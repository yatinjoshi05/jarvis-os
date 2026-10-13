import type { Mission } from '../model/types'
import { mockBackend } from './mockBackend'

export interface IMissionApi {
  getActiveMission(): Promise<Mission>
  getMissionList(): Promise<Mission[]>
  pauseMission(missionId: string): Promise<boolean>
  resumeMission(missionId: string): Promise<boolean>
  stopMission(missionId: string): Promise<boolean>
  clearActivityTimeline(missionId: string): Promise<boolean>
}

class MissionApi implements IMissionApi {
  public async getActiveMission(): Promise<Mission> {
    return mockBackend.getActiveMission()
  }

  public async getMissionList(): Promise<Mission[]> {
    return mockBackend.getMissionList()
  }

  public async pauseMission(missionId: string): Promise<boolean> {
    return mockBackend.pauseMission(missionId)
  }

  public async resumeMission(missionId: string): Promise<boolean> {
    return mockBackend.resumeMission(missionId)
  }

  public async stopMission(missionId: string): Promise<boolean> {
    return mockBackend.stopMission(missionId)
  }

  public async clearActivityTimeline(missionId: string): Promise<boolean> {
    return mockBackend.clearActivityTimeline(missionId)
  }
}

export const missionApi: IMissionApi = new MissionApi()
