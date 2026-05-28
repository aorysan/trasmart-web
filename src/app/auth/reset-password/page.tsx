"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import styles from "./reset-password.module.scss";
import { Eye, EyeOff, Lock, Recycle } from "lucide-react";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checking, setChecking] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  // Verifikasi session valid (dari link reset email)
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth/login?error=Link+reset+tidak+valid+atau+sudah+kedaluwarsa");
        return;
      }
      setChecking(false);
    };

    void checkSession();
  }, [router, supabase]);

  const onSubmit = async (data: ResetForm) => {
    setServerError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateError) {
      setServerError(updateError.message);
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/auth/login"), 3000);
  };

  if (checking) {
    return (
      <div className={styles.main}>
        <div className={styles.card}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Memverifikasi link reset...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Recycle size={48} />
          </div>
          {success ? (
            <>
              <div className={styles.successIcon}>✓</div>
              <h1>Password Berhasil Diubah!</h1>
              <p>
                Kamu akan diarahkan ke halaman login dalam beberapa detik...
              </p>
            </>
          ) : (
            <>
              <h1>Buat Password Baru</h1>
              <p>Masukkan password baru untuk akun kamu.</p>
            </>
          )}
        </div>

        {!success && (
          <>
            {serverError && (
              <div className={styles.errorBox} role="alert">
                ⚠️ {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              {/* Password Baru */}
              <div className={styles.formGroup}>
                <label htmlFor="new-password" className={styles.label}>
                  Password Baru
                </label>
                <div className={styles.passwordWrapper}>
                  <span className={styles.lockIcon}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    {...register("password")}
                    disabled={isSubmitting}
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.fieldError}>{errors.password.message}</span>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div className={styles.formGroup}>
                <label htmlFor="confirm-password" className={styles.label}>
                  Konfirmasi Password Baru
                </label>
                <div className={styles.passwordWrapper}>
                  <span className={styles.lockIcon}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    {...register("confirmPassword")}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowConfirm((p) => !p)}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>

            <div className={styles.backLink}>
              <a href="/auth/login">← Kembali ke Login</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
