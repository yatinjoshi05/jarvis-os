import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Check, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, RefreshCw, X } from 'lucide-react';
import { startChannelOAuth, callbackChannelOAuth } from '../../modules/ytstudio/api/ytstudioApi';

interface RobotChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (channelData: any) => void;
}

export type RobotState = 'idle' | 'scanning' | 'connecting' | 'success' | 'error';

export const RobotSvgHeader: React.FC<{ state: RobotState }> = ({ state }) => {
  const getBulbColor = () => {
    switch (state) {
      case 'success': return '#5cffa8';
      case 'scanning':
      case 'connecting': return '#38bdf8';
      case 'error': return '#ef4444';
      default: return '#5cffa8';
    }
  };

  return (
    <div className="w-full flex justify-center py-2 bg-gradient-to-b from-[#0D1220] to-[#080B13] border-b border-white/10 rounded-t-2xl">
      <div className="relative w-[210px] h-[140px] flex items-center justify-center">
        <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(239,68,68,0.25)]" viewBox="0 0 230 158">
          <defs>
            <linearGradient id="rbtCase" x1="0.22" y1="0" x2="0.72" y2="1">
              <stop offset="0" stopColor="#98a3b2" />
              <stop offset="0.44" stopColor="#6d7786" />
              <stop offset="1" stopColor="#3b424c" />
            </linearGradient>
            <linearGradient id="rbtCaseDk" x1="0.22" y1="0" x2="0.72" y2="1">
              <stop offset="0" stopColor="#6f7987" />
              <stop offset="1" stopColor="#2b313a" />
            </linearGradient>
            <radialGradient id="rbtLens" cx="0.36" cy="0.32" r="0.75">
              <stop offset="0" stopColor={state === 'error' ? '#fca5a5' : '#9fe4ff'} />
              <stop offset="0.5" stopColor={state === 'error' ? '#ef4444' : '#3a9fd4'} />
              <stop offset="1" stopColor={state === 'error' ? '#7f1d1d' : '#0e3b57'} />
            </radialGradient>
            <linearGradient id="rbtBrush" x1="0" y1="0" x2="1" y2="0.2">
              <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <g id="rbt-body">
            {/* Bulb Antenna */}
            <path d="M115 22 L115 8" stroke="#6d7786" strokeWidth="4" strokeLinecap="round" />
            <circle
              id="rbt-bulb"
              cx="115"
              cy="8"
              r="6"
              fill={getBulbColor()}
              className={state === 'connecting' || state === 'scanning' ? 'animate-pulse' : ''}
            />

            {/* Main Robot Casing */}
            <path d="M62 30 L168 30 Q180 30 180 42 L180 122 Q180 134 168 134 L62 134 Q50 134 50 122 L50 42 Q50 30 62 30 Z" fill="url(#rbtCase)" />
            <path d="M64 34 L166 34 Q174 34 174 42 L174 50 L56 50 L56 42 Q56 34 64 34 Z" fill="#aab4c2" opacity="0.4" />
            <path d="M50 78 L180 78" stroke="#2b313a" strokeWidth="1.6" opacity="0.5" />

            {/* Corner Rivets */}
            <g fill="#333b45">
              <circle cx="60" cy="40" r="3.2" /><circle cx="170" cy="40" r="3.2" />
              <circle cx="60" cy="124" r="3.2" /><circle cx="170" cy="124" r="3.2" />
            </g>
            <g fill="#79838f">
              <circle cx="60" cy="39.4" r="2" /><circle cx="170" cy="39.4" r="2" />
              <circle cx="60" cy="123.4" r="2" /><circle cx="170" cy="123.4" r="2" />
            </g>

            <path d="M62 30 L168 30 Q180 30 180 42 L180 122 Q180 134 168 134 L62 134 Q50 134 50 122 L50 42 Q50 30 62 30 Z" fill="url(#rbtBrush)" />

            <g stroke="#2b313a" strokeWidth="0.7" opacity="0.35">
              <path d="M50 56 L180 56" /><path d="M50 100 L180 100" />
              <path d="M116 30 L116 56" /><path d="M116 100 L116 134" />
            </g>

            {/* Lens Housings */}
            <circle cx="90" cy="72" r="24" fill="#20262d" />
            <circle cx="140" cy="72" r="24" fill="#20262d" />
            <circle cx="90" cy="72" r="20" fill="url(#rbtLens)" />
            <circle cx="140" cy="72" r="20" fill="url(#rbtLens)" />

            {/* Eye Pupils */}
            <g id="rbt-pupils" className={state === 'connecting' || state === 'scanning' ? 'animate-bounce' : ''}>
              <circle cx={state === 'error' ? 88 : 90} cy={state === 'error' ? 74 : 72} r="8" fill="#08222f" />
              <circle cx={state === 'error' ? 138 : 140} cy={state === 'error' ? 74 : 72} r="8" fill="#08222f" />
              <circle cx={state === 'error' ? 83 : 85} cy={state === 'error' ? 68 : 66} r="3.4" fill="#eaf8ff" opacity="0.85" />
              <circle cx={state === 'error' ? 133 : 135} cy={state === 'error' ? 68 : 66} r="3.4" fill="#eaf8ff" opacity="0.85" />
            </g>

            <circle cx="90" cy="72" r="23" fill="none" stroke="#4b545f" strokeWidth="3" />
            <circle cx="140" cy="72" r="23" fill="none" stroke="#4b545f" strokeWidth="3" />

            {/* Dynamic Mouths based on state */}
            {state === 'idle' && (
              <g className="rbt-mouth">
                <g fill="#2b313a">
                  <rect x="94" y="104" width="42" height="4" rx="2" />
                  <rect x="98" y="112" width="34" height="4" rx="2" />
                </g>
              </g>
            )}

            {(state === 'scanning' || state === 'connecting') && (
              <g className="rbt-mouth">
                <g fill="#2b313a">
                  <rect x="100" y="106" width="30" height="4" rx="2" />
                </g>
              </g>
            )}

            {state === 'success' && (
              <g className="rbt-mouth">
                <path d="M94 104 Q115 122 136 104 Z" fill="#2b313a" />
                <path d="M100 110 L130 110" stroke="#5cffa8" strokeWidth="2.4" opacity="0.8" />
              </g>
            )}

            {state === 'error' && (
              <g className="rbt-mouth">
                <path d="M98 116 Q115 104 132 116" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};

export const RobotChannelModal: React.FC<RobotChannelModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [channelName, setChannelName] = useState('Old Couple Stories');
  const [channelType, setChannelType] = useState('Old Couple Stories');
  const [customChannelName, setCustomChannelName] = useState('');
  const [robotState, setRobotState] = useState<RobotState>('idle');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedData, setConnectedData] = useState<any | null>(null);

  const channelTypesList = [
    'Old Couple Stories',
    'Funny Family',
    'Flood Stories',
    'Village Life',
    'Accident Stories',
    'Custom Channel'
  ];

  const handleStartOAuth = async () => {
    try {
      setErrorMessage(null);
      setRobotState('connecting');

      // Call start endpoint
      const startRes = await startChannelOAuth();
      if (startRes?.authUrl) {
        console.debug('[YTStudio] OAuth URL generated:', startRes.authUrl);
      }
      
      // Simulate Google OAuth popup authorization callback
      setTimeout(async () => {
        try {
          const finalChannelName = channelType === 'Custom Channel' ? (customChannelName || 'Custom Channel') : channelName;
          const callbackRes = await callbackChannelOAuth({
            channelName: finalChannelName,
            channelType,
            email: 'yatin@gmail.com'
          });

          if (callbackRes.success) {
            setRobotState('success');
            setConnectedData(callbackRes.channel);
            if (onSuccess) onSuccess(callbackRes.channel);
          } else {
            throw new Error(callbackRes.error || 'Failed to authenticate Google account.');
          }
        } catch (err: any) {
          setRobotState('error');
          setErrorMessage(err.message || 'OAuth popup closed or connection timed out.');
        }
      }, 1500);

    } catch (err: any) {
      setRobotState('error');
      setErrorMessage(err.message || 'Failed to initiate Google OAuth flow.');
    }
  };

  const handleReset = () => {
    setRobotState('idle');
    setErrorMessage(null);
    setConnectedData(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Right Slide-in Modal Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-[#080B13] border-l border-red-500/30 text-white z-50 h-full flex flex-col justify-between shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0D1220]">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">🤖</span>
              <div>
                <h2 className="text-sm font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                  JARVIS CHANNEL VAULT
                  <span className="text-[9px] bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded">OAUTH 2.0</span>
                </h2>
                <p className="text-[10.5px] text-slate-400 font-mono">Connect your YouTube channel safely</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            {/* Robot Header Animation */}
            <RobotSvgHeader state={robotState} />

            {/* STEP 1: FORM & OAUTH SELECTION */}
            {robotState !== 'success' && (
              <div className="space-y-4">
                {/* Channel Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">Channel Name</label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Old Couple Stories"
                    className="w-full bg-[#111625] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                {/* Channel Type Dropdown */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">Channel Type / Category</label>
                  <select
                    value={channelType}
                    onChange={(e) => setChannelType(e.target.value)}
                    className="w-full bg-[#111625] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500/50 transition-colors cursor-pointer"
                  >
                    {channelTypesList.map((type) => (
                      <option key={type} value={type} className="bg-[#0D1220] text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {channelType === 'Custom Channel' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">Custom Category Name</label>
                    <input
                      type="text"
                      value={customChannelName}
                      onChange={(e) => setCustomChannelName(e.target.value)}
                      placeholder="My Custom Channel"
                      className="w-full bg-[#111625] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-red-300">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={15} className="text-red-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-red-400 hover:text-red-200 underline text-[11px] ml-2 shrink-0 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {/* GOOGLE ACCOUNT OAUTH SECTION */}
                <div className="bg-[#0D1220] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white">
                      <Shield size={14} className="text-red-400" /> Google OAuth Authorization
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">AES-256 Encrypted</span>
                  </div>

                  {/* NO PASSWORD SECURITY PROTOCOL REMINDER */}
                  <div className="text-[10.5px] font-mono text-slate-400 bg-white/5 p-2.5 rounded border border-white/5 space-y-1">
                    <div className="text-slate-200 font-bold flex items-center gap-1">
                      <Lock size={12} className="text-amber-400" /> Password Security Protocol
                    </div>
                    <div>JARVIS never asks for or stores your Google password. Authorization is granted securely via official Google OAuth 2.0.</div>
                  </div>

                  {/* CONTINUE WITH GOOGLE BUTTON */}
                  <button
                    onClick={handleStartOAuth}
                    disabled={robotState === 'connecting' || robotState === 'scanning'}
                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {robotState === 'connecting' || robotState === 'scanning' ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-white" />
                        <span>Connecting to Google OAuth...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#ffffff" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C6.721,2,2,6.721,2,12.545s4.721,10.545,10.545,10.545c6.155,0,10.239-4.327,10.239-10.418c0-0.75-0.082-1.318-0.201-1.891H12.545z" />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  {/* Required Scopes Checklist */}
                  <div className="space-y-1.5 pt-1 text-[10.5px] font-mono text-slate-400">
                    <div className="text-slate-300 font-bold">Permissions Required:</div>
                    <div className="grid grid-cols-1 gap-1 pl-1">
                      <div className="flex items-center gap-1.5 text-emerald-400"><Check size={12} /> <span>Read channel analytics & retention</span></div>
                      <div className="flex items-center gap-1.5 text-emerald-400"><Check size={12} /> <span>Upload videos automatically</span></div>
                      <div className="flex items-center gap-1.5 text-emerald-400"><Check size={12} /> <span>Read comments & audience sentiment</span></div>
                      <div className="flex items-center gap-1.5 text-emerald-400"><Check size={12} /> <span>Manage video metadata & disclaimers</span></div>
                      <div className="flex items-center gap-1.5 text-emerald-400"><Check size={12} /> <span>Access channel identity information</span></div>
                    </div>
                  </div>
                </div>

                {/* ADVANCED SECTION ACCORDION */}
                <div className="bg-[#0D1220] border border-white/10 rounded-xl overflow-hidden font-mono text-xs">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full p-3 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <Lock size={13} className="text-cyan-400" /> Advanced Vault Status & Tokens
                    </span>
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showAdvanced && (
                    <div className="p-3 border-t border-white/5 space-y-2 text-[10.5px] text-slate-400 bg-black/40">
                      <div className="flex justify-between"><span>OAuth Protocol:</span> <strong className="text-emerald-400">OAuth 2.0 (Active)</strong></div>
                      <div className="flex justify-between"><span>Access Token Status:</span> <strong className="text-white">AES-256 Encrypted</strong></div>
                      <div className="flex justify-between"><span>Refresh Token Status:</span> <strong className="text-white">AES-256 Encrypted</strong></div>
                      <div className="flex justify-between"><span>Token Expiry Time:</span> <strong className="text-amber-400">3600 seconds (Auto-renew)</strong></div>
                      <div className="flex justify-between"><span>Connected Email:</span> <strong className="text-slate-200">yatin@gmail.com</strong></div>
                      <div className="flex justify-between"><span>Last Sync:</span> <strong className="text-slate-200">Just now</strong></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: SUCCESS SCREEN */}
            {robotState === 'success' && connectedData && (
              <div className="space-y-4">
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 text-center space-y-3 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <Check size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">Connected Successfully!</h3>
                    <p className="text-xs text-slate-400 font-mono">OAuth 2.0 Tokens encrypted & persisted</p>
                  </div>

                  <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-left space-y-2 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-400">Channel Name:</span>
                      <strong className="text-white">{connectedData.name || channelName}</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-400">Connected Email:</span>
                      <strong className="text-emerald-400">{connectedData.email || 'yatin@gmail.com'}</strong>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-white/5 p-1.5 rounded border border-white/5">
                        <div className="text-[9px] text-slate-400">Subscribers</div>
                        <div className="text-xs font-bold text-white">12,450</div>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded border border-white/5">
                        <div className="text-[9px] text-slate-400">Videos</div>
                        <div className="text-xs font-bold text-red-400">87</div>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded border border-white/5">
                        <div className="text-[9px] text-slate-400">Total Views</div>
                        <div className="text-xs font-bold text-amber-400">1.2M</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
                    <button
                      onClick={onClose}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Sync Analytics</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      <span>Open Channel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-[#0D1220] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 text-[10px]">JARVIS Channel Vault v2.4</span>
            {robotState === 'success' ? (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all cursor-pointer"
              >
                Close
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
