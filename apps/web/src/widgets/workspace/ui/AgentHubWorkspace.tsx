import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { Activity, AlertTriangle, Bell, Bot, Boxes, Camera, CirclePause, Code2, Folder, Globe2, KeyRound, Mail, Mic, MoreHorizontal, Play, Plus, RefreshCw, Search, Settings2, Square, TerminalSquare, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { AGENT_HUB_CATEGORIES, agentHubRegistry, type AgentHubCategory, type AgentHubManifest, type AgentHubRecord } from '../../../shared/agents/AgentHubRegistry';
import { agentRuntime } from '../../../shared/agents/AgentRuntime';
import { workspaceStudio } from '../../../shared/workspace/WorkspaceStudio';

const iconFor = (r: AgentHubRecord): LucideIcon => { const v = `${r.name} ${r.category}`.toLowerCase(); if (v.includes('browser')) return Globe2; if (v.includes('code')) return Code2; if (v.includes('vision')) return Camera; if (v.includes('crm')) return Users; if (v.includes('email')) return Mail; if (v.includes('file') || v.includes('document')) return Folder; if (v.includes('terminal')) return TerminalSquare; if (v.includes('finance') || v.includes('trading')) return TrendingUp; if (v.includes('voice')) return Mic; return Bot; };
const colourFor = (r: AgentHubRecord) => r.runtimeState === 'Error' || r.runtimeState === 'Stopped' ? 'text-red-400' : r.category === 'Coding' ? 'text-violet-400' : r.category === 'Finance' ? 'text-emerald-400' : r.category === 'Vision' ? 'text-orange-400' : 'text-cyan-400';
const ago = (v?: string) => !v ? '—' : `${Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 60_000))} min ago`;
const parseManifest = (raw: string): AgentHubManifest => {
  if (!raw || !raw.trim()) throw new Error('JSON input is empty.');
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON format: Unable to parse payload.');
  }

  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid JSON structure: Expected a JSON object.');
  }

  if (!value.name || typeof value.name !== 'string' || !value.name.trim()) {
    throw new Error('Invalid JSON: "name" property is required.');
  }

  const generatedId = typeof value.id === 'string' && value.id.trim()
    ? String(value.id).trim()
    : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

  const description = typeof value.description === 'string' && value.description.trim()
    ? String(value.description).trim()
    : 'Imported n8n workflow';

  const category: AgentHubCategory = AGENT_HUB_CATEGORIES.includes(value.category as AgentHubCategory)
    ? (value.category as AgentHubCategory)
    : 'Custom';

  const nodes = Array.isArray(value.nodes) ? value.nodes : null;

  const capabilities = Array.isArray(value.capabilities)
    ? (value.capabilities.map((v, i) => typeof v === 'string' ? ({ id: `${generatedId}-${i}`, name: v, description: v }) : v).filter(Boolean) as AgentHubManifest['capabilities'])
    : nodes
    ? (nodes.map((n: any, i: number) => ({ id: `${generatedId}-node-${i}`, name: String(n?.name || n?.type || `Node ${i + 1}`), description: `Type: ${n?.type || 'n8n node'}` })))
    : [];

  return {
    id: generatedId,
    name: String(value.name).trim(),
    description,
    category,
    version: String(value.version || '1.0.0'),
    author: String(value.author || 'JARVIS OS'),
    entryPoint: String(value.entryPoint || 'index.js'),
    capabilities,
    permissions: Array.isArray(value.permissions) ? (value.permissions as AgentHubManifest['permissions']) : [],
    dependencies: Array.isArray(value.dependencies) ? value.dependencies.map(String) : [],
    requiredApis: Array.isArray(value.requiredApis) ? value.requiredApis.map(String) : [],
    configuration: {
      ...(value.configuration && typeof value.configuration === 'object' ? (value.configuration as Record<string, unknown>) : {}),
      ...(nodes ? { nodes, connections: value.connections || {}, settings: value.settings || {}, pinData: value.pinData || {} } : {}),
    },
  };
};

