import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Activity, Server, Database, Network,
  Play, CheckCircle, Search, 
  SlidersHorizontal, ChevronRight, ChevronDown, 
  Loader2, Zap, BrainCircuit, Smartphone, ArrowRight,
  Library, FileJson, Bot, Radio, MapPin, Signal,
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
const SESSION_STORAGE_KEY = 'agentic-core-session-history';
const TOPOLOGY_DEBUG_PATH = '/debug/topology-canvas';

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

const ARF_SKILLS = [
  'Intent Decomposition',
  'Agent Selection',
  'Execution Planning',
  'Closed-Loop Verification',
  'Policy Reasoning',
];

const safeRender = (val: any) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

function getToolHostTag(tool: string) {
  return (TOOL_DEFINITIONS[tool]?.host || 'NF').replace(/^6G\s+/, '');
}

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
    label: 'UE 01',
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
    label: 'UE 02',
    profile: 'AGV-Swarm',
    summary: 'Factory URLLC control plane for coordinated AGV movement.',
    data: cloneUeData(DEFAULT_UE_DATA),
  },
  {
    id: 'smart-meter-01',
    label: 'UE 03',
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
  const [selectedUeId, setSelectedUeId] = useState<string>(MOCK_UES[0].id);
  
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [canvasOverlay, setCanvasOverlay] = useState<'trf' | 'arf' | null>(null);
  const playbackIdRef = useRef(0);
  const topologyViewportRef = useRef<HTMLDivElement | null>(null);
  const [topologyScale, setTopologyScale] = useState(1);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([
    'explorer-agents',
    'explorer-skills',
    'explorer-tools',
    'explorer-network-functions',
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
  const [now, setNow] = useState(() => new Date());
  const selectedUe = MOCK_UES.find((ue) => ue.id === selectedUeId) || null;
  const isTopologyDebugPath = typeof window !== 'undefined' && window.location.pathname === TOPOLOGY_DEBUG_PATH;
  const currentTime = now.toLocaleTimeString([], { hour12: false });
  const currentDate = now.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });

  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  const topologyCanvas = (
    <>
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
      <div ref={topologyViewportRef} className="relative flex flex-1 overflow-hidden rounded-[30px]">
        <div
          className="topology-frame absolute left-1/2 top-1/2 overflow-hidden rounded-[30px] border topology-grid"
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
            <path d="M 195 325 L 290 325" fill="none" stroke="#6366f1" strokeWidth="2.5" markerEnd="url(#arrow-indigo-live)" strokeLinecap="round" className="drop-shadow-sm animate-data-pulse" />
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

            <div className="absolute z-0 w-[2px] rounded-full bg-indigo-200/50" style={{ left: 138.5, top: 126, height: 35 }}></div>
            <div className="absolute z-20 flex cursor-default justify-center drop-shadow-xl transition-all hover:scale-110" style={{ left: 120, top: 71, width: 40, height: 60 }}>
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

            <div className={`absolute z-10 flex flex-col overflow-hidden rounded-[32px] border border-indigo-200/50 bg-white/60 shadow-xl backdrop-blur-md transition-all ${activeNFs.has('UERANSIM_APP') ? 'ring-4 ring-indigo-400/20 scale-105' : ''}`} style={{ left: 70, top: 156, width: 140, height: 220 }}>
            <div className="flex w-full justify-center border-b border-indigo-100 bg-indigo-50/50 py-3">
              <span className="text-sm font-black tracking-[0.2em] text-indigo-900 uppercase">Terminal</span>
            </div>
            </div>
            <div className="absolute z-10 w-[2px] rounded-full bg-indigo-200/50 animate-pulse" style={{ left: 138.5, top: 251, height: 60 }}></div>
            <div className={`absolute z-20 flex items-center justify-center rounded-2xl border border-indigo-400/50 bg-gradient-to-br from-indigo-500 to-blue-600 text-center text-[11px] font-bold uppercase tracking-tighter leading-tight text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-110 ${activeNFs.has('UERANSIM_APP') ? 'ring-4 ring-indigo-400/40' : ''}`} style={{ left: 85, top: 211, width: 110, height: 48 }}>
            OS<br />(Agent)
            </div>
            <div className={`absolute z-20 flex items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-center text-[11px] font-bold uppercase tracking-tighter leading-tight text-slate-600 shadow-md backdrop-blur-sm transition-all hover:scale-110 ${activeNFs.has('UERANSIM_APP') ? 'ring-4 ring-indigo-200/40' : ''}`} style={{ left: 85, top: 301, width: 110, height: 48 }}>
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
    </>
  );

  if (isTopologyDebugPath) {
    return (
      <div className="dashboard-root p-4">
        <div className="topology-debug-shell">
          {topologyCanvas}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <div className="dashboard-shell">
      
      {/* TOOL DEFINITION MODAL OVERLAY */}
      {selectedTool && (
        <div className="modal-backdrop absolute inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="modal-card flex w-[500px] flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="modal-header flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-800">Tool Definition Template</h3>
              </div>
              <button onClick={() => setSelectedTool(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Tool Name</h4>
                  <p className="status-pill info font-mono">{selectedTool}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Host NF</h4>
                  <span className="status-pill success">
                    {TOOL_DEFINITIONS[selectedTool]?.host || "Unknown"}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><FileJson size={12}/> Description</h4>
                <p className="metric-tile p-2 text-sm leading-relaxed text-slate-700">
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
        <div className="modal-backdrop absolute inset-0 z-40 flex items-center justify-center">
          <div className="modal-card flex w-[620px] max-w-[92vw] flex-col overflow-hidden">
            <div className="modal-header flex items-center justify-between px-4 py-3">
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
                <div key={group.label} className="soft-card p-4">
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
        <div className="modal-backdrop absolute inset-0 z-40 flex items-center justify-center">
          <div className="modal-card flex w-[520px] max-w-[92vw] flex-col overflow-hidden">
            <div className="modal-header flex items-center justify-between px-4 py-3">
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
      <header className="app-header px-5">
        <div className="brand-lockup">
          <div className="brand-mark flex items-center justify-center">
            <Network size={24} />
          </div>
          <div>
            <div className="brand-title">Agentic Core</div>
            <div className="brand-subtitle">Command Center</div>
          </div>
        </div>
        <div className="header-tools">
          <div className="text-right">
            <div className="header-clock">{currentTime}</div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-400">{currentDate}</div>
          </div>
          <HeaderUeSelector selectedUe={selectedUe} options={MOCK_UES} onSelect={handleSelectUe} />
          <button className="header-icon-btn" type="button" aria-label="Search"><Search size={15} /></button>
          <button className="header-icon-btn" type="button" aria-label="Settings"><SlidersHorizontal size={15} /></button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="dashboard-main">
        <div className="command-rail">
          <div className="rail-stack">
            <button className="rail-btn active" type="button" aria-label="Dashboard"><Network size={17} /></button>
            <button className="rail-btn" type="button" aria-label="Topology"><Activity size={17} /></button>
            <button className="rail-btn" type="button" aria-label="Functions"><Database size={17} /></button>
            <button className="rail-btn" type="button" aria-label="Infrastructure"><HardDrive size={17} /></button>
            <button className="rail-btn" type="button" aria-label="Settings"><SlidersHorizontal size={17} /></button>
          </div>
          <button className="rail-btn" type="button" aria-label="Operator">OP</button>
        </div>
        
        {/* SIDEBAR */}
        <div className="sidebar-panel">
          <div className="sidebar-section-header">
            <span>Active Context</span>
            <span className="status-pill success">Live</span>
          </div>
          <div className="sidebar-card p-2">
            <div className="space-y-0.5">
              <TreeItem variant="explorer" id="explorer-ue" label="UE" icon={<Smartphone size={16} className="text-[#0f766e]" />} hasChildren isExpanded={expandedFolders.has('explorer-ue')} onToggle={toggleFolder} count={12} />
              {expandedFolders.has('explorer-ue') && (
                <div className="-mt-1 ml-2 border-l border-[#dbe3ef] pl-1.5">
                  <TreeItem variant="explorer" label="UE-07" icon={<Smartphone size={14} className="text-[#0f766e]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="UE-08" icon={<Smartphone size={14} className="text-[#0f766e]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="UE-03" icon={<Smartphone size={14} className="text-[#0f766e]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="Others" icon={<Smartphone size={14} className="text-[#0f766e]" />} status="healthy" level={1} />
                </div>
              )}

              <TreeItem variant="explorer" id="explorer-agents" label="Agents" icon={<Bot size={16} className="text-[#1d4ed8]" />} hasChildren isExpanded={expandedFolders.has('explorer-agents')} onToggle={toggleFolder} count={3} />
              {expandedFolders.has('explorer-agents') && (
                <div className="-mt-1 ml-2 border-l border-[#dbe3ef] pl-1.5">
                  <TreeItem variant="explorer" label="System_Agent" icon={<Bot size={14} className="text-[#1d4ed8]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="Conn_Agent" icon={<Bot size={14} className="text-[#1d4ed8]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="Compute_Agent" icon={<Bot size={14} className="text-[#1d4ed8]" />} status="healthy" level={1} />
                </div>
              )}

              <TreeItem variant="explorer" id="explorer-network-functions" label="Network Functions" icon={<Database size={16} className="text-[#0369a1]" />} hasChildren isExpanded={expandedFolders.has('explorer-network-functions')} onToggle={toggleFolder} count={5} />
              {expandedFolders.has('explorer-network-functions') && (
                <div className="-mt-1 ml-2 border-l border-[#dbe3ef] pl-1.5">
                  <TreeItem variant="explorer" label="AM" icon={<Radio size={14} className="text-[#0369a1]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="SM" icon={<SlidersHorizontal size={14} className="text-[#0369a1]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="Policy" icon={<FileJson size={14} className="text-[#0369a1]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="UP" icon={<Activity size={14} className="text-[#0369a1]" />} status="healthy" level={1} />
                  <TreeItem variant="explorer" label="DP" icon={<Database size={14} className="text-[#0369a1]" />} status="healthy" level={1} />
                </div>
              )}

              <TreeItem variant="explorer" id="explorer-skills" label="Skills" icon={<BrainCircuit size={16} className="text-[#5b21b6]" />} hasChildren isExpanded={expandedFolders.has('explorer-skills')} onToggle={toggleFolder} count={ARF_SKILLS.length} />
              {expandedFolders.has('explorer-skills') && (
                <div className="-mt-1 ml-2 border-l border-[#dbe3ef] pl-1.5">
                  {ARF_SKILLS.map((skill) => (
                    <TreeItem key={skill} variant="explorer" label={skill} icon={<BrainCircuit size={14} className="text-[#5b21b6]" />} rightBadge="ARF" level={1} />
                  ))}
                </div>
              )}

              <TreeItem variant="explorer" id="explorer-tools" label="Tools" icon={<Code size={16} className="text-[#0f172a]" />} hasChildren isExpanded={expandedFolders.has('explorer-tools')} onToggle={toggleFolder} count={TRF_TOOL_GROUPS.reduce((sum, group) => sum + group.tools.length, 0)} />
              {expandedFolders.has('explorer-tools') && (
                <div className="-mt-1 ml-2 border-l border-[#dbe3ef] pl-1.5">
                  {TRF_TOOL_GROUPS.flatMap((group) => group.tools).map((tool) => (
                    <TreeItem
                      key={tool}
                      variant="explorer"
                      label={tool}
                      icon={<Code size={14} className="text-[#0f172a]" />}
                      rightBadge={getToolHostTag(tool)}
                      onClick={() => setSelectedTool(tool)}
                      level={1}
                    />
                  ))}
                </div>
              )}

              <TreeItem variant="explorer" id="explorer-infra" label="Infra" icon={<HardDrive size={16} className="text-[#334155]" />} hasChildren isExpanded={expandedFolders.has('explorer-infra')} onToggle={toggleFolder} count={5} />
              {expandedFolders.has('explorer-infra') && (
                <div className="-mt-1 ml-2 border-l border-[#dbe3ef] pl-1.5">
                  <TreeItem variant="explorer" label="AI Runtime" icon={<HardDrive size={14} className="text-[#334155]" />} level={1} />
                  <TreeItem variant="explorer" label="Core Cluster" icon={<HardDrive size={14} className="text-[#334155]" />} level={1} />
                  <TreeItem variant="explorer" label="RAN Sim" icon={<HardDrive size={14} className="text-[#334155]" />} level={1} />
                  <TreeItem variant="explorer" label="Trace Store" icon={<HardDrive size={14} className="text-[#334155]" />} level={1} />
                  <TreeItem variant="explorer" label="Telemetry" icon={<HardDrive size={14} className="text-[#334155]" />} level={1} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER AREA */}
        <div className="workspace flex flex-col">
          
          {/* TOPOLOGY VIEW */}
          <div className="workspace-section flex h-[60%] flex-col overflow-hidden px-5 pt-4">
            <div className="section-toolbar">
              <div className="section-title">
                <Activity size={15} className="text-[#2f73ff]" /> Active Network Architecture Topology
              </div>
              <div className="flex items-center gap-2">
                <span className="status-pill info">Active Trace</span>
                <span className="status-pill success">Healthy</span>
                <span className="topology-tools">
                  <button type="button">Legend</button>
                  <button type="button">Fit</button>
                </span>
              </div>
            </div>
            {topologyCanvas}
          </div>

          {/* SBI TRACE LOG */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="trace-panel-header flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <ChevronRight size={14}/> Service Based Interface (SBI) Trace Log
              </div>
              {isPlaying && <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] animate-pulse"><Loader2 size={12} className="animate-spin"/> PROCESSING...</div>}
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <table className="trace-table w-full text-left font-mono text-[10px]">
                <thead className="sticky top-0 uppercase">
                  <tr>
                    <th>TIME</th>
                    <th>SRC NF</th>
                    <th>DEST NF</th>
                    <th>SBI OPERATION</th>
                    <th>STATUS</th>
                    <th>PAYLOAD EXCERPT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f8]">
                  {traceData.map((t, i) => (
                    <tr key={i} className={`transition-colors hover:bg-[#f8fbff] ${i === 2 ? 'bg-[#f7f0ff]' : ''}`}>
                      <td className="text-slate-400">{t.time}</td>
                      <td className="font-bold text-slate-700">{t.src}</td>
                      <td className="font-bold text-slate-700">{t.dest}</td>
                      <td className="font-bold text-[#2f73ff]">{t.op}</td>
                      <td>
                        <span className={`status-pill ${
                          t.status === '200 OK' || t.status === '201 Created' || t.status === 'Success' ? 'success' : 'danger'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="max-w-[420px] truncate text-slate-400">{t.payload}</td>
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
        <div className="right-panel flex flex-col">
          <div className="right-panel-header">
            <div>
              <div className="text-[12px] font-extrabold text-slate-800">Outputs & Effects</div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-400">Live orchestration controls</div>
            </div>
            <span className="status-pill success">Live</span>
          </div>
          <div className="right-tabs">
            <TabBtn active={rightTab === 'intent'} icon={<Zap size={14}/>} label="INTENT" onClick={() => setRightTab('intent')} />
            <TabBtn active={rightTab === 'log'} icon={<Activity size={14}/>} label="REACT LOG" onClick={() => setRightTab('log')} />
            <TabBtn active={rightTab === 'ue'} icon={<Smartphone size={14}/>} label="UE STATE" onClick={() => setRightTab('ue')} />
            <TabBtn active={rightTab === 'ngap'} icon={<Radio size={14}/>} label="NGAP" onClick={() => setRightTab('ngap')} />
            <TabBtn active={rightTab === 'infra'} icon={<HardDrive size={14}/>} label="INFRA" onClick={() => setRightTab('infra')} />
            <TabBtn active={rightTab === 'sessions'} icon={<Library size={14}/>} label="TRACE SESSIONS" onClick={() => setRightTab('sessions')} />
          </div>

          <div className="panel-scroll space-y-4">
            {rightTab === 'intent' && (
              <>
                <div>
                   <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Natural Language Request</h3>
                   <div className="soft-card mb-2 px-3 py-2">
                     <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Active Target UE</div>
                     {selectedUe ? (
                       <div className="mt-1 flex items-center justify-between gap-2">
                         <div>
                           <div className="text-[10px] font-semibold text-slate-700">{selectedUe.label}</div>
                           <div className="font-mono text-[10px] text-slate-400">{selectedUe.data.supi}</div>
                         </div>
                         <span className="status-pill info">{selectedUe.profile}</span>
                       </div>
                     ) : (
                       <div className="mt-1 text-[10px] text-slate-400">Choose a UE target before executing an intent.</div>
                     )}
                   </div>
                   <textarea 
                     className="h-20 w-full resize-none rounded-lg border border-[#d7dfeb] bg-white p-3 font-mono text-[10px] leading-4 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] focus:outline-none focus:ring-2 focus:ring-blue-100"
                     value={inputText} onChange={(e) => setInputText(e.target.value)}
                     placeholder="Type intent here..."
                   />
                   {!selectedUe && (
                     <div className="mt-2 text-[10px] font-medium text-amber-600">Select a UE target first to enable execution.</div>
                   )}
                   <div className="mt-2 flex gap-2">
                     <button onClick={handleSuggest} className="action-secondary flex-1">SUGGEST</button>
                     <button onClick={processIntent} disabled={isProcessing || !selectedUe} className="action-primary flex-[2] disabled:cursor-not-allowed disabled:opacity-60">
                        {isProcessing ? <Loader2 size={14} className="animate-spin"/> : <Play size={12} fill="currentColor"/>} EXECUTE
                     </button>
                     <button onClick={handleReplay} disabled={isProcessing || isPlaying} className="action-purple disabled:cursor-not-allowed disabled:opacity-60"><RotateCcw size={12}/> REPLAY</button>
                   </div>
                   <div className="mt-3 flex items-center gap-2">
                     <input type="checkbox" checked={slowMode} onChange={e => setSlowMode(e.target.checked)} className="accent-blue-600" id="slow"/>
                     <label htmlFor="slow" className="cursor-pointer text-[10px] font-bold uppercase text-slate-500">Slow Motion Playback</label>
                   </div>
                </div>

                <div className="soft-card overflow-hidden">
                  <div className="soft-card-header flex items-center justify-between px-3 py-2">
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
      <div className="bottom-status">
        <div className="bottom-status-metrics">
          <span className="bottom-metric"><span className="status-dot"></span><span>Network</span><strong>Healthy</strong></span>
          <span className="bottom-metric"><span>Active PDU</span><strong>{kpis.pdu}</strong></span>
          <span className="bottom-metric"><span>CP Load</span><strong>{kpis.cpLoad}%</strong></span>
          <span className="bottom-metric"><span>SBI Latency</span><strong>{kpis.latency.toFixed(1)}ms</strong></span>
        </div>
        <div>
          <span className="font-bold text-slate-600">Active Alarms</span>
          <span className="status-pill danger">0 Critical</span>
          <span className="status-pill info">4 Minor</span>
        </div>
        <div>
          <span className="font-bold text-slate-600">System Load</span>
          <svg className="tiny-sparkline" viewBox="0 0 76 16" aria-hidden="true">
            <polyline fill="none" stroke="#2fb277" strokeWidth="1.5" points="0,12 10,11 18,8 26,9 34,6 42,10 50,5 60,4 76,3" />
          </svg>
          <span className="font-mono font-bold text-slate-700">{kpis.cpLoad}%</span>
        </div>
        <div>
          <span className="font-bold text-slate-600">Region</span>
          <span className="flex items-center gap-1 font-mono text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-[#2fb277]"></span> us-central</span>
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
    <div className="ue-selector">
      <div>
        <div className="ue-selector-label">Active UE</div>
        <div className="ue-selector-value">{selectedUe?.label || 'Unassigned'}</div>
      </div>
      <select
        value={selectedUe?.id || ''}
        onChange={(event) => onSelect(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label} · {option.profile} · {option.data.supi}
          </option>
        ))}
      </select>
    </div>
  );
}

function PolicyField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-tile px-3 py-2">
      <div className="mb-1 text-[9px] font-bold tracking-[0.04em] text-slate-400">{label}</div>
      <div className="break-all font-mono text-[10px] font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function MetricStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="metric-tile px-3 py-2">
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
    <div className="metric-tile px-3 py-3">
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
    <button onClick={onClick} className={`tab-btn ${active ? 'active' : ''}`}>
      <div className="flex flex-col items-center gap-1">
        {icon}
        <span className="text-[9px] font-bold tracking-[0.12em]">{label}</span>
      </div>
    </button>
  );
}

type TreeItemProps = {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  onToggle?: (id: string) => void;
  id?: string;
  count?: number;
  rightBadge?: string;
  status?: 'healthy' | 'muted';
  variant?: 'legacy' | 'explorer';
  level?: number;
};

function TreeItem({ icon, label, active, hasChildren, isExpanded, onClick, onToggle, id, count, rightBadge, status, variant = 'legacy' }: TreeItemProps) {
  if (variant === 'explorer') {
    const statusClass = status === 'muted' ? 'bg-slate-300' : 'bg-[#22c55e]';
    const isInteractive = Boolean(hasChildren || onClick);

    return (
      <div
        onClick={() => {
          if (hasChildren && onToggle && id) {
            onToggle(id);
            return;
          }
          onClick?.();
        }}
        className={`tree-item group flex items-center gap-1.5 rounded-md px-1.5 text-[11px] transition-all ${
          isInteractive ? 'cursor-pointer' : 'cursor-default'
        } ${hasChildren ? 'h-8' : 'h-7'} ${active ? 'bg-[#eaf1ff] text-[#315ee8]' : 'text-[#31415f] hover:bg-[#f2f6fc]'}`}
      >
        <div className="flex w-3 shrink-0 justify-center text-[#0f2a44]">
          {hasChildren && (isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>)}
        </div>
        <span className={active ? 'text-[#315ee8]' : 'text-[#7183a3]'}>{icon}</span>
        <span className={`min-w-0 flex-1 truncate ${hasChildren ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {typeof count === 'number' && (
          <span className="tree-badge px-1.5 py-0.5">
            {count}
          </span>
        )}
        {rightBadge && (
          <span className="tree-badge px-1.5 py-0.5">
            {rightBadge}
          </span>
        )}
        {!hasChildren && status && (
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusClass}`}></span>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => hasChildren && onToggle && id && onToggle(id)}
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
    <span onClick={onClick} className="status-pill info cursor-pointer">{label}</span>
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
    blue: 'border-[#bcd4ff] bg-[#eaf2ff] text-[#2f73ff]',
    fuchsia: 'border-[#d8ceff] bg-[#f0ecff] text-[#7956f5]',
  };
  const bgClass = themeMap[colorTheme] || themeMap.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`z-30 group flex items-center justify-center transition-all active:scale-95 ${positionClass}`}
    >
      <div className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase ${bgClass} shadow-[0_6px_14px_rgba(47,115,255,0.10)] hover:brightness-105`}>
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
    ? 'text-[#7956f5] ring-[#7956f5]/20'
    : 'text-[#2f73ff] ring-[#2f73ff]/20';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`topology-node relative z-10 flex h-[70px] w-[60px] flex-col items-center justify-center rounded-2xl transition-all ${
        themeClasses
      } ${active ? 'active-purple scale-110 ring-4' : ''} ${isClickable ? 'hover:scale-105 hover:bg-white/95' : 'cursor-default'}`}
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
    <div className={`topology-node relative z-10 flex h-[95px] w-[84px] flex-col items-center justify-center rounded-2xl transition-all hover:-translate-y-1 ${active ? 'active-purple scale-110 ring-4 ring-[#7956f5]/20' : ''}`}>
      <BrainCircuit size={18} className="mb-1.5 text-[#7956f5] opacity-80" />
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
      className={`topology-node relative z-10 flex h-[65px] w-[74px] flex-col items-center justify-center rounded-xl transition-all hover:shadow-md ${
        active ? 'active-blue scale-110 ring-4 ring-[#2f73ff]/20' : ''
      }`}
    >
      <StackedTag text={toolLabel} onClick={onToolsClick} positionClass="absolute -top-2" colorTheme="blue" />
      <Server size={16} className="mb-1 text-[#2f73ff] opacity-80" />
      <div className="text-[12px] font-bold tracking-tight text-slate-700">{label}</div>
    </div>
  );
}
