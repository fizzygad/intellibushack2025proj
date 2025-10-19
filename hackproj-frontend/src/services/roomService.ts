/**
 * Room Service Layer
 * Centralized API for room-related operations with proper error handling and data validation
 */

import { supabase } from '../lib/supabase';
import { logError, getSupabaseErrorMessage } from '../utils/errors';
import { validateRoomCode, sanitizeString } from '../utils/validation';

export interface Room {
  id: string;
  room_code: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

/**
 * Generates a unique 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Creates a new room with proper error handling
 */
export async function createRoom(
  userId: string
): Promise<{ room: Room | null; error: string | null }> {
  try {
    if (!userId) {
      throw new Error('User ID is required to create a room');
    }

    const roomCode = generateRoomCode();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        room_code: roomCode,
        created_by: userId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logError(error, 'createRoom');
      return { room: null, error: getSupabaseErrorMessage(error) };
    }

    if (!data) {
      return { room: null, error: 'Failed to create room' };
    }

    const participantResult = await addRoomParticipant(data.id, userId);
    if (participantResult.error) {
      logError(participantResult.error, 'createRoom - add participant');
    }

    return { room: data, error: null };
  } catch (err) {
    logError(err, 'createRoom');
    return {
      room: null,
      error: err instanceof Error ? err.message : 'Failed to create room',
    };
  }
}

/**
 * Finds an active room by room code
 */
export async function findRoomByCode(
  roomCode: string
): Promise<{ room: Room | null; error: string | null }> {
  try {
    const sanitizedCode = sanitizeString(roomCode).toUpperCase();

    if (!validateRoomCode(sanitizedCode)) {
      return { room: null, error: 'Invalid room code format' };
    }

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', sanitizedCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logError(error, 'findRoomByCode');
      return { room: null, error: getSupabaseErrorMessage(error) };
    }

    if (!data) {
      return { room: null, error: 'Room not found or inactive' };
    }

    return { room: data, error: null };
  } catch (err) {
    logError(err, 'findRoomByCode');
    return {
      room: null,
      error: err instanceof Error ? err.message : 'Failed to find room',
    };
  }
}

/**
 * Adds a participant to a room
 */
export async function addRoomParticipant(
  roomId: string,
  userId: string
): Promise<{ participant: RoomParticipant | null; error: string | null }> {
  try {
    if (!roomId || !userId) {
      throw new Error('Room ID and User ID are required');
    }

    const { data: existing } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { participant: existing, error: null };
    }

    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      logError(error, 'addRoomParticipant');
      return { participant: null, error: getSupabaseErrorMessage(error) };
    }

    return { participant: data, error: null };
  } catch (err) {
    logError(err, 'addRoomParticipant');
    return {
      participant: null,
      error: err instanceof Error ? err.message : 'Failed to join room',
    };
  }
}

/**
 * Removes a participant from a room
 */
export async function removeRoomParticipant(
  roomId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!roomId || !userId) {
      throw new Error('Room ID and User ID are required');
    }

    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) {
      logError(error, 'removeRoomParticipant');
      return { success: false, error: getSupabaseErrorMessage(error) };
    }

    return { success: true, error: null };
  } catch (err) {
    logError(err, 'removeRoomParticipant');
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to leave room',
    };
  }
}

/**
 * Deactivates a room
 */
export async function deactivateRoom(
  roomId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!roomId || !userId) {
      throw new Error('Room ID and User ID are required');
    }

    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId)
      .eq('created_by', userId);

    if (error) {
      logError(error, 'deactivateRoom');
      return { success: false, error: getSupabaseErrorMessage(error) };
    }

    return { success: true, error: null };
  } catch (err) {
    logError(err, 'deactivateRoom');
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to deactivate room',
    };
  }
}
