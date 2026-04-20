import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Server, Database, Network, Cpu, Wifi, 
  Terminal, Play, CheckCircle, Clock, Search, 
  SlidersHorizontal, ChevronRight, ChevronDown, 
  Loader2, Zap, BrainCircuit, Smartphone, ArrowRight,
  Library, FileJson, Layers, Bot, Microchip, MapPin, Radio, Signal,
  RotateCcw, HardDrive, TerminalSquare, X, ShieldAlert, Code, Settings, Key,
  List, ArrowLeft, PlayCircle, Star, LayoutDashboard, RefreshCw
} from 'lucide-react';

// --- Gemini API Setup Configuration ---
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

// --- Mock Tool Definitions (Based on Huawei SA2 Proposal) ---
const TOOL_DEFINITIONS = {
  "AUTH_Tool": { desc: "Executes 6G Primary Authentication and Key Agreement (AKA) procedures.", inputs: ["SUPI/SUCI", "Serving Network ID"], outputs: ["Auth Vector", "Security Result"], host: "6G AM", criticality: "High" },
  "SC_Tool": { desc: "Manages Security Context establishment and secure NAS/AS communication.", inputs: ["Security Result", "UE Capabilities"], outputs: ["K_AMF", "Encryption Alg"], host: "6G AM", criticality: "High" },
  "MM_Tool": { desc: "Handles Mobility Management, Tracking Area Updates, and UE reachability state.", inputs: ["UE ID", "Location Data", "Movement History"], outputs: ["Updated AM Context", "Paging Area"], host: "6G AM", criticality: "Medium" },
  "Reachability_Tool": { desc: "Optimizes IoT reachability state, managing eDRX and PSM parameters for massive IoT devices.", inputs: ["UE ID", "Traffic Pattern", "Power Profile"], outputs: ["eDRX Cycle", "Active Time"], host: "6G AM", criticality: "Low" },
  "SMC_Tool": { desc: "Session Management Control. Establishes, modifies, and releases PDU sessions.", inputs: ["UE ID", "DNN", "S-NSSAI", "QoS Reqs"], outputs: ["Session ID", "IP Address", "UPF Tunnel Info"], host: "6G SM", criticality: "High" },
  "TR_Tool": { desc: "Traffic Routing tool. Maps QoS flows to specific transport tunnels.", inputs: ["Session ID", "SDF Filter", "5QI"], outputs: ["Routing Rule ID", "N3/N9 Tunnel Config"], host: "6G SM", criticality: "Medium" },
  "UPC_Tool": { desc: "User Plane Control. Interfaces with UPF to enforce gating and bandwidth policies.", inputs: ["Session ID", "Gating Status", "MBR/GBR"], outputs: ["Enforcement Status", "Usage Report"], host: "6G SM", criticality: "High" },
  "VN_creation_tool": { desc: "Virtual Network creation tool. Allocates isolated subnet resources dynamically.", inputs: ["S-NSSAI", "Topology Reqs", "Isolation Level"], outputs: ["Subnet ID", "Allocated NF List"], host: "6G SM", criticality: "High" },
  "DNS_Resolver_Tool": { desc: "Resolves DNN/FQDNs to select optimal Edge/Central UPFs.", inputs: ["DNN", "UE Location"], outputs: ["UPF IP", "Edge Node ID"], host: "6G SM", criticality: "Medium" },
  "Subscription_Tool": { desc: "Retrieves, updates, and authorizes UE subscription data and slice limits.", inputs: ["SUPI", "Requested S-NSSAI", "Requested DNN"], outputs: ["Auth Status", "Allowed QoS Profile"], host: "6G UDM", criticality: "High" },
  "Analytic_Tool": { desc: "Provides Network Data Analytics, QoS prediction, and anomaly detection.", inputs: ["Target Area/UE", "Analytic ID", "Time Window"], outputs: ["Prediction Confidence", "Recommended Action"], host: "6G NWDAF", criticality: "Medium" }
};

