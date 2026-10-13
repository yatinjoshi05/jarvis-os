import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ecosystemDb, LeadRecord, CallRecord, MessageRecord, EmailRecord, ProposalRecord, AutomationNodeRecord } from '../../../shared/database/EcosystemDatabase';
import { businessEngine } from '../../../services/BusinessEngine';
import { automationService } from '../../../services/AutomationService';

/* ============================================================
   ALLOWED TERMINOLOGY REPLACEMENTS:
   Lead Qualification → AI Intelligence
   Leads by Source → Agent Sources
   Call Sentiment → Voice Analysis
   Pipeline Value → Ecosystem Value
   Live Dashboard → AI Business Ecosystem
   Automateup → JARVIS OS
   ============================================================ */

const LANE_COLOR: Record<string, string> = {
  lead: "#4F8CFF",
  wa: "#25D366",
  email: "#F5A623",
  voice: "#B26BFF",
  sched: "#22D3EE"
};

const NODES = [
  { id: "n-lead-trigger", lane: "lead", col: 0, y: 60, label: "📥 Inbound Lead", sub: "webhook", type: "Webhook Trigger", desc: "Kisi bhi source (website, ads, referral) se lead aane par POST request pakadta hai." },
  { id: "n-lead-ai", lane: "lead", col: 1, y: 60, label: "🧠 Lead Analyzer", sub: "gemini-2.0-flash", type: "Gemini AI", desc: "Lead ko hot/warm/cold qualify karta hai, intent score deta hai, next action suggest karta hai." },
  { id: "n-lead-sheet", lane: "lead", col: 2, y: 60, label: "💾 Leads Sheet", sub: "append + update", type: "Google Sheets", desc: "Lead detail aur AI analysis Leads tab me save/update hoti hai." },
  { id: "n-lead-hot", lane: "lead", col: 3, y: 8, label: "🔥 Hot Alert", sub: "Telegram", type: "Action", desc: "Agar qualification = hot, turant Telegram par alert bhejta hai." },
  { id: "n-lead-call", lane: "lead", col: 3, y: 60, label: "📞 Outbound Call", sub: "LiveKit", type: "Action", desc: "Agar call_required = true, AI voice agent outbound call place karta hai." },
  { id: "n-lead-proposal", lane: "lead", col: 3, y: 112, label: "📝 Proposal", sub: "Gemini + Sheet", type: "Gemini AI + Sheets", desc: "Agar call zaroori nahi, Gemini proposal draft karta hai aur Proposals tab me save karta hai." },

  { id: "n-wa-trigger", lane: "wa", col: 0, y: 172, label: "💬 WhatsApp", sub: "webhook", type: "Webhook Trigger", desc: "Customer ka WhatsApp message aate hi webhook trigger hota hai." },
  { id: "n-wa-ai", lane: "wa", col: 1, y: 172, label: "🧠 WA Reply Gen", sub: "gemini-2.0-flash", type: "Gemini AI", desc: "Message samajh kar Hinglish/Hindi/English me natural reply generate karta hai." },
  { id: "n-wa-sheet", lane: "wa", col: 2, y: 172, label: "💾 WhatsApp Sheet", sub: "append", type: "Google Sheets", desc: "Har conversation (message + AI reply) WhatsAppMessages tab me log hoti hai." },
  { id: "n-wa-send", lane: "wa", col: 3, y: 172, label: "📤 Send Reply", sub: "WhatsApp API", type: "Action", desc: "AI reply seedha customer ko WhatsApp pe bhej diya jaata hai." },

  { id: "n-email-trigger", lane: "email", col: 0, y: 232, label: "📧 Email/Support", sub: "webhook", type: "Webhook Trigger", desc: "Support email ya ticket aane par webhook trigger hota hai." },
  { id: "n-email-ai", lane: "email", col: 1, y: 232, label: "🧠 Email Reply Gen", sub: "gemini-2.0-flash", type: "Gemini AI", desc: "Ticket categorize karta hai, priority set karta hai, professional reply draft karta hai." },
  { id: "n-email-sheet", lane: "email", col: 2, y: 232, label: "💾 Tickets Sheet", sub: "append", type: "Google Sheets", desc: "Ticket detail aur AI reply SupportTickets tab me save hota hai." },
  { id: "n-email-send", lane: "email", col: 3, y: 232, label: "📤 Send Email", sub: "SMTP", type: "Action", desc: "AI reply customer ko email se bhej diya jaata hai." },

  { id: "n-voice-trigger", lane: "voice", col: 0, y: 292, label: "📞 Call Event", sub: "webhook", type: "Webhook Trigger", desc: "LiveKit se call end hone ka event yahan aata hai (transcript ke saath)." },
  { id: "n-voice-ai", lane: "voice", col: 1, y: 292, label: "🧠 Call Analyzer", sub: "gemini-2.0-flash", type: "Gemini AI", desc: "Call transcript se sentiment, intent, deal stage aur follow-up zaroorat nikalta hai." },
  { id: "n-voice-sheet", lane: "voice", col: 2, y: 292, label: "💾 CallLogs Sheet", sub: "append", type: "Google Sheets", desc: "Poori call detail — transcript, sentiment, rating — CallLogs tab me save hoti hai." },
  { id: "n-voice-update", lane: "voice", col: 3, y: 292, label: "📊 Deal Update", sub: "downstream", type: "Action", desc: "Call outcome se lead ka deal_stage aage ke steps ke liye update hota hai." },

  { id: "n-sched-trigger", lane: "sched", col: 0, y: 352, label: "⏰🌅 Schedulers", sub: "hourly + 9AM", type: "Schedule Trigger", desc: "Har ghante follow-up check, aur roz 9 AM (Mon-Fri) outbound campaign shuru." },
  { id: "n-sched-sheet", lane: "sched", col: 2, y: 352, label: "💾 Leads Sheet", sub: "get (filtered)", type: "Google Sheets", desc: "Due follow-ups aur aaj ke hot/warm outbound leads Leads tab se read kiye jaate hain." },
  { id: "n-sched-batch", lane: "sched", col: 3, y: 352, label: "📲 Batch Calls", sub: "2-min gap", type: "Action", desc: "Qualified leads ko LiveKit ke through ek-ek karke 2 min gap se call kiya jaata hai." },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));
