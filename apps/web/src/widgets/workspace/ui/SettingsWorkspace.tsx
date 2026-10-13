import { useState, useEffect } from 'react';
import { User, Key, Volume2, LayoutGrid, Cpu, Power, Monitor } from 'lucide-react';
import IdentityPersonalityPanel from '../../settings/ui/IdentityPersonalityPanel';
import ApiKeyManagementPanel from '../../settings/ui/ApiKeyManagementPanel';
import AudioCustomizationPanel from '../../settings/ui/AudioCustomizationPanel';
import DashboardCustomizationPanel from '../../settings/ui/DashboardCustomizationPanel';
import DisplayAppearancePanel from '../../settings/ui/DisplayAppearancePanel';
import AIProviderStatusPanel from './AIProviderStatusPanel';
import WorkspaceStudioPanel from '../../settings/ui/WorkspaceStudioPanel';

export default function SettingsWorkspace() {
  const [activeTab, setActiveTab] = useState<'display' | 'identity' | 'apikeys' | 'audio' | 'dashboard' | 'studio' | 'system'>('display');
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    const checkAutostart = async () => {
      const tauriDetected = typeof window !== 'undefined' && !!(window as any).__TAURI__;
      setIsTauri(tauriDetected);

      if (tauriDetected) {
        try {
          const { isEnabled } = await import('@tauri-apps/plugin-autostart');
          const status = await isEnabled();
          setAutostartEnabled(status);
        } catch (e) {
          console.error('[Settings] Failed to read autostart status:', e);
        }
      }
    };
    checkAutostart();
  }, []);

  const handleToggleAutostart = async () => {
    if (!isTauri) return;
    try {
      const { enable, disable } = await import('@tauri-apps/plugin-autostart');
      if (autostartEnabled) {
        await disable();
        setAutostartEnabled(false);
        console.log('[Settings] Autostart disabled');
      } else {
        await enable();
        setAutostartEnabled(true);
        console.log('[Settings] Autostart enabled');
      }
    } catch (e) {
      console.error('[Settings] Failed to toggle autostart:', e);
    }
  };

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'display', label: 'Display & Appearance', icon: Monitor },
    { id: 'identity', label: 'Identity & Personality', icon: User },
    { id: 'apikeys', label: 'API Keys (Secure)', icon: Key },
    { id: 'audio', label: 'Audio Engine', icon: Volume2 },
    { id: 'dashboard', label: 'Workspace Matrix', icon: LayoutGrid },
    { id: 'studio', label: 'Workspace Studio', icon: LayoutGrid },
    { id: 'system', label: 'System & Startup', icon: Cpu },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-start p-6 font-mono select-none text-white overflow-y-auto hide-scrollbar space-y-6">
      {/* HEADER */}
      <div className="flex flex-col space-y-1 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-black tracking-widest bg-gradient-to-r from-[#00DFFF] via-[#00FFCC] to-[#FF00FF] bg-clip-text text-transparent uppercase">
            JARVIS OS Settings &amp; System Controls
          </h2>
        </div>
        <p className="text-[10px] text-white/50 uppercase tracking-wider">
          Configure Display, Typography, Identity, Secure Provider Keys, Audio Soundscapes, and Workspace Matrix Layout
        </p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md flex items-center space-x-2 border-b border-white/10 py-2.5 overflow-x-auto hide-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-xl border text-[9.5px] font-bold tracking-wider uppercase transition-all flex items-center space-x-2 flex-shrink-0 relative z-20 ${
                isActive
                  ? 'border-[#00DFFF] bg-[#00DFFF]/20 text-white shadow-lg shadow-[#00DFFF]/10'
                  : 'border-white/10 bg-black/60 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-[#00DFFF]' : 'text-white/40'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="max-w-[900px]">
        {activeTab === 'display' && <DisplayAppearancePanel />}
        {activeTab === 'identity' && <IdentityPersonalityPanel />}
        {activeTab === 'apikeys' && <ApiKeyManagementPanel />}
        {activeTab === 'audio' && <AudioCustomizationPanel />}
        {activeTab === 'dashboard' && <DashboardCustomizationPanel />}
        {activeTab === 'studio' && <WorkspaceStudioPanel />}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* Startup Launch Setting */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <Power size={14} className="text-[#00DFFF]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/95">Launch on Startup</h3>
                  </div>
                  <p className="text-[9px] text-white/50 uppercase">
                    Automatically launch JARVIS OS when booting the operating system
                  </p>
                </div>
                {isTauri ? (
                  <button
                    onClick={handleToggleAutostart}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                      autostartEnabled ? 'bg-gradient-to-r from-[#00DFFF] to-[#FF00FF]' : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        autostartEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                ) : (
                  <div className="text-[9px] text-amber-400 font-bold uppercase border border-amber-500/25 bg-amber-500/10 px-3 py-1 rounded">
                    DESKTOP ENVIRONMENT (TAURI)
                  </div>
                )}
              </div>
            </div>

            {/* AI Provider Health & Failover Management Panel */}
            <AIProviderStatusPanel />
          </div>
        )}
      </div>
    </div>
  );
}
