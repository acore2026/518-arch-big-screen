import { useState, useEffect, useRef } from 'react';
import { 
  Activity, Server, Database, Network, Wifi, 
  Play, CheckCircle, Clock, Search, 
  SlidersHorizontal, ChevronRight, ChevronDown, 
  Loader2, Zap, BrainCircuit, Smartphone, ArrowRight,
  Library, FileJson, Layers, Bot, Microchip, Radio, MapPin, Signal,
  RotateCcw, HardDrive, X, Code, RefreshCw
} from 'lucide-react';

const DEFAULT_INTENT_TEXT = 'Deploy a massive IoT reachability tracking session for smart meters. Devices exhibit fixed-device characteristics.';

const DEFAULT_INTENT_DATA = {
  goals: 'Deploy reachability tracking session for smart meters',
  requirements: [
    'Reachability monitoring',
    'Device profile verification',
    'Subscription-based IoT tracking',
  ],
  conditions: [
    'Fixed-device characteristics',
    'Massive IoT scale',
  ],
  guidelines: 'Criticality: High scalability; focus on fixed-location power efficiency',
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/dashscope/compatible-mode/v1/chat/completions';
const MODEL_NAME = import.meta.env.VITE_MODEL_NAME || 'glm-5';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const USE_REAL_LLM = String(import.meta.env.VITE_USE_REAL_LLM || '').toLowerCase() === 'true';
const DISPLAY_MODEL_NAME = MODEL_NAME;
const SESSION_STORAGE_KEY = 'agentic-core-session-history';

const SUGGESTED_INTENTS = [
  DEFAULT_INTENT_TEXT,
  'Provision an AGV swarm control slice with ultra-low latency, deterministic routing, and closed-loop mobility monitoring across factory sectors.',
  'Create an AR gamer session with edge-optimized traffic steering, subscriber policy validation, and predictive analytics for handover quality.',
];

const DEFAULT_PLAYBACK_DATA = {
  structured_intent: DEFAULT_INTENT_DATA,
  agent_logs: [
    {
      agent_name: 'System_Agent',
      thoughts: [
        'Intent classified as massive IoT reachability tracking for fixed smart-meter devices.',
        'Required capabilities identified: subscription validation, AM reachability policy, and NWDAF optimization analytics.',
        'Selecting TRF tools and dispatching downstream tasks to Conn_Agent for host-specific execution.',
      ],
    },
    {
      agent_name: 'Conn_Agent',
      thoughts: [
        'Resolved target hosts: 6G UDM for subscription context, 6G AM for reachability control, 6G NWDAF for predictive analytics.',
        'Applying fixed-device tracking profile with periodic monitoring and low-power reachability constraints.',
        'All downstream SBI operations completed successfully; returning completion state to System_Agent.',
      ],
    },
  ],
  sbi_traces: [
    { src_nf: 'System_Agent', dest_nf: 'TRF', operation: 'Ntrf_ToolDiscovery', payload: '{"service":"reachability_tracking","constraints":["massive_IoT","fixed_device"]}', status: 'Success' },
    { src_nf: 'Conn_Agent', dest_nf: '6G UDM', operation: 'Subscription_Tool', payload: '{"query":"device_profile","type":"smart_meter","id_range":"IoT-block-104"}', status: 'Success' },
    { src_nf: 'Conn_Agent', dest_nf: '6G AM', operation: 'Reachability_Tool', payload: '{"action":"activate_tracking","mode":"periodic","ue_type":"fixed"}', status: 'Success' },
    { src_nf: 'Conn_Agent', dest_nf: '6G NWDAF', operation: 'Analytic_Tool', payload: '{"analytics_id":"reachability_optimization","target":"massive_IoT_group"}', status: 'Success' },
  ],
};

type PlaybackData = {
  structured_intent?: typeof DEFAULT_INTENT_DATA | null
  agent_logs?: Array<{ agent_name: string; thoughts: string[] }>
  sbi_traces?: Array<{ src_nf: string; dest_nf: string; operation: string; payload: any; status: string }>
};

type TraceRow = {
  id: string;
  time: string;
  src: string;
  dest: string;
  op: string;
  payload: string;
  status: string;
};

type SessionRecord = {
  id: string;
  createdAt: string;
  intent: string;
  data: PlaybackData;
  traceRows: TraceRow[];
  traceCount: number;
  ueId: string | null;
  ueLabel: string;
  ueSupi: string;
};

type UeSnapshot = {
  supi: string;
  pei: string;
  status: string;
  rmStatus: string;
  location: {
    tai: string;
    gNodeB: string;
    cellId: string;
  };
  sessions: Array<{ id: number; dnn: string; sNssai: string; ip: string; qos: string }>;
  policy: {
    policyId: string;
    targetDnn: string;
    targetSlice: string;
    qfi: number;
    qosId: string;
    '5qi': number;
    gbrDl: string;
    gbrUl: string;
    maxbrDl: string;
    maxbrUl: string;
    reflectiveQoS: string;
    arp: {
      preemptCap: string;
      prioritLevel: number;
      preemptVuln: string;
    };
  };
  metrics: {
    windowLabel: string;
    samples: Array<{ label: string; dl: number; ul: number }>;
    summary: {
      avgDl: string;
      peakDl: string;
      avgUl: string;
      rtt: string;
      jitter: string;
      packetLoss: string;
    };
  };
};

type MockUeOption = {
  id: string;
  label: string;
  profile: string;
  summary: string;
  data: UeSnapshot;
};

type SelectorPlacement = 'header' | 'sidebar' | 'intent';

const DEFAULT_UE_DATA: UeSnapshot = {
  supi: 'imsi-208930000000001',
  pei: 'imeisv-35431108221433-12',
  status: 'CM-CONNECTED',
  rmStatus: 'RM-REGISTERED',
  location: {
    tai: 'TAC: 0x0001, MCC: 208, MNC: 93',
    gNodeB: 'gNB-ID: 10449',
    cellId: 'NR-CGI: 208930001044901',
  },
  sessions: [
    { id: 1, dnn: 'internet', sNssai: 'eMBB (SST:1)', ip: '10.0.0.12', qos: '5QI: 9' },
    { id: 2, dnn: 'urllc.agv', sNssai: 'URLLC (SST:2)', ip: '10.0.0.42', qos: '5QI: 82' },
  ],
  policy: {
    policyId: 'POL-URLLC-AGV-0027',
    targetDnn: 'urllc.agv',
    targetSlice: 'SST:2 / SD:0xA1B2C3',
    qfi: 7,
    qosId: 'QOS-URLLC-AGV-CONTROL-82',
    '5qi': 82,
    gbrDl: '40 Mbps',
    gbrUl: '20 Mbps',
    maxbrDl: '80 Mbps',
    maxbrUl: '40 Mbps',
    reflectiveQoS: 'Enabled',
    arp: {
      preemptCap: 'MAY_PREEMPT',
      prioritLevel: 2,
      preemptVuln: 'PREEMPTABLE',
    },
  },
  metrics: {
    windowLabel: 'Last 30 sec',
    samples: [
      { label: '-30s', dl: 22, ul: 7 },
      { label: '-25s', dl: 28, ul: 9 },
      { label: '-20s', dl: 34, ul: 11 },
      { label: '-15s', dl: 46, ul: 15 },
      { label: '-10s', dl: 58, ul: 18 },
      { label: '-5s', dl: 52, ul: 16 },
      { label: 'Now', dl: 49, ul: 14 },
    ],
    summary: {
      avgDl: '41.3 Mbps',
      peakDl: '58.0 Mbps',
      avgUl: '12.9 Mbps',
      rtt: '11.8 ms',
      jitter: '2.4 ms',
      packetLoss: '0.06%',
    },
  },
};

// --- Mock Tool Definitions ---
const TOOL_DEFINITIONS: Record<string, { desc: string; inputs: string[]; outputs: string[]; host: string; criticality: string }> = {
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

const TRF_TOOL_GROUPS = [
  { label: '6G AM Tools', tools: ['AUTH_Tool', 'SC_Tool', 'MM_Tool', 'Reachability_Tool'] },
  { label: '6G SM Tools', tools: ['SMC_Tool', 'TR_Tool', 'UPC_Tool', 'VN_creation_tool', 'DNS_Resolver_Tool'] },
  { label: '6G UDM Tools', tools: ['Subscription_Tool'] },
  { label: '6G NWDAF Tools', tools: ['Analytic_Tool'] },
];

const safeRender = (val: any) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const UE_METRIC_LABELS = ['-30s', '-25s', '-20s', '-15s', '-10s', '-5s', 'Now'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatMbps(value: number) {
  return `${value.toFixed(1)} Mbps`;
}

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}

function formatPct(value: number) {
  return `${value.toFixed(2)}%`;
}

function cloneUeData(data: UeSnapshot): UeSnapshot {
  return {
    ...data,
    location: { ...data.location },
    sessions: data.sessions.map((session) => ({ ...session })),
    policy: {
      ...data.policy,
      arp: { ...data.policy.arp },
    },
    metrics: {
      ...data.metrics,
      samples: data.metrics.samples.map((sample) => ({ ...sample })),
      summary: { ...data.metrics.summary },
    },
  };
}

const MOCK_UES: MockUeOption[] = [
  {
    id: 'ar-gamer-01',
    label: 'AR Gamer 01',
    profile: 'AR-Gamer',
    summary: 'Edge-rendered AR session with mobility-sensitive QoS.',
    data: {
      supi: 'imsi-208930000000011',
      pei: 'imeisv-35399109011234-21',
      status: 'CM-CONNECTED',
      rmStatus: 'RM-REGISTERED',
      location: {
        tai: 'TAC: 0x0007, MCC: 208, MNC: 93',
        gNodeB: 'gNB-ID: 10612',
        cellId: 'NR-CGI: 208930001061201',
      },
      sessions: [
        { id: 1, dnn: 'internet', sNssai: 'eMBB (SST:1)', ip: '10.10.0.19', qos: '5QI: 9' },
        { id: 2, dnn: 'ar.edge', sNssai: 'XR (SST:4)', ip: '10.10.1.33', qos: '5QI: 7' },
      ],
      policy: {
        policyId: 'POL-XR-EDGE-1108',
        targetDnn: 'ar.edge',
        targetSlice: 'SST:4 / SD:0xEA7101',
        qfi: 11,
        qosId: 'QOS-XR-EDGE-7',
        '5qi': 7,
        gbrDl: '120 Mbps',
        gbrUl: '30 Mbps',
        maxbrDl: '180 Mbps',
        maxbrUl: '60 Mbps',
        reflectiveQoS: 'Enabled',
        arp: {
          preemptCap: 'MAY_PREEMPT',
          prioritLevel: 3,
          preemptVuln: 'NOT_PREEMPTABLE',
        },
      },
      metrics: {
        windowLabel: 'Last 30 sec',
        samples: [
          { label: '-30s', dl: 74, ul: 18 },
          { label: '-25s', dl: 82, ul: 20 },
          { label: '-20s', dl: 91, ul: 24 },
          { label: '-15s', dl: 88, ul: 21 },
          { label: '-10s', dl: 97, ul: 25 },
          { label: '-5s', dl: 103, ul: 27 },
          { label: 'Now', dl: 95, ul: 24 },
        ],
        summary: {
          avgDl: '90.0 Mbps',
          peakDl: '103.0 Mbps',
          avgUl: '22.7 Mbps',
          rtt: '9.4 ms',
          jitter: '1.9 ms',
          packetLoss: '0.03%',
        },
      },
    },
  },
  {
    id: 'agv-swarm-01',
    label: 'AGV Swarm 01',
    profile: 'AGV-Swarm',
    summary: 'Factory URLLC control plane for coordinated AGV movement.',
    data: cloneUeData(DEFAULT_UE_DATA),
  },
  {
    id: 'smart-meter-01',
    label: 'Smart Meter 01',
    profile: 'Smart-Meter',
    summary: 'Massive IoT metering endpoint with low-power periodic reachability.',
    data: {
      supi: 'imsi-208930000000031',
      pei: 'imeisv-86422107054119-05',
      status: 'CM-IDLE',
      rmStatus: 'RM-REGISTERED',
      location: {
        tai: 'TAC: 0x000C, MCC: 208, MNC: 93',
        gNodeB: 'gNB-ID: 20512',
        cellId: 'NR-CGI: 208930002051204',
      },
      sessions: [
        { id: 1, dnn: 'iot.telemetry', sNssai: 'mMTC (SST:3)', ip: '10.20.4.88', qos: '5QI: 70' },
      ],
      policy: {
        policyId: 'POL-MIOT-TRACK-7842',
        targetDnn: 'iot.telemetry',
        targetSlice: 'SST:3 / SD:0x00AA31',
        qfi: 3,
        qosId: 'QOS-MIOT-REACHABILITY-70',
        '5qi': 70,
        gbrDl: '256 Kbps',
        gbrUl: '384 Kbps',
        maxbrDl: '1 Mbps',
        maxbrUl: '1 Mbps',
        reflectiveQoS: 'Disabled',
        arp: {
          preemptCap: 'NOT_PREEMPT',
          prioritLevel: 8,
          preemptVuln: 'PREEMPTABLE',
        },
      },
      metrics: {
        windowLabel: 'Last 30 sec',
        samples: [
          { label: '-30s', dl: 1.1, ul: 0.4 },
          { label: '-25s', dl: 1.4, ul: 0.5 },
          { label: '-20s', dl: 1.8, ul: 0.6 },
          { label: '-15s', dl: 1.2, ul: 0.5 },
          { label: '-10s', dl: 2.0, ul: 0.8 },
          { label: '-5s', dl: 1.6, ul: 0.6 },
          { label: 'Now', dl: 1.3, ul: 0.5 },
        ],
        summary: {
          avgDl: '1.5 Mbps',
          peakDl: '2.0 Mbps',
          avgUl: '0.6 Mbps',
          rtt: '46.0 ms',
          jitter: '6.1 ms',
          packetLoss: '0.12%',
        },
      },
    },
  },
];

function advanceUeMetrics(metrics: any) {
  const previousSamples = Array.isArray(metrics?.samples) ? metrics.samples : DEFAULT_UE_DATA.metrics.samples;
  const lastSample = previousSamples[previousSamples.length - 1] || { dl: 49, ul: 14 };

  const nextDl = clamp(lastSample.dl + (Math.random() * 10 - 5.2), 20, 64);
  const nextUl = clamp(lastSample.ul + (Math.random() * 5 - 2.5), 6, 24);
  const shiftedValues = [...previousSamples.slice(1).map((sample: any) => ({ dl: sample.dl, ul: sample.ul })), { dl: nextDl, ul: nextUl }];
  const samples = UE_METRIC_LABELS.map((label, index) => ({
    label,
    dl: Number(shiftedValues[index].dl.toFixed(1)),
    ul: Number(shiftedValues[index].ul.toFixed(1)),
  }));

  const avgDlValue = samples.reduce((sum, sample) => sum + sample.dl, 0) / samples.length;
  const avgUlValue = samples.reduce((sum, sample) => sum + sample.ul, 0) / samples.length;
  const peakDlValue = samples.reduce((max, sample) => Math.max(max, sample.dl), 0);
  const currentLoadRatio = nextDl / 64;
  const rttValue = clamp(9.5 + currentLoadRatio * 4.2 + Math.random() * 0.7, 8.5, 16.5);
  const jitterValue = clamp(1.4 + currentLoadRatio * 1.6 + Math.random() * 0.4, 1.1, 4.2);
  const packetLossValue = clamp(0.02 + currentLoadRatio * 0.08 + Math.random() * 0.02, 0.01, 0.18);

  return {
    ...metrics,
    samples,
    summary: {
      avgDl: formatMbps(avgDlValue),
      peakDl: formatMbps(peakDlValue),
      avgUl: formatMbps(avgUlValue),
      rtt: formatMs(rttValue),
      jitter: formatMs(jitterValue),
      packetLoss: formatPct(packetLossValue),
    },
  };
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  const delays = [700, 1400, 2400];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown network error');
      if (attempt === retries - 1) {
        throw lastError;
      }
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }

  throw lastError || new Error('Request failed');
}

function extractJsonPayload(rawContent: unknown) {
  const content = Array.isArray(rawContent)
    ? rawContent.map((item) => safeRender((item as any)?.text ?? item)).join('')
    : safeRender(rawContent);
  const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Model response did not contain valid JSON');
  }
}

