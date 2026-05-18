"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Check,
  X,
  Camera,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import styles from "./account.module.scss";
import { useUser } from "@/contexts/UserContext";
import type { UserProfile } from "@/hooks/useAuth";
import { createClient } from "@/lib/utils/supabase/client";
import PageTopbar from "@/components/layout/PageTopbar";

export default function AccountRoute() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, loading, error, updateUser, signOut, changePassword } =
    useUser();
  const [pointBalance, setPointBalance] = useState(0);
  const [pointError, setPointError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  // State modal Change Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        city: user.city || "",
        postal_code: user.postal_code || "",
      });
    }
  }, [user]);

  const loadPoints = useCallback(async (signal?: AbortSignal) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      setPointError(null);
      const supabase = createClient();
      await supabase.auth.getSession();
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", uid)
        .maybeSingle();
      if (fetchErr) throw new Error(fetchErr.message);
      if (signal?.aborted) return;
      setPointBalance(data?.points ?? 0);
    } catch (err) {
      if (signal?.aborted) return;
      setPointError(err instanceof Error ? err.message : "Gagal memuat poin");
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const abort = new AbortController();
    let mounted = true;
    let focusTimer: ReturnType<typeof setTimeout> | null = null;

    void loadPoints(abort.signal);

    const handleActivityChanged = () => {
      void loadPoints(abort.signal);
    };
    const handleFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        if (mounted) void loadPoints(abort.signal);
      }, 2000);
    };
    window.addEventListener("trasmart:activity-changed", handleActivityChanged);
    window.addEventListener("focus", handleFocus);
    return () => {
      mounted = false;
      abort.abort();
      if (focusTimer) clearTimeout(focusTimer);
      window.removeEventListener(
        "trasmart:activity-changed",
        handleActivityChanged,
      );
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, loadPoints]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        username: user.username || "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        city: user.city || "",
        postal_code: user.postal_code || "",
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser(formData);
      setIsEditing(false);
      setToast({ type: "success", message: "Profile updated successfully!" });
      setTimeout(() => setToast(null), 4000);
      window.dispatchEvent(new Event("trasmart:activity-changed"));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update profile";
      setToast({ type: "error", message: `Error: ${errorMsg}` });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handlers modal Change Password
  const handleOpenPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    if (isChangingPassword) return;
    setIsPasswordModalOpen(false);
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.currentPassword) {
      setPasswordError("Password saat ini tidak boleh kosong");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok");
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("Password baru harus berbeda dari password lama");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      setPasswordSuccess("✓ Password berhasil diubah!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Gagal mengubah password",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <div className={styles.loadingState}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mainContainer}>
        <div className={styles.errorState}>
          <p>Error loading profile: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.toastMessage}>{toast.message}</span>
          <button
            type="button"
            className={styles.toastClose}
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      )}

      <PageTopbar
        title="My Account"
        description="Kelola informasi profil akun kamu"
        topbarClassName={styles.topbar}
        topbarContentClassName={styles.topbarContent}
        notificationBtnClassName={styles.notificationBtn}
        notificationBadgeClassName={styles.notificationBadge}
      />

      <div className={styles.contentWrapper}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarLarge}>
                <User size={48} strokeWidth={1.5} />
              </div>
              {isEditing && (
                <button
                  className={styles.avatarEditBtn}
                  type="button"
                  aria-label="Change avatar"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className={styles.profileBasic}>
              <h1 className={styles.profileName}>
                {user?.fullName || "Guest"}
              </h1>
              {user?.username && (
                <p className={styles.profileUsername}>@{user.username}</p>
              )}
            </div>
          </div>

          <div className={styles.profileDetails}>
            {!isEditing ? (
              <>
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <User size={20} />
                  </div>
                  <div className={styles.detailContent}>
                    <p className={styles.detailLabel}>User Name</p>
                    <p className={styles.detailValue}>{user?.username}</p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <User size={20} />
                  </div>
                  <div className={styles.detailContent}>
                    <p className={styles.detailLabel}>Nama Lengkap</p>
                    <p className={styles.detailValue}>{user?.fullName}</p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <Mail size={20} />
                  </div>
                  <div className={styles.detailContent}>
                    <p className={styles.detailLabel}>Email</p>
                    <p className={styles.detailValue}>{user?.email}</p>
                    <small style={{ color: "#999" }}>
                      Email cannot be changed here
                    </small>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <Phone size={20} />
                  </div>
                  <div className={styles.detailContent}>
                    <p className={styles.detailLabel}>Nomor Telepon</p>
                    <p className={styles.detailValue}>{user?.phone}</p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <MapPin size={20} />
                  </div>
                  <div className={styles.detailContent}>
                    <p className={styles.detailLabel}>Alamat</p>
                    <p className={styles.detailValue}>{user?.address}</p>
                  </div>
                </div>
                {user?.city && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <MapPin size={20} />
                    </div>
                    <div className={styles.detailContent}>
                      <p className={styles.detailLabel}>Kota</p>
                      <p className={styles.detailValue}>{user.city}</p>
                    </div>
                  </div>
                )}
                {user?.postal_code && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <MapPin size={20} />
                    </div>
                    <div className={styles.detailContent}>
                      <p className={styles.detailLabel}>Kode Pos</p>
                      <p className={styles.detailValue}>{user.postal_code}</p>
                    </div>
                  </div>
                )}
                <button className={styles.editBtn} onClick={handleEdit}>
                  <Edit size={18} />
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.label}>
                    User Name
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    className={styles.input}
                    value={formData.username || ""}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName" className={styles.label}>
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className={styles.input}
                    value={formData.fullName || ""}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={user?.email}
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                  <small style={{ color: "#999" }}>
                    Email cannot be changed
                  </small>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Nomor Telepon
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={styles.input}
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="address" className={styles.label}>
                    Alamat
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className={styles.input}
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    Kota
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className={styles.input}
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postal_code" className={styles.label}>
                    Kode Pos
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    className={styles.input}
                    value={formData.postal_code || ""}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Check size={18} />
                    {isSaving ? "Saving..." : "Simpan Perubahan"}
                  </button>
                  <button
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X size={18} />
                    Batal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.pointsCard}>
            <p className={styles.pointsCaption}>Saldo Poin Aktif</p>
            <div className={styles.pointsValueWrap}>
              <span className={styles.pointsValue}>{pointBalance}</span>
              <span className={styles.pointsUnit}>Pts</span>
            </div>
            {pointError && <p className={styles.pointsError}>{pointError}</p>}
          </div>

          <div className={styles.actionsCard}>
            <h3 className={styles.actionsTitle}>Quick Actions</h3>
            <button
              className={styles.actionBtn}
              onClick={handleOpenPasswordModal}
            >
              Ubah Password
            </button>
            <button
              className={styles.actionBtn + " " + styles.dangerBtn}
              onClick={signOut}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Modal Ubah Password */}
      {isPasswordModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={handleClosePasswordModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-password-title"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2 id="modal-password-title" className={styles.modalTitle}>
                Ubah Password
              </h2>
              <button
                className={styles.modalCloseBtn}
                onClick={handleClosePasswordModal}
                aria-label="Tutup modal"
                disabled={isChangingPassword}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handlePasswordChange();
              }}
            >
              {/* Password Saat Ini */}
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword" className={styles.label}>
                  Password Saat Ini
                </label>
                <div className={styles.passwordInputWrapper}>
                  <span className={styles.passwordIconLeft}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPw ? "text" : "password"}
                    className={`${styles.input} ${styles.inputPasswordField}`}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    disabled={isChangingPassword}
                    placeholder="Masukkan password saat ini"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowCurrentPw((p) => !p)}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  Password Baru
                </label>
                <div className={styles.passwordInputWrapper}>
                  <span className={styles.passwordIconLeft}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPw ? "text" : "password"}
                    className={`${styles.input} ${styles.inputPasswordField}`}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    disabled={isChangingPassword}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowNewPw((p) => !p)}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <small className={styles.inputHint}>Minimal 8 karakter</small>
              </div>

              {/* Konfirmasi Password */}
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Konfirmasi Password Baru
                </label>
                <div className={styles.passwordInputWrapper}>
                  <span className={styles.passwordIconLeft}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPw ? "text" : "password"}
                    className={`${styles.input} ${styles.inputPasswordField}`}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    disabled={isChangingPassword}
                    placeholder="Ulangi password baru"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowConfirmPw((p) => !p)}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className={styles.errorMessage} role="alert">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className={styles.successMessage} role="status">
                  {passwordSuccess}
                </div>
              )}

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={isChangingPassword}
                >
                  <Check size={18} />
                  {isChangingPassword ? "Menyimpan..." : "Simpan Password"}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleClosePasswordModal}
                  disabled={isChangingPassword}
                >
                  <X size={18} />
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