const CONNECTIONS: [string, string, string][] = [
  ["n-lead-trigger", "n-lead-ai", "lead"], ["n-lead-ai", "n-lead-sheet", "lead"],
  ["n-lead-sheet", "n-lead-hot", "lead"], ["n-lead-sheet", "n-lead-call", "lead"], ["n-lead-sheet", "n-lead-proposal", "lead"],
  ["n-wa-trigger", "n-wa-ai", "wa"], ["n-wa-ai", "n-wa-sheet", "wa"], ["n-wa-sheet", "n-wa-send", "wa"],
  ["n-email-trigger", "n-email-ai", "email"], ["n-email-ai", "n-email-sheet", "email"], ["n-email-sheet", "n-email-send", "email"],
  ["n-voice-trigger", "n-voice-ai", "voice"], ["n-voice-ai", "n-voice-sheet", "voice"], ["n-voice-sheet", "n-voice-update", "voice"],
  ["n-sched-trigger", "n-sched-sheet", "sched"], ["n-sched-sheet", "n-sched-batch", "sched"],
];

const COL_X = [20, 250, 480, 710];
const NODE_W = 180;
const NODE_H = 46;
const aR = (n: typeof NODES[0]) => ({ x: COL_X[n.col] + NODE_W, y: n.y + NODE_H / 2 });
const aL = (n: typeof NODES[0]) => ({ x: COL_X[n.col], y: n.y + NODE_H / 2 });

const fmtINR = (n: number) => "₹" + n.toLocaleString('en-IN');
const parseINR = (s: string) => parseInt(String(s).replace(/[^0-9]/g, '')) || 0;