export default function AgentHubWorkspace() {
 const records = useSyncExternalStore(agentHubRegistry.subscribe, agentHubRegistry.getRecords, agentHubRegistry.getRecords); const setSelectedId = (id: string | null) => agentHubRegistry.select(id); const [studio, setStudio] = useState(() => workspaceStudio.getState()); const [q, setQ] = useState(''); const [category, setCategory] = useState<'All' | AgentHubCategory>('All'); const [page, setPage] = useState(1); const [tab, setTab] = useState('Overview'); const [text, setText] = useState(''); const [importError, setImportError] = useState(''); const [showAllNotifications, setShowAllNotifications] = useState(false); const [uiMessage, setUiMessage] = useState(''); const file = useRef<HTMLInputElement>(null); const importPanel = useRef<HTMLElement>(null);
 useEffect(() => workspaceStudio.subscribe(() => setStudio(workspaceStudio.getState())), []); useEffect(() => setPage(1), [q, category]);
 const filtered = useMemo(() => records.filter(r => (category === 'All' || r.category === category) && [r.name, r.category, r.description, r.runtimeId, ...r.tags, ...r.capabilities.map(c => c.name)].join(' ').toLowerCase().includes(q.toLowerCase())), [records, q, category]); const totalPages = Math.max(1, Math.ceil(filtered.length / 6)); const cards = filtered.slice((page - 1) * 6, page * 6); const selected = records.find(r => r.selected) ?? records[0]; const notices = agentHubRegistry.getNotifications(); const stats = { total: records.length, running: records.filter(r => ['Running', 'Busy', 'Idle'].includes(r.runtimeState)).length, stopped: records.filter(r => ['Stopped', 'Disabled'].includes(r.runtimeState)).length, errors: records.filter(r => r.runtimeState === 'Error').length, api: records.filter(r => r.apiRequirements.length > 0 && r.runtimeState !== 'Running').length };
 const importAgent = () => { try { const record = agentHubRegistry.installManifest(parseManifest(text)); agentHubRegistry.select(record.id); setText(''); setImportError(''); } catch (e) { setImportError(e instanceof Error ? e.message : 'Invalid JSON'); } };
 return <div className="agent-hub h-full overflow-y-auto bg-[#050505] p-4 font-sans text-white md:p-6" style={{ fontSize: `${studio.fontScale}em` }}>
   <header className="mb-3 flex items-center justify-between border-b border-white/[.06] pb-4"><div className="flex items-center gap-3"><div className="rounded-full bg-violet-500/15 p-2 text-violet-400"><Boxes size={22}/></div><div><h1 className="text-2xl font-bold">Agent Hub</h1><p className="text-[10px] text-white/45">Manage, monitor and control all agents in JARVIS OS</p></div></div><div className="flex items-center gap-5 text-white/55"><Bell size={18}/><Activity size={18}/><Settings2 size={18}/><div className="border-l border-white/[.06] pl-5 text-right text-[10px]"><div>{new Date().toLocaleDateString(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div><strong className="text-sm text-white">{new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</strong></div></div></header>
   <section className="agent-hub-summary-grid rounded-xl border border-white/[.06] bg-[#070707]">{[['Total Agents',stats.total,Boxes,'text-violet-400','All Registered'],['Running',stats.running,Play,'text-emerald-400','Active'],['Stopped',stats.stopped,CirclePause,'text-amber-400','Inactive'],['Error',stats.errors,AlertTriangle,'text-red-400','With Issues'],['Needs API',stats.api,KeyRound,'text-sky-400','Missing Keys']].map(([label,value,Icon,colour,sub],i)=>{const Glyph=Icon as typeof Boxes;return <div key={label as string} className={`flex min-w-0 items-center gap-4 p-5 ${i<4?'border-r border-white/[.06]':''}`}><div className={`rounded-full bg-current/10 p-3 ${colour as string}`}><Glyph size={22}/></div><div><div className="text-[10px] text-white/55">{label as string}</div><div className={`text-2xl font-bold ${colour as string}`}>{value as number}</div><div className="text-[9px] text-white/35">{sub as string}</div></div></div>})}</section>
   <section className="mt-3 grid gap-3" style={{gridTemplateColumns:`minmax(0,1fr) ${studio.inspectorWidth}px`}}><main className="min-w-0 space-y-5"><div className="rounded-xl border border-white/[.06] bg-[#070707] p-3"><div className="flex gap-3"><div className="flex flex-1 items-center rounded-lg border border-white/[.06] bg-black/20 px-3"><Search size={14} className="text-white/40"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search agents..." className="w-full bg-transparent p-2.5 text-[10px] outline-none"/></div><select value={category} onChange={e=>setCategory(e.target.value as 'All'|AgentHubCategory)} className="rounded-lg border border-white/[.06] bg-black/20 px-3 text-[10px] text-white/55"><option value="All">All Categories</option>{AGENT_HUB_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><button onClick={()=>importPanel.current?.scrollIntoView({behavior:'smooth',block:'center'})} className="rounded-lg bg-violet-600 px-4 text-[10px] font-semibold"><Plus className="mr-1 inline" size={13}/>Import Agent</button></div><div className="mt-4 grid grid-cols-3 gap-3">{cards.map(r=><AgentCard key={r.id} record={r} selected={r.id===selected?.id} onClick={()=>{setSelectedId(r.id);setTab('Overview')}}/>)}{page===totalPages&&<button onClick={()=>importPanel.current?.scrollIntoView({behavior:'smooth',block:'center'})} className="min-h-[176px] rounded-lg border border-dashed border-white/25 text-[10px] text-white/50"><Plus className="mb-2 inline" size={16}/><br/><strong>Add New Agent</strong><br/><span className="text-[9px]">Import or create a new agent</span></button>}</div><footer className="mt-3 flex items-center justify-between text-[9px] text-white/35"><span>Showing {filtered.length ? (page-1)*6+1 : 0} to {Math.min(page*6,filtered.length)} of {filtered.length} agents</span><div className="flex gap-3"><button disabled={page===1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length:totalPages},(_,i)=><button key={i} onClick={()=>setPage(i+1)} className={page===i+1?'text-violet-300':''}>{i+1}</button>)}<button disabled={page===totalPages} onClick={()=>setPage(page+1)}>›</button></div></footer></div><section className="grid grid-cols-2 gap-3"><ImportPanel text={text} setText={setText} error={importError} onImport={importAgent} file={file} panelRef={importPanel}/><ApiPanel onAction={setUiMessage}/></section></main><aside className="space-y-3"><Notifications notices={notices} select={id=>{setSelectedId(id);setTab('Overview')}} showAll={showAllNotifications} onToggle={()=>setShowAllNotifications(!showAllNotifications)}/>{selected&&<Inspector record={selected} tab={tab} setTab={setTab}/>}</aside></section>{uiMessage&&<div className="fixed bottom-5 right-5 rounded border border-violet-400/40 bg-[#111111] px-4 py-3 text-[10px] shadow-xl">{uiMessage}<button onClick={()=>setUiMessage('')} className="ml-3 text-white/50">×</button></div>}
 </div>;
}
function AgentCard({ record, selected, onClick }: { record: AgentHubRecord; selected: boolean; onClick: () => void }) {
 const Icon = iconFor(record);
 const colour = colourFor(record);
 const running = ['Running', 'Busy', 'Idle'].includes(record.runtimeState);
 const shownTags = record.tags.slice(0, 5);
 const remaining = record.tags.length - shownTags.length;

 return <button onClick={onClick} className={`flex min-w-0 flex-col rounded-lg border p-3 text-left ${selected ? 'border-violet-400/60 bg-violet-500/5' : 'border-white/10 bg-[#0b1423]'}`}>
   <div className="flex min-w-0 justify-between"><div className="flex min-w-0 gap-2"><div className={`shrink-0 rounded-full bg-current/10 p-2 ${colour}`}><Icon size={18} /></div><div className="min-w-0"><h2 className="truncate text-[11px] font-bold">{record.name}</h2><span className={running ? 'text-emerald-400' : 'text-red-400'}>●</span><span className="ml-1 text-[9px] text-white/65">{record.status}</span></div></div><MoreHorizontal size={14} className="ml-2 shrink-0 text-white/35" /></div>
   <p className="mt-3 text-[9px] leading-4 text-white/45">{record.description}</p>
   <div className="mt-3 flex items-center justify-between text-[9px]"><span className="text-white/45">Progress</span><b>{record.progress}%</b></div>
   <div className="mt-2 h-1 shrink-0 overflow-hidden rounded bg-white/15"><div className="h-full rounded bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${record.progress}%` }} /></div>
   <div className="mt-3 flex flex-wrap gap-1">{shownTags.map(t => <span key={t} className="max-w-full truncate rounded border border-white/10 px-2 text-[8px] leading-[14px] text-white/45">{t}</span>)}{remaining > 0 && <span className="rounded border border-white/10 px-2 text-[8px] leading-[14px] text-white/45">+{remaining}</span>}</div>
   <div className="mt-3 border-t border-white/5 pt-2 text-[8px] text-white/35">{record.category} · {record.runtimeId}</div>
 </button>;
}
function Notifications({notices,select,showAll,onToggle}:{notices:ReturnType<typeof agentHubRegistry.getNotifications>;select:(id:string)=>void;showAll:boolean;onToggle:()=>void}) { return <section className="rounded-xl border border-white/10 bg-[#09111f] p-4"><div className="flex justify-between"><h2 className="text-[12px] font-bold">Agent Notifications</h2><button onClick={onToggle} className="text-[9px] text-violet-300">{showAll?'Show Less':'View All'}</button></div><div className="mt-3 space-y-2 hide-scrollbar overflow-y-auto">{notices.length?notices.slice(0,showAll?notices.length:5).map(n=><button key={n.id} onClick={()=>select(n.agentId)} className="flex w-full gap-2 border-b border-white/5 pb-2 text-left"><AlertTriangle size={14} className={n.severity==='error'?'text-red-400':'text-amber-400'}/><div className="min-w-0 flex-1"><b className="text-[10px]">{n.title}</b><p className="truncate text-[9px] text-white/45">{n.message}</p></div><span className="text-[8px] text-white/35">{ago(n.timestamp)}</span></button>):<p className="text-[9px] text-white/45">No notifications recorded.</p>}</div></section> }
function Inspector({record,tab,setTab}:{record:AgentHubRecord;tab:string;setTab:(v:string)=>void}) { const Icon=iconFor(record); const tabs=['Overview','Config','Logs','Tasks','Metrics','Permissions']; const run=()=>void agentRuntime.start(record.id); return <section className="rounded-xl border border-white/10 bg-[#09111f] p-4"><div className="flex justify-between"><div className="flex gap-2"><div className={`rounded-full bg-current/10 p-2 ${colourFor(record)}`}><Icon size={18}/></div><div><h2 className="text-[12px] font-bold">{record.name}</h2><span className="text-[9px] text-emerald-400">● {record.status}</span></div></div><div className="flex gap-2"><button onClick={run}><Play size={14}/></button><button onClick={()=>void agentRuntime.stop(record.id)}><Square size={13}/></button><button onClick={()=>void agentRuntime.restart(record.id)}><RefreshCw size={14}/></button></div></div><div className="mt-4 flex gap-3 border-b border-white/10 pb-2">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`text-[8px] ${tab===t?'border-b border-violet-400 pb-2 text-violet-300':'text-white/45'}`}>{t}</button>)}</div><div className="mt-4 text-[9px]">{tab==='Overview'&&<><Field label="Description" value={record.description}/><div className="mt-3"><label className="text-white/45">Progress</label><b className="float-right">{record.progress}%</b><div className="mt-2 h-1 rounded bg-white/15"><div className="h-full bg-cyan-400" style={{width:`${record.progress}%`}}/></div></div><div className="mt-4 grid grid-cols-2 gap-3"><Field label="Health" value={`${record.health}%`}/><Field label="Last Run" value={ago(record.lastRun)}/><Field label="Version" value={record.version}/><Field label="Heartbeat" value={ago(record.metrics.heartbeatAt)}/></div><h3 className="mt-4 text-[10px] font-bold">Dependencies</h3><div className="mt-2 flex flex-wrap gap-1">{record.dependencies.map(d=><span key={d} className="rounded bg-white/5 px-2 py-1 text-[8px]">{d}</span>) || 'None'}</div></>}{tab==='Logs'&&<List values={record.logs.map(l=>`${l.level.toUpperCase()} · ${l.message}`)}/>} {tab==='Tasks'&&<List values={record.tasks}/>} {tab==='Metrics'&&<List values={[`Starts: ${record.metrics.starts}`,`Executions: ${record.metrics.executionCount}`,`Failures: ${record.metrics.failureCount}`,`Uptime: ${Math.floor(record.metrics.uptimeMs/1000)}s`]}/>} {tab==='Permissions'&&<List values={record.permissions.map(p=>`${p.type}: ${p.action} ${p.resource}`)}/>} {tab==='Config'&&<pre className="whitespace-pre-wrap rounded bg-black/20 p-2 text-[8px] text-white/65">{JSON.stringify(record.configuration,null,2)}</pre>}</div></section> }
function Field({label,value}:{label:string;value:string}) { return <div><div className="text-[8px] text-white/40">{label}</div><div className="mt-1 text-[9px] text-white/75">{value}</div></div> } function List({values}:{values:string[]}) { return values.length?<div className="space-y-2">{values.map((v,i)=><div key={i} className="rounded bg-black/20 p-2 text-[8px]">{v}</div>)}</div>:<p className="text-white/45">No runtime data yet.</p> }
function ImportPanel({text,setText,error,onImport,file,panelRef}:{text:string;setText:(v:string)=>void;error:string;onImport:()=>void;file:RefObject<HTMLInputElement>;panelRef:RefObject<HTMLElement>}) {
  const [validation,setValidation]=useState('');
  const validate=()=>{try{parseManifest(text);setValidation('JSON manifest is valid.')}catch(e){setValidation(e instanceof Error?e.message:'Invalid JSON')}};
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      try {
        const content = await droppedFile.text();
        setText(content);
        setValidation('');
      } catch (_) {
        setValidation('Failed to read dropped file.');
      }
    }
  };

  return <section ref={panelRef} onDragOver={handleDragOver} onDrop={handleDrop} className="flex min-h-[380px] flex-col rounded-xl border border-white/10 bg-[#09111f] p-4"><h2 className="text-[11px] font-bold">Import Agent (JSON)</h2><p className="mt-1 text-[9px] text-white/40">Paste or drag & drop agent / n8n workflow JSON configuration below</p><input ref={file} type="file" className="hidden" accept=".json" onChange={async e=>{const f=e.target.files?.[0];if(f){setText(await f.text());setValidation('')}}}/><textarea value={text} onChange={e=>{setText(e.target.value);setValidation('')}} placeholder={'{\n  "name": "n8n Workflow",\n  "nodes": [...]\n}'} className="hide-scrollbar mt-3 min-h-0 flex-1 resize-none rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-[9px] outline-none"/>{(error||validation)&&<p className={`mt-2 truncate text-[9px] ${error?'text-red-300':'text-emerald-300'}`}>{error||validation}</p>}<div className="mt-3 flex shrink-0 justify-end gap-2"><button onClick={()=>file.current?.click()} className="rounded border border-white/10 px-3 py-2 text-[9px]">Upload JSON</button><button onClick={validate} className="rounded border border-white/10 px-3 py-2 text-[9px]">Validate JSON</button><button onClick={onImport} className="rounded bg-violet-600 px-4 py-2 text-[9px] font-semibold">Import Agent</button></div></section>;
}
function ApiPanel({onAction}:{onAction:(message:string)=>void}){return <section className="rounded-xl border border-white/10 bg-[#09111f] p-4"><div className="flex justify-between"><div><h2 className="text-[11px] font-bold">API Keys</h2><p className="mt-1 text-[9px] text-white/40">Manage API keys for your agents</p></div><button onClick={()=>onAction('API key management is available in Settings.')} className="text-[9px] text-violet-300">Manage API</button></div><div className="mt-3 space-y-2">{['OpenAI API','Google Gemini API','Anthropic Claude API','ElevenLabs API'].map(k=><button onClick={()=>onAction(`${k} is managed in Settings.`)} key={k} className="flex w-full justify-between rounded border border-white/10 bg-black/15 px-3 py-2 text-[9px]"><span>{k}</span><span className="text-white/35">••••••••••••••••</span><span className="text-emerald-400">Active</span></button>)}</div><button onClick={()=>onAction('Add API key is available in Settings.')} className="mt-4 rounded border border-violet-400/50 px-4 py-2 text-[9px] text-violet-300"><Plus className="mr-1 inline" size={12}/>Add New API Key</button></section>}
