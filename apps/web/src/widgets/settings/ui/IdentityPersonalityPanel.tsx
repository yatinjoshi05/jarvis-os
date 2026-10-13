import React, { useState, useEffect } from 'react';
import { User, Sparkles, Check, Save } from 'lucide-react';
import { identitySettings, UserIdentityState, AIPersonalityState } from '../../../shared/ai/IdentitySettings';

export const IdentityPersonalityPanel: React.FC = () => {
  const [profile, setProfile] = useState(() => identitySettings.getState());
  const [identity, setIdentity] = useState<UserIdentityState>(profile.identity);
  const [personality, setPersonality] = useState<AIPersonalityState>(profile.personality);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = identitySettings.subscribe((updated) => {
      setProfile(updated);
      setIdentity(updated.identity);
      setPersonality(updated.personality);
    });
    return unsub;
  }, []);

  const handleIdentityChange = (field: keyof UserIdentityState, val: string) => {
    const updated = { ...identity, [field]: val };
    setIdentity(updated);
    identitySettings.updateIdentity(updated);
  };

  const handlePersonalityChange = (partial: Partial<AIPersonalityState>) => {
    const updated = { ...personality, ...partial };
    setPersonality(updated);
    identitySettings.updatePersonality(updated);
  };

  const handleSelectPreset = (preset: 'JARVIS' | 'FRIDAY' | 'HERMES') => {
    let updated: AIPersonalityState;
    if (preset === 'JARVIS') {
      updated = {
        personaPreset: 'JARVIS',
        formality: 4,
        verbosity: 3,
        customInstructions: 'Address the user as Commander. Prioritize tactical precision, structured analysis, and clean executable code.',
      };
    } else if (preset === 'FRIDAY') {
      updated = {
        personaPreset: 'FRIDAY',
        formality: 2,
        verbosity: 3,
        customInstructions: 'Adopt an intuitive, conversational tone. Provide direct, pragmatic answers with light wit when appropriate.',
      };
    } else {
      updated = {
        personaPreset: 'HERMES',
        formality: 5,
        verbosity: 1,
        customInstructions: 'Ultra-concise data specialist mode. Eliminate pleasantries. Deliver direct bulleted data and exact code diffs.',
      };
    }
    setPersonality(updated);
    identitySettings.updatePersonality(updated);
  };

  const handleApply = async () => {
    setIsApplying(true);
    setApplyFeedback(null);
    try {
      const ok = await identitySettings.saveToDurableBackend();
      if (ok) {
        setApplyFeedback('✓ IDENTITY PROFILE APPLIED & PERSISTED TO BACKEND');
      } else {
        setApplyFeedback('✓ IDENTITY PROFILE APPLIED LOCALLY');
      }
      setTimeout(() => setApplyFeedback(null), 3000);
    } catch (err: any) {
      setApplyFeedback(`ERROR: ${err?.message || 'SAVE FAILED'}`);
      setTimeout(() => setApplyFeedback(null), 3000);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="w-full bg-black/40 border border-white/10 rounded-xl p-5 space-y-6 font-mono select-none text-left relative z-10">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <User size={16} className="text-[#FF0055]" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Identity & AI Personality Profile
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {applyFeedback && (
            <span className="text-[8.5px] font-bold text-[#00FFCC] border border-[#00FFCC]/30 bg-[#00FFCC]/10 px-2 py-0.5 rounded flex items-center space-x-1 uppercase">
              <Check size={9} />
              <span>{applyFeedback}</span>
            </span>
          )}
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-3 py-1.5 bg-[#FF0055] hover:bg-[#E0004B] text-white rounded-lg text-[9px] font-bold uppercase transition-all flex items-center space-x-1.5 shadow-lg shadow-[#FF0055]/20 disabled:opacity-50"
          >
            <Save size={11} />
            <span>{isApplying ? 'APPLYING...' : 'APPLY PROFILE'}</span>
          </button>
        </div>
      </div>

      {/* USER IDENTITY SECTION */}
      <div className="space-y-3">
        <span className="text-[9px] font-black text-[#FF0055] uppercase tracking-wider">
          [1] USER IDENTITY & DESIGNATION
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-white/50 uppercase">User Name / Title</label>
            <input
              type="text"
              value={identity.userName}
              onChange={(e) => handleIdentityChange('userName', e.target.value)}
              placeholder="e.g. Commander, Alex Mercer..."
              className="w-full bg-black/80 border border-white/15 rounded-lg px-3 py-1.5 text-[10px] text-white font-mono outline-none focus:border-[#FF0055]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-white/50 uppercase">Domain / Specialization</label>
            <input
              type="text"
              value={identity.focusDomain}
              onChange={(e) => handleIdentityChange('focusDomain', e.target.value)}
              placeholder="e.g. Systems Engineer..."
              className="w-full bg-black/80 border border-white/15 rounded-lg px-3 py-1.5 text-[10px] text-white font-mono outline-none focus:border-[#FF0055]"
            />
          </div>
        </div>
      </div>

      {/* AI PERSONALITY SECTION */}
      <div className="space-y-4 pt-2">
        <span className="text-[9px] font-black text-[#00DFFF] uppercase tracking-wider">
          [2] AI PERSONALITY & TONE MATRIX
        </span>

        {/* PRESET SELECTION */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'JARVIS', name: 'J.A.R.V.I.S.', desc: 'Formal, Tactical, Precision-Focused' },
            { id: 'FRIDAY', name: 'F.R.I.D.A.Y.', desc: 'Adaptive, Conversational, Witty' },
            { id: 'HERMES', name: 'H.E.R.M.E.S.', desc: 'Ultra-Concise Data Specialist' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id as any)}
              className={`p-3 rounded-xl border flex flex-col items-start space-y-1 transition-all ${
                personality.personaPreset === p.id
                  ? 'border-[#00DFFF] bg-[#00DFFF]/10 text-white shadow-lg'
                  : 'border-white/10 bg-black/50 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex justify-between w-full items-center">
                <span className="text-[10px] font-black uppercase tracking-wide">{p.name}</span>
                {personality.personaPreset === p.id && (
                  <Sparkles size={10} className="text-[#00DFFF]" />
                )}
              </div>
              <p className="text-[7.5px] leading-tight text-white/50">{p.desc}</p>
            </button>
          ))}
        </div>

        {/* SLIDERS FOR FORMALITY & VERBOSITY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/50 border border-white/5 rounded-xl p-3.5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[8.5px] font-bold uppercase">
              <span className="text-white/70">Formality Level</span>
              <span className="text-[#00DFFF]">{personality.formality} / 5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={personality.formality}
              onChange={(e) => handlePersonalityChange({ formality: Number(e.target.value), personaPreset: 'CUSTOM' })}
              className="w-full accent-[#00DFFF]"
            />
            <div className="flex justify-between text-[7px] text-white/30 uppercase font-mono">
              <span>Casual</span>
              <span>Tactical Protocol</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[8.5px] font-bold uppercase">
              <span className="text-white/70">Response Verbosity</span>
              <span className="text-[#00DFFF]">{personality.verbosity} / 5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={personality.verbosity}
              onChange={(e) => handlePersonalityChange({ verbosity: Number(e.target.value), personaPreset: 'CUSTOM' })}
              className="w-full accent-[#00DFFF]"
            />
            <div className="flex justify-between text-[7px] text-white/30 uppercase font-mono">
              <span>Ultra-Concise</span>
              <span>Exhaustive</span>
            </div>
          </div>
        </div>

        {/* CUSTOM DIRECTIVE INSTRUCTIONS */}
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-white/50 uppercase">
            Custom System Directive Instructions
          </label>
          <textarea
            rows={3}
            value={personality.customInstructions}
            onChange={(e) => handlePersonalityChange({ customInstructions: e.target.value, personaPreset: 'CUSTOM' })}
            placeholder="Specify system directives (e.g. Always structure output into key sections...)"
            className="w-full bg-black/80 border border-white/15 rounded-lg p-2.5 text-[9px] text-white font-mono outline-none focus:border-[#00DFFF]"
          />
        </div>
      </div>
    </div>
  );
};

export default IdentityPersonalityPanel;
