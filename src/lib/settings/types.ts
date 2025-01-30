export interface AutoResponseSettings {
  enabled?: boolean;
  tone?: string;
  language?: string;
  responseGuidelines?: string;
  complianceRequirements?: string;
}

export interface PriorityCriteria {
  urgent?: string;
  high?: string;
  normal?: string;
  low?: string;
}

export interface OrganizationSettings {
  autoResponse?: AutoResponseSettings;
  priorityCriteria?: PriorityCriteria;
  // ... other settings ...
}
