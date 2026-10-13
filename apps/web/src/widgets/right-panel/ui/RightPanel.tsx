import { MissionCard } from '../../../entities/mission'
import { MemoryCard } from '../../../entities/memory'
import { DeviceCard } from '../../../entities/device'

export default function RightPanel() {
  return (
    <aside className="w-full lg:w-80 flex flex-col space-y-6">
      <MissionCard />
      <MemoryCard />
      <DeviceCard />
    </aside>
  )
}