async function fetchWithRetry(url, options, retries = 3) {
  const delays = [1000, 2000, 4000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
}

// Utility to safely render objects from LLM to prevent React crashes
const safeRender = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

export default function AgenticNOCDashboard() {
  // API Key State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(() => !localStorage.getItem('gemini_api_key'));
  const [tempKey, setTempKey] = useState(apiKey);

  // App Routing View State ('dashboard', 'sessions_list', 'session_detail', 'replay_animation')
  const [appView, setAppView] = useState('dashboard');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [viewingSession, setViewingSession] = useState(null);

  // Animation Portal State
  const [animStatus, setAnimStatus] = useState('idle'); // 'idle', 'running', 'done'
  const [animLogs, setAnimLogs] = useState([]);
  const [animActiveNodes, setAnimActiveNodes] = useState(new Set());
  const animLogRef = useRef(null);
  const animIdRef = useRef(0);

  // Main UI State
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [slowMode, setSlowMode] = useState(false); 
  
  const [traceData, setTraceData] = useState([]);
  const [intentData, setIntentData] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]); 
  const [activeNFs, setActiveNFs] = useState(new Set());
  const [rightTab, setRightTab] = useState('intent'); 
  
  // Modals
  const [selectedTool, setSelectedTool] = useState(null);

  const playbackIdRef = useRef(0);
  
  // State for Tree Menu Toggle
  const [expandedFolders, setExpandedFolders] = useState(new Set(['plmn', 'core', 'ai_layer', 'trf_registry', 'am_tools', 'sm_tools', 'udm_tools', 'nwdaf_tools']));

  // State for UE Diagnostics
  const [ueQuery, setUeQuery] = useState('imsi-208930000000001');
  const [isFetchingUe, setIsFetchingUe] = useState(false);
  const [ueData, setUeData] = useState(null);

  // State for NGAP Diagnostics
  const [isFetchingNgap, setIsFetchingNgap] = useState(false);
  const [ngapData, setNgapData] = useState([
    { id: '10449', name: 'gNB-GOA-Park', ip: '10.200.1.14', status: 'ESTABLISHED', ues: 142, uptime: '14d 2h' },
    { id: '20512', name: 'gNB-Sector-4', ip: '10.200.1.15', status: 'ESTABLISHED', ues: 87, uptime: '45d 12h' },
    { id: '30991', name: 'gNB-Region-B', ip: '10.200.1.16', status: 'ESTABLISHED', ues: 5040, uptime: '110d 5h' },
  ]);

  // State for Infra Diagnostics (Mock Live Processes)
  const [activeLogProcess, setActiveLogProcess] = useState(null);
  const [processLogs, setProcessLogs] = useState({
    'planning-agent': ['[SYSTEM] Agent initialized. Ready to receive routing intents.'],
    'conn-agent': ['[SYSTEM] Conn_Agent initialized.', '[DEBUG] Connected to TRF local cache.'],
    'free5gc-amf': ['[INFO] AMF: NGAP Setup Response sent to gNB-10449'],
    'free5gc-smf': ['[INFO] SMF: PFCP Association established with UPF'],
    'free5gc-upf': ['[INFO] UPF: Ready to route GTP-U packets'],
    'free5gc-udm': ['[INFO] UDM: Subscription data loaded.'],
    'ueransim-gnb': ['[INFO] gNB: SCTP connection active with AMF'],
    'ueransim-ue': ['[INFO] UE: Initialized IMSI-208930000000001', '[INFO] UE: RM-REGISTERED, CM-IDLE']
  });
  
  const logContainerRef = useRef(null);

  const [infraData, setInfraData] = useState([
    { group: 'AI Control Layer', name: 'planning-agent', status: 'Running', cpu: 12.4, mem: 450, uptime: '14d 2h' },
    { group: 'AI Control Layer', name: 'conn-agent', status: 'Running', cpu: 8.1, mem: 312, uptime: '14d 2h' },
    { group: 'free5GC NFs', name: 'free5gc-amf', status: 'Running', cpu: 4.2, mem: 128, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-smf', status: 'Running', cpu: 5.6, mem: 145, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-upf', status: 'Running', cpu: 28.4, mem: 1024, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-udm', status: 'Running', cpu: 2.1, mem: 95, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-nwdaf', status: 'Running', cpu: 15.2, mem: 512, uptime: '45d 12h' },
    { group: 'UERANSIM', name: 'ueransim-gnb', status: 'Running', cpu: 18.7, mem: 256, uptime: '3d 5h' },
    { group: 'UERANSIM', name: 'ueransim-ue', status: 'Running', cpu: 2.4, mem: 64, uptime: '1d 1h' },
  ]);

  const [kpis, setKpis] = useState({ pdu: 3, cpLoad: 15, latency: 12.4 });

  function handleSaveSettings() {
    setApiKey(tempKey);
    localStorage.setItem('gemini_api_key', tempKey);
    setShowSettings(false);
  }

  function appendProcessLog(procName, text) {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    const safeText = safeRender(text);
    setProcessLogs(prev => ({
      ...prev,
      [procName]: [...(prev[procName] || []), `[${timestamp}] ${safeText}`].slice(-40) 
    }));
  }

  // Background Jitter & Fake Heartbeat Logs
  useEffect(() => {
    if (appView !== 'dashboard') return; // Stop jitter if not looking at dashboard

    const interval = setInterval(() => {
      setKpis(prev => ({
        pdu: Math.max(1, Math.min(10, prev.pdu + Math.floor(Math.random() * 3) - 1)),
        cpLoad: Math.max(5, Math.min(60, prev.cpLoad + Math.floor(Math.random() * 5) - 2)),
        latency: Math.max(5, prev.latency + (Math.random() * 2 - 1))
      }));
      
      setInfraData(prev => prev.map(p => ({
        ...p,
        cpu: Math.max(0.5, Math.min(99, p.cpu + (Math.random() * 4 - 2))),
        mem: Math.max(50, p.mem + (Math.random() * 10 - 5))
      })));

      setNgapData(prev => prev.map(gnb => ({
        ...gnb,
        ues: Math.max(0, gnb.ues + Math.floor(Math.random() * 5) - 2)
      })));

      if (Math.random() > 0.7) {
        const noises = [
          { proc: 'free5gc-upf', msg: '[DEBUG] Sending PFCP Heartbeat Request' },
          { proc: 'ueransim-gnb', msg: '[TRACE] RRC Connection Reconfiguration' },
          { proc: 'free5gc-amf', msg: '[DEBUG] Processing NGAP UE Context Release' },
          { proc: 'free5gc-nwdaf', msg: '[TRACE] Collecting QoS telemetry data from UPF' }
        ];
        const noise = noises[Math.floor(Math.random() * noises.length)];
        appendProcessLog(noise.proc, noise.msg);
      }

    }, 2500);
    return () => clearInterval(interval);
  }, [appView]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [processLogs, activeLogProcess]);

  // Auto-scroll Portal Animation logs
  useEffect(() => {
    if (animLogRef.current) {
      animLogRef.current.scrollTop = animLogRef.current.scrollHeight;
    }
  }, [animLogs]);

  function handleSuggest() {
    setInputText("We plan to play location-based AR game in GOA central Park. We need to see the same virtual elements aligned with physical surroundings with minimal lag. Please sense environment in real time and ensure low latency connection.");
  }

  function toggleFolder(id) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleUeSearch(e) {
    e.preventDefault();
    if (!ueQuery.trim() || isFetchingUe) return;
    setIsFetchingUe(true);
    setUeData(null);
    
    await new Promise(r => setTimeout(r, 800));
    
    setUeData({
      supi: ueQuery,
      pei: 'imeisv-35431108221433-12',
      status: 'CM-CONNECTED',
      rmStatus: 'RM-REGISTERED',
      location: {
        tai: 'TAC: 0x0001, MCC: 208, MNC: 93',
        gNodeB: 'gNB-ID: 10449',
        cellId: 'NR-CGI: 208930001044901'
      },
      sessions: [
        { id: 1, dnn: 'internet', sNssai: 'eMBB (SST:1)', ip: '10.0.0.12', qos: '5QI: 9' },
        { id: 2, dnn: 'urllc.agv', sNssai: 'URLLC (SST:2)', ip: '10.0.0.42', qos: '5QI: 82' }
      ]
    });
    setIsFetchingUe(false);
  }

  async function handleNgapRefresh() {
    setIsFetchingNgap(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate fetching
    setIsFetchingNgap(false);
  }

  function mapNfToProc(nfName) {
    if (!nfName) return null;
    const name = String(nfName).toLowerCase();
    if (name.includes('planning')) return 'planning-agent';
    if (name.includes('conn')) return 'conn-agent';
    if (name.includes('sm')) return 'free5gc-smf';
    if (name.includes('am')) return 'free5gc-amf';
    if (name.includes('udm')) return 'free5gc-udm';
    if (name.includes('nwdaf')) return 'free5gc-nwdaf';
    if (name.includes('trf')) return 'planning-agent';
    return null;
  }

  // --- TRACING PORTAL ANIMATION LOGIC ---
  const runPortalAnimation = async () => {
    const currentId = Date.now();
    animIdRef.current = currentId;
    const checkAbort = () => animIdRef.current !== currentId || appView !== 'replay_animation';

    setAnimStatus('running');
    setAnimLogs([]);
    setAnimActiveNodes(new Set());
    const delay = 1200; 
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const data = viewingSession.data;

    if (checkAbort()) return;
    setAnimActiveNodes(new Set(['intent', 'srf']));
    setAnimLogs([{ time: new Date().toLocaleTimeString(), text: "Intent received via SRF. Routing to Planning Agent.", type: 'info' }]);
    await sleep(delay);

    if (checkAbort()) return;
    setAnimActiveNodes(new Set(['Planning_Agent']));
    setAnimLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: "Planning Agent instantiated. Analyzing goals...", type: 'info' }]);
    await sleep(delay);

    for (const trace of data.sbi_traces || []) {
      if (checkAbort()) return;
      const active = new Set();
      active.add(safeRender(trace.src_nf));
      active.add(safeRender(trace.dest_nf));
      active.add(safeRender(trace.operation)); // Highlight specific tool pill
      
      // Implicitly highlight groups
      if (['6G AM', '6G SM', '6G UDM', '6G NWDAF'].includes(safeRender(trace.dest_nf))) {
        active.add('TRF_GROUP');
      }

      setAnimActiveNodes(active);
      setAnimLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        text: `[${safeRender(trace.src_nf)} ➔ ${safeRender(trace.dest_nf)}]`,
        subtext: `Operation: ${safeRender(trace.operation)}()`,
        payload: typeof trace.payload === 'object' ? JSON.stringify(trace.payload, null, 2) : safeRender(trace.payload),
        type: 'trace'
      }]);

      await sleep(delay * 1.5);
    }

    if (checkAbort()) return;
    setAnimActiveNodes(new Set());
    setAnimStatus('done');
    setAnimLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: "Workflow trace execution completed.", type: 'success' }]);
  };

  function registerSessionRecord(intent, responseData) {
    const newId = `service-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}`;
    const traceCount = Array.isArray(responseData.sbi_traces) ? responseData.sbi_traces.length : 0;
    
    const newSession = {
      id: newId,
      createdAt: new Date().toLocaleString(),
      intent: intent,
      data: responseData,
      tracesCount: traceCount,
      environment: 'default'
    };
    
    setSessionHistory(prev => [newSession, ...prev]);
  }

  async function processIntent(e) {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing || isPlaying) return;
    
    if (!apiKey) {
      // OFFLINE DEMO MODE
      setIsProcessing(true);
      const currentIntent = inputText;
      appendProcessLog('ueransim-ue', '[INFO] Preparing natural language intent string for SRF...');
      appendProcessLog('planning-agent', '[INFO] Running in OFFLINE DEMO mode. Using pre-calculated inference for AR Game.');
      
      await new Promise(r => setTimeout(r, 2500));
      
      const offlineDemoData = {
        structured_intent: {
          goals: "Establish low-latency connection and real-time environment sensing for AR application.",
          requirements: ["Latency < 10ms", "High bandwidth", "Real-time spatial sensing"],
          conditions: ["Location: GOA Central Park", "Device Type: AR Headset/Smartphone"],
          guidelines: "Criticality: High"
        },
        agent_logs: [
          {
            agent_name: "Planning_Agent",
            thoughts: [
              "Analyzed intent: User requires URLLC connectivity and real-time sensing for an AR game.",
              "Querying TRF (Tool Repository Function) to discover available tools for this service profile.",
              "TRF returned: SMC_Tool (6G SM) for connectivity, Analytic_Tool (6G NWDAF) for sensing.",
              "Decomposing task: Assigning connectivity setup to Conn_Agent, sensing analytics to Compute_Agent."
            ]
          },
          {
            agent_name: "Conn_Agent",
            thoughts: [
              "Received sub-task from Planning_Agent to establish URLLC connection.",
              "Invoking Subscription_Tool to verify user slice limits for URLLC.",
              "Selecting SMC_Tool to create a new PDU session with 5QI=82 (Low Latency).",
              "Selecting UPC_Tool to enforce UPF routing rules for the GOA Central Park edge node."
            ]
          }
        ],
        sbi_traces: [
          { src_nf: "Planning_Agent", dest_nf: "TRF", operation: "Ntrf_ToolDiscovery", payload: { required_caps: ["URLLC", "Sensing"] }, status: "200 OK" },
          { src_nf: "Planning_Agent", dest_nf: "Conn_Agent", operation: "Nca_TaskAssign", payload: { task: "Setup URLLC", location: "GOA Central Park" }, status: "201 Created" },
          { src_nf: "Conn_Agent", dest_nf: "6G UDM", operation: "Subscription_Tool", payload: { supi: "IMSI-20893", req_snssai: "URLLC" }, status: "200 OK" },
          { src_nf: "Conn_Agent", dest_nf: "6G SM", operation: "SMC_Tool", payload: { dnn: "ar.game.edge", "5qi": 82 }, status: "201 Created" },
          { src_nf: "Conn_Agent", dest_nf: "6G SM", operation: "UPC_Tool", payload: { rule: "Route to Edge UPF" }, status: "200 OK" },
          { src_nf: "Planning_Agent", dest_nf: "Compute_Agent", operation: "Nca_TaskAssign", payload: { task: "Environment Sensing" }, status: "201 Created" },
          { src_nf: "Compute_Agent", dest_nf: "6G NWDAF", operation: "Analytic_Tool", payload: { target: "GOA Central Park", type: "Spatial Sensing" }, status: "200 OK" }
        ]
      };

      registerSessionRecord(currentIntent, offlineDemoData);
      setIsProcessing(false);
      
      // Auto-switch to Session Detail to view it
      const newId = `service-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}`;
      setViewingSession({ id: newId, intent: currentIntent, data: offlineDemoData, tracesCount: 7 });
      setAppView('session_detail');
      return;
    }

    setIsProcessing(true);
    
    const currentIntent = inputText;
    appendProcessLog('ueransim-ue', '[INFO] Preparing natural language intent string for SRF...');

    try {
      const sysUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: currentIntent }] }],
        systemInstruction: {
          parts: [{ text: `You are the Planning Agent in a 6G Core based on the Huawei SA2 proposal. 
          1. Parse the intent into semi-structured fields: Goals, Requirements, Conditions, and Guidelines (Criticality).
          2. Generate a sequence of SBI operations.
          CRITICAL RULES FOR TRACES:
          - First trace MUST be from Planning_Agent to TRF (Tool Repository Function) to discover tools using Ntrf_ToolDiscovery.
          - Then the Planning_Agent assigns subtasks to Conn_Agent or Compute_Agent.
          - Then domain agents (Conn_Agent, etc.) invoke specific tools hosted by 6G NFs. 
          - AVAILABLE TOOLS: AUTH_Tool, SC_Tool, MM_Tool, Reachability_Tool (hosted by 6G AM); SMC_Tool, SMAU_Tool, TR_Tool, UPC_Tool, VN_creation_tool, DNS_Resolver_Tool (hosted by 6G SM); Subscription_Tool (hosted by 6G UDM); Analytic_Tool (hosted by 6G NWDAF).
          - Target NFs MUST be exactly: 6G SM, 6G AM, 6G UDM, 6G NWDAF.
          - Multi-Agent ReAct Log: Provide step-by-step reasoning for EACH agent involved in 'agent_logs'. For example, Planning_Agent reasons about task breakdown and ARF/TRF discovery. Conn_Agent reasons about selecting specific 6G tools based on the context.
          Return JSON matching the schema.` }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              structured_intent: {
                type: "OBJECT",
                properties: {
                  goals: { type: "STRING" },
                  requirements: { type: "ARRAY", items: { type: "STRING" } },
                  conditions: { type: "ARRAY", items: { type: "STRING" } },
                  guidelines: { type: "STRING" }
                }
              },
              agent_logs: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    agent_name: { type: "STRING" },
                    thoughts: { type: "ARRAY", items: { type: "STRING" } }
                  },
                  required: ["agent_name", "thoughts"]
                },
                description: "Multi-agent step-by-step reasoning logs"
              },
              sbi_traces: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    src_nf: { type: "STRING" },
                    dest_nf: { type: "STRING" },
                    operation: { type: "STRING" },
                    payload: { type: "STRING" },
                    status: { type: "STRING" }
                  }
                }
              }
            }
          }
        }
      };

      const result = await fetchWithRetry(sysUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      let responseText = result.candidates[0].content.parts[0].text;
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(responseText);
      
      registerSessionRecord(currentIntent, parsedData);
      setIsProcessing(false);
      
      // Auto-switch to Session Detail to view it
      const newId = `service-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}`;
      setViewingSession({ id: newId, intent: currentIntent, data: parsedData, tracesCount: Array.isArray(parsedData.sbi_traces) ? parsedData.sbi_traces.length : 0 });
      setAppView('session_detail');

    } catch (error) {
      console.error(error);
      setTraceData([]);
      addTrace("Planning_Agent", "Planning_Agent", "INTERNAL_ERROR", { error: "LLM Orchestration Failed" }, "500 Internal Server Error");
      appendProcessLog('planning-agent', '[ERROR] Failed to communicate with LLM API endpoint. Verify API Key in settings.');
      setIsProcessing(false);
    }
  }

  function addTrace(src, dest, op, payload, status) {
    setTraceData(prev => [...prev, {
      id: Date.now() + Math.random(),
      time: '0ms',
      src: safeRender(src), 
      dest: safeRender(dest), 
      op: safeRender(op), 
      payload: typeof payload === 'object' ? JSON.stringify(payload) : safeRender(payload), 
      status: safeRender(status)
    }]);
  }

  // --- TRACING PORTAL REUSABLE COMPONENTS ---
  const PortalGroup = ({ title, icon, colorClass, children, className = "" }) => (
    <div className={`border-2 border-dashed ${colorClass} rounded-xl p-4 bg-white/60 backdrop-blur-sm ${className}`}>
       <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
         {icon} {title}
       </div>
       {children}
    </div>
  );

  const PortalNode = ({ id, title, subtitle, icon, active, children, borderColorClass = "border-slate-200" }) => (
    <div className={`bg-white border-2 rounded-lg p-3.5 shadow-sm transition-all duration-300 ${active ? 'border-purple-500 shadow-purple-200 shadow-lg scale-105 z-10 relative' : borderColorClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-md ${active ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
          {icon}
        </div>
        <h4 className="font-bold text-xs text-slate-800">{title}</h4>
      </div>
      {subtitle && <div className="text-[10px] text-slate-500 ml-8 mb-2 leading-tight">{subtitle}</div>}
      {children && <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );

  const PortalTool = ({ id, title, subtitle, active }) => (
    <div className={`border rounded-md p-2 transition-all duration-300 ${active ? 'bg-emerald-50 border-emerald-400 shadow-sm scale-105' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`font-mono text-[10px] font-bold ${active ? 'text-emerald-700' : 'text-blue-700'}`}>{title}</div>
      {subtitle && <div className="text-[9px] text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans text-xs overflow-hidden relative">
      
      {/* SETTINGS MODAL OVERLAY */}
      {showSettings && (
        <div className="absolute inset-0 z-[160] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-[450px] border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-5 py-4 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100">
                <Settings size={18} className="text-blue-400" />
                <h3 className="font-bold text-sm tracking-wide">Global Configuration</h3>
              </div>
              {apiKey && (
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 text-xs">
                <p>Welcome to the <strong>6G Agentic Core NOC Prototype</strong>.</p>
                <p className="mt-2">To power the AI orchestration logic (Planning Agent, Conn Agent, etc.), this static dashboard requires a valid Google Gemini API key.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Key size={12} /> Gemini API Key
                </label>
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Leave empty for OFFLINE DEMO mode..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">If left empty, the application will fallback to a pre-calculated AR Game offline trace.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold transition-colors shadow-sm"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOL DEFINITION MODAL OVERLAY */}
      {selectedTool && (
        <div className="absolute inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-[500px] border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-purple-600" />
                <h3 className="font-bold text-slate-800 uppercase tracking-wide">Tool Definition Template</h3>
              </div>
              <button onClick={() => setSelectedTool(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Tool Name</h4>
                  <p className="font-mono text-base font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-block">{selectedTool}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Host NF</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">
                    {TOOL_DEFINITIONS[selectedTool]?.host || "Unknown"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><FileJson size={12}/> Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                  {TOOL_DEFINITIONS[selectedTool]?.desc || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><ArrowRight size={12}/> Input Parameters</h4>
                  <ul className="list-disc pl-4 text-[11px] font-mono text-slate-600 space-y-1">
                    {TOOL_DEFINITIONS[selectedTool]?.inputs?.map((inp, i) => <li key={i}>{safeRender(inp)}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><CheckCircle size={12}/> Expected Output</h4>
                  <ul className="list-disc pl-4 text-[11px] font-mono text-emerald-700 space-y-1">
                    {TOOL_DEFINITIONS[selectedTool]?.outputs?.map((out, i) => <li key={i}>{safeRender(out)}</li>)}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                 <ShieldAlert size={14} className={TOOL_DEFINITIONS[selectedTool]?.criticality === 'High' ? 'text-red-500' : 'text-amber-500'} />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Operational Criticality:</span>
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TOOL_DEFINITIONS[selectedTool]?.criticality === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                   {TOOL_DEFINITIONS[selectedTool]?.criticality || "Normal"}
                 </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP KPI HEADER (Only visible outside Replay Animation) */}
      {appView !== 'replay_animation' && (
        <header className="bg-slate-900 text-slate-200 h-14 flex items-center justify-between px-4 shrink-0 shadow-md z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppView('dashboard')}>
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Network size={14} className="text-white"/>
              </div>
              <span className="font-bold text-sm tracking-widest text-slate-100">6G AGENTIC CORE <span className="font-normal text-slate-400 text-xs">SA2 Prototype</span></span>
            </div>
            
            <div className="h-6 w-px bg-slate-700 mx-2 ml-4"></div>
            
            {appView === 'dashboard' && (
              <div className="flex gap-6 animate-in fade-in">
                <KpiBlock label="ACTIVE PDU SESSIONS" value={kpis.pdu.toLocaleString()} trend="up" />
                <KpiBlock label="AGENTIC CP LOAD" value={`${kpis.cpLoad}%`} trend={kpis.cpLoad > 70 ? "up_bad" : "down"} />
                <KpiBlock label="AVG SBI LATENCY" value={`${kpis.latency.toFixed(1)}ms`} trend="down" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-2 mr-2">
               <Clock size={14} />
               <span className="font-mono">{new Date().toISOString().split('T')[1].substring(0, 8)} UTC</span>
            </div>
            
            <div className="h-5 w-px bg-slate-700"></div>

            {/* SESSIONS BUTTON */}
            <button 
              onClick={() => setAppView(appView === 'sessions_list' || appView === 'session_detail' ? 'dashboard' : 'sessions_list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors text-xs font-bold uppercase tracking-wider ${appView === 'sessions_list' || appView === 'session_detail' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <List size={14} /> Sessions
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800 focus:outline-none"
              title="Configure API Key"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>
      )}

      {/* 2. MAIN APP ROUTER */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* VIEW: REPLAY ANIMATION PORTAL (Full Screen Override) */}
        {appView === 'replay_animation' && viewingSession && (
          <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-300">
             
             {/* Portal Header */}
             <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setAppView('session_detail'); setAnimStatus('idle'); setAnimLogs([]); setAnimActiveNodes(new Set()); }} 
                    className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-full"
                  >
                     <ArrowLeft size={16} />
                  </button>
                  <div className="flex items-center gap-2 text-indigo-900">
                    <div className="bg-indigo-600 p-1.5 rounded-md">
                      <BrainCircuit size={20} className="text-white" />
                    </div>
                    <span className="font-extrabold text-lg tracking-tight">AICore Intent Tracing Portal</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     <span>MSGCAP</span>
                     <div className="border border-slate-200 rounded px-3 py-1.5 bg-slate-50 flex items-center gap-2 text-slate-700 normal-case font-mono">
                       {viewingSession.id}.msgcap <ChevronDown size={14}/>
                     </div>
                  </div>
                  <div className="h-6 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     <span>SPEED</span>
                     <div className="border border-slate-200 rounded px-2 py-1.5 bg-slate-50 normal-case font-mono text-slate-700">1.0x</div>
                  </div>
                  <button 
                    onClick={runPortalAnimation}
                    disabled={animStatus === 'running'}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-md font-bold text-xs flex items-center gap-2 shadow-sm transition-colors ml-2"
                  >
                    <Play size={14} fill="currentColor" /> Play Trace
                  </button>
                </div>
             </header>

             {/* Portal Main Split */}
             <div className="flex-1 flex overflow-hidden">
                
                {/* Visual Canvas (Left) */}
                <div className="flex-1 bg-slate-50 relative p-8 overflow-auto">
                  {/* Dot Grid Background */}
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }}></div>

                  {/* Node Layout Wrapper */}
                  <div className="relative z-10 flex gap-8 h-full min-w-max items-start justify-center pt-8">
                    
                    {/* REQUEST / INTENT GROUP */}
                    <div className="w-64 pt-48">
                      <PortalGroup title="REQUEST / INTENT" icon={<FileJson size={14}/>} colorClass="border-sky-200 bg-sky-50/30">
                         <div className="space-y-6">
                           <PortalNode id="intent" title="Intent" subtitle="Current UE intent" icon={<FileJson size={14}/>} active={animActiveNodes.has('intent')} borderColorClass="border-sky-200" />
                           <PortalNode id="srf" title="SRF" subtitle="Routes to NW-Agent" icon={<Network size={14}/>} active={animActiveNodes.has('srf')} borderColorClass="border-sky-200" />
                         </div>
                      </PortalGroup>
                    </div>

                    {/* ARF + AGENT LAYER GROUP */}
                    <div className="w-[500px] flex flex-col gap-8">
                      <PortalGroup title="ARF" icon={<Database size={14}/>} colorClass="border-amber-200 bg-amber-50/30">
                         <div className="flex gap-4">
                           <PortalNode id="acn_skill" title="ACN Skill" subtitle="Agent connection workflow" icon={<Database size={14}/>} active={animActiveNodes.has('ARF_GROUP')} borderColorClass="border-amber-200" />
                           <PortalNode id="qos_skill" title="QoS Assurance Skill" subtitle="Dynamic traffic treatment" icon={<Database size={14}/>} active={animActiveNodes.has('ARF_GROUP')} borderColorClass="border-amber-200" />
                         </div>
                      </PortalGroup>

                      <PortalGroup title="AGENT LAYER" icon={<Bot size={14}/>} colorClass="border-purple-200 bg-purple-50/30" className="flex-1">
                         <div className="grid grid-cols-2 gap-6 h-full content-center py-4">
                           <div className="flex items-center">
                             <PortalNode id="Planning_Agent" title="Planning Agent" subtitle="NW-Agent orchestrator" icon={<Bot size={14}/>} active={animActiveNodes.has('Planning_Agent')} borderColorClass="border-purple-200" />
                           </div>
                           <div className="space-y-6">
                             <PortalNode id="Compute_Agent" title="Computing Agent" subtitle="Compute domain" icon={<Cpu size={14}/>} active={animActiveNodes.has('Compute_Agent')} borderColorClass="border-purple-200" />
                             <PortalNode id="Conn_Agent" title="Connection Agent" subtitle="Connectivity domain" icon={<Network size={14}/>} active={animActiveNodes.has('Conn_Agent')} borderColorClass="border-purple-200" />
                           </div>
                         </div>
                      </PortalGroup>
                    </div>

                    {/* TRF GROUP */}
                    <div className="w-80 pb-12">
                      <PortalGroup title="TRF" icon={<Library size={14}/>} colorClass="border-blue-200 bg-blue-50/30">
                         <div className="space-y-4">
                           <PortalNode id="6G AM" title="6G AM" subtitle="Access / mobility" icon={<Server size={14}/>} active={animActiveNodes.has('6G AM')} borderColorClass="border-blue-200">
                             <PortalTool id="AUTH_Tool" title="AUTH_Tool" active={animActiveNodes.has('AUTH_Tool')} />
                             <PortalTool id="MM_Tool" title="MM_Tool" active={animActiveNodes.has('MM_Tool')} />
                           </PortalNode>
                           
                           <PortalNode id="6G UDM" title="6G UDM" subtitle="Unified data" icon={<Database size={14}/>} active={animActiveNodes.has('6G UDM')} borderColorClass="border-blue-200">
                             <PortalTool id="Subscription_Tool" title="Subscription_Tool" active={animActiveNodes.has('Subscription_Tool')} />
                           </PortalNode>

                           <PortalNode id="6G SM" title="6G SM" subtitle="Session Management" icon={<Server size={14}/>} active={animActiveNodes.has('6G SM')} borderColorClass="border-blue-200">
                             <PortalTool id="SMC_Tool" title="SMC_Tool" active={animActiveNodes.has('SMC_Tool')} />
                             <PortalTool id="UPC_Tool" title="UPC_Tool" active={animActiveNodes.has('UPC_Tool')} />
                           </PortalNode>

                           <PortalNode id="6G NWDAF" title="6G NWDAF" subtitle="Network Analytics" icon={<Activity size={14}/>} active={animActiveNodes.has('6G NWDAF')} borderColorClass="border-blue-200">
                             <PortalTool id="Analytic_Tool" title="Analytic_Tool" active={animActiveNodes.has('Analytic_Tool')} />
                           </PortalNode>
                         </div>
                      </PortalGroup>
                    </div>
                  </div>
                </div>

                {/* Execution Log (Right) */}
                <div className="w-[380px] border-l border-slate-200 bg-white flex flex-col z-20 shadow-xl">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Agent Run</div>
                      <div className="text-lg font-extrabold text-slate-800 tracking-tight">Execution log</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      animStatus === 'idle' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                      animStatus === 'running' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {animStatus}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-5 space-y-4" ref={animLogRef}>
                    {animStatus === 'idle' && animLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <div className="text-sm font-bold mb-1 tracking-widest uppercase">READY</div>
                        <div className="text-xs">Press play to stream the agent trace.</div>
                      </div>
                    ) : (
                      animLogs.map((log, i) => (
                        <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-lg p-3.5 animate-in fade-in slide-in-from-bottom-2">
                          <div className="text-[10px] text-slate-400 font-mono mb-1.5">{log.time}</div>
                          <div className={`text-xs font-bold font-mono leading-relaxed ${log.type === 'trace' ? 'text-blue-700' : log.type === 'success' ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {log.text}
                          </div>
                          {log.subtext && <div className="text-[10px] text-purple-600 mt-1.5 font-mono font-bold bg-purple-50 inline-block px-1.5 py-0.5 rounded border border-purple-100">{log.subtext}</div>}
                          {log.payload && (
                            <div className="mt-2.5 bg-slate-900 text-emerald-400 p-2.5 rounded-md text-[10px] font-mono overflow-x-auto shadow-inner">
                              <pre>{log.payload}</pre>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
             </div>

          </div>
        )}

        {/* VIEW: DASHBOARD */}
        {appView === 'dashboard' && (
          <React.Fragment>
            {/* LEFT MENU (Interactive Topology Explorer) */}
            <div className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col z-10 shadow-sm shrink-0 overflow-y-auto">
              <div className="p-2">
                <div className="font-bold text-slate-500 mb-2 px-2 pb-1 border-b border-slate-200 uppercase tracking-wider text-[10px]">Topology Explorer</div>
                
                <TreeItem id="plmn" label="PLMN 001-01" icon={<Network size={12}/>} hasChildren isExpanded={expandedFolders.has('plmn')} onToggle={toggleFolder} active={true} />
                
                {expandedFolders.has('plmn') && (
                  <div className="ml-5 border-l border-slate-300 space-y-0.5 mt-0.5 pl-1">
                    <TreeItem id="core" label="Decoupled Core" icon={<Layers size={12}/>} hasChildren isExpanded={expandedFolders.has('core')} onToggle={toggleFolder} />
                    
                    {expandedFolders.has('core') && (
                      <div className="ml-4 border-l border-slate-300 space-y-0.5 mt-0.5 pl-1">
                        <TreeItem id="ai_layer" label="AI Control Layer" icon={<BrainCircuit size={12}/>} hasChildren isExpanded={expandedFolders.has('ai_layer')} onToggle={toggleFolder} />
                        {expandedFolders.has('ai_layer') && (
                          <div className="ml-4 border-l border-slate-300 space-y-0.5 mt-0.5 pl-1">
                            <TreeItem id="model" label="Model: Gemini-2.5" icon={<Microchip size={10}/>} className="text-[10px]" />
                            <TreeItem id="pa" label="Inst: Planning_Agent" icon={<Bot size={10}/>} className="text-[10px]" />
                            <TreeItem id="ca" label="Inst: Conn_Agent" icon={<Bot size={10}/>} className="text-[10px]" />
                            <TreeItem id="repo" label="ARF / TRF Cluster" icon={<Library size={10}/>} className="text-[10px]" />
                          </div>
                        )}
                        
                        <TreeItem id="nfs" label="6G NFs" icon={<Database size={12}/>} hasChildren isExpanded={expandedFolders.has('nfs')} onToggle={toggleFolder} />
                        {expandedFolders.has('nfs') && (
                          <div className="ml-4 border-l border-slate-300 space-y-0.5 mt-0.5 pl-1">
                            <TreeItem id="amf" label="6G AM (amf-reg-1)" icon={<Server size={10}/>} className="text-[10px]" />
                            <TreeItem id="smf" label="6G SM (smf-slice-a)" icon={<Server size={10}/>} className="text-[10px]" />
                            <TreeItem id="udm" label="6G UDM (udm-central)" icon={<Server size={10}/>} className="text-[10px]" />
                            <TreeItem id="nwdaf" label="6G NWDAF (analytics-1)" icon={<Server size={10}/>} className="text-[10px]" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <TreeItem id="ran" label="UERANSIM" icon={<Wifi size={12}/>} hasChildren isExpanded={expandedFolders.has('ran')} onToggle={toggleFolder} />
                    {expandedFolders.has('ran') && (
                      <div className="ml-4 border-l border-slate-300 space-y-0.5 mt-0.5 pl-1">
                        <TreeItem id="ue1" label="Profile: AR-Gamer" icon={<Smartphone size={10}/>} className="text-[10px]" />
                        <TreeItem id="ue2" label="Profile: AGV-Swarm" icon={<Smartphone size={10}/>} className="text-[10px]" />
                        <TreeItem id="ue3" label="Profile: Smart-Meter" icon={<Smartphone size={10}/>} className="text-[10px]" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-2 mt-2 border-t border-slate-200">
                <TreeItem 
                  id="trf_registry" 
                  label="TRF Tool Registry" 
                  icon={<Library size={12} className="text-purple-600"/>} 
                  hasChildren 
                  isExpanded={expandedFolders.has('trf_registry')} 
                  onToggle={toggleFolder} 
                  className="uppercase tracking-wider text-[10px] font-bold text-purple-700" 
                />
                
                {expandedFolders.has('trf_registry') && (
                  <div className="ml-4 mt-1 space-y-1">
                    <TreeItem id="am_tools" label="6G AM Tools" icon={<Server size={10} className="text-slate-400"/>} hasChildren isExpanded={expandedFolders.has('am_tools')} onToggle={toggleFolder} />
                    {expandedFolders.has('am_tools') && (
                      <div className="ml-5 border-l border-slate-300 pl-2 space-y-1 mt-1 mb-2 flex flex-col items-start">
                        <ToolBadge label="AUTH_Tool" onClick={() => setSelectedTool("AUTH_Tool")} />
                        <ToolBadge label="SC_Tool" onClick={() => setSelectedTool("SC_Tool")} />
                        <ToolBadge label="MM_Tool" onClick={() => setSelectedTool("MM_Tool")} />
                        <ToolBadge label="Reachability_Tool" onClick={() => setSelectedTool("Reachability_Tool")} />
                      </div>
                    )}
                    
                    <TreeItem id="sm_tools" label="6G SM Tools" icon={<Server size={10} className="text-slate-400"/>} hasChildren isExpanded={expandedFolders.has('sm_tools')} onToggle={toggleFolder} />
                    {expandedFolders.has('sm_tools') && (
                      <div className="ml-5 border-l border-slate-300 pl-2 space-y-1 mt-1 mb-2 flex flex-col items-start">
                        <ToolBadge label="SMC_Tool" onClick={() => setSelectedTool("SMC_Tool")} />
                        <ToolBadge label="TR_Tool" onClick={() => setSelectedTool("TR_Tool")} />
                        <ToolBadge label="UPC_Tool" onClick={() => setSelectedTool("UPC_Tool")} />
                        <ToolBadge label="VN_creation_tool" onClick={() => setSelectedTool("VN_creation_tool")} />
                        <ToolBadge label="DNS_Resolver_Tool" onClick={() => setSelectedTool("DNS_Resolver_Tool")} />
                      </div>
                    )}

                    <TreeItem id="udm_tools" label="6G UDM Tools" icon={<Database size={10} className="text-slate-400"/>} hasChildren isExpanded={expandedFolders.has('udm_tools')} onToggle={toggleFolder} />
                    {expandedFolders.has('udm_tools') && (
                      <div className="ml-5 border-l border-slate-300 pl-2 space-y-1 mt-1 mb-2 flex flex-col items-start">
                        <ToolBadge label="Subscription_Tool" onClick={() => setSelectedTool("Subscription_Tool")} />
                      </div>
                    )}

                    <TreeItem id="nwdaf_tools" label="6G NWDAF Tools" icon={<Activity size={10} className="text-slate-400"/>} hasChildren isExpanded={expandedFolders.has('nwdaf_tools')} onToggle={toggleFolder} />
                    {expandedFolders.has('nwdaf_tools') && (
                      <div className="ml-5 border-l border-slate-300 pl-2 space-y-1 mt-1 mb-2 flex flex-col items-start">
                        <ToolBadge label="Analytic_Tool" onClick={() => setSelectedTool("Analytic_Tool")} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CENTER CONTENT */}
            <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
              
              {/* TOP HALF: Architecture Topology Visualizer */}
              <div className="h-[45%] border-b border-slate-200 relative bg-slate-50/50 p-4">
                 <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                   <Activity size={12} /> Active Network Architecture Topology
                 </div>
                 
                 {/* Topology diagram incorporating Huawei Proposal concepts */}
                 <div className="w-full h-full flex flex-col items-center justify-center pt-4">
                    
                    <div className="flex w-full items-center justify-between px-8">
                      
                      {/* UERANSIM */}
                      <div className="flex flex-col items-center relative">
                        <div className="absolute -top-6 bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-300 whitespace-nowrap">Device / RAN Sim</div>
                        <NFNode id="UERANSIM_APP" label="UERANSIM" icon={<Smartphone/>} active={activeNFs.has('UERANSIM_APP')} />
                      </div>
                      
                      <Arrow active={activeNFs.has('UERANSIM_APP') || activeNFs.has('SRF')} />

                      {/* Agentic Cluster */}
                      <div className="bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg p-3 relative shadow-sm flex-1 max-w-xl mx-4">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-300 whitespace-nowrap">Decoupled AI Layer (NW-Agents & Repositories)</div>
                        
                        <div className="flex justify-between items-center gap-2 mt-2">
                          <NFNode id="SRF" label="SRF Router" icon={<SlidersHorizontal/>} active={activeNFs.has('SRF')} color="slate" size="small" />
                          
                          <div className="flex flex-col items-center gap-4">
                            <NFNode id="Planning_Agent" label="Planning Agent" icon={<BrainCircuit/>} active={activeNFs.has('Planning_Agent')} color="emerald" />
                            <div className="flex gap-2">
                               <NFNode id="Conn_Agent" label="Conn Agent" icon={<Network/>} active={activeNFs.has('Conn_Agent')} color="blue" size="small" />
                               <NFNode id="Compute_Agent" label="Compute Agent" icon={<Cpu/>} active={activeNFs.has('Compute_Agent')} color="sky" size="small" />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <NFNode id="TRF" label="TRF (Tools)" icon={<Library/>} active={activeNFs.has('TRF')} color="purple" size="small" />
                            <NFNode id="ARF" label="ARF (Agents)" icon={<Search/>} active={activeNFs.has('ARF')} color="purple" size="small" />
                          </div>
                        </div>
                      </div>

                      <Arrow active={activeNFs.has('Planning_Agent') || activeNFs.has('Conn_Agent') || activeNFs.has('Compute_Agent') || activeNFs.has('6G SM') || activeNFs.has('6G UDM') || activeNFs.has('6G NWDAF')} />

                      {/* Legacy SBA Cluster (6G NFs) */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 relative shadow-sm">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-300 whitespace-nowrap">6G NFs (Tool Hosts)</div>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex gap-2 justify-center">
                            <NFNode id="6G NWDAF" label="6G NWDAF" icon={<Activity/>} active={activeNFs.has('6G NWDAF')} color="emerald" size="small" />
                            <NFNode id="6G UDM" label="6G UDM" icon={<Database/>} active={activeNFs.has('6G UDM')} color="emerald" size="small" />
                          </div>
                          <div className="flex gap-2 justify-center">
                            <NFNode id="6G SM" label="6G SM" icon={<Server/>} active={activeNFs.has('6G SM')} color="emerald" size="small" />
                            <NFNode id="6G AM" label="6G AM" icon={<Server/>} active={activeNFs.has('6G AM')} color="emerald" size="small" />
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>

              {/* BOTTOM HALF: Tabular SBI Trace */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center justify-between shrink-0">
                  <div className="font-bold text-slate-600 flex items-center gap-2">
                    <Terminal size={14} /> Service Based Interface (SBI) Trace Log
                  </div>
                  {(isProcessing || isPlaying) && (
                    <div className="text-blue-600 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin"/> 
                      {isProcessing ? "Querying LLM Orchestrator..." : "Executing Traces..."}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-auto bg-slate-50 p-2">
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead className="bg-slate-200 text-slate-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-2 font-semibold w-20">TIME</th>
                        <th className="p-2 font-semibold w-28">SRC NF</th>
                        <th className="p-2 font-semibold w-28">DEST NF</th>
                        <th className="p-2 font-semibold w-40">SBI OPERATION</th>
                        <th className="p-2 font-semibold w-20">STATUS</th>
                        <th className="p-2 font-semibold">PAYLOAD EXCERPT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {traceData.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic font-sans">No signaling traces captured. Submit an intent.</td></tr>
                      ) : (
                        traceData.map((trace, i) => (
                          <tr key={trace.id} className={`transition-colors ${trace.src === 'TRF' || trace.dest === 'TRF' ? 'bg-purple-50 hover:bg-purple-100' : 'hover:bg-blue-50'}`}>
                            <td className="p-2 text-slate-500">{trace.time}</td>
                            <td className="p-2 font-bold text-slate-700">{safeRender(trace.src)}</td>
                            <td className="p-2 font-bold text-slate-700">{safeRender(trace.dest)}</td>
                            <td className={`p-2 font-bold ${trace.src === 'TRF' || trace.dest === 'TRF' ? 'text-purple-700' : 'text-blue-700'}`}>{safeRender(trace.op)}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                trace.status.includes('20') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                                trace.status.includes('50') ? 'bg-red-100 text-red-800 border border-red-200' : 
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {safeRender(trace.status)}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500 truncate max-w-[250px]" title={typeof trace.payload === 'object' ? JSON.stringify(trace.payload) : trace.payload}>
                              {typeof trace.payload === 'object' ? JSON.stringify(trace.payload) : trace.payload}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Tabbed Console */}
            <div className="w-[340px] bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10 shrink-0">
              
              {/* Tabs Header */}
              <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                <button 
                  onClick={() => setRightTab('intent')} 
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${rightTab === 'intent' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                   <Zap size={12}/> Intent
                </button>
                <button 
                  onClick={() => setRightTab('log')} 
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${rightTab === 'log' ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                   <BrainCircuit size={12}/> ReAct Log
                </button>
                <button 
                  onClick={() => setRightTab('ue')} 
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${rightTab === 'ue' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                   <Smartphone size={12}/> UE State
                </button>
                <button 
                  onClick={() => setRightTab('ngap')} 
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${rightTab === 'ngap' ? 'border-amber-600 text-amber-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                   <Radio size={12}/> NGAP
                </button>
                <button 
                  onClick={() => setRightTab('infra')} 
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${rightTab === 'infra' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                   <HardDrive size={12}/> Infra Diags
                </button>
              </div>

              {/* TAB 1: INTENT ENGINE */}
              {rightTab === 'intent' && (
                <div className="p-4 flex-1 overflow-y-auto animate-in fade-in">
                  {/* Input Form */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Natural Language Request</label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isProcessing || isPlaying}
                      placeholder="Enter raw intent text..."
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 resize-none h-24 mb-2 font-mono text-slate-700 disabled:opacity-60"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSuggest} disabled={isProcessing || isPlaying} className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 py-1.5 rounded text-[10px] font-bold transition-colors disabled:opacity-60">
                        SUGGEST AR GAME
                      </button>
                      <button onClick={processIntent} disabled={isProcessing || isPlaying || !inputText.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-60">
                        {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                        EXECUTE
                      </button>
                    </div>
                  </div>

                  {/* Structured Intent Extracted */}
                  <div className="border border-slate-200 rounded overflow-hidden mb-4">
                    <div className="bg-slate-100 p-2 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                      Semi-Structured Intent
                      {intentData && <CheckCircle size={12} className="text-emerald-500" />}
                    </div>
                    <div className="p-3 bg-white text-[11px] text-slate-700 space-y-3">
                      {intentData ? (
                        <>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Goals</span>
                            <span className="text-blue-800 font-medium">{safeRender(intentData.goals)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Requirements</span>
                            <ul className="list-disc pl-4 font-mono text-emerald-700 text-[10px]">
                              {Array.isArray(intentData.requirements) ? intentData.requirements.map((req, i) => <li key={i}>{safeRender(req)}</li>) : null}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Conditions</span>
                            <ul className="list-disc pl-4 font-mono text-amber-700 text-[10px]">
                              {Array.isArray(intentData.conditions) ? intentData.conditions.map((cond, i) => <li key={i}>{safeRender(cond)}</li>) : null}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Guidelines</span>
                            <span className="font-mono text-purple-700 text-[10px]">{safeRender(intentData.guidelines)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 italic text-center py-4">Awaiting NLP classification...</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1.5: MULTI-AGENT REACT LOG */}
              {rightTab === 'log' && (
                <div className="p-4 flex-1 overflow-y-auto bg-slate-50 animate-in fade-in">
                  <div className="flex flex-col gap-1 mb-4 pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Multi-Agent Orchestration</h3>
                    <span className="text-[10px] text-slate-500">Live Reasoning (Chain-of-Thought)</span>
                  </div>
                  
                  {isProcessing || isPlaying ? (
                    <div className="flex flex-col items-center justify-center h-32 text-emerald-600 gap-3">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="font-mono text-[10px] animate-pulse">Agents are reasoning...</span>
                    </div>
                  ) : Array.isArray(agentLogs) && agentLogs.length > 0 ? (
                    <div className="space-y-5">
                      {agentLogs.map((logSection, idx) => {
                        const safeName = safeRender(logSection.agent_name);
                        let colorTheme = "emerald";
                        let IconComponent = BrainCircuit;
                        
                        if (safeName.includes("Conn_Agent")) {
                          colorTheme = "blue";
                          IconComponent = Network;
                        } else if (safeName.includes("Compute_Agent")) {
                          colorTheme = "sky";
                          IconComponent = Cpu;
                        }

                        return (
                          <div key={idx} className="flex flex-col gap-2">
                            {/* Agent Header */}
                            <div className={`flex items-center gap-1.5 text-${colorTheme}-600 font-bold text-[10px] uppercase tracking-wider bg-${colorTheme}-50 py-1 px-2 rounded-md border border-${colorTheme}-100 w-max`}>
                              <IconComponent size={12} />
                              {safeName}
                            </div>
                            
                            {/* Agent Thoughts */}
                            <div className="space-y-2">
                              {Array.isArray(logSection.thoughts) ? logSection.thoughts.map((thought, tIdx) => (
                                <div key={tIdx} className="bg-white border border-slate-200 rounded p-2.5 shadow-sm relative overflow-hidden group ml-2">
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${colorTheme}-500 transition-colors`}></div>
                                  <div className="flex gap-2 items-start">
                                    <span className={`text-${colorTheme}-600 font-mono font-bold text-[9px] mt-0.5`}>[{tIdx + 1}]</span>
                                    <p className="text-[10px] text-slate-700 font-mono leading-relaxed">{safeRender(thought)}</p>
                                  </div>
                                </div>
                              )) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center px-4 border-2 border-dashed border-slate-200 rounded-lg">
                      <BrainCircuit size={24} className="mb-2 text-slate-300" />
                      <p>Execute an intent to view the LLM's internal ReAct (Reasoning and Acting) process.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: UE DIAGNOSTICS */}
              {rightTab === 'ue' && (
                <div className="p-4 flex-1 overflow-y-auto bg-slate-50 animate-in fade-in">
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Lookup UE Context</label>
                  <form onSubmit={handleUeSearch} className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={ueQuery} 
                      onChange={(e) => setUeQuery(e.target.value)}
                      placeholder="SUPI / IMSI / PEI"
                      className="flex-1 bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                    <button type="submit" disabled={!ueQuery.trim() || isFetchingUe} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm">
                      {isFetchingUe ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} FETCH
                    </button>
                  </form>

                  {ueData ? (
                    <div className="space-y-3">
                      {/* Identification */}
                      <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
                        <div className="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 mb-2 flex items-center gap-1"><Smartphone size={10}/> IDENTIFICATION</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div><span className="text-slate-400 block">SUPI</span> <span className="font-bold text-slate-700">{ueData.supi}</span></div>
                          <div><span className="text-slate-400 block">PEI</span> <span className="text-slate-600">{ueData.pei}</span></div>
                        </div>
                      </div>

                      {/* Status & Location */}
                      <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
                        <div className="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 mb-2 flex items-center gap-1"><MapPin size={10}/> STATUS & LOCATION</div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-bold">{ueData.status}</span>
                          <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-bold">{ueData.rmStatus}</span>
                        </div>
                        <div className="text-[10px] font-mono space-y-1.5">
                          <div className="flex gap-2"><Radio size={12} className="text-slate-400"/> <span className="text-slate-600">{ueData.location.tai}</span></div>
                          <div className="flex gap-2"><Signal size={12} className="text-slate-400"/> <span className="text-slate-600">{ueData.location.gNodeB}</span></div>
                          <div className="flex gap-2"><MapPin size={12} className="text-slate-400"/> <span className="text-slate-600">{ueData.location.cellId}</span></div>
                        </div>
                      </div>

                      {/* Sessions */}
                      <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
                        <div className="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 mb-2 flex items-center gap-1"><Activity size={10}/> ACTIVE PDU SESSIONS ({ueData.sessions.length})</div>
                        <div className="space-y-2">
                          {ueData.sessions.map(s => (
                            <div key={s.id} className="bg-slate-50 border border-slate-100 rounded p-2 text-[10px] font-mono">
                              <div className="flex justify-between mb-1">
                                <span className="font-bold text-purple-700">DNN: {s.dnn}</span>
                                <span className="text-emerald-600 font-bold">{s.ip}</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>{s.sNssai}</span>
                                <span>{s.qos}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center px-4 border-2 border-dashed border-slate-200 rounded-lg">
                      <Database size={24} className="mb-2 text-slate-300" />
                      <p>Enter a SUPI/IMSI to fetch context from 6G UDM & AM.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* TAB 3: NGAP LINKS */}
              {rightTab === 'ngap' && (
                <div className="p-4 flex-1 overflow-y-auto bg-slate-50 animate-in fade-in flex flex-col">
                  <div className="flex flex-col gap-1 mb-4 pb-2 border-b border-slate-200 shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">NGAP Connections</h3>
                      <button 
                        onClick={handleNgapRefresh} 
                        disabled={isFetchingNgap}
                        className="text-amber-600 hover:text-amber-700 bg-amber-50 p-1 rounded transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isFetchingNgap ? "animate-spin" : ""} />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500">Live SCTP links between RAN & SRF</span>
                  </div>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {ngapData.map((gnb, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded p-3 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                        <div className="flex justify-between items-start mb-2 ml-1">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                               {gnb.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {gnb.id}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${gnb.status === 'ESTABLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {gnb.status}
                          </span>
                        </div>
                        <div className="ml-1 space-y-1 mt-3">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Endpoint IP</span>
                            <span className="text-slate-700 font-bold">{gnb.ip}</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Active UEs</span>
                            <span className="text-blue-600 font-bold">{gnb.ues.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Uptime</span>
                            <span className="text-slate-600">{gnb.uptime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: INFRA DIAGNOSTICS & LIVE LOGS */}
              {rightTab === 'infra' && (
                <div className="p-4 flex-1 overflow-y-auto bg-slate-50 animate-in fade-in flex flex-col">
                  <div className="flex flex-col gap-1 mb-4 pb-2 border-b border-slate-200 shrink-0">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Infrastructure Status</h3>
                    <span className="text-[10px] text-slate-500">Live CPU/Memory & Node Terminal Logs</span>
                  </div>
                  
                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    {/* Group By Category */}
                    {['AI Control Layer', 'free5GC NFs', 'UERANSIM'].map(groupName => (
                      <div key={groupName} className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm shrink-0">
                        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                          {groupName}
                        </div>
                        <div className="divide-y divide-slate-100">
                          {infraData.filter(p => p.group === groupName).map((proc, i) => (
                            <div key={i} className="p-3">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-mono text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                  {proc.name}
                                </span>
                                
                                <button 
                                  onClick={() => setActiveLogProcess(activeLogProcess === proc.name ? null : proc.name)}
                                  className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${activeLogProcess === proc.name ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                  <TerminalSquare size={10} />
                                  {activeLogProcess === proc.name ? 'HIDE LOGS' : 'VIEW LOGS'}
                                </button>
                              </div>
                              
                              {/* CPU Bar */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] text-slate-500 w-6">CPU</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 rounded-full ${proc.cpu > 70 ? 'bg-red-500' : proc.cpu > 40 ? 'bg-amber-500' : 'bg-sky-500'}`}
                                    style={{ width: `${proc.cpu}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] font-mono text-slate-600 w-8 text-right">{proc.cpu.toFixed(1)}%</span>
                              </div>
                              
                              {/* RAM Bar */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500 w-6">MEM</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-purple-500 transition-all duration-500 rounded-full"
                                    style={{ width: `${Math.min(100, (proc.mem / 1500) * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] font-mono text-slate-600 w-8 text-right">{Math.round(proc.mem)}M</span>
                              </div>

                              {/* Terminal Expansion */}
                              {activeLogProcess === proc.name && (
                                <div 
                                  ref={logContainerRef}
                                  className="mt-3 bg-slate-950 rounded border border-slate-700 h-32 overflow-y-auto p-2 font-mono text-[9px] text-emerald-400 space-y-1 shadow-inner animate-in slide-in-from-top-2"
                                >
                                  {processLogs[proc.name]?.length > 0 ? (
                                    processLogs[proc.name].map((logStr, lIdx) => (
                                      <div key={lIdx} className="opacity-90 hover:opacity-100">{logStr}</div>
                                    ))
                                  ) : (
                                    <div className="text-slate-600 italic">No logs available.</div>
                                  )}
                                </div>
                              )}

                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        )}

        {/* VIEW: SESSIONS LIST */}
        {appView === 'sessions_list' && (
          <div className="w-full h-full bg-white flex flex-col animate-in fade-in">
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <List size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Sessions History</h2>
              </div>
              <span className="text-slate-500 font-mono text-xs">{sessionHistory.length} Total Traces</span>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {sessionHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <List size={48} className="mb-4 opacity-20" />
                  <p className="text-sm">No session traces recorded yet.</p>
                  <p className="text-xs mt-1">Execute an intent on the dashboard to generate a trace.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-bold uppercase tracking-wider w-10"></th>
                        <th className="p-3 font-bold uppercase tracking-wider">Session ID</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Created At</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Environment</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Intent Summary</th>
                        <th className="p-3 font-bold uppercase tracking-wider text-center">Traces</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionHistory.map((session, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => { setViewingSession(session); setAppView('session_detail'); }}
                          className="hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                          <td className="p-3 text-center"><Star size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors" /></td>
                          <td className="p-3 font-mono font-bold text-blue-600">{session.id}</td>
                          <td className="p-3 text-slate-600 font-mono">{session.createdAt}</td>
                          <td className="p-3">
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{session.environment}</span>
                          </td>
                          <td className="p-3 text-slate-700 truncate max-w-xs" title={session.intent}>{session.intent}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{session.tracesCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: SESSION DETAIL (Trace View) */}
        {appView === 'session_detail' && viewingSession && (
          <div className="w-full h-full bg-white flex flex-col animate-in fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setAppView('sessions_list')}
                  className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-bold transition-colors text-xs"
                >
                  <ArrowLeft size={16} /> Back to Sessions
                </button>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">Session Trace:</span>
                  <span className="font-mono text-sm text-blue-600 font-bold">{viewingSession.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setAppView('replay_animation')}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-xs font-bold transition-colors shadow-sm"
              >
                <PlayCircle size={14} /> REPLAY ON DASHBOARD
              </button>
            </div>

            {/* Split View Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Pane: Prompt & Thoughts */}
              <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-white p-6">
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">User Request</h3>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-slate-800 text-sm leading-relaxed">
                    {viewingSession.intent}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <BrainCircuit size={14} className="text-emerald-500"/> Assistant ReAct Processing
                  </h3>
                  
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg space-y-5">
                    {Array.isArray(viewingSession.data?.agent_logs) ? viewingSession.data.agent_logs.map((logSection, idx) => (
                       <div key={idx} className="flex flex-col gap-2">
                         <div className="font-bold text-xs text-emerald-800 uppercase tracking-wider">{safeRender(logSection.agent_name)}</div>
                         <div className="space-y-2">
                           {Array.isArray(logSection.thoughts) ? logSection.thoughts.map((thought, tIdx) => (
                             <div key={tIdx} className="flex gap-2 items-start ml-2">
                               <span className="text-emerald-500 font-mono font-bold text-[10px] mt-0.5">[{tIdx + 1}]</span>
                               <p className="text-xs text-slate-700 font-mono leading-relaxed">{safeRender(thought)}</p>
                             </div>
                           )) : null}
                         </div>
                       </div>
                    )) : (
                      <span className="text-slate-500 italic">No reasoning logs available for this trace.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane: Generated Traces */}
              <div className="w-1/2 overflow-y-auto bg-slate-50 p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Generated Network Traces</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">{viewingSession.tracesCount} Executions</span>
                </h3>
                
                <div className="space-y-3">
                  {Array.isArray(viewingSession.data?.sbi_traces) && viewingSession.data.sbi_traces.length > 0 ? (
                    viewingSession.data.sbi_traces.map((trace, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded shadow-sm p-3 hover:border-blue-300 transition-colors">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-700 text-xs">{safeRender(trace.src_nf)}</span>
                             <ArrowRight size={12} className="text-slate-400" />
                             <span className="font-bold text-slate-700 text-xs">{safeRender(trace.dest_nf)}</span>
                           </div>
                           <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${safeRender(trace.status).includes('20') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                             {safeRender(trace.status)}
                           </span>
                         </div>
                         <div className="font-mono text-xs text-blue-600 font-bold mb-2">
                           {safeRender(trace.operation)}()
                         </div>
                         <div className="bg-slate-900 text-emerald-400 p-2 rounded text-[10px] font-mono overflow-x-auto">
                           {typeof trace.payload === 'object' ? JSON.stringify(trace.payload, null, 2) : safeRender(trace.payload)}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded">
                      No SBI Traces were generated during this session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- Small UI Sub-components for NOC Styling ---

function KpiBlock({ label, value, trend }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-bold text-sm text-slate-100 font-mono">{value}</span>
        {trend === 'up' && <ArrowRight size={10} className="text-emerald-400 -rotate-45" />}
        {trend === 'up_bad' && <ArrowRight size={10} className="text-red-400 -rotate-45" />}
        {trend === 'down' && <ArrowRight size={10} className="text-emerald-400 rotate-45" />}
      </div>
    </div>
  );
}

function TreeItem({ id, icon, label, active, hasChildren, isExpanded, onToggle, className = "" }) {
  return (
    <div 
      onClick={() => hasChildren && onToggle && onToggle(id)}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded select-none ${hasChildren ? 'cursor-pointer hover:bg-slate-200' : ''} ${active ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600'} ${className}`}
    >
      <div className="w-3 flex justify-center">
        {hasChildren && (
           isExpanded ? <ChevronDown size={10} className="text-slate-500" /> : <ChevronRight size={10} className="text-slate-400" />
        )}
      </div>
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function ToolBadge({ label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="text-[9px] font-mono bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-700 px-1.5 py-0.5 rounded w-max mb-1 shadow-sm transition-colors text-left"
    >
      {label}
    </button>
  );
}

function NFNode({ id, label, icon, active, color = "slate", size = "normal" }) {
  const colors = {
    slate: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-300', shadow: 'shadow-sm' },
    blue: { bg: 'bg-white', text: 'text-blue-600', border: 'border-blue-300', shadow: 'shadow-sm' },
    emerald: { bg: 'bg-white', text: 'text-emerald-600', border: 'border-emerald-300', shadow: 'shadow-sm' },
    sky: { bg: 'bg-white', text: 'text-sky-600', border: 'border-sky-300', shadow: 'shadow-sm' },
    purple: { bg: 'bg-white', text: 'text-purple-600', border: 'border-purple-300', shadow: 'shadow-sm' }
  };
  const c = colors[color] || colors.slate;
  const sizeClass = size === "small" ? "w-10 h-10" : "w-14 h-14";

  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      <div className={`${sizeClass} rounded flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${c.bg} ${c.border} ${c.text} ${active ? `ring-4 ring-${color}-100 border-${color}-500 scale-110 shadow-lg` : c.shadow}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold whitespace-nowrap ${active ? `text-${color}-700` : 'text-slate-600'}`}>{label}</span>
      {active && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white animate-pulse z-20"></div>}
    </div>
  );
}

function Arrow({ active }) {
  return (
    <div className="flex-1 flex items-center justify-center px-1">
      <div className={`h-0.5 w-full transition-colors duration-300 relative ${active ? 'bg-blue-500' : 'bg-slate-200'}`}>
        <div className={`absolute right-0 -top-1 w-0 h-0 border-y-4 border-y-transparent border-l-4 transition-colors duration-300 ${active ? 'border-l-blue-500' : 'border-l-slate-200'}`}></div>
      </div>
    </div>
  );
}