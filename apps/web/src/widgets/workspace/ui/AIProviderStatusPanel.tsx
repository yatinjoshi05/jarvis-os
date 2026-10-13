import { useEffect, useState } from 'react';
import { 
  Activity, RefreshCw, ArrowUp, ArrowDown, Power, Zap, Server
} from 'lucide-react';
import { aiHealthManager, ProviderHealthMetrics, ProviderStatus, FailoverLogEntry } from '../../../shared/ai/AIProviderHealthManager';

const statusStyles: Record<ProviderStatus, { bg: string; text: string; border: string; label: string }> = {
  ONLINE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'ONLINE' },
  BUSY: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'BUSY' },
  QUOTA_EXCEEDED: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', label: 'QUOTA EXCEEDED' },
  RATE_LIMITED: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', label: 'RATE LIMITED' },
  TIMEOUT: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', label: 'TIMEOUT' },
  OFFLINE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'OFFLINE' },
  DISABLED: { bg: 'bg-white/5', text: 'text-white/40', border: 'border-white/10', label: 'DISABLED' },
};

export default function AIProviderStatusPanel() {
  const [metrics, setMetrics] = useState<Map<string, ProviderHealthMetrics>>(() => aiHealthManager.getAllMetrics());
  const [priorityOrder, setPriorityOrder] = useState<string[]>(() => aiHealthManager.getPriorityOrder());
  const [autoFailover, setAutoFailover] = useState<boolean>(() => aiHealthManager.isAutoFailoverEnabled());
  const [failoverLogs, setFailoverLogs] = useState<FailoverLogEntry[]>(() => aiHealthManager.getFailoverLogs());
  const [recheckingId, setRecheckingId] = useState<string | null>(null);

  useEffect(() => {
    return aiHealthManager.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setPriorityOrder(aiHealthManager.getPriorityOrder());
      setAutoFailover(aiHealthManager.isAutoFailoverEnabled());
      setFailoverLogs(aiHealthManager.getFailoverLogs());
    });
  }, []);

  const handleToggleEnable = (id: string) => {
    const isEnabled = aiHealthManager.isProviderEnabled(id);
    aiHealthManager.setProviderEnabled(id, !isEnabled);
  };

  const handleMoveUp = (id: string) => {
    aiHealthManager.movePriorityUp(id);
  };

  const handleMoveDown = (id: string) => {
    aiHealthManager.movePriorityDown(id);
  };

  const handleToggleAutoFailover = () => {
    aiHealthManager.setAutoFailoverEnabled(!autoFailover);
  };

  const handleRecheck = async (id: string) => {
    setRecheckingId(id);
    await aiHealthManager.recheckProvider(id);
    setRecheckingId(null);
  };

  return (
    <div className="w-full flex flex-col gap-5 select-none font-mono text-white relative z-10">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-[#00DFFF]/10 border border-[#00DFFF]/30 text-[#00DFFF]">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-white/90">
              AI Provider Health & Failover
            </h3>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">
              Real-Time Latency, Quota & Automatic Failover Management
            </p>
          </div>
        </div>

        {/* Auto Failover Toggle */}
        <div className="flex items-center space-x-3 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          <span className="text-[10px] font-bold tracking-wider text-white/70 uppercase">
            AUTO FAILOVER
          </span>
          <button
            onClick={handleToggleAutoFailover}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${
              autoFailover ? 'bg-gradient-to-r from-[#00DFFF] to-[#FF00FF]' : 'bg-white/20'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                autoFailover ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Priority Order & Active Matrix */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-[10px] font-black tracking-widest text-[#00DFFF] uppercase">
            CONFIGURED PRIORITY ORDER
          </span>
          <span className="text-[9px] text-white/40 font-bold uppercase">
            Primary ➔ Fallbacks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {priorityOrder.map((id, index) => {
            const m = metrics.get(id);
            const style = statusStyles[m?.status || 'OFFLINE'];
            const isEnabled = aiHealthManager.isProviderEnabled(id);

            return (
              <div
                key={id}
                className={`flex items-center justify-between p-2.5 rounded-lg border bg-black/30 transition-all ${
                  isEnabled ? style.border : 'border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-[9px] font-black text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                    #{index + 1}
                  </span>
                  <span className="text-[11px] font-bold tracking-wide truncate text-white/90">
                    {aiHealthManager.getProviderName(id)}
                  </span>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleMoveUp(id)}
                    disabled={index === 0}
                    className="p-1 rounded text-white/40 hover:text-white disabled:opacity-20 hover:bg-white/5"
                    title="Move Up Priority"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(id)}
                    disabled={index === priorityOrder.length - 1}
                    className="p-1 rounded text-white/40 hover:text-white disabled:opacity-20 hover:bg-white/5"
                    title="Move Down Priority"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {priorityOrder.map((id) => {
          const m = metrics.get(id);
          if (!m) return null;

          const style = statusStyles[m.status];
          const isEnabled = aiHealthManager.isProviderEnabled(id);
          const isRechecking = recheckingId === id;

          return (
            <div
              key={id}
              className={`flex flex-col justify-between p-4 rounded-xl border bg-black/40 space-y-3 transition-all ${style.border}`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Server size={14} className={style.text} />
                  <span className="text-xs font-black tracking-wider text-white">
                    {m.name}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black border tracking-wider ${style.bg} ${style.text} ${style.border}`}>
                    {style.label}
                  </span>
                  <button
                    onClick={() => handleToggleEnable(id)}
                    className={`p-1 rounded border ${
                      isEnabled ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-white/30 bg-white/5'
                    }`}
                    title={isEnabled ? 'Disable Provider' : 'Enable Provider'}
                  >
                    <Power size={11} />
                  </button>
                </div>
              </div>

              {/* Health Score & Metrics */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/50 font-bold uppercase">Health Score</span>
                  <span className={`font-black ${m.healthScore > 70 ? 'text-emerald-400' : m.healthScore > 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {m.healthScore}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      m.healthScore > 70
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : m.healthScore > 30
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                        : 'bg-gradient-to-r from-rose-500 to-red-500'
                    }`}
                    style={{ width: `${m.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Stats */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[9px]">
                <div className="bg-white/5 rounded p-1.5 border border-white/5">
                  <div className="text-white/40 uppercase">Latency</div>
                  <div className="text-white font-bold mt-0.5">{m.latencyMs}ms</div>
                </div>
                <div className="bg-white/5 rounded p-1.5 border border-white/5">
                  <div className="text-white/40 uppercase">Requests</div>
                  <div className="text-white font-bold mt-0.5">{m.requestCount}</div>
                </div>
                <div className="bg-white/5 rounded p-1.5 border border-white/5">
                  <div className="text-white/40 uppercase">Failures</div>
                  <div className="text-rose-400 font-bold mt-0.5">{m.failureCount}</div>
                </div>
              </div>

              {/* Recheck & Last Error */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[8px] text-white/30 font-medium truncate max-w-[180px]">
                  {m.lastErrorReason ? `Error: ${m.lastErrorReason}` : `Checked: ${new Date(m.lastChecked).toLocaleTimeString()}`}
                </span>
                <button
                  onClick={() => handleRecheck(id)}
                  disabled={isRechecking}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                >
                  <RefreshCw size={9} className={isRechecking ? 'animate-spin' : ''} />
                  <span>{isRechecking ? 'CHECKING' : 'RECHECK'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Failover Activity Log Feed */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2 text-[#FF00FF]">
            <Zap size={12} />
            <span className="text-[10px] font-black tracking-widest uppercase">
              FAILOVER ACTIVITY LOG
            </span>
          </div>
          <span className="text-[8px] text-white/40 font-bold uppercase">
            {failoverLogs.length} Events Logged
          </span>
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto hide-scrollbar">
          {failoverLogs.length === 0 ? (
            <div className="text-[10px] text-white/40 py-2 text-center">
              No failover events recorded. All active providers running normally.
            </div>
          ) : (
            failoverLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 text-[9px]"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-rose-400 font-bold">
                    {log.failedProviderName}
                  </span>
                  <span className="text-white/30 font-bold">({log.reason})</span>
                  <span className="text-white/40">➔</span>
                  <span className="text-emerald-400 font-bold">
                    {log.targetProviderName}
                  </span>
                </div>
                <span className="text-white/30 text-[8px] flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
