export interface ActiveRelay {
  id: string;
  description: string;
  eventFilters: string[];
  metadata: Record<string, string>;
  createdAt: string;
}

export interface WebhookFormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

export interface PlatformContextItem {
  value: string;
  label: string;
  extra?: Record<string, string>;
}

export interface PlatformContextGroup {
  field: string;
  label: string;
  items: PlatformContextItem[];
}

export interface PlatformContext {
  field?: string;
  label?: string;
  items: PlatformContextItem[];
  fields?: PlatformContextGroup[];
}

export interface WebhookConfig {
  formData: WebhookFormField[];
}

export interface CreateRelayInput {
  connectionKey: string;
  platform: string;
  eventFilters?: string[];
  metadata?: Record<string, string>;
}

export interface CreateRelayResponse {
  success: boolean;
  error?: string;
  warning?: string;
}