function normalizePlaybackData(rawData: any): PlaybackData {
  const structuredIntent = rawData?.structured_intent && typeof rawData.structured_intent === 'object'
    ? {
        goals: safeRender(rawData.structured_intent.goals) || DEFAULT_INTENT_DATA.goals,
        requirements: Array.isArray(rawData.structured_intent.requirements)
          ? rawData.structured_intent.requirements.map((item: unknown) => safeRender(item)).filter(Boolean)
          : [],
        conditions: Array.isArray(rawData.structured_intent.conditions)
          ? rawData.structured_intent.conditions.map((item: unknown) => safeRender(item)).filter(Boolean)
          : [],
        guidelines: safeRender(rawData.structured_intent.guidelines) || DEFAULT_INTENT_DATA.guidelines,
      }
    : DEFAULT_INTENT_DATA;

  const agentLogs = Array.isArray(rawData?.agent_logs)
    ? rawData.agent_logs
        .map((entry: any) => ({
          agent_name: safeRender(entry?.agent_name) || 'Unknown_Agent',
          thoughts: Array.isArray(entry?.thoughts)
            ? entry.thoughts.map((thought: unknown) => safeRender(thought)).filter(Boolean)
            : [],
        }))
        .filter((entry: { agent_name: string; thoughts: string[] }) => entry.thoughts.length > 0)
    : [];

  const sbiTraces = Array.isArray(rawData?.sbi_traces)
    ? rawData.sbi_traces
        .map((trace: any) => ({
          src_nf: safeRender(trace?.src_nf) || 'System_Agent',
          dest_nf: safeRender(trace?.dest_nf) || 'TRF',
          operation: safeRender(trace?.operation) || 'Unknown_Operation',
          payload: trace?.payload ?? {},
          status: safeRender(trace?.status) || 'Success',
        }))
        .filter((trace: { operation: string }) => Boolean(trace.operation))
    : [];

  return {
    structured_intent: structuredIntent,
    agent_logs: agentLogs,
    sbi_traces: sbiTraces,
  };
}

async function generatePlaybackData(intent: string, targetUe: MockUeOption | null): Promise<PlaybackData> {
  if (!USE_REAL_LLM) {
    return DEFAULT_PLAYBACK_DATA;
  }

  if (!API_KEY) {
    throw new Error('VITE_USE_REAL_LLM is enabled, but VITE_API_KEY is missing.');
  }

  const systemPrompt = `You are the System Agent for a 6G agentic core dashboard.
Return only valid JSON with this shape:
{
  "structured_intent": {
    "goals": "string",
    "requirements": ["string"],
    "conditions": ["string"],
    "guidelines": "string"
  },
  "agent_logs": [
    {
      "agent_name": "System_Agent",
      "thoughts": ["string"]
    }
  ],
  "sbi_traces": [
    {
      "src_nf": "System_Agent",
      "dest_nf": "TRF",
      "operation": "Ntrf_ToolDiscovery",
      "payload": {"key": "value"},
      "status": "Success"
    }
  ]
}

Rules:
- Produce realistic orchestration for a 6G core network.
- Use these NF names exactly when applicable: TRF, System_Agent, Conn_Agent, Compute_Agent, 6G AM, 6G SM, 6G UDM, 6G NWDAF.
- The first trace should discover tools from TRF.
- Include 2-4 agent_logs sections with concise reasoning.
- Include 4-8 sbi_traces.
- Payload can be an object.
- Use the target UE context when choosing policy, reachability, mobility, and slice-related actions.
- Do not wrap the JSON in markdown fences.`;

  const response = await fetchWithRetry(API_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: JSON.stringify({
            intent,
            target_ue: targetUe
              ? {
                  label: targetUe.label,
                  profile: targetUe.profile,
                  supi: targetUe.data.supi,
                  status: targetUe.data.status,
                  rm_status: targetUe.data.rmStatus,
                  sessions: targetUe.data.sessions,
                  policy: {
                    policyId: targetUe.data.policy.policyId,
                    targetDnn: targetUe.data.policy.targetDnn,
                    targetSlice: targetUe.data.policy.targetSlice,
                    qfi: targetUe.data.policy.qfi,
                    '5qi': targetUe.data.policy['5qi'],
                  },
                }
              : null,
          }),
        },
      ],
    }),
  });

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM response did not include message content.');
  }

  return normalizePlaybackData(extractJsonPayload(content));
}

