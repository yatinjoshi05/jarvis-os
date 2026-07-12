import { TriggerType } from './types';

/**
 * Defines an automation trigger condition.
 */
export interface AutomationTrigger {
  id: string;
  type: TriggerType;
  expression: string;
}

/**
 * Defines an automation action output block.
 */
export interface AutomationAction {
  id: string;
  module: string;
  payload: Record<string, unknown>;
}
