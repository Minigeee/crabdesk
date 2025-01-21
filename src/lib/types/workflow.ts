import { type Ticket } from './ticket';

export type WorkflowTransition = {
  from: Ticket['status'];
  to: Ticket['status'];
  validation?: {
    required: WorkflowCondition[]; // Hard requirements (data integrity)
    recommended: WorkflowCondition[]; // Soft guidelines (UI warnings)
  };
  actions?: WorkflowAction[];
};

export type WorkflowCondition = {
  type: 'hasResponse' | 'hasAssignee' | 'hasTeam' | 'hasDueDate' | 'custom';
  check: (ticket: Ticket) => Promise<boolean> | boolean;
  message: string; // Changed from errorMessage to be more neutral
};

export type WorkflowAction = {
  type: 'notify' | 'updateField' | 'createTask' | 'custom';
  execute: (ticket: Ticket) => Promise<void>;
};

export type WorkflowValidationResult = {
  isValid: boolean;
  required: string[]; // Required validation failures (block transition)
  recommended: string[]; // Recommended validation failures (warnings)
};

export type StatusMetadata = {
  label: string;
  description: string;
  color: string;
  icon: string;
  order: number;
};

// New types for organization-specific workflow configuration
export type WorkflowConfig = {
  allowFreeTransitions: boolean; // Allow any status to transition to any other status
  requireAssigneeForProgress: boolean; // Require assignee for in_progress
  requireResponseForResolution: boolean; // Require response for resolved
  autoCloseAfterResolution?: {
    // Auto-close settings
    enabled: boolean;
    hours: number;
  };
  defaultAssigneeTeamId?: string; // Default team for auto-assignment
  allowCustomerToReopen: boolean; // Allow customers to reopen closed tickets
};
