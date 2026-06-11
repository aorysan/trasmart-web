"use client";
import { useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/utils/supabase/client";

const channelId = () => `session-realtime-${Math.random().toString(36).slice(2, 8)}`;

export function useRealtimeSession(
  userId: string | undefined,
  onUpdate?: () => void,
  active = true,
) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<string | null>(null);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!userId || !active) return;

    const name = channelId();
    channelRef.current = name;
    const channel = supabase
      .channel(name)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "machine_sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdateRef.current?.();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, active, supabase]);
}
