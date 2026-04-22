/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  points: number;
  phone: string;
  address: string;
  avatar: string;
  city: string;
  postal_code: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        //Get current user
        const {
          data: { user },
          error: err,
        } = await supabase.auth.getUser();
        if (err) throw err;

        if (isMounted) {
          setUser(user ?? null);

          if (user?.id) {
            const { data, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (profileError) {
              console.warn("Profile not found:", profileError);
              // Create default
              setUserProfile({
                id: user.id,
                username: "",
                email: user.email || "",
                points: 0,
                fullName: "",
                phone: "",
                address: "",
                avatar: "",
                city: "",
                postal_code: "",
              });
            } else {
              setUserProfile({
                id: user.id,
                username: data?.username || "",
                email: user.email || "",
                points: data?.points ?? 0,
                fullName: data?.full_name || "",
                phone: data?.phone || "",
                address: data?.address || "",
                avatar: data?.avatar_url || "",
                city: data?.city || "",
                postal_code: data?.postal_code || "",
              });
            }
          }

          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Auth error");
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    //setup AuthListener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        // Fetch profile on session changes
        if (session?.user?.id) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (data) {
            setUserProfile({
              id: session.user.id,
              email: session.user.email || "",
              username: data.username || "",
              points: data.points ?? 0,
              fullName: data.full_name || "",
              phone: data.phone || "",
              address: data.address || "",
              avatar: data.avatar_url || "",
              city: data.city || "",
              postal_code: data.postal_code || "",
            });
          }
        } else {
          setUserProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      const { error: err } = await supabase.auth.signOut();
      if (err) throw err;
      setUser(null);
      setUserProfile(null);
      router.push("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out error");
    }
  }, [supabase, router]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<void> => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);

        //update data
        const updateData: any = {};
        if (updates.username !== undefined)
          updateData.username = updates.username;
        if (updates.fullName !== undefined)
          updateData.full_name = updates.fullName;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.address !== undefined) updateData.address = updates.address;
        if (updates.avatar !== undefined)
          updateData.avatar_url = updates.avatar;
        if (updates.city !== undefined) updateData.city = updates.city;
        if (updates.postal_code !== undefined)
          updateData.postal_code = updates.postal_code;

        console.log("Updating profile with data:", updateData);

        const { data, error: err } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id)
          .select();

        if (err) {
          console.error("Update error:", err);
          throw new Error(err.message || "Failed to update profile");
        }

        console.log("Update response:", data);

        //Update local state
        setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Update profile error";
        console.error("updateProfile error:", errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [user?.id, supabase],
  );

  return {
    user,
    userProfile,
    loading,
    error,
    signOut,
    updateProfile,
  };
}
