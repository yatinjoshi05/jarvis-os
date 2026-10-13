import { Instagram } from 'lucide-react';

export default function InstagramPage() {
  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col items-center justify-center bg-[#080B12] text-white p-6 select-none font-sans">
      <div className="flex flex-col items-center text-center space-y-4 max-w-md bg-black/40 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.25)]">
          <Instagram size={32} />
        </div>
        <h1 className="text-2xl font-bold font-sans tracking-tight text-white">Instagram</h1>
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-pink-500/20 text-pink-400 border border-pink-500/40">
          COMING SOON
        </span>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          This workspace is under development. Features will be added in future phases.
        </p>
      </div>
    </div>
  );
}
