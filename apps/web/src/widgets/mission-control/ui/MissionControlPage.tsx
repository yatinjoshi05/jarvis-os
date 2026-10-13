import React from 'react';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { CenterDashboard } from './CenterDashboard';
import { RightPanel } from './RightPanel';

export const MissionControlPage: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-[#05060C] text-white font-sans overflow-hidden select-none relative">
      {/* Ambient Cyberpunk Radial Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-gradient-to-b from-purple-600/10 via-cyan-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-gradient-to-t from-pink-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <TopBar />

      {/* Main 3-Column Content Layout (Left: 20%, Center: 55%, Right: 25%) */}
      <div className="flex-1 w-full h-full min-h-0 grid grid-cols-[20%_55%_25%] p-4 gap-4 overflow-hidden relative z-10">
        {/* Left Column Panel (20%) */}
        <LeftSidebar />

        {/* Center Dashboard Panel (55%) */}
        <CenterDashboard />

        {/* Right Column Panel (25%) */}
        <RightPanel />
      </div>
    </div>
  );
};
