"use client";
import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
export function useRealtimeTransactions(
  userId: string | undefined,
  onInsert?: () => void,
) {
  const router = useRouter();
  const supabase = createClient();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onInsertRef = useRef(onInsert);
  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      router.refresh();
      window.dispatchEvent(new Event("trasmart:activity-changed"));
      refreshTimer.current = null;
    }, 10_000);
  }, [router]);
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onInsertRef.current?.();
          scheduleRefresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [userId, supabase, scheduleRefresh]);
}
