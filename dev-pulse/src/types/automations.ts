export interface Automation {
  id: number;
  trigger_platform: string;
  trigger_event: string;
  action_prompt: string;
  enabled: number;
  created_at: string;
}

export interface ParsedAutomation {
  trigger_platform: string;
  trigger_event: string;
  action_prompt: string;
  summary: string;
}

export interface CreateAutomationInput {
  trigger_platform: string;
  trigger_event: string;
  action_prompt: string;
}
