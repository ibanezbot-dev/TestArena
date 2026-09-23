'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Participant } from '@/lib/types';

interface UseLeaderboardOptions {
  examId: string;
  enabled?: boolean;
}

export function useLeaderboard({ examId, enabled = true }: UseLeaderboardOptions) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  const fetchParticipants = useCallback(async () => {
    if (!examId) return;
    
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('exam_id', examId)
      .order('score', { ascending: false });

    if (!error && data) {
      setParticipants(data as Participant[]);
    }
    setLoading(false);
  }, [examId]);

  useEffect(() => {
    if (!enabled || !examId) return;

    fetchParticipants();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`leaderboard:${examId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `exam_id=eq.${examId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants((prev) => [...prev, payload.new as Participant]);
          } else if (payload.eventType === 'UPDATE') {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Participant).id
                  ? (payload.new as Participant)
                  : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setParticipants((prev) =>
              prev.filter((p) => p.id !== (payload.old as Participant).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [examId, enabled, fetchParticipants]);

  return { participants, loading, refetch: fetchParticipants };
}
