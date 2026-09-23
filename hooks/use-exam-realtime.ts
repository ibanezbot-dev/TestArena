'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BroadcastPayload } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseExamRealtimeOptions {
  pin: string;
  participantName?: string;
  onBroadcast?: (payload: BroadcastPayload) => void;
  onPresenceSync?: (users: { name: string; id?: string }[]) => void;
  enabled?: boolean;
}

export function useExamRealtime({
  pin,
  participantName,
  onBroadcast,
  onPresenceSync,
  enabled = true,
}: UseExamRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !pin) return;

    const channel = supabase.channel(`exam:${pin}`, {
      config: { presence: { key: participantName || 'anonymous' } },
    });

    // Listen for broadcast events (game control)
    channel.on('broadcast', { event: 'game_event' }, ({ payload }) => {
      onBroadcast?.(payload as BroadcastPayload);
    });

    // Listen for presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.entries(state).map(([key, presences]) => ({
        name: key,
        id: (presences[0] as Record<string, string>)?.participant_id,
      }));
      onPresenceSync?.(users);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        // Track presence if we have a name
        if (participantName) {
          await channel.track({
            name: participantName,
            online_at: new Date().toISOString(),
          });
        }
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [pin, participantName, enabled]);

  const broadcast = useCallback(
    async (payload: BroadcastPayload) => {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'game_event',
          payload,
        });
      }
    },
    []
  );

  return { broadcast, isConnected, channel: channelRef.current };
}