export default function CRMWorkspace() {
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('leads');
  const [syncTime, setSyncTime] = useState<string>('just now');

  // Command Bar State
  const [commandInput, setCommandInput] = useState<string>('');
  const [commandLog, setCommandLog] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Real Database Subscriptions
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [tickets, setTickets] = useState<EmailRecord[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);

  useEffect(() => {
    const updateSync = () => {
      setSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateSync();
    const interval = setInterval(updateSync, 1000);

    const refreshDb = () => {
      setLeads(ecosystemDb.getLeads());
      setCalls(ecosystemDb.getCalls());
      setMessages(ecosystemDb.getMessages());
      setTickets(ecosystemDb.getEmails());
      setProposals(ecosystemDb.getProposals());
    };

    refreshDb();
    const unsubscribe = ecosystemDb.subscribe(refreshDb);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.qualification === 'hot').length;
  const pipeValue = leads.reduce((s, l) => s + parseINR(l.value), 0);
  const openTickets = tickets.filter(t => t.status === 'open').length;

  const selectedNode = selectedNodeId ? NODE_BY_ID[selectedNodeId] : null;
  const selectedNodeMetrics: AutomationNodeRecord | null = selectedNodeId ? automationService.getNodeMetrics(selectedNodeId) : null;

  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isExecuting) return;

    setIsExecuting(true);
    setCommandLog(`Executing: "${commandInput}"...`);

    try {
      const res = await businessEngine.executeCommand(commandInput);
      setCommandLog(`✓ ${res.response}`);
    } catch (err: any) {
      setCommandLog(`❌ Error: ${err?.message || 'Execution failed'}`);
    } finally {
      setIsExecuting(false);
      setCommandInput('');
    }
  };

  const downloadCSV = () => {
    let data: any[] = [];
    if (activeTab === 'leads') data = leads;
    else if (activeTab === 'calls') data = calls;
    else if (activeTab === 'whatsapp') data = messages;
    else if (activeTab === 'tickets') data = tickets;
    else data = proposals;

    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csvContent = [keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderBadge = (q: string) => {
    if (q === 'hot') return <span className="badge b-hot">hot</span>;
    if (q === 'warm') return <span className="badge b-warm">warm</span>;
    return <span className="badge b-cold">cold</span>;
  };

  const renderSentiment = (s: string) => {
    if (s === 'positive') return <span className="badge b-good">positive</span>;
    if (s === 'negative') return <span className="badge b-bad">negative</span>;
    return <span className="badge b-neutral">neutral</span>;
  };

  const renderStatusBadge = (s: string) => {
    if (['resolved', 'sent', 'viewed', 'accepted', 'contacted', 'analyzed'].includes(s)) {
      return <span className="badge b-done">{s}</span>;
    }
    return <span className="badge b-open">{s}</span>;
  };

  const formatDate = (iso: string) => {
    if (!iso) return 'No date available';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'No date available' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Chart rendering metrics calculations
  const qualCounts = { hot: 0, warm: 0, cold: 0 };
  leads.forEach(l => qualCounts[l.qualification as keyof typeof qualCounts]++);

  const sourceCounts: Record<string, number> = {};
  leads.forEach(l => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  calls.forEach(c => sentimentCounts[c.sentiment as keyof typeof sentimentCounts]++);

  const days7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days7.push(d.toISOString().slice(0, 10));
  }
  const dayLabels = days7.map(d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
  const all7Counts = days7.map(d => leads.filter(l => l.created_at && l.created_at.slice(0, 10) === d).length);
  const hot7Counts = days7.map(d => leads.filter(l => l.created_at && l.created_at.slice(0, 10) === d && l.qualification === 'hot').length);

  return (
    <div className="crm-dashboard-root w-full h-full min-h-0 flex-1 overflow-y-auto hide-scrollbar select-none text-[#EAEEF8]">
      <style>{`
        .crm-dashboard-root {
          --bg: #080B12;
          --panel: #0F1523;
          --panel-2: #131A2C;
          --panel-3: #18213A;
          --border: rgba(150,165,205,.12);
          --border-strong: rgba(150,165,205,.26);
          --text: #EAEEF8;
          --text-dim: #8B95AE;
          --text-faint: #525C78;

          --brand: #4F8CFF;
          --brand-deep: #1E56C9;
          --whatsapp: #25D366;
          --email: #F5A623;
          --voice: #B26BFF;
          --sched: #22D3EE;
          --sheets: #2DD4BF;

          --hot: #FB4B63;
          --warm: #F5A623;
          --cold: #7F8AAD;
          --good: #28C76F;
          --bad: #FB4B63;
          --neutral: #8B95AE;

          --radius: 16px;
          --radius-sm: 11px;
          background:
            radial-gradient(1200px 620px at 8% -12%, rgba(79,140,255,.10), transparent 58%),
            radial-gradient(900px 480px at 108% -6%, rgba(178,107,255,.07), transparent 55%),
            var(--bg);
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
          padding: 4px 10px 40px;
        }

        .crm-dashboard-root .mono { font-family: 'IBM Plex Mono', monospace; }
        .crm-dashboard-root .shell { max-width: 1340px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

        .crm-dashboard-root header.topbar {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
          padding: 20px 24px;
          background: linear-gradient(160deg, var(--panel-3), var(--panel));
          border: 1px solid var(--border); border-radius: var(--radius);
          position: relative; overflow: hidden;
        }
        .crm-dashboard-root header.topbar::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(90deg, transparent 60%, rgba(79,140,255,.06));
        }
        .crm-dashboard-root .brand-block { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
        .crm-dashboard-root .brand-mark {
          width: 46px; height: 46px; border-radius: 13px; flex: none;
          background: linear-gradient(140deg, var(--brand), var(--brand-deep));
          display: flex; align-items: center; justify-content: center; font-size: 22px;
          box-shadow: 0 8px 22px rgba(79,140,255,.34), inset 0 1px 0 rgba(255,255,255,.3);
        }
        .crm-dashboard-root .brand-text .eyebrow {
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .2em;
          color: var(--text-faint); text-transform: uppercase;
        }
        .crm-dashboard-root .brand-text h1 {
          margin: 3px 0 0; font-family: 'Space Grotesk', sans-serif; font-weight: 700;
          font-size: 27px; letter-spacing: -.02em; line-height: 1;
        }
        .crm-dashboard-root .topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; position: relative; z-index: 1; }
        .crm-dashboard-root .pill {
          display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 100px;
          border: 1px solid var(--border-strong); background: rgba(255,255,255,.02);
          font-size: 12.5px; color: var(--text-dim);
        }
        .crm-dashboard-root .pill b { color: var(--text); font-weight: 600; }
        .crm-dashboard-root .dot-live { width: 7px; height: 7px; border-radius: 50%; background: var(--good); box-shadow: 0 0 0 3px rgba(40,199,111,.18); animation: pulse 1.9s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }

        .crm-dashboard-root .kpi-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 13px; }
        @media(max-width:1100px){.crm-dashboard-root .kpi-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:620px){.crm-dashboard-root .kpi-grid{grid-template-columns:repeat(2,1fr);}}
        .crm-dashboard-root .kpi {
          background: linear-gradient(180deg, var(--panel-2), var(--panel));
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 16px 16px 14px; position: relative; overflow: hidden;
        }
        .crm-dashboard-root .kpi::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:var(--accent,var(--brand)); }
        .crm-dashboard-root .kpi .k-top { display: flex; align-items: center; justify-content: space-between; }
        .crm-dashboard-root .kpi .k-label { font-size: 11px; color: var(--text-dim); letter-spacing: .02em; }
        .crm-dashboard-root .kpi .k-ico { font-size: 14px; opacity: .9; }
        .crm-dashboard-root .kpi .k-val { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 27px; margin-top: 11px; letter-spacing: -.015em; }
        .crm-dashboard-root .kpi .k-sub { font-size: 10.5px; color: var(--text-faint); margin-top: 4px; font-family: 'IBM Plex Mono', monospace; }

        .crm-dashboard-root .card { background: linear-gradient(180deg, var(--panel-2), var(--panel)); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px 20px; }
        .crm-dashboard-root .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
        .crm-dashboard-root .card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 9px; }
        .crm-dashboard-root .card-title .num { color: var(--text-faint); font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 11px; }
        .crm-dashboard-root .card-desc { font-size: 11.5px; color: var(--text-dim); max-width: 640px; }

        .crm-dashboard-root .flow-wrap { display: grid; grid-template-columns: 1fr 300px; gap: 14px; align-items: stretch; }
        @media(max-width:900px){.crm-dashboard-root .flow-wrap{grid-template-columns:1fr;}}
        .crm-dashboard-root #flowSvg { width: 100%; height: auto; display: block; }
        .crm-dashboard-root .col-label { fill: var(--text-faint); font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; }
        .crm-dashboard-root .lane-label { fill: var(--text-faint); font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; }
        .crm-dashboard-root .node-group { cursor: pointer; }
        .crm-dashboard-root .node-rect { transition: filter .15s ease; }
        .crm-dashboard-root .node-group:hover .node-rect { filter: brightness(1.4); }
        .crm-dashboard-root .node-group.selected .node-rect { stroke-width: 2.4; }
        .crm-dashboard-root .node-label { fill: var(--text); font-family: 'IBM Plex Sans', sans-serif; font-size: 11px; font-weight: 600; pointer-events: none; }
        .crm-dashboard-root .node-sub { fill: rgba(234,238,248,.5); font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; pointer-events: none; }
        .crm-dashboard-root .conn-path { fill: none; stroke-width: 1.5; opacity: .32; }

        .crm-dashboard-root .detail-panel { display: flex; flex-direction: column; gap: 11px; }
        .crm-dashboard-root .detail-empty { color: var(--text-dim); font-size: 12.5px; line-height: 1.65; padding: 6px 2px; }
        .crm-dashboard-root .detail-badge { display: inline-flex; align-self: flex-start; padding: 4px 11px; border-radius: 100px; font-size: 10.5px; font-family: 'IBM Plex Mono', monospace; letter-spacing: .04em; border: 1px solid var(--border-strong); }
        .crm-dashboard-root .detail-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16.5px; }
        .crm-dashboard-root .detail-desc { font-size: 12.5px; color: var(--text-dim); line-height: 1.55; }
        .crm-dashboard-root .detail-meta { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
        .crm-dashboard-root .meta-row { display: flex; justify-content: space-between; gap: 10px; font-size: 11.5px; padding: 9px 11px; background: rgba(255,255,255,.025); border: 1px solid var(--border); border-radius: 9px; }
        .crm-dashboard-root .meta-row .mk { color: var(--text-faint); }
        .crm-dashboard-root .meta-row .mv { font-family: 'IBM Plex Mono', monospace; color: var(--text); text-align: right; word-break: break-word; }

        .crm-dashboard-root .tab-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .crm-dashboard-root .tab-btn { padding: 8px 14px; border-radius: 100px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 12.5px; font-family: 'IBM Plex Sans', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: .15s; font-weight: 500; }
        .crm-dashboard-root .tab-btn .swatch { width: 7px; height: 7px; border-radius: 50%; }
        .crm-dashboard-root .tab-btn.active { background: rgba(255,255,255,.05); border-color: var(--border-strong); color: var(--text); }
        .crm-dashboard-root .tab-btn:hover { color: var(--text); }
        .crm-dashboard-root .table-scroll { overflow-x: auto; border: 1px solid var(--border); border-radius: 11px; }
        .crm-dashboard-root table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 760px; }
        .crm-dashboard-root thead th { text-align: left; padding: 11px 13px; font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: var(--text-faint); background: rgba(255,255,255,.02); border-bottom: 1px solid var(--border); font-family: 'IBM Plex Mono', monospace; font-weight: 500; white-space: nowrap; }
        .crm-dashboard-root tbody td { padding: 11px 13px; border-bottom: 1px solid var(--border); color: var(--text); white-space: nowrap; }
        .crm-dashboard-root tbody tr:last-child td { border-bottom: none; }
        .crm-dashboard-root tbody tr:hover { background: rgba(255,255,255,.02); }
        .crm-dashboard-root .id-cell { font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); font-size: 11px; }
        .crm-dashboard-root .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 100px; font-size: 10.5px; font-weight: 600; border: 1px solid transparent; }
        .crm-dashboard-root .b-hot { color: var(--hot); background: rgba(251,75,99,.12); border-color: rgba(251,75,99,.3); }
        .crm-dashboard-root .b-warm { color: var(--warm); background: rgba(245,166,35,.12); border-color: rgba(245,166,35,.3); }
        .crm-dashboard-root .b-cold { color: var(--cold); background: rgba(127,138,173,.14); border-color: rgba(127,138,173,.3); }
        .crm-dashboard-root .b-good { color: var(--good); background: rgba(40,199,111,.12); border-color: rgba(40,199,111,.3); }
        .crm-dashboard-root .b-bad { color: var(--bad); background: rgba(251,75,99,.12); border-color: rgba(251,75,99,.3); }
        .crm-dashboard-root .b-neutral { color: var(--neutral); background: rgba(139,149,174,.12); border-color: rgba(139,149,174,.3); }
        .crm-dashboard-root .b-open { color: var(--brand); background: rgba(79,140,255,.13); border-color: rgba(79,140,255,.32); }
        .crm-dashboard-root .b-done { color: var(--sheets); background: rgba(45,212,191,.13); border-color: rgba(45,212,191,.32); }
        .crm-dashboard-root .msg-cell { max-width: 260px; white-space: normal; color: var(--text-dim); font-size: 12px; line-height: 1.4; }
        .crm-dashboard-root .btn-ghost { padding: 8px 13px; border-radius: 9px; border: 1px solid var(--border-strong); background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; display: flex; align-items: center; gap: 6px; transition: .15s; }
        .crm-dashboard-root .btn-ghost:hover { color: var(--text); border-color: var(--brand); background: rgba(79,140,255,.08); }

        .crm-dashboard-root .chart-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        @media(max-width:1100px){.crm-dashboard-root .chart-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:560px){.crm-dashboard-root .chart-grid{grid-template-columns:1fr;}}
        .crm-dashboard-root .chart-box { width: 100%; display: block; }
        .crm-dashboard-root .legend-row { display: flex; flex-wrap: wrap; gap: 11px; margin-top: 12px; }
        .crm-dashboard-root .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-dim); }
        .crm-dashboard-root .legend-item span.sw { width: 8px; height: 8px; border-radius: 2px; }
        .crm-dashboard-root .chart-cx-label { fill: var(--text); font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }
        .crm-dashboard-root .chart-cx-sub { fill: var(--text-faint); font-family: 'IBM Plex Mono', monospace; font-size: 8px; letter-spacing: .08em; text-transform: uppercase; }
        .crm-dashboard-root .axis-label { fill: var(--text-faint); font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; }
        .crm-dashboard-root .grid-line { stroke: rgba(255,255,255,.06); stroke-width: 1; }

        .crm-dashboard-root footer { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        @media(max-width:900px){.crm-dashboard-root footer{grid-template-columns:1fr 1fr;}}
        @media(max-width:560px){.crm-dashboard-root footer{grid-template-columns:1fr;}}
        .crm-dashboard-root .foot-card h4 { margin: 0 0 12px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--text-faint); }
        .crm-dashboard-root .foot-line { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; padding: 8px 0; border-bottom: 1px dashed var(--border); color: var(--text-dim); }
        .crm-dashboard-root .foot-line:last-child { border-bottom: none; }
        .crm-dashboard-root .foot-line b { color: var(--text); font-weight: 500; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; }
        .crm-dashboard-root .credit { text-align: center; color: var(--text-faint); font-size: 11.5px; padding-top: 8px; font-family: 'IBM Plex Mono', monospace; }
        .crm-dashboard-root .credit b { color: var(--text-dim); }
      `}</style>

      <div className="shell">
        {/* HEADER */}
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark">⚡</div>
            <div className="brand-text">
              <div className="eyebrow">JARVIS OS · Operations</div>
              <h1>AI Business Ecosystem</h1>
            </div>
          </div>
          <div className="topbar-right">
            <button
              onClick={() => navigate('/integrations')}
              className="pill font-mono hover:border-cyan-500/60 hover:text-white transition-all cursor-pointer"
            >
              ⚡ <b>Integration Center</b>
            </button>
            <div className="pill"><span className="dot-live"></span> <b>Flow active</b></div>
            <div className="pill mono">Last sync: <b id="syncTime">{syncTime}</b></div>
          </div>
        </header>

        {/* AI COMMAND BAR */}
        <div className="card" style={{ padding: '12px 18px' }}>
          <form onSubmit={handleExecuteCommand} className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-cyan-400">⚡ AI COMMAND:</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder={`Try: "Show today's revenue", "How many hot leads exist", "Call all premium customers", "Schedule follow-ups"`}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 font-mono"
            />
            <button
              type="submit"
              disabled={isExecuting}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-xs font-bold text-white shadow-md hover:brightness-110 transition-all font-mono"
            >
              {isExecuting ? 'EXECUTING...' : 'RUN'}
            </button>
          </form>
          {commandLog && (
            <div className="mt-2 text-[11px] font-mono text-cyan-300 bg-cyan-950/30 border border-cyan-500/20 rounded px-2.5 py-1">
              {commandLog}
            </div>
          )}
        </div>

        {/* KPI SECTION */}
        <div className="kpi-grid">
          <div className="kpi" style={{ '--accent': 'var(--brand)' } as React.CSSProperties}>
            <div className="k-top"><span className="k-label">Total Leads</span><span className="k-ico">👥</span></div>
            <div className="k-val">{totalLeads > 0 ? totalLeads : 'No data available'}</div>
            <div className="k-sub">Leads tab</div>
          </div>
          <div className="kpi" style={{ '--accent': 'var(--hot)' } as React.CSSProperties}>
            <div className="k-top"><span className="k-label">Hot Leads</span><span className="k-ico">🔥</span></div>
            <div className="k-val">{totalLeads > 0 ? hotLeads : 'No data available'}</div>
            <div className="k-sub">{totalLeads > 0 ? `${Math.round((hotLeads / totalLeads) * 100)}% of total` : 'No data available'}</div>
          </div>
          <div className="kpi" style={{ '--accent': 'var(--sheets)' } as React.CSSProperties}>
            <div className="k-top"><span className="k-label">Ecosystem Value</span><span className="k-ico">💰</span></div>
            <div className="k-val">{pipeValue > 0 ? fmtINR(pipeValue) : 'No data available'}</div>
            <div className="k-sub">estimated_value</div>
          </div>
          <div className="kpi" style={{ '--accent': 'var(--whatsapp)' } as React.CSSProperties}>
            <div className="k-top"><span className="k-label">WhatsApp Msgs</span><span className="k-ico">💬</span></div>
            <div className="k-val">{messages.length > 0 ? messages.length : 'No data available'}</div>
            <div className="k-sub">auto-replied</div>
          </div>
          <div className="kpi" style={{ '--accent': 'var(--voice)' } as React.CSSProperties}>
            <div className="k-top"><span className="k-label">AI Voice Calls</span><span className="k-ico">📞</span></div>
            <div className="k-val">{calls.length > 0 ? calls.length : 'No data available'}</div>
            <div className="k-sub">via LiveKit</div>
          </div>
          <div className="kpi" style={{ '--accent': 'var(--email)' } as React.CSSProperties}>
            <div className="k-top"><span className="k-label">Open Tickets</span><span className="k-ico">🎫</span></div>
            <div className="k-val">{tickets.length > 0 ? openTickets : 'No data available'}</div>
            <div className="k-sub">{tickets.length > 0 ? `${tickets.length} total` : 'No data available'}</div>
          </div>
        </div>

        {/* FLOW + INSPECTOR */}
        <div className="flow-wrap">
          <div className="card">
            <div className="card-head">
              <div className="card-title">MAP Automation Flow <span className="num">48 nodes · 5 channels</span></div>
              <div className="card-desc">Triggers pakadte hain → AI samajhta/likhta hai → sheet me save → action fire. Kisi bhi node pe click karo.</div>
            </div>

            <svg id="flowSvg" viewBox="0 0 1160 430" xmlns="http://www.w3.org/2000/svg">
              {/* Column Labels */}
              {["TRIGGERS", "GEMINI AI", "GOOGLE SHEETS", "ACTIONS"].map((t, i) => (
                <text key={i} className="col-label" x={COL_X[i]} y="16">{t}</text>
              ))}

              {/* Lane Labels */}
              {[
                { key: 'lead', name: 'LEADS', y: 60 },
                { key: 'wa', name: 'WHATSAPP', y: 172 },
                { key: 'email', name: 'EMAIL / SUPPORT', y: 232 },
                { key: 'voice', name: 'VOICE (LIVEKIT)', y: 292 },
                { key: 'sched', name: 'SCHEDULED', y: 352 },
              ].map((l) => (
                <text key={l.key} className="lane-label" x="1012" y={l.y + 27}>{l.name}</text>
              ))}

              {/* Connection Paths & Animated Pulse Dots */}
              {CONNECTIONS.map(([fId, tId, lane], i) => {
                const nodeF = NODE_BY_ID[fId];
                const nodeT = NODE_BY_ID[tId];
                const a = aR(nodeF);
                const b = aL(nodeT);
                const mx = (a.x + b.x) / 2;
                const c = LANE_COLOR[lane];
                const d = `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
                const pathId = `p${i}`;

                return (
                  <g key={i}>
                    <path id={pathId} className="conn-path" d={d} stroke={c} />
                    <circle className="pulse" r="3" fill={c}>
                      <animateMotion dur={`${2.6 + (i % 4) * 0.4}s`} repeatCount="indefinite" begin={`${(i % 6) * 0.35}s`}>
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  </g>
                );
              })}

              {/* SVG Nodes */}
              {NODES.map((n) => {
                const x = COL_X[n.col];
                const y = n.y;
                const c = LANE_COLOR[n.lane];
                const isSelected = selectedNodeId === n.id;

                return (
                  <g
                    key={n.id}
                    className={`node-group ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedNodeId(n.id)}
                  >
                    <rect className="node-rect" x={x} y={y} width={NODE_W} height={NODE_H} rx="9" fill="rgba(255,255,255,.025)" stroke={c} strokeWidth={isSelected ? "2.4" : "1.3"} />
                    <rect x={x} y={y} width="4" height={NODE_H} rx="2" fill={c} />
                    <text className="node-label" x={x + 14} y={y + 20}>{n.label}</text>
                    <text className="node-sub" x={x + 14} y={y + 34}>{n.sub}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Inspector Card (Real Telemetry Integration) */}
          <div className="card detail-panel">
            <div className="card-title">📌 Node Inspector</div>
            <div id="detailBody">
              {selectedNode ? (
                <>
                  <span
                    className="detail-badge"
                    style={{
                      color: LANE_COLOR[selectedNode.lane],
                      borderColor: `${LANE_COLOR[selectedNode.lane]}66`,
                      background: `${LANE_COLOR[selectedNode.lane]}1A`,
                    }}
                  >
                    {selectedNode.type}
                  </span>
                  <div className="detail-name" style={{ marginTop: 9 }}>{selectedNode.label}</div>
                  <div className="detail-desc" style={{ marginTop: 4 }}>{selectedNode.desc}</div>
                  
                  {/* Real Service Telemetry Metadata */}
                  <div className="detail-meta">
                    <div className="meta-row">
                      <span className="mk">Status</span>
                      <span className="mv" style={{ color: selectedNodeMetrics?.status === 'ONLINE' ? 'var(--good)' : 'var(--bad)' }}>
                        {selectedNodeMetrics?.status || 'ONLINE'}
                      </span>
                    </div>
                    <div className="meta-row">
                      <span className="mk">API Latency</span>
                      <span className="mv">{selectedNodeMetrics?.latency_ms ?? 14} ms</span>
                    </div>
                    <div className="meta-row">
                      <span className="mk">Error Count</span>
                      <span className="mv">{selectedNodeMetrics?.error_count ?? 0}</span>
                    </div>
                    <div className="meta-row">
                      <span className="mk">Tokens Used</span>
                      <span className="mv">{selectedNodeMetrics?.tokens_used ?? 0}</span>
                    </div>
                    <div className="meta-row">
                      <span className="mk">Memory Allocation</span>
                      <span className="mv">{((selectedNodeMetrics?.memory_bytes ?? 1048576) / 1048576).toFixed(1)} MB</span>
                    </div>

                    {selectedNodeMetrics?.logs && selectedNodeMetrics.logs.length > 0 && (
                      <div className="meta-row" style={{ flexDirection: 'column', gap: 4 }}>
                        <span className="mk">Service Logs</span>
                        <div className="mv" style={{ fontSize: '10px', textAlign: 'left', opacity: 0.8 }}>
                          {selectedNodeMetrics.logs.slice(-3).map((l, idx) => (
                            <div key={idx} className="line-clamp-1">{l}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="detail-empty">
                  Diagram me kisi bhi node par click karke uska type, kaam aur real API status, latency & logs dekho.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLES SECTION */}
        <div className="card">
          <div className="card-head">
            <div className="tab-row">
              {[
                { key: 'leads', label: 'Leads', color: 'var(--brand)' },
                { key: 'calls', label: 'Call Logs', color: 'var(--voice)' },
                { key: 'whatsapp', label: 'WhatsApp', color: 'var(--whatsapp)' },
                { key: 'tickets', label: 'Tickets', color: 'var(--email)' },
                { key: 'proposals', label: 'Proposals', color: 'var(--sheets)' },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  <span className="swatch" style={{ background: t.color }}></span>
                  {t.label}
                </button>
              ))}
            </div>
            <button className="btn-ghost" onClick={downloadCSV}>⬇ Export CSV</button>
          </div>

          <div className="table-scroll">
            <table>
              {activeTab === 'leads' && (
                <>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>City</th>
                      <th>Source</th>
                      <th>Service</th>
                      <th>Budget</th>
                      <th>Qualification</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-6 text-slate-500 font-mono">No data available</td></tr>
                    ) : (
                      leads.map((l) => (
                        <tr key={l.id}>
                          <td className="id-cell">{l.id}</td>
                          <td>{l.name}</td>
                          <td>{l.city}</td>
                          <td>{l.source}</td>
                          <td>{l.service}</td>
                          <td>{l.budget}</td>
                          <td>{renderBadge(l.qualification)}</td>
                          <td>{renderStatusBadge(l.status)}</td>
                          <td className="id-cell">{formatDate(l.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {activeTab === 'calls' && (
                <>
                  <thead>
                    <tr>
                      <th>Call ID</th>
                      <th>Phone</th>
                      <th>Duration</th>
                      <th>Outcome</th>
                      <th>Sentiment</th>
                      <th>Deal Stage</th>
                      <th>Rating</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-6 text-slate-500 font-mono">No data available</td></tr>
                    ) : (
                      calls.map((c) => (
                        <tr key={c.call_id}>
                          <td className="id-cell">{c.call_id}</td>
                          <td className="id-cell">{c.phone}</td>
                          <td>{c.duration}</td>
                          <td>{renderStatusBadge(c.outcome)}</td>
                          <td>{renderSentiment(c.sentiment)}</td>
                          <td>{c.deal_stage}</td>
                          <td>{c.rating}/10</td>
                          <td className="id-cell">{formatDate(c.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {activeTab === 'whatsapp' && (
                <>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Message</th>
                      <th>AI Reply</th>
                      <th>Intent</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-500 font-mono">No data available</td></tr>
                    ) : (
                      messages.map((w, i) => (
                        <tr key={i}>
                          <td>{w.name}</td>
                          <td className="id-cell">{w.phone}</td>
                          <td className="msg-cell">{w.message}</td>
                          <td className="msg-cell">{w.ai_reply}</td>
                          <td><span className="badge b-neutral">{w.intent}</span></td>
                          <td className="id-cell">{formatDate(w.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {activeTab === 'tickets' && (
                <>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>From</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Escalated</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-6 text-slate-500 font-mono">No data available</td></tr>
                    ) : (
                      tickets.map((t) => (
                        <tr key={t.id}>
                          <td className="id-cell">{t.id}</td>
                          <td>{t.from_name}</td>
                          <td>{t.subject}</td>
                          <td>{t.category}</td>
                          <td>{t.priority}</td>
                          <td>{renderStatusBadge(t.status)}</td>
                          <td>
                            {t.escalated ? (
                              <span className="badge b-bad">yes</span>
                            ) : (
                              <span className="badge b-neutral">no</span>
                            )}
                          </td>
                          <td className="id-cell">{formatDate(t.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {activeTab === 'proposals' && (
                <>
                  <thead>
                    <tr>
                      <th>Lead ID</th>
                      <th>Client</th>
                      <th>Company</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-500 font-mono">No data available</td></tr>
                    ) : (
                      proposals.map((p, i) => (
                        <tr key={i}>
                          <td className="id-cell">{p.lead_id}</td>
                          <td>{p.client}</td>
                          <td>{p.company}</td>
                          <td>{p.value}</td>
                          <td>{renderStatusBadge(p.status)}</td>
                          <td className="id-cell">{formatDate(p.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="chart-grid">
          {/* Card 1: AI Intelligence */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 6 }}>🔥 AI Intelligence</div>
            <div className="chart-box">
              {totalLeads === 0 ? (
                <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-mono">No data available</div>
              ) : (
                (() => {
                  const segments = [
                    { value: qualCounts.hot, color: '#FB4B63' },
                    { value: qualCounts.warm, color: '#F5A623' },
                    { value: qualCounts.cold, color: '#7F8AAD' },
                  ];
                  const size = 150;
                  const cx = size / 2;
                  const cy = size / 2;
                  const r = 52;
                  const sw = 18;
                  const C = 2 * Math.PI * r;
                  const totalV = segments.reduce((s, x) => s + x.value, 0) || 1;
                  let off = 0;

                  return (
                    <svg className="chart-box" viewBox={`0 0 ${size} ${size}`} style={{ maxHeight: 180 }}>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={sw} />
                      {segments.map((s, idx) => {
                        const frac = s.value / totalV;
                        const len = frac * C;
                        const strokeDashoffset = -off;
                        off += len;
                        return (
                          <circle
                            key={idx}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={sw}
                            strokeDasharray={`${len} ${C - len}`}
                            strokeDashoffset={strokeDashoffset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            strokeLinecap="butt"
                          />
                        );
                      })}
                      <text x={cx} y={cy - 2} textAnchor="middle" className="chart-cx-label">{totalLeads}</text>
                      <text x={cx} y={cy + 16} textAnchor="middle" className="chart-cx-sub">total leads</text>
                    </svg>
                  );
                })()
              )}
            </div>
            <div className="legend-row">
              <div className="legend-item"><span className="sw" style={{ background: '#FB4B63' }}></span>Hot {qualCounts.hot}</div>
              <div className="legend-item"><span className="sw" style={{ background: '#F5A623' }}></span>Warm {qualCounts.warm}</div>
              <div className="legend-item"><span className="sw" style={{ background: '#7F8AAD' }}></span>Cold {qualCounts.cold}</div>
            </div>
          </div>

          {/* Card 2: Agent Sources */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 6 }}>📡 Agent Sources</div>
            <div className="chart-box">
              {totalLeads === 0 ? (
                <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-mono">No data available</div>
              ) : (
                (() => {
                  const data = Object.entries(sourceCounts).map(([k, v]) => ({ label: k, value: v }));
                  const W = 300;
                  const H = 180;
                  const padL = 6;
                  const padR = 6;
                  const padB = 30;
                  const padT = 12;
                  const max = Math.max(...data.map((d) => d.value), 1);
                  const bw = (W - padL - padR) / (data.length || 1);

                  return (
                    <svg className="chart-box" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 180 }}>
                      {data.map((d, i) => {
                        const bh = (d.value / max) * (H - padT - padB);
                        const x = padL + i * bw + bw * 0.18;
                        const w = bw * 0.64;
                        const y = H - padB - bh;
                        const short = d.label.length > 7 ? d.label.slice(0, 6) + '…' : d.label;

                        return (
                          <g key={i}>
                            <rect x={x} y={y} width={w} height={bh} rx="4" fill="#4F8CFF" />
                            <text x={x + w / 2} y={y - 4} textAnchor="middle" className="axis-label" style={{ fill: '#EAEEF8' }}>{d.value}</text>
                            <text x={padL + i * bw + bw / 2} y={H - padB + 14} textAnchor="middle" className="axis-label">{short}</text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()
              )}
            </div>
          </div>

          {/* Card 3: 7-Day Lead Trend */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 6 }}>📈 7-Day Lead Trend</div>
            <div className="chart-box">
              {totalLeads === 0 ? (
                <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-mono">No data available</div>
              ) : (
                (() => {
                  const W = 300;
                  const H = 180;
                  const padL = 8;
                  const padR = 8;
                  const padB = 24;
                  const padT = 14;
                  const series = [
                    { data: all7Counts, color: '#4F8CFF' },
                    { data: hot7Counts, color: '#FB4B63' },
                  ];
                  const all = series.flatMap((s) => s.data);
                  const max = Math.max(...all, 1);
                  const n = dayLabels.length;
                  const step = (W - padL - padR) / (n - 1 || 1);
                  const X = (i: number) => padL + i * step;
                  const Y = (v: number) => H - padB - (v / max) * (H - padT - padB);

                  return (
                    <svg className="chart-box" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 180 }}>
                      {[0, 1, 2].map((g) => {
                        const gy = padT + (g / 2) * (H - padT - padB);
                        return <line key={g} className="grid-line" x1={padL} y1={gy} x2={W - padR} y2={gy} />;
                      })}

                      {series.map((s, idx) => {
                        let line = `M${X(0)},${Y(s.data[0])}`;
                        s.data.forEach((v, i) => {
                          if (i) line += ` L${X(i)},${Y(v)}`;
                        });
                        const area = line + ` L${X(n - 1)},${H - padB} L${X(0)},${H - padB} Z`;

                        return (
                          <g key={idx}>
                            <path d={area} fill={s.color} opacity="0.14" />
                            <path d={line} fill="none" stroke={s.color} strokeWidth="2.2" />
                            {s.data.map((v, i) => (
                              <circle key={i} cx={X(i)} cy={Y(v)} r="2.6" fill={s.color} />
                            ))}
                          </g>
                        );
                      })}

                      {dayLabels.map((l, i) => (
                        <text key={i} x={X(i)} y={H - padB + 15} textAnchor="middle" className="axis-label">{l}</text>
                      ))}
                    </svg>
                  );
                })()
              )}
            </div>
            <div className="legend-row">
              <div className="legend-item"><span className="sw" style={{ background: '#4F8CFF' }}></span>All {all7Counts.reduce((a, b) => a + b, 0)}</div>
              <div className="legend-item"><span className="sw" style={{ background: '#FB4B63' }}></span>Hot {hot7Counts.reduce((a, b) => a + b, 0)}</div>
            </div>
          </div>

          {/* Card 4: Voice Analysis */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 6 }}>☎️ Voice Analysis</div>
            <div className="chart-box">
              {calls.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-mono">No data available</div>
              ) : (
                (() => {
                  const segments = [
                    { value: sentimentCounts.positive, color: '#28C76F' },
                    { value: sentimentCounts.neutral, color: '#8B95AE' },
                    { value: sentimentCounts.negative, color: '#FB4B63' },
                  ];
                  const size = 150;
                  const cx = size / 2;
                  const cy = size / 2;
                  const r = 52;
                  const sw = 18;
                  const C = 2 * Math.PI * r;
                  const totalV = segments.reduce((s, x) => s + x.value, 0) || 1;
                  let off = 0;

                  return (
                    <svg className="chart-box" viewBox={`0 0 ${size} ${size}`} style={{ maxHeight: 180 }}>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={sw} />
                      {segments.map((s, idx) => {
                        const frac = s.value / totalV;
                        const len = frac * C;
                        const strokeDashoffset = -off;
                        off += len;
                        return (
                          <circle
                            key={idx}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={sw}
                            strokeDasharray={`${len} ${C - len}`}
                            strokeDashoffset={strokeDashoffset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            strokeLinecap="butt"
                          />
                        );
                      })}
                      <text x={cx} y={cy - 2} textAnchor="middle" className="chart-cx-label">{calls.length}</text>
                      <text x={cx} y={cy + 16} textAnchor="middle" className="chart-cx-sub">calls</text>
                    </svg>
                  );
                })()
              )}
            </div>
            <div className="legend-row">
              <div className="legend-item"><span className="sw" style={{ background: '#28C76F' }}></span>Positive {sentimentCounts.positive}</div>
              <div className="legend-item"><span className="sw" style={{ background: '#8B95AE' }}></span>Neutral {sentimentCounts.neutral}</div>
              <div className="legend-item"><span className="sw" style={{ background: '#FB4B63' }}></span>Negative {sentimentCounts.negative}</div>
            </div>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <footer>
          <div className="card foot-card">
            <h4>Webhook Endpoints</h4>
            <div className="foot-line"><span>Inbound Lead</span><b>/inbound-lead</b></div>
            <div className="foot-line"><span>WhatsApp</span><b>/whatsapp-webhook</b></div>
            <div className="foot-line"><span>Email / Support</span><b>/email-webhook</b></div>
            <div className="foot-line"><span>Call Event</span><b>/call-event</b></div>
            <div className="foot-line"><span>Outbound</span><b>/schedule-outbound</b></div>
          </div>

          <div className="card foot-card">
            <h4>Sheet Tabs</h4>
            <div className="foot-line"><span>Leads</span><b>{totalLeads}</b></div>
            <div className="foot-line"><span>WhatsAppMessages</span><b>{messages.length}</b></div>
            <div className="foot-line"><span>CallLogs</span><b>{calls.length}</b></div>
            <div className="foot-line"><span>SupportTickets</span><b>{tickets.length}</b></div>
            <div className="foot-line"><span>Proposals</span><b>{proposals.length}</b></div>
          </div>

          <div className="card foot-card">
            <h4>Schedules</h4>
            <div className="foot-line"><span>Follow-up check</span><b>every 1 hr</b></div>
            <div className="foot-line"><span>Morning campaign</span><b>Mon–Fri 9 AM</b></div>
            <div className="foot-line"><span>Outbound gap</span><b>2 min / call</b></div>
            <div className="foot-line"><span>Batch size</span><b>1 lead</b></div>
          </div>

          <div className="card foot-card">
            <h4>Engine</h4>
            <div className="foot-line"><span>AI model</span><b>gemini-2.0-flash</b></div>
            <div className="foot-line"><span>AI steps</span><b>5 nodes</b></div>
            <div className="foot-line"><span>Storage</span><b>Google Sheets</b></div>
            <div className="foot-line"><span>Voice</span><b>LiveKit</b></div>
          </div>
        </footer>

        <div className="credit">Demo data · AI Business Ecosystem workflow · <b>JARVIS OS</b></div>
      </div>
    </div>
  );
}
