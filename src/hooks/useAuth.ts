/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

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
  const supabase = useMemo(() => createClient(), []);

  const userRef = useRef<User | null>(null);
  const userProfileRef = useRef<UserProfile | null>(null);
  userRef.current = user;
  userProfileRef.current = userProfile;

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!isMounted) return;

        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        setLoading(false);

        if (sessionUser?.id) {
          void fetchProfile(sessionUser.id)
            .then((profileData) => {
              if (!isMounted) return;

              if (profileData) {
                setUserProfile({
                  id: sessionUser.id,
                  username: profileData.username || "",
                  email: sessionUser.email || "",
                  points: profileData.points ?? 0,
                  fullName: profileData.full_name || "",
                  phone: profileData.phone || "",
                  address: profileData.address || "",
                  avatar: profileData.avatar_url || "",
                  city: profileData.city || "",
                  postal_code: profileData.postal_code || "",
                });
              } else {
                setUserProfile({
                  id: sessionUser.id,
                  username: "",
                  email: sessionUser.email || "",
                  points: 0,
                  fullName: "",
                  phone: "",
                  address: "",
                  avatar: "",
                  city: "",
                  postal_code: "",
                });
              }
              setError(null);
            })
            .catch((err) => {
              if (isMounted) {
                setError(err instanceof Error ? err.message : "Auth error");
              }
            });
        }

        if (isMounted) {
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Auth error");
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setLoading(false);

      if (event === "SIGNED_OUT" || !sessionUser) {
        setUserProfile(null);
        setError(null);
        return;
      }

      if (sessionUser?.id) {
        void fetchProfile(sessionUser.id)
          .then((profileData) => {
            if (!isMounted) return;

            if (profileData) {
              setUserProfile({
                id: sessionUser.id,
                username: profileData.username || "",
                email: sessionUser.email || "",
                points: profileData.points ?? 0,
                fullName: profileData.full_name || "",
                phone: profileData.phone || "",
                address: profileData.address || "",
                avatar: profileData.avatar_url || "",
                city: profileData.city || "",
                postal_code: profileData.postal_code || "",
              });
            } else {
              setUserProfile({
                id: sessionUser.id,
                username: "",
                email: sessionUser.email || "",
                points: 0,
                fullName: "",
                phone: "",
                address: "",
                avatar: "",
                city: "",
                postal_code: "",
              });
            }
            setError(null);
          })
          .catch((err) => {
            if (isMounted) {
              setError(err instanceof Error ? err.message : "Auth error");
            }
          });
      }

      if (isMounted) {
        setError(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      const { error: err } = await supabase.auth.signOut();
      if (err) throw err;
      setUser(null);
      setUserProfile(null);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out error");
    }
  }, [supabase]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<void> => {
      const currentUser = userRef.current;
      if (!currentUser?.id) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);

        const body: Record<string, string> = {};
        if (updates.username !== undefined) body.username = updates.username;
        if (updates.fullName !== undefined) body.full_name = updates.fullName;
        if (updates.phone !== undefined) body.phone = updates.phone;
        if (updates.address !== undefined) body.address = updates.address;
        if (updates.avatar !== undefined) body.avatar_url = updates.avatar;
        if (updates.city !== undefined) body.city = updates.city;
        if (updates.postal_code !== undefined) body.postal_code = updates.postal_code;

        const res = await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to update profile");
        }

        const currentProfile = userProfileRef.current;
        if (currentProfile) {
          setUserProfile({ ...currentProfile, ...updates });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Update profile error";
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      const currentUser = userRef.current;
      if (!currentUser?.email) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error("Password saat ini tidak valid");
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          throw new Error(updateError.message);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Change password error";
        setError(errorMessage);
        throw err;
      }
    },
    [supabase],
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<void> => {
      try {
        setError(null);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
          },
        );
        if (resetError) {
          throw new Error(resetError.message);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Reset password error";
        setError(errorMessage);
        throw err;
      }
    },
    [supabase],
  );

  return {
    user,
    userProfile,
    loading,
    error,
    signOut,
    updateProfile,
    changePassword,
    sendPasswordReset,
  };
}
