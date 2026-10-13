import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthCheckService, ServiceHealthReport } from '../../services/HealthCheckService';
import { connectionManager, ServiceName, ServiceCredentials } from '../../services/ConnectionManager';
import { geminiService } from '../../services/GeminiService';
import { whatsAppService } from '../../services/WhatsAppService';
import { liveKitService } from '../../services/LiveKitService';
import { googleSheetsService } from '../../services/GoogleSheetsService';
import { telegramService } from '../../services/TelegramService';
import { emailService } from '../../services/EmailService';
import { Zap, ShieldCheck, RefreshCw, Unplug, CheckCircle, AlertTriangle, XCircle, ArrowRight, Lock, ArrowLeft, ArrowUp, RotateCw } from 'lucide-react';

export default function IntegrationCenter() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ServiceHealthReport[]>([]);
  const [wizardStep, setWizardStep] = useState<number | null>(null);
  const [testingService, setTestingService] = useState<ServiceName | null>(null);
  const [testOutput, setTestOutput] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Input states for Setup Wizard / Edit Modal
  const [credsInput, setCredsInput] = useState<ServiceCredentials>({});

  useEffect(() => {
    setReports(healthCheckService.getHealthReports());
    setCredsInput(connectionManager.getCredentials());

    const unsubscribe = healthCheckService.subscribe(() => {
      setReports(healthCheckService.getHealthReports());
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await healthCheckService.runAllHealthChecks();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Keyboard Shortcuts: Alt+Left (Back), Alt+Right (Forward), Alt+Up (Up), Ctrl+R / F5 (Refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(1);
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        navigate('/crm');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleTestConnection = async (service: ServiceName) => {
    setTestingService(service);
    setTestOutput(prev => ({ ...prev, [service]: 'Testing connection...' }));

    let res: any;
    switch (service) {
      case 'gemini': res = await geminiService.testConnection(); break;
      case 'whatsapp': res = await whatsAppService.testConnection(); break;
      case 'livekit': res = await liveKitService.testConnection(); break;
      case 'google_sheets': res = await googleSheetsService.testConnection(); break;
      case 'telegram': res = await telegramService.testConnection(); break;
      case 'smtp': res = await emailService.testConnection(); break;
    }

    setTestingService(null);
    await healthCheckService.runHealthCheckForService(service);

    if (res.success) {
      setTestOutput(prev => ({ ...prev, [service]: `✓ ${res.message}` }));
    } else {
      setTestOutput(prev => ({ ...prev, [service]: `❌ ${res.message}: ${res.error || ''}` }));
    }
  };

  const handleSaveCredentials = (updates: Partial<ServiceCredentials>) => {
    connectionManager.saveCredentials(updates);
    setCredsInput(connectionManager.getCredentials());
    healthCheckService.runAllHealthChecks();
  };

  const handleDisconnect = (service: ServiceName) => {
    const empty: Partial<ServiceCredentials> = {};
    if (service === 'gemini') empty.geminiApiKey = '';
    if (service === 'whatsapp') { empty.whatsappAccessToken = ''; empty.whatsappPhoneNumberId = ''; }
    if (service === 'livekit') { empty.livekitUrl = ''; empty.livekitApiKey = ''; }
    if (service === 'google_sheets') empty.googleSheetId = '';
    if (service === 'telegram') { empty.telegramBotToken = ''; empty.telegramChatId = ''; }
    if (service === 'smtp') { empty.smtpHost = ''; empty.smtpUser = ''; }

    handleSaveCredentials(empty);
    setTestOutput(prev => ({ ...prev, [service]: 'Disconnected.' }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Connected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5"><CheckCircle size={10} /> Connected</span>;
      case 'Rate limited':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1.5"><AlertTriangle size={10} /> Rate limited</span>;
      case 'Error':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center gap-1.5"><XCircle size={10} /> Connection failed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 border border-slate-500/30 text-slate-400 flex items-center gap-1.5"><Unplug size={10} /> Not Connected</span>;
    }
  };

  const stepServices: ServiceName[] = ['gemini', 'whatsapp', 'livekit', 'google_sheets', 'telegram', 'smtp'];

  return (
    <div className="w-full h-full p-6 bg-[#080B12] text-[#EAEEF8] overflow-y-auto font-sans select-none">
      {/* WINDOWS FILE EXPLORER NAVIGATION TOOLBAR */}
      <div className="flex items-center gap-1.5 mb-4 p-1.5 bg-[#0F1523] border border-white/10 rounded-xl w-fit shadow-md font-mono select-none">
        <button
          onClick={() => navigate(-1)}
          title="Back (Alt + Left)"
          className="p-2 text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-transparent rounded-lg transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft size={14} />
        </button>

        <button
          onClick={() => navigate(1)}
          title="Forward (Alt + Right)"
          className="p-2 text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-transparent rounded-lg transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <ArrowRight size={14} />
        </button>

        <button
          onClick={() => navigate('/crm')}
          title="Up to Dashboard (Alt + Up)"
          className="p-2 text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-transparent rounded-lg transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <ArrowUp size={14} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          onClick={handleRefresh}
          title="Refresh (Ctrl + R)"
          className="p-2 text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-transparent rounded-lg transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <RotateCw size={14} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
        </button>
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
            <Zap size={14} className="animate-pulse" /> JARVIS OS · Ecosystem Gateway
          </div>
          <h1 className="text-2xl font-bold font-sans text-white tracking-tight mt-1">Integration Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure live credentials, test connection channels, monitor automated 60s health telemetry, and setup API bridges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWizardStep(1)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold font-mono rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <ShieldCheck size={14} /> Launch Setup Wizard
          </button>
          <button
            onClick={() => healthCheckService.runAllHealthChecks()}
            className="px-3.5 py-2 border border-white/10 hover:border-cyan-500/50 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw size={13} className={testingService ? 'animate-spin' : ''} /> Run Health Audit
          </button>
        </div>
      </div>

      {/* SETUP WIZARD MODAL */}
      {wizardStep !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1523] border border-white/15 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center">
                  {wizardStep}
                </span>
                <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider">
                  Step {wizardStep} of 6: Connect {stepServices[wizardStep - 1].toUpperCase()}
                </h2>
              </div>
              <button onClick={() => setWizardStep(null)} className="text-xs text-slate-400 hover:text-white font-mono">
                ✕ Close
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-4 text-xs font-mono">
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <label className="block text-slate-300">GEMINI_API_KEY</label>
                  <input
                    type="password"
                    value={credsInput.geminiApiKey || ''}
                    onChange={(e) => handleSaveCredentials({ geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400">Used for lead analysis, automated replies, and natural language command reasoning.</p>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 mb-1">WHATSAPP_ACCESS_TOKEN</label>
                    <input
                      type="password"
                      value={credsInput.whatsappAccessToken || ''}
                      onChange={(e) => handleSaveCredentials({ whatsappAccessToken: e.target.value })}
                      placeholder="EAAG..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">WHATSAPP_PHONE_NUMBER_ID</label>
                    <input
                      type="text"
                      value={credsInput.whatsappPhoneNumberId || ''}
                      onChange={(e) => handleSaveCredentials({ whatsappPhoneNumberId: e.target.value })}
                      placeholder="104928..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 mb-1">LIVEKIT_URL</label>
                    <input
                      type="text"
                      value={credsInput.livekitUrl || ''}
                      onChange={(e) => handleSaveCredentials({ livekitUrl: e.target.value })}
                      placeholder="wss://livekit.example.com"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">LIVEKIT_API_KEY</label>
                    <input
                      type="text"
                      value={credsInput.livekitApiKey || ''}
                      onChange={(e) => handleSaveCredentials({ livekitApiKey: e.target.value })}
                      placeholder="API..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-3">
                  <label className="block text-slate-300">GOOGLE_SHEET_ID</label>
                  <input
                    type="text"
                    value={credsInput.googleSheetId || ''}
                    onChange={(e) => handleSaveCredentials({ googleSheetId: e.target.value })}
                    placeholder="1BxiMVs0..."
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400">Target Google Sheet ID for sync tables (`Leads`, `CallLogs`, `WhatsAppMessages`, etc.).</p>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 mb-1">TELEGRAM_BOT_TOKEN</label>
                    <input
                      type="password"
                      value={credsInput.telegramBotToken || ''}
                      onChange={(e) => handleSaveCredentials({ telegramBotToken: e.target.value })}
                      placeholder="123456:ABC..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">TELEGRAM_CHAT_ID</label>
                    <input
                      type="text"
                      value={credsInput.telegramChatId || ''}
                      onChange={(e) => handleSaveCredentials({ telegramChatId: e.target.value })}
                      placeholder="-100123456"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 6 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">SMTP_HOST</label>
                      <input
                        type="text"
                        value={credsInput.smtpHost || ''}
                        onChange={(e) => handleSaveCredentials({ smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">SMTP_PORT</label>
                      <input
                        type="text"
                        value={credsInput.smtpPort || ''}
                        onChange={(e) => handleSaveCredentials({ smtpPort: e.target.value })}
                        placeholder="587"
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">SMTP_USER</label>
                    <input
                      type="text"
                      value={credsInput.smtpUser || ''}
                      onChange={(e) => handleSaveCredentials({ smtpUser: e.target.value })}
                      placeholder="support@example.com"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(prev => (prev ? Math.max(1, prev - 1) : 1))}
                className="px-4 py-2 border border-white/10 text-slate-300 text-xs font-mono rounded-lg hover:bg-white/5 disabled:opacity-30"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestConnection(stepServices[wizardStep - 1])}
                  className="px-3.5 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold rounded-lg hover:bg-emerald-600/30"
                >
                  Test Step {wizardStep} Connection
                </button>
                {wizardStep < 6 ? (
                  <button
                    onClick={() => setWizardStep(prev => (prev ? prev + 1 : 1))}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5"
                  >
                    Next <ArrowRight size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => setWizardStep(null)}
                    className="px-5 py-2 bg-emerald-500 text-black text-xs font-mono font-bold rounded-lg shadow-lg hover:brightness-110"
                  >
                    Finish Setup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6 INTEGRATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report) => {
          const maskedKey = connectionManager.getMaskedKey(report.service);
          const currentTestLog = testOutput[report.service];

          return (
            <div key={report.service} className="bg-gradient-to-b from-[#131A2C] to-[#0F1523] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{report.name}</span>
                  {getStatusBadge(report.status)}
                </div>

                <div className="space-y-1.5 text-xs font-mono text-slate-400 mt-3 bg-black/30 border border-white/5 rounded-xl p-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Encrypted Token:</span>
                    <span className="text-slate-300 flex items-center gap-1"><Lock size={10} /> {maskedKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Sync:</span>
                    <span className="text-white">{report.lastSync}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">API Latency:</span>
                    <span className="text-cyan-400">{report.latencyMs > 0 ? `${report.latencyMs} ms` : '—'}</span>
                  </div>
                </div>

                {/* Error Logs */}
                {report.errorLog && report.errorLog.length > 0 && (
                  <div className="mt-3 bg-rose-950/20 border border-rose-500/20 rounded-xl p-2.5 space-y-1 text-[10px] font-mono text-rose-300">
                    <div className="text-rose-400 font-bold uppercase text-[9px]">Error History</div>
                    {report.errorLog.slice(-2).map((err, i) => (
                      <div key={i} className="line-clamp-1 opacity-90">{err}</div>
                    ))}
                  </div>
                )}

                {/* Output Banner */}
                {currentTestLog && (
                  <div className="mt-3 bg-black/50 border border-cyan-500/30 rounded-xl p-2 text-[10px] font-mono text-cyan-300">
                    {currentTestLog}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
                <button
                  onClick={() => handleTestConnection(report.service)}
                  disabled={testingService === report.service}
                  className="flex-1 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-mono font-bold text-[11px] rounded-lg shadow transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw size={11} className={testingService === report.service ? 'animate-spin' : ''} /> Test Connection
                </button>

                {report.status === 'Connected' ? (
                  <button
                    onClick={() => handleDisconnect(report.service)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono text-[11px] rounded-lg transition-all"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => setWizardStep(stepServices.indexOf(report.service) + 1)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-[11px] rounded-lg transition-all"
                  >
                    Configure
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
