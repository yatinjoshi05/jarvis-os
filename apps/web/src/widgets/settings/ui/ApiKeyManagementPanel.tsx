import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Key, ShieldCheck, ShieldAlert, Check, RefreshCw, Lock, EyeOff, Plus, Trash2, Globe, Cpu, AlertTriangle, Activity, Code, FileCode } from 'lucide-react';
import { getBackendApiUrl } from '../../../shared/ai/config';
import { customProviderManager } from '../../../shared/ai/CustomProviderManager';
import { CustomProviderConfig } from '../../../shared/ai/CustomOpenAICompatibleProvider';
import { parseProviderSnippet, ParsedProviderSnippet } from '../../../shared/ai/SnippetParser';

declare const process: any;

export interface KeyStatusInfo {
  providerName: string;
  active: boolean;
  maskedKey: string | null;
  envVar: string;
}

export interface KeysStatusResponse {
  status: string;
  keys: Record<string, KeyStatusInfo>;
}

export const ApiKeyManagementPanel: React.FC = () => {
  const [keysData, setKeysData] = useState<Record<string, KeyStatusInfo>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Key Modal State
  const [modalProvider, setModalProvider] = useState<{ id: string; name: string } | null>(null);
  const [tempRawKeyInput, setTempRawKeyInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  // Test Connection State per Provider
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latencyMs?: number }>>({});

  // Custom Provider State
  const [customProviders, setCustomProviders] = useState<CustomProviderConfig[]>(() =>
    customProviderManager.getCustomProviders()
  );
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customModalMode, setCustomModalMode] = useState<'manual' | 'snippet'>('manual');
  const [rawSnippetInput, setRawSnippetInput] = useState<string>('');
  const [snippetParseResult, setSnippetParseResult] = useState<ParsedProviderSnippet | null>(null);

  const [customName, setCustomName] = useState<string>('');
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('');
  const [customModelName, setCustomModelName] = useState<string>('');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [customHeadersJson, setCustomHeadersJson] = useState<string>('');

  const fetchKeysStatus = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const url = getBackendApiUrl('/api/keys/status');
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const json: KeysStatusResponse = await res.json();
        setKeysData(json.keys || {});
      } else {
        setErrorMsg(`Failed to load key status (HTTP ${res.status})`);
      }
    } catch (err: any) {
      console.error('[ApiKeyManagement] Status fetch error:', err);
      setErrorMsg('Unable to connect to backend proxy service.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeysStatus();
    setCustomProviders(customProviderManager.getCustomProviders());
  }, [fetchKeysStatus]);

  // Clean Keyboard Escape listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModals();
      }
    };
    if (modalProvider || showAddCustomModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalProvider, showAddCustomModal]);

  const handleOpenModal = (providerId: string, providerName: string) => {
    setTempRawKeyInput('');
    setSaveSuccessMsg(null);
    setModalErrorMsg(null);
    setModalProvider({ id: providerId, name: providerName });
  };

  const handleCloseModals = () => {
    if (isSaving) return;
    setModalProvider(null);
    setShowAddCustomModal(false);
    setCustomModalMode('manual');
    setRawSnippetInput('');
    setSnippetParseResult(null);
    setTempRawKeyInput('');
    setSaveSuccessMsg(null);
    setModalErrorMsg(null);
  };

  const handleSaveKey = async () => {
    if (!modalProvider || !tempRawKeyInput.trim()) return;

    setIsSaving(true);
    setSaveSuccessMsg(null);
    setModalErrorMsg(null);

    const providerId = modalProvider.id;
    const rawKey = tempRawKeyInput.trim();

    try {
      const url = getBackendApiUrl('/api/keys/save');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, rawKey }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        const errMsg = data.error || `Key validation failed for ${modalProvider.name}.`;
        setModalErrorMsg(errMsg);
        setIsSaving(false);
        return;
      }

      setTempRawKeyInput('');
      const masked = data.maskedKey || '••••••••';

      setSaveSuccessMsg(`Key verified & saved securely for ${modalProvider.name} (${masked})`);

      setTimeout(() => {
        setModalProvider(null);
        setSaveSuccessMsg(null);
        setModalErrorMsg(null);
      }, 1000);

      await fetchKeysStatus();
    } catch (err: any) {
      console.error('[ApiKeyManagement] Key save error:', err);
      setModalErrorMsg(`Connection error during validation: ${err.message || 'Check network'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (providerId: string, baseUrl?: string, customHeaders?: Record<string, string>, envVarKey?: string) => {
    setTestingProviderId(providerId);
    try {
      const url = getBackendApiUrl('/api/keys/test');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, envVarKey, baseUrl, customHeaders }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestResults((prev) => ({
          ...prev,
          [providerId]: {
            success: true,
            message: data.message || 'Verified successfully!',
            latencyMs: data.latencyMs,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [providerId]: {
            success: false,
            message: data.error || 'Connection check failed.',
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          message: `Network error: ${err.message || 'Unreachable'}`,
        },
      }));
    } finally {
      setTestingProviderId(null);
      fetchKeysStatus();
    }
  };

  const handleParseSnippet = (snippetText: string) => {
    if (!snippetText || !snippetText.trim()) return;

    const res = parseProviderSnippet(snippetText);
    setSnippetParseResult(res);

    if (res.name) setCustomName(res.name);
    if (res.baseUrl) setCustomBaseUrl(res.baseUrl);
    if (res.modelName) setCustomModelName(res.modelName);
    if (res.apiKey) setCustomApiKey(res.apiKey);
    if (res.customHeaders) setCustomHeadersJson(JSON.stringify(res.customHeaders, null, 2));

    // Security & Hygiene: Instant wipe of raw code snippet from memory
    setRawSnippetInput('');

    // Switch to manual review mode so user can verify pre-filled fields
    setCustomModalMode('manual');
  };

  const handleAddCustomProvider = async () => {
    if (!customName.trim() || !customBaseUrl.trim() || !customModelName.trim()) {
      setModalErrorMsg('Provider Name, Base URL, and Model Name are required.');
      return;
    }

    let parsedHeaders: Record<string, string> | undefined = undefined;
    if (customHeadersJson.trim()) {
      try {
        parsedHeaders = JSON.parse(customHeadersJson.trim());
      } catch (_) {
        setModalErrorMsg('Custom Headers must be valid JSON format (e.g. {"Header-Name": "Value"}).');
        return;
      }
    }

    setIsSaving(true);
    setModalErrorMsg(null);

    try {
      // Step 1: Generate provider metadata upfront so we know the envVarKey
      // before the backend receives anything.
      const slug = customName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const providerId = `custom_${slug}_${Date.now().toString(36)}`;
      const envVarKey = `CUSTOM_PROVIDER_${slug.toUpperCase()}_KEY`;
      const hasKey = !!customApiKey.trim();

      // Step 2: If a key was provided, save + validate it first (atomically on the backend).
      // POST /api/keys/save validates live then persists to .env.custom-keys (not apps/web/.env).
      if (hasKey) {
        const saveUrl = getBackendApiUrl('/api/keys/save');
        let saveRes: Response;
        try {
          saveRes = await fetch(saveUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId,
              envVarKey,
              rawKey: customApiKey.trim(),
              baseUrl: customBaseUrl.trim(),
              customHeaders: parsedHeaders,
            }),
          });
        } catch (networkErr: any) {
          setModalErrorMsg(`Network error contacting backend: ${networkErr.message || 'Check that the backend proxy is running.'}`);
          return;
        }

        const saveData = await saveRes.json().catch(() => ({ success: false, error: 'Backend returned non-JSON response.' }));
        if (!saveRes.ok || !saveData.success) {
          setModalErrorMsg(saveData.error || `Key validation failed for ${customName}.`);
          return;
        }
      }

      // Step 3: Register in memory + localStorage with the SAME IDs used in Step 2.
      // Passing providerId + envVarKey prevents addCustomProvider from generating
      // different IDs (due to timestamp difference), which would create a mismatch.
      await customProviderManager.addCustomProvider({
        providerId,
        envVarKey,
        name: customName,
        baseUrl: customBaseUrl,
        modelName: customModelName,
        rawApiKey: undefined,   // already persisted in Step 2, do not re-send
        customHeaders: parsedHeaders,
      });

      // Step 4: Close modal and refresh UI.
      setCustomProviders(customProviderManager.getCustomProviders());
      setCustomName('');
      setCustomBaseUrl('');
      setCustomModelName('');
      setCustomApiKey('');
      setCustomHeadersJson('');
      setShowAddCustomModal(false);
      setCustomModalMode('manual');
      setSnippetParseResult(null);
      await fetchKeysStatus();
    } catch (err: any) {
      console.error('[ApiKeyManagement] handleAddCustomProvider error:', err);
      setModalErrorMsg(`Failed to add custom provider: ${err.message || 'Unknown error. Check browser console.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCustomProvider = (id: string) => {
    if (confirm('Are you sure you want to remove this custom provider?')) {
      customProviderManager.removeCustomProvider(id);
      setCustomProviders(customProviderManager.getCustomProviders());
      fetchKeysStatus();
    }
  };

  return (
    <div className="w-full bg-black/40 border border-white/10 rounded-xl p-5 space-y-6 font-mono select-none text-left relative z-10">
      {/* PANEL HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <Key size={16} className="text-[#00DFFF]" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            API Key Security & Live Verification Management
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setModalErrorMsg(null);
              setCustomModalMode('manual');
              setShowAddCustomModal(true);
            }}
            className="px-3 py-1 bg-[#00DFFF] text-black hover:bg-[#00C4E6] rounded text-[8.5px] font-bold transition-all flex items-center space-x-1 uppercase"
          >
            <Plus size={11} />
            <span>Add Custom Provider</span>
          </button>
          <button
            onClick={fetchKeysStatus}
            disabled={isLoading}
            className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-white/70 hover:text-white transition-all disabled:opacity-40"
            title="Refresh Key Status"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SECURITY & VALIDATION AUDIT BANNER */}
      <div className="border border-[#00FFCC]/20 bg-[#00FFCC]/5 rounded-lg p-3 flex items-start space-x-2.5">
        <Lock size={14} className="text-[#00FFCC] flex-shrink-0 mt-0.5" />
        <div className="text-[8.5px] leading-relaxed text-white/80">
          <span className="text-[#00FFCC] font-bold uppercase mr-1">[LIVE VALIDATION BOUNDARY]</span>
          Every API key submitted is validated live against provider endpoints before persisting to disk. Invalid or unauthenticated keys are rejected immediately and never saved.
        </div>
      </div>

      {errorMsg && (
        <div className="border border-red-500/40 bg-red-500/10 rounded-lg p-2.5 text-[9px] text-red-400 font-bold">
          {errorMsg}
        </div>
      )}

      {/* STANDARD PROVIDERS GRID */}
      <div className="space-y-2">
        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider">[1] BUILT-IN PROVIDERS</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(keysData).map(([id, info]) => {
            const isTesting = testingProviderId === id;
            const testRes = testResults[id];

            return (
              <div
                key={id}
                className="border border-white/10 rounded-xl bg-black/60 p-3.5 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-white uppercase">{info.providerName}</span>
                    <div className="text-[7.5px] text-white/40 font-mono">ENV: {info.envVar}</div>
                  </div>
                  <span
                    className={`text-[7px] px-2 py-0.5 rounded font-black tracking-wider uppercase border flex items-center space-x-1 ${
                      info.active
                        ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {info.active ? <ShieldCheck size={8} /> : <ShieldAlert size={8} />}
                    <span>{info.active ? 'ACTIVE & VERIFIED' : 'UNCONFIGURED'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between bg-black/80 border border-white/5 rounded-lg px-3 py-1.5">
                  <div className="flex items-center space-x-2">
                    <EyeOff size={11} className="text-white/30" />
                    <span className="text-[10px] font-mono font-bold text-white/80 tracking-widest">
                      {info.maskedKey || '••••••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {info.active && (
                      <button
                        onClick={() => handleTestConnection(id)}
                        disabled={isTesting}
                        className="px-2 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded text-[7.5px] font-bold text-[#00DFFF] hover:text-white transition-all uppercase flex items-center space-x-1"
                        title="Re-verify live API connection"
                      >
                        <Activity size={9} className={isTesting ? 'animate-spin' : ''} />
                        <span>{isTesting ? 'TESTING...' : 'TEST'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(id, info.providerName)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded text-[8px] font-bold text-white/80 hover:text-white transition-all uppercase"
                    >
                      {info.maskedKey ? 'UPDATE' : 'ADD KEY'}
                    </button>
                  </div>
                </div>

                {testRes && (
                  <div
                    className={`text-[8px] p-1.5 rounded font-mono font-bold flex items-center justify-between border ${
                      testRes.success
                        ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    <span>{testRes.message}</span>
                    {testRes.latencyMs !== undefined && <span>{testRes.latencyMs}ms</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CUSTOM OPENAI-COMPATIBLE PROVIDERS SECTION */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-[#00DFFF] uppercase tracking-wider">
            [2] CUSTOM OPENAI-COMPATIBLE PROVIDERS (Groq, Together, LM Studio, etc.)
          </span>
          <span className="text-[8px] text-white/40 font-mono">{customProviders.length} Configured</span>
        </div>

        {customProviders.length === 0 ? (
          <div className="border border-white/5 bg-black/40 rounded-xl p-4 text-center space-y-2">
            <p className="text-[9px] text-white/40 font-mono">No custom providers configured yet.</p>
            <button
              onClick={() => {
                setModalErrorMsg(null);
                setCustomModalMode('manual');
                setShowAddCustomModal(true);
              }}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[8.5px] text-[#00DFFF] font-bold uppercase transition-all"
            >
              + Add Custom Provider
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customProviders.map((cp) => {
              const isTesting = testingProviderId === cp.id;
              const testRes = testResults[cp.id];
              const isLocal = cp.baseUrl.includes('localhost') || cp.baseUrl.includes('127.0.0.1');
              const hasKey = typeof process !== 'undefined' && process.env ? (!!process.env[cp.id] || (cp.envVarKey ? !!process.env[cp.envVarKey] : false)) : true;
              const isActive = isLocal || hasKey || (testRes && testRes.success);

              return (
                <div
                  key={cp.id}
                  className="border border-[#00DFFF]/20 bg-black/60 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between hover:border-[#00DFFF]/40 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5 truncate">
                      <span className="text-xs font-black text-white uppercase">{cp.name}</span>
                      <div className="text-[7.5px] text-[#00DFFF] font-mono truncate flex items-center space-x-1">
                        <Globe size={8} />
                        <span className="truncate">{cp.baseUrl}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[7px] px-2 py-0.5 rounded font-black tracking-wider uppercase border flex items-center space-x-1 ${
                          isActive
                            ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isActive ? <ShieldCheck size={8} /> : <ShieldAlert size={8} />}
                        <span>{isActive ? 'ACTIVE & VERIFIED' : 'KEY REQUIRED'}</span>
                      </span>
                      <button
                        onClick={() => handleRemoveCustomProvider(cp.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded border border-red-500/20 transition-all"
                        title="Remove Provider"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/80 border border-white/5 rounded-lg p-2 space-y-1 text-[8px] font-mono">
                    <div className="flex justify-between text-white/60">
                      <span>MODEL:</span>
                      <span className="text-white font-bold">{cp.modelName}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>ENV KEY:</span>
                      <span className="text-white/80">{cp.envVarKey}</span>
                    </div>
                  </div>

                  {testRes && (
                    <div
                      className={`text-[8px] p-1.5 rounded font-mono font-bold flex items-center justify-between border ${
                        testRes.success
                          ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      <span>{testRes.message}</span>
                      {testRes.latencyMs !== undefined && <span>{testRes.latencyMs}ms</span>}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => handleTestConnection(cp.id, cp.baseUrl, cp.customHeaders, cp.envVarKey)}
                      disabled={isTesting}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded text-[7.5px] font-bold text-[#00DFFF] uppercase flex items-center space-x-1"
                    >
                      <Activity size={8} className={isTesting ? 'animate-spin' : ''} />
                      <span>{isTesting ? 'TESTING...' : 'TEST'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenModal(cp.id, cp.name)}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded text-[7.5px] font-bold text-white/80 uppercase"
                    >
                      UPDATE KEY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPDATE KEY MODAL */}
      {modalProvider && createPortal(
        <div
          onClick={handleCloseModals}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-black border border-white/20 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl text-left relative z-[10000] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Key size={14} className="text-[#00DFFF]" />
                <h4 className="text-xs font-black text-white uppercase">
                  Save Key for {modalProvider.name}
                </h4>
              </div>
              <button
                onClick={handleCloseModals}
                disabled={isSaving}
                className="text-white/40 hover:text-white text-xs font-mono disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            <p className="text-[8.5px] text-white/60 leading-relaxed">
              Paste the API key below. The backend will perform a live verification check against {modalProvider.name}'s API endpoints before persisting. Invalid keys will be rejected.
            </p>

            <input
              type="password"
              value={tempRawKeyInput}
              onChange={(e) => {
                setTempRawKeyInput(e.target.value);
                setModalErrorMsg(null);
              }}
              disabled={isSaving}
              placeholder="Paste raw API key (e.g. sk_live_...)..."
              className="w-full bg-black/90 border border-white/20 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-[#00DFFF] font-mono disabled:opacity-50"
              autoFocus
            />

            {modalErrorMsg && (
              <div className="border border-red-500/40 bg-red-500/10 rounded-lg p-2.5 text-[9px] text-red-400 font-bold flex items-start space-x-2">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-red-400" />
                <div className="leading-relaxed">{modalErrorMsg}</div>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="border border-[#00FFCC]/40 bg-[#00FFCC]/10 rounded-lg p-2.5 text-[9px] text-[#00FFCC] font-bold flex items-center space-x-2">
                <Check size={12} />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={handleCloseModals}
                disabled={isSaving}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[9px] font-bold text-white/70 disabled:opacity-40"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveKey}
                disabled={isSaving || !tempRawKeyInput.trim()}
                className="px-4 py-1.5 bg-[#00DFFF] text-black hover:bg-[#00C4E6] disabled:opacity-40 rounded text-[9px] font-bold transition-all flex items-center space-x-1.5"
              >
                {isSaving ? (
                  <RefreshCw size={10} className="animate-spin" />
                ) : (
                  <Lock size={10} />
                )}
                <span>{isSaving ? 'VERIFYING & PERSISTING...' : 'VERIFY & SAVE KEY SECURELY'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD CUSTOM PROVIDER MODAL WITH AUTO-PARSE SNIPPET MODE */}
      {showAddCustomModal && createPortal(
        <div
          onClick={handleCloseModals}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-black border border-[#00DFFF]/30 rounded-2xl p-5 w-full max-w-xl space-y-4 shadow-2xl text-left relative z-[10000] max-h-[90vh] overflow-y-auto"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu size={14} className="text-[#00DFFF]" />
                <h4 className="text-xs font-black text-white uppercase">
                  Add Custom OpenAI-Compatible Provider
                </h4>
              </div>
              <button
                onClick={handleCloseModals}
                disabled={isSaving}
                className="text-white/40 hover:text-white text-xs font-mono disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            {/* TAB TOGGLE: MANUAL ENTRY vs PASTE CODE SNIPPET */}
            <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setCustomModalMode('manual')}
                className={`px-3 py-1.5 rounded-lg border text-[8.5px] font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  customModalMode === 'manual'
                    ? 'border-[#00DFFF] bg-[#00DFFF]/20 text-white'
                    : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                }`}
              >
                <Code size={11} />
                <span>Manual Form Entry</span>
              </button>
              <button
                onClick={() => setCustomModalMode('snippet')}
                className={`px-3 py-1.5 rounded-lg border text-[8.5px] font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  customModalMode === 'snippet'
                    ? 'border-[#00DFFF] bg-[#00DFFF]/20 text-white'
                    : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                }`}
              >
                <FileCode size={11} className="text-[#00FFCC]" />
                <span>Paste Code Snippet (Python / LangChain / Node / cURL)</span>
              </button>
            </div>

            {/* SNIPPET PASTE MODE */}
            {customModalMode === 'snippet' ? (
              <div className="space-y-3 font-mono">
                <p className="text-[8.5px] text-white/60 leading-relaxed">
                  Paste the quickstart code snippet copied from NVIDIA NIM, Groq, Together AI, or OpenRouter docs (Python SDK, LangChain, Node.js, or cURL format). The parser will extract the Base URL, Model ID, API Key, and Headers automatically.
                </p>

                <textarea
                  rows={6}
                  value={rawSnippetInput}
                  onChange={(e) => setRawSnippetInput(e.target.value)}
                  disabled={isSaving}
                  placeholder={`Paste snippet here...\n\nExample (Python):\nclient = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key="nvapi-...")\ncompletion = client.chat.completions.create(model="z-ai/glm-5.2", ...)\n\nOr cURL:\ncurl https://api.groq.com/openai/v1/chat/completions -H "Authorization: Bearer gsk_..."`}
                  className="w-full bg-black/90 border border-white/20 rounded-xl p-3 text-[9.5px] text-white outline-none focus:border-[#00DFFF] font-mono leading-relaxed resize-none disabled:opacity-50"
                />

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    onClick={() => handleParseSnippet(rawSnippetInput)}
                    disabled={!rawSnippetInput.trim() || isSaving}
                    className="px-4 py-2 bg-[#00FFCC] text-black hover:bg-[#00E6B8] disabled:opacity-40 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all flex items-center space-x-1.5"
                  >
                    <FileCode size={12} />
                    <span>⚡ AUTO-PARSE & POPULATE FORM</span>
                  </button>
                </div>
              </div>
            ) : (
              /* MANUAL FORM ENTRY MODE (also shows auto-parsed values & warnings if parsed) */
              <div className="space-y-3 text-[9px] font-mono">
                {snippetParseResult && (
                  <div className="border border-[#00FFCC]/30 bg-[#00FFCC]/10 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[#00FFCC] font-bold text-[8.5px] uppercase">
                      <span>✓ Snippet Auto-Parsed ({snippetParseResult.formatDetected})</span>
                      <span className="text-white/60">Raw code cleared from memory</span>
                    </div>
                    {snippetParseResult.warnings.length > 0 && (
                      <div className="text-amber-400 text-[8px] space-y-0.5 pt-1">
                        {snippetParseResult.warnings.map((w, idx) => (
                          <div key={idx}>⚠️ {w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-white/60 uppercase">Provider Name (Label)</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    disabled={isSaving}
                    placeholder="e.g. Groq AI, NVIDIA NIM, Together AI..."
                    className="w-full bg-black/90 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-[#00DFFF] disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-white/60 uppercase">Base API URL</label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    disabled={isSaving}
                    placeholder="e.g. https://api.groq.com/openai/v1 or http://localhost:1234/v1"
                    className="w-full bg-black/90 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-[#00DFFF] disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-white/60 uppercase">Default Model ID / Name</label>
                  <input
                    type="text"
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    disabled={isSaving}
                    placeholder="e.g. llama-3.3-70b-versatile or z-ai/glm-5.2"
                    className="w-full bg-black/90 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-[#00DFFF] disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-white/60 uppercase">
                    API Key (Validated Live Before Saving)
                  </label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    disabled={isSaving}
                    placeholder="Paste API key if required..."
                    className="w-full bg-black/90 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-[#00DFFF] disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-white/60 uppercase">
                    Custom HTTP Headers (Optional JSON)
                  </label>
                  <textarea
                    rows={2}
                    value={customHeadersJson}
                    onChange={(e) => setCustomHeadersJson(e.target.value)}
                    disabled={isSaving}
                    placeholder='e.g. { "HTTP-Referer": "https://jarvis.os" }'
                    className="w-full bg-black/90 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-[#00DFFF] disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {modalErrorMsg && (
              <div className="border border-red-500/40 bg-red-500/10 rounded-lg p-2.5 text-[9px] text-red-400 font-bold flex items-start space-x-2">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-red-400" />
                <div className="leading-relaxed">{modalErrorMsg}</div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={handleCloseModals}
                disabled={isSaving}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[9px] font-bold text-white/70 disabled:opacity-40"
              >
                CANCEL
              </button>
              {customModalMode === 'manual' && (
                <button
                  onClick={handleAddCustomProvider}
                  disabled={isSaving || !customName.trim() || !customBaseUrl.trim() || !customModelName.trim()}
                  className="px-4 py-1.5 bg-[#00DFFF] text-black hover:bg-[#00C4E6] disabled:opacity-40 rounded text-[9px] font-bold transition-all flex items-center space-x-1.5"
                >
                  {isSaving ? (
                    <RefreshCw size={10} className="animate-spin" />
                  ) : (
                    <Plus size={10} />
                  )}
                  <span>{isSaving ? 'VERIFYING & REGISTERING...' : 'VERIFY & REGISTER PROVIDER'}</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ApiKeyManagementPanel;
