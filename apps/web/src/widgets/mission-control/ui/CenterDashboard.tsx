import React from 'react';
import { SystemOverview } from './SystemOverview';
import { CurrentMission } from './CurrentMission';
import { ActivityTimeline } from './ActivityTimeline';
import { AgentStatus } from './AgentStatus';
import { SystemHealthWidget } from '../widgets/SystemHealthWidget';
import { ProcessWidget } from '../widgets/ProcessWidget';
import { AgentGraph } from '../components/AgentGraph';
import { VisionPanel } from '../components/VisionPanel';
import {
  MemoryEngineCard,
  MissionAlertsCard,
  AutomationSchedulerCard,
  AgentNetworkCard,
} from '../widgets';

export const CenterDashboard: React.FC = () => {
  return (
    <main className="w-full h-full flex flex-col space-y-4 overflow-y-auto hide-scrollbar select-none px-1">
      {/* 1. Real-Time System Health Intelligence Widget */}
      <SystemHealthWidget />

      {/* 2. System Overview Stat Cards */}
      <SystemOverview />

      {/* 3. Magic UI JARVIS System Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MemoryEngineCard />
        <MissionAlertsCard />
        <AutomationSchedulerCard />
        <AgentNetworkCard />
      </div>

      {/* 4. Live Agent Execution Dependency Graph */}
      <AgentGraph />

      {/* 5. Current Operational Mission Card */}
      <CurrentMission />

      {/* 6. Vision & OCR Screen Intelligence Panel */}
      <VisionPanel />

      {/* 7. Active Kernel Processes */}
      <ProcessWidget />

      {/* 8. Activity Timeline Feed */}
      <ActivityTimeline />

      {/* 9. Agent Coordination Matrix */}
      <AgentStatus />
    </main>
  );
};
