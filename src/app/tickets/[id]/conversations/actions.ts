'use server';

import { revalidatePath } from 'next/cache';
import { ConversationService } from '@/lib/services/conversation.service';
import { type NewConversation, type ConversationUpdate } from '@/lib/types/conversation';

export async function createConversation(ticketId: string, conversation: NewConversation) {
  try {
    const conversationService = await ConversationService.create();
    const result = await conversationService.create({
      ...conversation,
      ticket_id: ticketId
    });
    revalidatePath(`/tickets/${ticketId}`);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { data: null, error: 'Failed to create conversation' };
  }
}

export async function updateConversation(
  ticketId: string,
  conversationId: string,
  updates: ConversationUpdate
) {
  try {
    const conversationService = await ConversationService.create();
    const result = await conversationService.update(conversationId, updates);
    revalidatePath(`/tickets/${ticketId}`);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return { data: null, error: 'Failed to update conversation' };
  }
}

export async function deleteConversation(ticketId: string, conversationId: string) {
  try {
    const conversationService = await ConversationService.create();
    await conversationService.delete(conversationId);
    revalidatePath(`/tickets/${ticketId}`);
    return { error: null };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { error: 'Failed to delete conversation' };
  }
}

export async function getConversation(conversationId: string) {
  try {
    const conversationService = await ConversationService.create();
    const result = await conversationService.getById(conversationId);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { data: null, error: 'Failed to get conversation' };
  }
}

export async function getTicketConversations(ticketId: string) {
  try {
    const conversationService = await ConversationService.create();
    const result = await conversationService.getTicketConversations(ticketId);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error getting ticket conversations:', error);
    return { data: null, error: 'Failed to get ticket conversations' };
  }
} 