function buildTraceTimeline(intentStr: string, parsedData: PlaybackData, targetUe: MockUeOption | null): TraceRow[] {
  const rows: TraceRow[] = [
    {
      id: `trace-${Date.now()}-0`,
      time: '0ms',
      src: 'UERANSIM_APP',
      dest: 'SRF',
      op: 'Nsrf_Intent_Submit',
      payload: JSON.stringify({
        request: 'Raw Intent String',
        ue: targetUe?.data.supi || 'unassigned',
        profile: targetUe?.profile || 'unknown',
      }),
      status: '201 Created',
    },
    {
      id: `trace-${Date.now()}-1`,
      time: '0ms',
      src: 'SRF',
      dest: 'System_Agent',
      op: 'Npa_Task_Create',
      payload: JSON.stringify({
        intent: intentStr,
        ue_label: targetUe?.label || 'Unassigned UE',
        ue_supi: targetUe?.data.supi || 'unassigned',
      }),
      status: '200 OK',
    },
  ];

  let cumulativeTime = 437;
  const traces = Array.isArray(parsedData.sbi_traces) ? parsedData.sbi_traces : [];
  traces.forEach((trace, idx) => {
    cumulativeTime += 12 + (idx % 3) * 20;
    rows.push({
      id: `trace-${Date.now()}-${idx + 2}`,
      time: `+${cumulativeTime}ms`,
      src: safeRender(trace.src_nf) || 'Unknown',
      dest: safeRender(trace.dest_nf) || 'Unknown',
      op: safeRender(trace.operation) || 'Unknown',
      payload: typeof trace.payload === 'object' ? JSON.stringify(trace.payload) : safeRender(trace.payload),
      status: safeRender(trace.status) || 'Success',
    });
  });

  rows.push({
    id: `trace-${Date.now()}-${rows.length}`,
    time: '0ms',
    src: 'System_Agent',
    dest: 'UERANSIM_APP',
    op: 'Npa_Task_Complete',
    payload: '{"result":"Service Provisioned","closed_loop_active":true}',
    status: '200 OK',
  });

  return rows;
}

