export interface AutoResponseSettings {
  enabled?: boolean;
  tone?: string;
  language?: string;
  responseGuidelines?: string;
  complianceRequirements?: string;
}

export interface GraderSettings {
  enabled?: boolean;
  qualityGuidelines?: string;
  accuracyGuidelines?: string;
  minimumQualityScore?: number;
  minimumAccuracyScore?: number;
}

export interface PriorityCriteria {
  urgent?: string;
  high?: string;
  normal?: string;
  low?: string;
}

export interface OrganizationSettings {
  autoResponse?: AutoResponseSettings;
  grader?: GraderSettings;
  priorityCriteria?: PriorityCriteria;
  // ... other settings ...
}
