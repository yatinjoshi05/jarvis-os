import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Shell } from '../../pages/dashboard'
import { HomeWorkspace, ModulePlaceholder, ChatWorkspace, CodingWorkspace, FinancialWorkspace, CRMWorkspace, SettingsWorkspace, AgentHubWorkspace, MissionWorkspace, MemoryWorkspace, FilesWorkspace, TerminalWorkspace, BrowserWorkspace } from '../../widgets/workspace'
import { MissionControlPage } from '../../widgets/mission-control'
import IntegrationCenter from '../../pages/IntegrationCenter'
import YTStudioPage from '../../pages/YTStudio'
import InstagramPage from '../../pages/Instagram'
import FacebookPage from '../../pages/Facebook'

import { WorkspaceErrorBoundary } from '../../shared/ui/WorkspaceErrorBoundary'

const router = createHashRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      {
        index: true,
        element: <HomeWorkspace />,
      },
      {
        path: 'home',
        element: <HomeWorkspace />,
      },
      {
        path: 'mission-control',
        element: <MissionControlPage />,
      },
      {
        path: 'chat',
        element: <ChatWorkspace />,
      },
      {
        path: 'missions',
        element: <MissionWorkspace />,
      },
      {
        path: 'memory',
        element: <MemoryWorkspace />,
      },
      {
        path: 'files',
        element: <FilesWorkspace />,
      },
      {
        path: 'terminal',
        element: <TerminalWorkspace />,
      },
      {
        path: 'browser',
        element: <BrowserWorkspace />,
      },
      {
        path: 'coding',
        element: <CodingWorkspace />,
      },
      {
        path: 'trading',
        element: (
          <WorkspaceErrorBoundary fallbackTitle="Trading & Financial Workspace">
            <FinancialWorkspace />
          </WorkspaceErrorBoundary>
        ),
      },
      {
        path: 'crm',
        element: <CRMWorkspace />,
      },
      {
        path: 'integrations',
        element: <IntegrationCenter />,
      },
      {
        path: 'devices',
        element: <ModulePlaceholder moduleName="Devices" />,
      },
      {
        path: 'agent-hub',
        element: <AgentHubWorkspace />,
      },
      {
        path: 'yt-studio',
        element: <YTStudioPage />,
      },
      {
        path: 'instagram',
        element: <InstagramPage />,
      },
      {
        path: 'facebook',
        element: <FacebookPage />,
      },
      {
        path: 'settings',
        element: <SettingsWorkspace />,
      },
      {
        path: '*',
        element: <HomeWorkspace />,
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