function createSessionRecord(intent: string, data: PlaybackData, targetUe: MockUeOption | null): SessionRecord {
  return {
    id: `service-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toLocaleString(),
    intent,
    data,
    traceRows: buildTraceTimeline(intent, data, targetUe),
    traceCount: Array.isArray(data.sbi_traces) ? data.sbi_traces.length : 0,
    ueId: targetUe?.id || null,
    ueLabel: targetUe?.label || 'Unassigned UE',
    ueSupi: targetUe?.data.supi || 'unassigned',
  };
}

export default function App() {
  const [inputText, setInputText] = useState(DEFAULT_INTENT_TEXT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [slowMode, setSlowMode] = useState(true); 
  
  const [traceData, setTraceData] = useState<any[]>([]);
  const [intentData, setIntentData] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]); 
  const [activeNFs, setActiveNFs] = useState<Set<string>>(new Set(['System_Agent']));
  const [rightTab, setRightTab] = useState('intent');
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [lastPlaybackData, setLastPlaybackData] = useState<PlaybackData>(DEFAULT_PLAYBACK_DATA);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((session: any) => ({
        ...session,
        traceRows: Array.isArray(session.traceRows)
          ? session.traceRows
          : buildTraceTimeline(
              session.intent || DEFAULT_INTENT_TEXT,
              session.data || DEFAULT_PLAYBACK_DATA,
              MOCK_UES.find((ue) => ue.id === session.ueId) || null,
            ),
        traceCount: typeof session.traceCount === 'number'
          ? session.traceCount
          : Array.isArray(session.data?.sbi_traces) ? session.data.sbi_traces.length : 0,
        ueId: typeof session.ueId === 'string' ? session.ueId : null,
        ueLabel: safeRender(session.ueLabel) || 'Unassigned UE',
        ueSupi: safeRender(session.ueSupi) || 'unassigned',
      }));
    } catch (error) {
      console.error('Failed to restore session history', error);
      return [];
    }
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectorPlacement, setSelectorPlacement] = useState<SelectorPlacement>('intent');
  const [selectedUeId, setSelectedUeId] = useState<string>(MOCK_UES[0].id);
  
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [canvasOverlay, setCanvasOverlay] = useState<'trf' | 'arf' | null>(null);
  const playbackIdRef = useRef(0);
  const topologyViewportRef = useRef<HTMLDivElement | null>(null);
  const [topologyScale, setTopologyScale] = useState(1);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([
    'plmn',
    'core',
    'ai_layer',
    'nfs',
    'am_t',
    'sm_t',
    'udm_t',
    'nwdaf_t',
  ]));
  const [ueData, setUeData] = useState<UeSnapshot | null>(() => cloneUeData(MOCK_UES[0].data));

  const [isFetchingNgap, setIsFetchingNgap] = useState(false);
  const [ngapData] = useState<any[]>([
    { id: '10449', name: 'gNB-GOA-Park', ip: '10.200.1.14', status: 'ESTABLISHED', ues: 142, uptime: '14d 2h' },
    { id: '20512', name: 'gNB-Sector-4', ip: '10.200.1.15', status: 'ESTABLISHED', ues: 87, uptime: '45d 12h' },
    { id: '30991', name: 'gNB-Region-B', ip: '10.200.1.16', status: 'ESTABLISHED', ues: 5040, uptime: '110d 5h' },
  ]);

  const [activeLogProcess, setActiveLogProcess] = useState<string | null>(null);
  const [processLogs] = useState<Record<string, string[]>>({
    'system-agent': ['[SYSTEM] Agent initialized. Ready to receive routing intents.'],
    'conn-agent': ['[SYSTEM] Conn_Agent initialized.', '[DEBUG] Connected to TRF local cache.'],
    'free5gc-amf': ['[INFO] AMF: NGAP Setup Response sent to gNB-10449'],
    'free5gc-smf': ['[INFO] SMF: PFCP Association established with UPF'],
    'free5gc-upf': ['[INFO] UPF: Ready to route GTP-U packets'],
    'free5gc-udm': ['[INFO] UDM: Subscription data loaded.'],
    'ueransim-gnb': ['[INFO] gNB: SCTP connection active with AMF'],
    'ueransim-ue': ['[INFO] UE: Initialized IMSI-208930000000001', '[INFO] UE: RM-REGISTERED, CM-IDLE']
  });
  
  const [infraData, setInfraData] = useState<any[]>([
    { group: 'AI Control Layer', name: 'system-agent', status: 'Running', cpu: 12.4, mem: 450, uptime: '14d 2h' },
    { group: 'AI Control Layer', name: 'conn-agent', status: 'Running', cpu: 8.1, mem: 312, uptime: '14d 2h' },
    { group: 'free5GC NFs', name: 'free5gc-amf', status: 'Running', cpu: 4.2, mem: 128, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-smf', status: 'Running', cpu: 5.6, mem: 145, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-upf', status: 'Running', cpu: 28.4, mem: 1024, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-udm', status: 'Running', cpu: 2.1, mem: 95, uptime: '45d 12h' },
    { group: 'free5GC NFs', name: 'free5gc-nwdaf', status: 'Running', cpu: 15.2, mem: 512, uptime: '45d 12h' },
    { group: 'UERANSIM', name: 'ueransim-gnb', status: 'Running', cpu: 18.7, mem: 256, uptime: '3d 5h' },
    { group: 'UERANSIM', name: 'ueransim-ue', status: 'Running', cpu: 2.4, mem: 64, uptime: '1d 1h' },
  ]);

  const [kpis, setKpis] = useState({ pdu: 7, cpLoad: 56, latency: 34.9 });
  const selectedUe = MOCK_UES.find((ue) => ue.id === selectedUeId) || null;

  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  useEffect(() => {
    const interval = setInterval(() => {
      setKpis(prev => ({
        pdu: Math.max(1, Math.min(20, prev.pdu + Math.floor(Math.random() * 3) - 1)),
        cpLoad: Math.max(5, Math.min(95, prev.cpLoad + Math.floor(Math.random() * 5) - 2)),
        latency: Math.max(5, prev.latency + (Math.random() * 2 - 1))
      }));
      setInfraData(prev => prev.map(p => ({
        ...p,
        cpu: Math.max(0.5, Math.min(99, p.cpu + (Math.random() * 4 - 2))),
        mem: Math.max(50, p.mem + (Math.random() * 10 - 5))
      })));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUeData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          metrics: advanceUeMetrics(prev.metrics),
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const element = topologyViewportRef.current;
    if (!element) return;

    const updateScale = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const nextScale = Math.min((width - 18) / 1050, (height - 10) / 550);
      setTopologyScale(clamp(nextScale, 0.42, 1));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  function handleSuggest() {
    const nextIndex = (suggestIndex + 1) % SUGGESTED_INTENTS.length;
    setSuggestIndex(nextIndex);
    setInputText(SUGGESTED_INTENTS[nextIndex]);
  }

  function handleReplay() {
    if (isProcessing || isPlaying) return;
    const selectedSession = sessionHistory.find(session => session.id === selectedSessionId);
    const replayIntent = selectedSession?.intent || inputText.trim() || DEFAULT_INTENT_TEXT;
    const replayData = selectedSession?.data || lastPlaybackData || DEFAULT_PLAYBACK_DATA;
    executePlayback(replayIntent, replayData);
  }

  function handleSelectUe(ueId: string) {
    const nextUe = MOCK_UES.find((ue) => ue.id === ueId) || null;
    setSelectedUeId(ueId);
    setUeData(nextUe ? cloneUeData(nextUe.data) : null);
    setSelectedSessionId(null);
  }

  function loadSessionIntoDashboard(session: SessionRecord) {
    const traceRows = Array.isArray(session.traceRows)
      ? session.traceRows
      : buildTraceTimeline(
          session.intent,
          session.data || DEFAULT_PLAYBACK_DATA,
          MOCK_UES.find((ue) => ue.id === session.ueId) || null,
        );
    setSelectedSessionId(session.id);
    if (session.ueId && MOCK_UES.some((ue) => ue.id === session.ueId)) {
      setSelectedUeId(session.ueId);
      const sessionUe = MOCK_UES.find((ue) => ue.id === session.ueId) || null;
      setUeData(sessionUe ? cloneUeData(sessionUe.data) : null);
    }
    setInputText(session.intent);
    setLastPlaybackData(session.data);
    setIntentData(session.data.structured_intent || null);
    setAgentLogs(session.data.agent_logs || []);
    setTraceData(traceRows);
    setActiveNFs(new Set());
  }

  function registerSessionRecord(intent: string, data: PlaybackData, targetUe: MockUeOption | null) {
    const record = createSessionRecord(intent, data, targetUe);
    setSessionHistory(prev => [record, ...prev]);
    loadSessionIntoDashboard(record);
  }

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleNgapRefresh() {
    setIsFetchingNgap(true);
    await new Promise(r => setTimeout(r, 600));
    setIsFetchingNgap(false);
  }

  async function executePlayback(intentStr: string, parsedData: any, targetUe: MockUeOption | null = selectedUe) {
    const currentId = Date.now();
    playbackIdRef.current = currentId;
    const checkAbort = () => playbackIdRef.current !== currentId;
    const timeline = buildTraceTimeline(intentStr, parsedData, targetUe);

    setIsPlaying(true);
    setTraceData([]);
    setIntentData(null);
    setAgentLogs([]);
    setActiveNFs(new Set(['System_Agent']));

    const delayMult = slowMode ? 1.5 : 0.5;
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms * delayMult));

    setIntentData(parsedData.structured_intent || null);
    setAgentLogs(parsedData.agent_logs || []);

    for (const row of timeline) {
      setActiveNFs(new Set([row.src, row.dest]));
      setTraceData(prev => [...prev, row]);
      await sleep(row.time === '0ms' ? 600 : 1000);
      if (checkAbort()) return;
    }

    setActiveNFs(new Set()); 
    setIsPlaying(false);
  }

  async function processIntent() {
    if (!inputText.trim() || isProcessing || isPlaying || !selectedUe) return;
    setIsProcessing(true);
    const currentIntent = inputText.trim();

    try {
      const playbackData = await generatePlaybackData(currentIntent, selectedUe);
      setLastPlaybackData(playbackData);
      registerSessionRecord(currentIntent, playbackData, selectedUe);
      setIsProcessing(false);
      executePlayback(currentIntent, playbackData, selectedUe);
    } catch (error) {
      console.error('Intent execution failed', error);
      const message = error instanceof Error ? error.message : 'Unknown LLM execution error';
      setTraceData([
        {
          id: `trace-error-${Date.now()}`,
          time: '0ms',
          src: 'System_Agent',
          dest: 'LLM Gateway',
          op: 'Npa_Intent_Failed',
          payload: JSON.stringify({ error: message }),
          status: '500 Error',
        },
      ]);
      setIntentData(null);
      setAgentLogs([
        {
          agent_name: 'System',
          thoughts: [
            USE_REAL_LLM
              ? `Live ${MODEL_NAME} request failed: ${message}`
              : `Stub playback failed: ${message}`,
          ],
        },
      ]);
      setActiveNFs(new Set());
      setIsProcessing(false);
      setRightTab('log');
    }
  }

  return (
    <div className="h-screen bg-[#edf2f7] p-1.5 text-[11px] text-slate-700 overflow-hidden">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-[#d9e1ee] bg-white shadow-[0_8px_28px_rgba(30,41,59,0.08)]">
      
      {/* TOOL DEFINITION MODAL OVERLAY */}
      {selectedTool && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-[500px] border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-purple-600" />
                <h3 className="font-bold text-slate-800 uppercase tracking-wide">Tool Definition Template</h3>
              </div>
              <button onClick={() => setSelectedTool(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
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
                    {TOOL_DEFINITIONS[selectedTool]?.inputs?.map((inp: any, i: number) => <li key={i}>{safeRender(inp)}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><CheckCircle size={12}/> Expected Output</h4>
                  <ul className="list-disc pl-4 text-[11px] font-mono text-emerald-700 space-y-1">
                    {TOOL_DEFINITIONS[selectedTool]?.outputs?.map((out: any, i: number) => <li key={i}>{safeRender(out)}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {canvasOverlay === 'trf' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm">
          <div className="flex w-[620px] max-w-[92vw] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Library size={16} className="text-purple-600" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">TRF Tool Registry</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">Available tools grouped by 6G network function host.</p>
                </div>
              </div>
              <button onClick={() => setCanvasOverlay(null)} className="text-slate-400 transition-colors hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {TRF_TOOL_GROUPS.map((group) => (
                <div key={group.label} className="rounded-xl border border-[#e1e8f2] bg-[#fbfcfe] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{group.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.tools.map((tool) => (
                      <ToolBadge
                        key={tool}
                        label={tool}
                        onClick={() => {
                          setCanvasOverlay(null);
                          setSelectedTool(tool);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {canvasOverlay === 'arf' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm">
          <div className="flex w-[520px] max-w-[92vw] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-purple-600" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">ARF Agent Registry</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">Reserved for agent registry details and discovery content.</p>
                </div>
              </div>
              <button onClick={() => setCanvasOverlay(null)} className="text-slate-400 transition-colors hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="flex min-h-[180px] items-center justify-center p-6 text-center">
              <div>
                <Bot size={24} className="mx-auto text-slate-300" />
                <div className="mt-3 text-[11px] font-medium text-slate-500">No ARF content configured yet.</div>
                <div className="mt-1 text-[10px] text-slate-400">This window is ready for future agent registry information.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex h-11 shrink-0 items-center border-b border-slate-800/50 bg-[#111a2f] px-4 text-white">
        <div className="flex min-w-0 flex-1 items-center justify-start">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2f67f6]">
              <Network size={14} className="text-white"/>
            </div>
            <span className="text-[11px] font-semibold tracking-[0.24em] text-white">6G AGENTIC CORE <span className="ml-1 text-[10px] font-medium tracking-[0.12em] text-slate-400">SA2 Prototype</span></span>
          </div>
        </div>
        <div className="ml-6 flex items-center justify-end gap-6">
          <div className="flex gap-8 border-l border-slate-700 pl-8">
            <KpiBlock label="ACTIVE PDU SESSIONS" value={kpis.pdu} trend="up" />
            <KpiBlock label="AGENTIC CP LOAD" value={`${kpis.cpLoad}%`} trend="up" />
            <KpiBlock label="AVG SBI LATENCY" value={`${kpis.latency.toFixed(1)}ms`} trend="down" />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/90 bg-slate-900/25 px-3 py-1.5">
            <div>
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">UE Selector</div>
              <div className="mt-1 flex gap-1">
                {(['header', 'sidebar', 'intent'] as SelectorPlacement[]).map((placement) => (
                  <button
                    key={placement}
                    onClick={() => setSelectorPlacement(placement)}
                    className={`rounded px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors ${
                      selectorPlacement === placement
                        ? 'bg-[#2f67f6] text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {placement}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {selectorPlacement === 'header' && (
            <HeaderUeSelector selectedUe={selectedUe} options={MOCK_UES} onSelect={handleSelectUe} />
          )}
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
            <Clock size={14} /> <span>11:47:27 UTC</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 overflow-hidden bg-[#f8fafc]">
        
        {/* SIDEBAR */}
        <div className="flex w-[256px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-[#dbe3ef] bg-[#f6f8fb]">
          <div className="border-b border-[#dbe3ef] bg-[#eef2f8] px-3 py-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Topology Explorer</h2>
          </div>
          <div className="p-3">
            <TreeItem id="plmn" label="PLMN 001-01" icon={<Network size={12}/>} hasChildren isExpanded={expandedFolders.has('plmn')} onToggle={toggleFolder} active={true} />
            {expandedFolders.has('plmn') && (
              <div className="ml-4 mt-1 space-y-1 border-l border-[#d8dfeb] pl-2">
                <TreeItem id="core" label="Decoupled Core" icon={<Layers size={12}/>} hasChildren isExpanded={expandedFolders.has('core')} onToggle={toggleFolder} />
                {expandedFolders.has('core') && (
                  <div className="ml-4 space-y-1 border-l border-[#d8dfeb] pl-2">
                    <TreeItem id="ai_layer" label="AI Control Layer" icon={<BrainCircuit size={12}/>} hasChildren isExpanded={expandedFolders.has('ai_layer')} onToggle={toggleFolder} />
                    {expandedFolders.has('ai_layer') && (
                      <div className="ml-4 space-y-0.5 text-slate-400">
                        <TreeItem id="m1" label={`Model: ${DISPLAY_MODEL_NAME}`} icon={<Microchip size={10}/>} />
                        <TreeItem id="pa" label="Inst: System_Agent" icon={<Bot size={10}/>} />
                        <TreeItem id="ca" label="Inst: Conn_Agent" icon={<Bot size={10}/>} />
                        <TreeItem id="cl" label="ARF / TRF Cluster" icon={<Library size={10}/>} />
                      </div>
                    )}
                    <TreeItem id="nfs" label="6G NFs" icon={<Database size={12}/>} hasChildren isExpanded={expandedFolders.has('nfs')} onToggle={toggleFolder} />
                    {expandedFolders.has('nfs') && (
                      <div className="ml-4 space-y-0.5 text-slate-400">
                        <TreeItem id="am" label="6G AM" icon={<Server size={10}/>} />
                        <TreeItem id="sm" label="6G SM" icon={<Server size={10}/>} />
                        <TreeItem id="ud" label="6G UDM" icon={<Server size={10}/>} />
                        <TreeItem id="nw" label="6G NWDAF" icon={<Server size={10}/>} />
                      </div>
                    )}
                  </div>
                )}
                <TreeItem id="ran" label="UERANSIM" icon={<Wifi size={12}/>} hasChildren isExpanded={expandedFolders.has('ran')} onToggle={toggleFolder} />
                {expandedFolders.has('ran') && (
                  <div className="ml-4 space-y-2 text-slate-400">
                    <div className="space-y-0.5">
                    <TreeItem id="p1" label="Profile: AR-Gamer" icon={<Smartphone size={10}/>} />
                    <TreeItem id="p2" label="Profile: AGV-Swarm" icon={<Smartphone size={10}/>} />
                    <TreeItem id="p3" label="Profile: Smart-Meter" icon={<Smartphone size={10}/>} />
                    </div>
                    {selectorPlacement === 'sidebar' && (
                      <div className="rounded-lg border border-[#dbe3ef] bg-white/80 p-2 shadow-[0_1px_3px_rgba(148,163,184,0.12)]">
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">UE Targets</div>
                        <UeSelectionList
                          options={MOCK_UES}
                          selectedUeId={selectedUeId}
                          onSelect={handleSelectUe}
                          variant="sidebar"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-auto border-t border-[#dbe3ef] bg-[#f8fafd] p-3">
            <h2 className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"><Library size={11} className="text-[#8e63ff]" /> TRF Tool Registry</h2>
            <div className="ml-4 space-y-1">
              <TreeItem id="am_t" label="6G AM Tools" hasChildren isExpanded={expandedFolders.has('am_t')} onToggle={toggleFolder} />
              {expandedFolders.has('am_t') && (
                <div className="ml-4 mt-1 flex flex-wrap gap-1">
                  <ToolBadge label="AUTH_Tool" onClick={() => setSelectedTool("AUTH_Tool")} />
                  <ToolBadge label="SC_Tool" onClick={() => setSelectedTool("SC_Tool")} />
                  <ToolBadge label="MM_Tool" onClick={() => setSelectedTool("MM_Tool")} />
                  <ToolBadge label="Reachability_Tool" onClick={() => setSelectedTool("Reachability_Tool")} />
                </div>
              )}
              <TreeItem id="sm_t" label="6G SM Tools" hasChildren isExpanded={expandedFolders.has('sm_t')} onToggle={toggleFolder} />
              {expandedFolders.has('sm_t') && (
                <div className="ml-4 mt-1 flex flex-wrap gap-1">
                  <ToolBadge label="SMC_Tool" onClick={() => setSelectedTool("SMC_Tool")} />
                  <ToolBadge label="TR_Tool" onClick={() => setSelectedTool("TR_Tool")} />
                  <ToolBadge label="UPC_Tool" onClick={() => setSelectedTool("UPC_Tool")} />
                  <ToolBadge label="VN_creation_tool" onClick={() => setSelectedTool("VN_creation_tool")} />
                  <ToolBadge label="DNS_Resolver_Tool" onClick={() => setSelectedTool("DNS_Resolver_Tool")} />
                </div>
              )}
              <TreeItem id="udm_t" label="6G UDM Tools" hasChildren isExpanded={expandedFolders.has('udm_t')} onToggle={toggleFolder} />
              {expandedFolders.has('udm_t') && (
                <div className="ml-4 mt-1 flex flex-wrap gap-1">
                  <ToolBadge label="Subscription_Tool" onClick={() => setSelectedTool("Subscription_Tool")} />
                </div>
              )}
              <TreeItem id="nwdaf_t" label="6G NWDAF Tools" hasChildren isExpanded={expandedFolders.has('nwdaf_t')} onToggle={toggleFolder} />
              {expandedFolders.has('nwdaf_t') && (
                <div className="ml-4 mt-1 flex flex-wrap gap-1">
                  <ToolBadge label="Analytic_Tool" onClick={() => setSelectedTool("Analytic_Tool")} />
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes data-pulse {
            0% { stroke-dashoffset: 20; opacity: 0.4; }
            50% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0.4; }
          }
          .animate-data-pulse {
            stroke-dasharray: 10 5;
            animation: data-pulse 2s linear infinite;
          }
          .topology-grid {
            background-image: 
              linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
            background-size: 40px 40px;
          }
        `}</style>

        {/* CENTER AREA */}
        <div className="flex flex-1 flex-col bg-white">
          
          {/* TOPOLOGY VIEW */}
          <div className="flex h-[60%] flex-col overflow-hidden border-b border-[#dbe3ef] bg-white px-4 pt-3">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#91a4c2]">
              <Activity size={14}/> Active Network Architecture Topology
            </div>
            <div ref={topologyViewportRef} className="relative flex flex-1 overflow-hidden rounded-[30px]">
              <div
                className="absolute left-1/2 top-1/2 overflow-hidden rounded-[30px] border border-slate-200/60 bg-slate-50 topology-grid shadow-[0_22px_48px_rgba(148,163,184,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]"
                style={{
                  width: 1050,
                  height: 550,
                  transform: `translate(-50%, -50%) scale(${topologyScale})`,
                  transformOrigin: 'center center',
                }}
              >
                <div className="absolute inset-0">
                <svg className="absolute inset-0 z-[5] pointer-events-none drop-shadow-sm" width="1050" height="550" viewBox="0 0 1050 550">
                  <defs>
                    <marker id="arrow-indigo-live" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                    </marker>
                  </defs>
                  <path d="M 195 307.5 C 245 307.5, 245 325, 290 325" fill="none" stroke="#6366f1" strokeWidth="2.5" markerEnd="url(#arrow-indigo-live)" strokeLinecap="round" className="drop-shadow-sm animate-data-pulse" />
                  <line x1="380" y1="510" x2="950" y2="510" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="440" y1="270" x2="440" y2="510" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="4 2" className="opacity-40" />
                  <line x1="560" y1="270" x2="560" y2="510" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="4 2" className="opacity-40" />
                  <line x1="660" y1="270" x2="660" y2="510" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="4 2" className="opacity-40" />
                  <line x1="760" y1="270" x2="760" y2="510" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="4 2" className="opacity-40" />

                  <line x1="440" y1="440" x2="440" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="560" y1="440" x2="560" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="660" y1="440" x2="660" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="760" y1="440" x2="760" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="860" y1="440" x2="860" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />

                  <line x1="325" y1="340" x2="970" y2="340" stroke="#fda4af" strokeWidth="3" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="420" y1="270" x2="420" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="540" y1="270" x2="540" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="640" y1="270" x2="640" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="740" y1="270" x2="740" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="420" y1="340" x2="420" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="540" y1="340" x2="540" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="640" y1="340" x2="640" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="740" y1="340" x2="740" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                  <line x1="840" y1="340" x2="840" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" className="animate-data-pulse" />
                </svg>

                <div className="absolute rounded-[24px] border border-slate-300/60 bg-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-[2px] z-0 pointer-events-none" style={{ left: 280, top: 70, width: 730, height: 460 }}>
                  <div className="relative z-20 flex justify-center pt-5">
                    <span className="text-xl font-black tracking-[0.2em] text-slate-400 uppercase opacity-50">Agentic Core</span>
                  </div>
                </div>
                <div className="absolute rounded-[20px] border border-dashed border-slate-300/80 bg-slate-400/5 z-0 pointer-events-none" style={{ left: 490, top: 140, width: 380, height: 160 }}>
                  <div className="absolute right-4 top-2 text-[10px] font-bold uppercase tracking-widest text-slate-400/60">Service agents</div>
                </div>

                <div className="absolute z-0 w-[2px] rounded-full bg-indigo-200/50" style={{ left: 138.5, top: 110, height: 35 }}></div>
                <div className="absolute z-20 flex cursor-default justify-center drop-shadow-xl transition-all hover:scale-110" style={{ left: 120, top: 55, width: 40, height: 60 }}>
                  <svg width="40" height="60" viewBox="0 0 40 60">
                    <circle cx="20" cy="18" r="12" fill="url(#userGradLive)" stroke="#4f46e5" strokeWidth="1.5" />
                    <path d="M 8 50 C 8 42, 32 42, 32 50 L 32 55 L 8 55 Z" fill="#ffffff" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round" />
                    <defs>
                      <linearGradient id="userGradLive" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className={`absolute z-10 flex flex-col overflow-hidden rounded-[32px] border border-indigo-200/50 bg-white/60 shadow-xl backdrop-blur-md transition-all ${activeNFs.has('UERANSIM_APP') ? 'ring-4 ring-indigo-400/20 scale-105' : ''}`} style={{ left: 70, top: 140, width: 140, height: 220 }}>
                  <div className="flex w-full justify-center border-b border-indigo-100 bg-indigo-50/50 py-3">
                    <span className="text-sm font-black tracking-[0.2em] text-indigo-900 uppercase">Terminal</span>
                  </div>
                </div>
                <div className="absolute z-10 w-[2px] rounded-full bg-indigo-200/50 animate-pulse" style={{ left: 138.5, top: 235, height: 60 }}></div>
                <div className={`absolute z-20 flex items-center justify-center rounded-2xl border border-indigo-400/50 bg-gradient-to-br from-indigo-500 to-blue-600 text-center text-[11px] font-bold uppercase tracking-tighter leading-tight text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-110 ${activeNFs.has('UERANSIM_APP') ? 'ring-4 ring-indigo-400/40' : ''}`} style={{ left: 85, top: 195, width: 110, height: 48 }}>
                  OS/UE<br />Agent
                </div>
                <div className={`absolute z-20 flex items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-center text-[11px] font-bold uppercase tracking-tighter leading-tight text-slate-600 shadow-md backdrop-blur-sm transition-all hover:scale-110 ${activeNFs.has('UERANSIM_APP') ? 'ring-4 ring-indigo-200/40' : ''}`} style={{ left: 85, top: 285, width: 110, height: 48 }}>
                  Modem/MT
                </div>

                <div className="absolute" style={{ left: 295, top: 290 }}>
                  <TopologyEndpointNode label="SRF" active={activeNFs.has('SRF')} accent="pink" />
                </div>
                <div className="absolute" style={{ left: 970, top: 290 }}>
                  <TopologyEndpointNode label="ARF" active={activeNFs.has('ARF')} accent="pink" onClick={() => setCanvasOverlay('arf')} />
                </div>

                <div className="absolute" style={{ left: 390, top: 175 }}>
                  <TopologyAgentCard label="Sys-Agent" active={activeNFs.has('System_Agent')} skillLabel="Skills" onSkillClick={() => setCanvasOverlay('arf')} />
                </div>
                <div className="absolute" style={{ left: 510, top: 175 }}>
                  <TopologyAgentCard label="Conn-Agent" active={activeNFs.has('Conn_Agent')} skillLabel="Skills" onSkillClick={() => setCanvasOverlay('arf')} />
                </div>
                <div className="absolute" style={{ left: 610, top: 175 }}>
                  <TopologyAgentCard label="Comp-Agent" active={activeNFs.has('Compute_Agent')} skillLabel="Skills" onSkillClick={() => setCanvasOverlay('arf')} />
                </div>
                <div className="absolute" style={{ left: 710, top: 175 }}>
                  <TopologyAgentCard label="Data-Agent" active={activeNFs.has('6G NWDAF')} skillLabel="Skills" onSkillClick={() => setCanvasOverlay('arf')} />
                </div>

                <div className="absolute" style={{ left: 395, top: 385 }}>
                  <TopologyHostCard label="AM" active={activeNFs.has('6G AM')} toolLabel="Tools" onToolsClick={() => setCanvasOverlay('trf')} />
                </div>
                <div className="absolute" style={{ left: 515, top: 385 }}>
                  <TopologyHostCard label="SM" active={activeNFs.has('6G SM')} toolLabel="Tools" onToolsClick={() => setCanvasOverlay('trf')} />
                </div>
                <div className="absolute" style={{ left: 615, top: 385 }}>
                  <TopologyHostCard label="Policy" active={activeNFs.has('6G UDM')} toolLabel="Tools" onToolsClick={() => setCanvasOverlay('trf')} />
                </div>
                <div className="absolute" style={{ left: 715, top: 385 }}>
                  <TopologyHostCard label="UP" active={activeNFs.has('6G NWDAF')} toolLabel="Tools" onToolsClick={() => setCanvasOverlay('trf')} />
                </div>
                <div className="absolute" style={{ left: 815, top: 385 }}>
                  <TopologyHostCard label="DP" toolLabel="Tools" onToolsClick={() => setCanvasOverlay('trf')} />
                </div>

                <div className="absolute z-10 text-[13px] font-black tracking-[0.3em] text-rose-500/60 uppercase" style={{ left: 915, top: 320 }}>ABI</div>
                <div className="absolute z-10 text-[13px] font-black tracking-[0.3em] text-sky-500/60 uppercase" style={{ left: 915, top: 490 }}>DBI</div>
                </div>
              </div>
            </div>
          </div>

          {/* SBI TRACE LOG */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#dbe3ef] bg-[#eef3f9] px-4 py-2">
              <div className="flex items-center gap-2 font-bold text-slate-600">
                <ChevronRight size={14}/> Service Based Interface (SBI) Trace Log
              </div>
              {isPlaying && <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] animate-pulse"><Loader2 size={12} className="animate-spin"/> PROCESSING...</div>}
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-left font-mono text-[10px]">
                <thead className="sticky top-0 bg-[#f3f6fb] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="border-b border-[#dbe3ef] px-3 py-2">TIME</th>
                    <th className="border-b border-[#dbe3ef] px-3 py-2">SRC NF</th>
                    <th className="border-b border-[#dbe3ef] px-3 py-2">DEST NF</th>
                    <th className="border-b border-[#dbe3ef] px-3 py-2">SBI OPERATION</th>
                    <th className="border-b border-[#dbe3ef] px-3 py-2">STATUS</th>
                    <th className="border-b border-[#dbe3ef] px-3 py-2">PAYLOAD EXCERPT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f8]">
                  {traceData.map((t, i) => (
                    <tr key={i} className={`transition-colors hover:bg-[#f8fbff] ${i === 2 ? 'bg-[#f7f0ff]' : ''}`}>
                      <td className="px-3 py-2 text-slate-400">{t.time}</td>
                      <td className="px-3 py-2 font-bold text-slate-600">{t.src}</td>
                      <td className="px-3 py-2 font-bold text-slate-600">{t.dest}</td>
                      <td className="px-3 py-2 font-bold text-[#5478db]">{t.op}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                          t.status === '200 OK' || t.status === '201 Created' || t.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="max-w-[420px] truncate px-3 py-2 text-slate-400">{t.payload}</td>
                    </tr>
                  ))}
                  {traceData.length === 0 && (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic font-sans text-xs">Awaiting intent execution...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex w-[300px] shrink-0 flex-col border-l border-[#dbe3ef] bg-white">
          <div className="grid grid-cols-3 border-b border-[#dbe3ef] bg-[#fafcff]">
            <TabBtn active={rightTab === 'intent'} icon={<Zap size={14}/>} label="INTENT" onClick={() => setRightTab('intent')} />
            <TabBtn active={rightTab === 'log'} icon={<Activity size={14}/>} label="REACT LOG" onClick={() => setRightTab('log')} />
            <TabBtn active={rightTab === 'ue'} icon={<Smartphone size={14}/>} label="UE STATE" onClick={() => setRightTab('ue')} />
            <TabBtn active={rightTab === 'ngap'} icon={<Radio size={14}/>} label="NGAP" onClick={() => setRightTab('ngap')} />
            <TabBtn active={rightTab === 'infra'} icon={<HardDrive size={14}/>} label="INFRA" onClick={() => setRightTab('infra')} />
            <TabBtn active={rightTab === 'sessions'} icon={<Library size={14}/>} label="TRACE SESSIONS" onClick={() => setRightTab('sessions')} />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {rightTab === 'intent' && (
              <>
                {selectorPlacement === 'intent' && (
                  <div className="overflow-hidden rounded-lg border border-[#dbe3ef] bg-white">
                    <div className="border-b border-[#dbe3ef] bg-[#eef3f9] px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Target UE</span>
                    </div>
                    <div className="p-3">
                      <UeSelectionList
                        options={MOCK_UES}
                        selectedUeId={selectedUeId}
                        onSelect={handleSelectUe}
                        variant="intent"
                      />
                    </div>
                  </div>
                )}
                <div>
                   <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Natural Language Request</h3>
                   <div className="mb-2 rounded-lg border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2">
                     <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Active Target UE</div>
                     {selectedUe ? (
                       <div className="mt-1 flex items-center justify-between gap-2">
                         <div>
                           <div className="text-[10px] font-semibold text-slate-700">{selectedUe.label}</div>
                           <div className="font-mono text-[10px] text-slate-400">{selectedUe.data.supi}</div>
                         </div>
                         <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-[9px] font-bold text-[#4f76da]">{selectedUe.profile}</span>
                       </div>
                     ) : (
                       <div className="mt-1 text-[10px] text-slate-400">Choose a UE target before executing an intent.</div>
                     )}
                   </div>
                   <textarea 
                     className="h-20 w-full resize-none rounded border border-[#d7dfeb] bg-[#f8fafc] p-3 font-mono text-[10px] leading-4 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                     value={inputText} onChange={(e) => setInputText(e.target.value)}
                     placeholder="Type intent here..."
                   />
                   {!selectedUe && (
                     <div className="mt-2 text-[10px] font-medium text-amber-600">Select a UE target first to enable execution.</div>
                   )}
                   <div className="mt-2 flex gap-2">
                     <button onClick={handleSuggest} className="flex-1 rounded border border-[#d6deea] bg-white py-1.5 font-bold text-slate-600 hover:bg-slate-50">SUGGEST</button>
                     <button onClick={processIntent} disabled={isProcessing || !selectedUe} className="flex-[2] rounded bg-[#2f67f6] py-1.5 font-bold text-white shadow-sm transition-all hover:bg-[#2558db] active:scale-95 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-[#a5b8e6]">
                        {isProcessing ? <Loader2 size={14} className="animate-spin"/> : <Play size={12} fill="currentColor"/>} EXECUTE
                     </button>
                     <button onClick={handleReplay} disabled={isProcessing || isPlaying} className="rounded bg-[#9b34f3] px-3 text-white hover:bg-[#8522db] shadow-sm flex items-center gap-1.5 font-bold disabled:cursor-not-allowed disabled:opacity-60"><RotateCcw size={12}/> REPLAY</button>
                   </div>
                   <div className="mt-3 flex items-center gap-2">
                     <input type="checkbox" checked={slowMode} onChange={e => setSlowMode(e.target.checked)} className="accent-blue-600" id="slow"/>
                     <label htmlFor="slow" className="cursor-pointer text-[10px] font-bold uppercase text-slate-500">Slow Motion Playback</label>
                   </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#dbe3ef] bg-white">
                  <div className="flex items-center justify-between border-b border-[#dbe3ef] bg-[#eef3f9] px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Semi-Structured Intent</span>
                    {intentData && <CheckCircle size={14} className="text-emerald-500"/>}
                  </div>
                  <div className="space-y-4 p-3">
                    {intentData ? (
                      <>
                        <div>
                          <label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Goals</label>
                          <p className="font-medium text-[#5679df]">{intentData.goals}</p>
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Requirements</label>
                          <ul className="space-y-1">
                            {intentData.requirements?.map((r: string, i: number) => <li key={i} className="text-emerald-700 flex items-center gap-1.5"><div className="w-1 h-1 bg-emerald-500 rounded-full"></div> {r}</li>)}
                          </ul>
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Conditions</label>
                          <ul className="space-y-1">
                            {intentData.conditions?.map((c: string, i: number) => <li key={i} className="text-amber-700 flex items-center gap-1.5"><div className="w-1 h-1 bg-amber-500 rounded-full"></div> {c}</li>)}
                          </ul>
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Guidelines</label>
                          <p className="text-[#9b5ae6]">{intentData.guidelines}</p>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-slate-400 italic">No intent data extracted.</div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {rightTab === 'log' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multi-Agent Orchestration</h3>
                {agentLogs.length > 0 ? agentLogs.map((log: any, i: number) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 font-bold uppercase text-[9px]">
                      <Bot size={12}/> {log.agent_name}
                    </div>
                    {log.thoughts?.map((t: string, j: number) => (
                      <div key={j} className="text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-100 font-mono leading-relaxed">
                        {t}
                      </div>
                    ))}
                  </div>
                )) : <div className="text-center py-10 text-slate-400 italic">No ReAct logs available.</div>}
              </div>
            )}

            {rightTab === 'ue' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#e1e8f2] bg-white p-4 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
                  <div className="mb-3 flex items-center gap-2 border-b border-[#edf2f7] pb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    <Smartphone size={12}/> Active UE
                  </div>
                  {selectedUe ? (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-700">{selectedUe.label}</div>
                        <div className="mt-1 font-mono text-[10px] text-slate-500">{selectedUe.data.supi}</div>
                        <div className="mt-2 text-[10px] text-slate-400">{selectedUe.summary}</div>
                      </div>
                      <span className="rounded-md bg-[#eef3ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#4f76da]">
                        {selectedUe.profile}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400">No UE target selected.</div>
                  )}
                </div>
                {ueData ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#e1e8f2] bg-white p-4 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
                      <div className="mb-3 flex items-center gap-2 border-b border-[#edf2f7] pb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        <Smartphone size={12}/> Identification
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">SUPI</div>
                          <div className="font-mono text-[10px] font-semibold text-slate-700">{ueData.supi}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">PEI</div>
                          <div className="font-mono text-[10px] font-semibold text-slate-700">{ueData.pei}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e1e8f2] bg-white p-4 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
                      <div className="mb-3 flex items-center gap-2 border-b border-[#edf2f7] pb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        <MapPin size={12}/> Status & Location
                      </div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-md bg-[#d8f5e6] px-3 py-1.5 text-[10px] font-bold text-[#208c61] shadow-sm">{ueData.status}</span>
                        <span className="rounded-md bg-[#dbe9ff] px-3 py-1.5 text-[10px] font-bold text-[#5178d8] shadow-sm">{ueData.rmStatus}</span>
                      </div>
                      <div className="space-y-2 font-mono text-[10px] text-slate-500">
                        <div className="flex items-center gap-2"><Radio size={12} className="text-slate-400" /> {ueData.location.tai}</div>
                        <div className="flex items-center gap-2"><Signal size={12} className="text-slate-400" /> {ueData.location.gNodeB}</div>
                        <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400" /> {ueData.location.cellId}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e1e8f2] bg-white p-4 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
                      <div className="mb-3 flex items-center gap-2 border-b border-[#edf2f7] pb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]">
                        <Activity size={12}/> Active PDU Sessions ({ueData.sessions.length})
                      </div>
                      <div className="space-y-3">
                        {ueData.sessions.map((s: any, i: number) => (
                          <div key={i} className="rounded-lg border border-[#edf2f7] bg-[#fbfcfe] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-[#913df0]">DNN: {s.dnn}</span>
                              <span className="font-mono text-[10px] font-bold text-[#18a36f]">{s.ip}</span>
                            </div>
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                              <span>{s.sNssai}</span>
                              <span>{s.qos}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e1e8f2] bg-white p-4 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
                      <div className="mb-3 flex items-center gap-2 border-b border-[#edf2f7] pb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        <SlidersHorizontal size={12}/> Current Policy
                      </div>
                      <div className="mb-3 rounded-lg border border-[#edf2f7] bg-[#fbfcfe] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Applied Policy</div>
                            <div className="mt-1 font-mono text-[10px] font-semibold text-slate-700">{ueData.policy.policyId}</div>
                          </div>
                          <span className="rounded-md bg-[#d8f5e6] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#208c61] shadow-sm">Applied</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-md bg-[#eef3ff] px-2.5 py-1 font-mono text-[9px] font-semibold text-[#4f76da]">{ueData.policy.targetDnn}</span>
                          <span className="rounded-md bg-[#f4ecff] px-2.5 py-1 font-mono text-[9px] font-semibold text-[#8b4fe0]">{ueData.policy.targetSlice}</span>
                          <span className="rounded-md bg-[#ecfbf5] px-2.5 py-1 font-mono text-[9px] font-semibold text-[#1b9a6d]">QFI {ueData.policy.qfi}</span>
                          <span className="rounded-md bg-[#fff4e6] px-2.5 py-1 font-mono text-[9px] font-semibold text-[#c67a1d]">5QI {ueData.policy['5qi']}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <PolicyField label="qosId" value={ueData.policy.qosId} />
                        <PolicyField label="reflectiveQoS" value={ueData.policy.reflectiveQoS} />
                        <PolicyField label="gbrDl" value={ueData.policy.gbrDl} />
                        <PolicyField label="gbrUl" value={ueData.policy.gbrUl} />
                        <PolicyField label="maxbrDl" value={ueData.policy.maxbrDl} />
                        <PolicyField label="maxbrUl" value={ueData.policy.maxbrUl} />
                      </div>
                      <div className="mt-3 rounded-lg border border-[#edf2f7] bg-[#fbfcfe] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">ARP</div>
                        <div className="grid grid-cols-1 gap-2">
                          <PolicyField label="preemptCap" value={ueData.policy.arp.preemptCap} />
                          <PolicyField label="prioritLevel" value={ueData.policy.arp.prioritLevel} />
                          <PolicyField label="preemptVuln" value={ueData.policy.arp.preemptVuln} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e1e8f2] bg-white p-4 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
                      <div className="mb-3 flex items-center justify-between border-b border-[#edf2f7] pb-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          <Activity size={12}/> Live Service Metrics
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 rounded-md bg-[#ecfbf5] px-2 py-1 text-[9px] font-bold text-[#1b9a6d]">
                            <span className="h-2 w-2 rounded-full bg-[#1b9a6d] animate-pulse"></span>
                            LIVE
                          </span>
                          <span className="rounded-md bg-[#eef3ff] px-2 py-1 text-[9px] font-bold text-[#4f76da]">{ueData.metrics.windowLabel}</span>
                        </div>
                      </div>
                      <MetricLineChart samples={ueData.metrics.samples} />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <MetricStat label="Avg DL" value={ueData.metrics.summary.avgDl} accent="text-[#31a6f6]" />
                        <MetricStat label="Peak DL" value={ueData.metrics.summary.peakDl} accent="text-[#4f76da]" />
                        <MetricStat label="Avg UL" value={ueData.metrics.summary.avgUl} accent="text-[#ab5cf6]" />
                        <MetricStat label="RTT" value={ueData.metrics.summary.rtt} accent="text-[#1b9a6d]" />
                        <MetricStat label="Jitter" value={ueData.metrics.summary.jitter} accent="text-[#c67a1d]" />
                        <MetricStat label="Pkt Loss" value={ueData.metrics.summary.packetLoss} accent="text-[#dc5c78]" />
                      </div>
                    </div>
                  </div>
                ) : <div className="text-center py-10 text-slate-400 italic">Select a UE target to inspect state.</div>}
              </div>
            )}

            {rightTab === 'ngap' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NGAP Connections</h3>
                  <button onClick={handleNgapRefresh} className="p-1 hover:bg-slate-100 rounded text-blue-600"><RefreshCw size={14} className={isFetchingNgap ? 'animate-spin' : ''}/></button>
                </div>
                {ngapData.map((gnb, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between font-bold"><span>{gnb.name}</span> <span className="text-emerald-600 text-[9px]">{gnb.status}</span></div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono"><span>IP: {gnb.ip}</span> <span>UEs: {gnb.ues}</span></div>
                  </div>
                ))}
              </div>
            )}

            {rightTab === 'infra' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Infrastructure Status</h3>
                  <p className="mt-1 text-[10px] text-slate-400">Live CPU/Memory & Node Terminal Logs</p>
                </div>
                {[
                  ['AI Control Layer', infraData.filter(p => p.group === 'AI Control Layer')],
                  ['free5GC NFs', infraData.filter(p => p.group === 'free5GC NFs')],
                  ['UERANSIM', infraData.filter(p => p.group === 'UERANSIM')],
                ].map(([groupName, items]: any) => (
                  <div key={groupName} className="rounded-xl border border-[#e1e8f2] bg-white p-3 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
                    <div className="mb-3 border-b border-[#edf2f7] pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {groupName}
                    </div>
                    <div className="space-y-3">
                      {items.map((p: any) => (
                        <div key={p.name} className="rounded-lg border border-[#edf2f7] bg-[#fbfcfe] p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                              <span className="text-[10px] font-bold text-slate-700">{p.name}</span>
                            </div>
                            <button
                              onClick={() => setActiveLogProcess(activeLogProcess === p.name ? null : p.name)}
                              className="rounded border border-[#dbe3ef] bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 hover:border-[#b9c8de]"
                            >
                              View Logs
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="grid grid-cols-[24px_1fr_36px] items-center gap-2 text-[9px] text-slate-400">
                              <span>CPU</span>
                              <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f7]">
                                <div className="h-full rounded-full bg-[#31a6f6] transition-all duration-500" style={{ width: `${p.cpu}%` }}></div>
                              </div>
                              <span className="text-right font-bold text-slate-500">{p.cpu.toFixed(1)}%</span>
                            </div>
                            <div className="grid grid-cols-[24px_1fr_36px] items-center gap-2 text-[9px] text-slate-400">
                              <span>MEM</span>
                              <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f7]">
                                <div className="h-full rounded-full bg-[#ab5cf6] transition-all duration-500" style={{ width: `${Math.min(100, p.mem / 12)}%` }}></div>
                              </div>
                              <span className="text-right font-bold text-slate-500">{Math.round(p.mem)}M</span>
                            </div>
                          </div>
                          {activeLogProcess === p.name && (
                            <div className="mt-3 h-24 overflow-y-auto rounded bg-slate-900 p-2 font-mono text-[9px] text-emerald-400 shadow-inner">
                              {processLogs[p.name]?.map((l, j) => <div key={j} className="opacity-80">{l}</div>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rightTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Trace Sessions</h3>
                    <p className="mt-1 text-[10px] text-slate-400">Recorded intent traces loaded into the main dashboard.</p>
                  </div>
                  <span className="rounded-full bg-[#eef3f9] px-2 py-1 font-mono text-[9px] font-bold text-slate-500">{sessionHistory.length}</span>
                </div>

                {sessionHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#dbe3ef] bg-[#fafcff] p-6 text-center text-slate-400">
                    <div className="text-[11px] font-medium">No session traces recorded yet.</div>
                    <div className="mt-1 text-[10px]">Execute an intent to generate a trace.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionHistory.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => loadSessionIntoDashboard(session)}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          selectedSessionId === session.id
                            ? 'border-[#8fb2ff] bg-[#f4f8ff] shadow-[0_4px_12px_rgba(95,140,255,0.12)]'
                            : 'border-[#e1e8f2] bg-white hover:border-[#c9d7ee]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-mono text-[10px] font-bold text-[#4f76da]">{session.id}</div>
                            <div className="mt-1 text-[10px] text-slate-400">{session.createdAt}</div>
                          </div>
                          <span className="rounded-full bg-[#eef3f9] px-2 py-1 font-mono text-[9px] font-bold text-slate-500">{session.traceCount}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-[9px] font-bold text-[#4f76da]">{session.ueLabel}</span>
                          <span className="font-mono text-[9px] text-slate-400">{session.ueSupi}</span>
                        </div>
                        <div className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-600">{session.intent}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}

function HeaderUeSelector({
  selectedUe,
  options,
  onSelect,
}: {
  selectedUe: MockUeOption | null;
  options: MockUeOption[];
  onSelect: (ueId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700/90 bg-slate-900/25 px-3 py-1.5">
      <div>
        <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">Active UE</div>
        <div className="text-[10px] font-semibold text-white">{selectedUe?.label || 'Unassigned'}</div>
      </div>
      <select
        value={selectedUe?.id || ''}
        onChange={(event) => onSelect(event.target.value)}
        className="rounded border border-slate-600 bg-[#10182c] px-2 py-1 text-[10px] font-medium text-slate-200 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label} · {option.data.supi}
          </option>
        ))}
      </select>
    </div>
  );
}

function UeSelectionList({
  options,
  selectedUeId,
  onSelect,
  variant = 'intent',
}: {
  options: MockUeOption[];
  selectedUeId: string | null;
  onSelect: (ueId: string) => void;
  variant?: 'intent' | 'sidebar';
}) {
  const gapClass = variant === 'sidebar' ? 'space-y-1.5' : 'space-y-2';

  return (
    <div className={gapClass}>
      {options.map((option) => {
        const active = selectedUeId === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
              active
                ? 'border-[#8fb2ff] bg-[#f4f8ff] shadow-[0_4px_12px_rgba(95,140,255,0.12)]'
                : 'border-[#e1e8f2] bg-[#fbfcfe] hover:border-[#c9d7ee]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold text-slate-700">{option.label}</div>
                <div className="mt-0.5 font-mono text-[9px] text-slate-400">{option.data.supi}</div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] ${
                active ? 'bg-[#dce7ff] text-[#4f76da]' : 'bg-white text-slate-400'
              }`}>
                {option.profile}
              </span>
            </div>
            {variant === 'intent' && (
              <div className="mt-2 text-[10px] leading-4 text-slate-500">{option.summary}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function KpiBlock({ label, value, trend }: any) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[12px] font-bold tracking-tight text-white">{value}</span>
        {trend === 'up' && <ArrowRight size={11} className="text-emerald-400 -rotate-45" />}
        {trend === 'down' && <ArrowRight size={11} className="text-emerald-400 -rotate-45" />}
      </div>
    </div>
  );
}

function PolicyField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#edf2f7] bg-[#fbfcfe] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="mb-1 text-[9px] font-bold tracking-[0.04em] text-slate-400">{label}</div>
      <div className="break-all font-mono text-[10px] font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function MetricStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-[#edf2f7] bg-[#fbfcfe] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</div>
      <div className={`font-mono text-[10px] font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function MetricLineChart({ samples }: { samples: Array<{ label: string; dl: number; ul: number }> }) {
  const width = 320;
  const height = 132;
  const paddingX = 14;
  const paddingY = 14;
  const maxValue = Math.max(...samples.flatMap((sample) => [sample.dl, sample.ul]), 1) * 1.15;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const toPoint = (value: number, index: number) => {
    const x = paddingX + (index * innerWidth) / Math.max(samples.length - 1, 1);
    const y = paddingY + innerHeight - (value / maxValue) * innerHeight;
    return `${x},${y}`;
  };

  const dlLine = samples.map((sample, index) => toPoint(sample.dl, index)).join(' ');
  const ulLine = samples.map((sample, index) => toPoint(sample.ul, index)).join(' ');
  const gridValues = [0.25, 0.5, 0.75];

  return (
    <div className="rounded-lg border border-[#edf2f7] bg-[#fbfcfe] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="mb-3 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#31a6f6]"></span>DL Bandwidth</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ab5cf6]"></span>UL Bandwidth</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full overflow-visible">
        {gridValues.map((ratio, index) => {
          const y = paddingY + innerHeight - innerHeight * ratio;
          return (
            <line
              key={index}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
          );
        })}
        <polyline
          fill="none"
          stroke="#31a6f6"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={dlLine}
        />
        <polyline
          fill="none"
          stroke="#ab5cf6"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={ulLine}
        />
        {samples.map((sample, index) => {
          const [dlx, dly] = toPoint(sample.dl, index).split(',').map(Number);
          const [ulx, uly] = toPoint(sample.ul, index).split(',').map(Number);
          return (
            <g key={sample.label}>
              <circle cx={dlx} cy={dly} r="3.5" fill="#31a6f6" />
              <circle cx={ulx} cy={uly} r="3.5" fill="#ab5cf6" />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 grid grid-cols-7 text-center text-[9px] font-mono text-slate-400">
        {samples.map((sample) => (
          <span key={sample.label}>{sample.label}</span>
        ))}
      </div>
    </div>
  );
}

function TabBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 border-b px-1 py-2 transition-all ${active ? 'border-[#5f8cff] bg-white text-[#4f76da]' : 'border-transparent text-slate-400 hover:bg-white'}`}>
      <div className="flex flex-col items-center gap-1">
        {icon}
        <span className="text-[9px] font-bold tracking-[0.12em]">{label}</span>
      </div>
    </button>
  );
}

function TreeItem({ icon, label, active, hasChildren, isExpanded, onToggle, id }: any) {
  return (
    <div 
      onClick={() => hasChildren && onToggle && onToggle(id)}
      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors ${active ? 'bg-[#dbe7fb] text-[#2f67f6]' : 'text-slate-500 hover:bg-[#edf2f8]'}`}
    >
      <div className="w-3 text-slate-300">
        {hasChildren && (isExpanded ? <ChevronDown size={10}/> : <ChevronRight size={10}/>)}
      </div>
      <span className={active ? 'text-[#5e82e8]' : 'text-[#a5b2c8]'}>{icon}</span>
      <span className={`whitespace-nowrap ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </div>
  );
}

function ToolBadge({ label, onClick }: any) {
  return (
    <span onClick={onClick} className="cursor-pointer rounded-[4px] border border-[#dbe3ef] bg-white px-2 py-1 text-[8px] font-bold text-slate-500 shadow-[0_1px_2px_rgba(148,163,184,0.08)] transition-all hover:border-[#a7b9da]">{label}</span>
  );
}

function StackedTag({
  text,
  colorTheme = 'blue',
  onClick,
  positionClass = '',
}: {
  text: string;
  colorTheme?: 'blue' | 'fuchsia';
  onClick?: () => void;
  positionClass?: string;
}) {
  const themeMap = {
    blue: 'from-sky-500 to-blue-600 shadow-blue-200/50',
    fuchsia: 'from-fuchsia-500 to-purple-600 shadow-purple-200/50',
  };
  const bgClass = themeMap[colorTheme] || themeMap.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`z-30 group flex items-center justify-center transition-all active:scale-95 ${positionClass}`}
    >
      <div className={`px-2.5 py-0.5 rounded-full bg-gradient-to-br ${bgClass} text-white text-[9px] font-bold tracking-widest uppercase shadow-lg border border-white/20 hover:brightness-110`}>
        {text}
      </div>
    </button>
  );
}

function TopologyEndpointNode({
  label,
  active,
  accent,
  onClick,
}: {
  label: string;
  active?: boolean;
  accent: 'pink' | 'blue';
  onClick?: () => void;
}) {
  const isClickable = typeof onClick === 'function';
  const themeClasses = accent === 'pink'
    ? 'border-rose-200/50 bg-rose-50/40 text-rose-600 ring-rose-500/20'
    : 'border-sky-200/50 bg-sky-50/40 text-sky-600 ring-sky-500/20';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative z-10 flex h-[70px] w-[60px] flex-col items-center justify-center rounded-2xl border backdrop-blur-md shadow-sm transition-all ${
        themeClasses
      } ${active ? 'scale-110 ring-4 !border-rose-400 !bg-rose-100/60' : ''} ${isClickable ? 'hover:scale-105 hover:bg-white/80' : 'cursor-default'}`}
    >
      <Database size={20} className="mb-1 opacity-80" />
      <span className="text-[14px] font-black tracking-tighter">{label}</span>
    </button>
  );
}

function TopologyAgentCard({
  label,
  active,
  skillLabel,
  onSkillClick,
}: {
  label: string;
  active?: boolean;
  skillLabel: string;
  onSkillClick?: () => void;
}) {
  const lines = label.split('-');

  return (
    <div className={`relative z-10 flex h-[95px] w-[84px] flex-col items-center justify-center rounded-2xl border border-rose-200/50 bg-white/40 backdrop-blur-sm shadow-sm transition-all hover:-translate-y-1 ${active ? 'scale-110 ring-4 ring-rose-400/30 !border-rose-400 !bg-rose-50/80' : ''}`}>
      <BrainCircuit size={18} className="mb-1.5 text-rose-500 opacity-70" />
      <div className="mb-1 text-center text-[11px] font-bold leading-tight text-slate-700">
        {lines.map((line, idx) => (
          <div key={idx}>{line}{idx === 0 && lines.length > 1 ? '-' : ''}</div>
        ))}
      </div>
      <StackedTag text={skillLabel} onClick={onSkillClick} positionClass="absolute -bottom-2" colorTheme="fuchsia" />
    </div>
  );
}

function TopologyHostCard({
  label,
  active,
  toolLabel,
  onToolsClick,
}: {
  label: string;
  active?: boolean;
  toolLabel: string;
  onToolsClick?: () => void;
}) {
  return (
    <div
      className={`relative z-10 flex h-[65px] w-[74px] flex-col items-center justify-center rounded-xl border border-sky-200/50 bg-white/40 backdrop-blur-sm shadow-sm transition-all hover:shadow-md ${
        active ? 'scale-110 ring-4 ring-sky-400/30 !border-sky-400 !bg-sky-50/80' : ''
      }`}
    >
      <StackedTag text={toolLabel} onClick={onToolsClick} positionClass="absolute -top-2" colorTheme="blue" />
      <Server size={16} className="mb-1 text-sky-500 opacity-70" />
      <div className="text-[12px] font-bold tracking-tight text-slate-700">{label}</div>
    </div>
  );
}
