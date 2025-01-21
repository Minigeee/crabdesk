'use server';

import { revalidatePath } from 'next/cache';
import { WorkflowService } from '@/lib/services/workflow.service';
import { type Ticket } from '@/lib/types/ticket';
import { type WorkflowConfig } from '@/lib/types/workflow';

// Get organization workflow config from database or environment
async function getOrgConfig(organizationId: string): Promise<Partial<WorkflowConfig>> {
  // TODO: Fetch from database. For now, return default config
  return {
    allowFreeTransitions: true,
    requireAssigneeForProgress: false,
    requireResponseForResolution: false
  };
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: Ticket['status'],
  organizationId: string
) {
  try {
    const config = await getOrgConfig(organizationId);
    const workflowService = await WorkflowService.create(config);
    const result = await workflowService.updateStatus(ticketId, newStatus);
    
    if (result.success) {
      revalidatePath('/tickets');
      revalidatePath(`/tickets/${ticketId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return { 
      success: false, 
      required: ['Failed to update ticket status'],
      recommended: []
    };
  }
}

export async function getStatusMetadata(status: Ticket['status']) {
  try {
    const workflowService = await WorkflowService.create();
    const metadata = workflowService.getStatusMetadata(status);
    return { data: metadata, error: null };
  } catch (error) {
    console.error('Error getting status metadata:', error);
    return { data: null, error: 'Failed to get status metadata' };
  }
}

export async function getAllowedTransitions(
  currentStatus: Ticket['status'],
  organizationId: string
) {
  try {
    const config = await getOrgConfig(organizationId);
    const workflowService = await WorkflowService.create(config);
    const transitions = workflowService.getAllowedTransitions(currentStatus);
    return { data: transitions, error: null };
  } catch (error) {
    console.error('Error getting allowed transitions:', error);
    return { data: null, error: 'Failed to get allowed transitions' };
  }
}

export async function getTicketStatusHistory(ticketId: string) {
  try {
    const workflowService = await WorkflowService.create();
    const history = await workflowService.getStatusHistory(ticketId);
    return { data: history, error: null };
  } catch (error) {
    console.error('Error getting status history:', error);
    return { data: null, error: 'Failed to get status history' };
  }
} 