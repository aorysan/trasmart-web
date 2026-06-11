"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import PageTopbar from "@/components/layout/PageTopbar";

const profileSchema = z.object({
  username: z.string().optional(),
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password baru tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Password baru harus berbeda dari password lama",
    path: ["newPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function AccountRoute() {
  const [isEditing, setIsEditing] = useState(false);
  const { user, loading, error, updateUser, signOut, changePassword } =
    useUser();
  const pointBalance = user?.points ?? 0;
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // State modal Change Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      username: user?.username ?? "",
      fullName: user?.fullName ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      city: user?.city ?? "",
      postal_code: user?.postal_code ?? "",
    },
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    profileForm.reset({
      username: user?.username ?? "",
      fullName: user?.fullName ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      city: user?.city ?? "",
      postal_code: user?.postal_code ?? "",
    });
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      await updateUser(data as Partial<UserProfile>);
      setIsEditing(false);
      setToast({ type: "success", message: "Profile updated successfully!" });
      setTimeout(() => setToast(null), 4000);
      window.dispatchEvent(new Event("trasmart:activity-changed"));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update profile";
      setToast({ type: "error", message: `Error: ${errorMsg}` });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Handlers modal Change Password
  const handleOpenPasswordModal = () => {
    passwordForm.reset();
    setPasswordServerError(null);
    setPasswordSuccess(null);
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    if (passwordForm.formState.isSubmitting) return;
    setIsPasswordModalOpen(false);
    setPasswordServerError(null);
    setPasswordSuccess(null);
  };

  const onPasswordSubmit = async (data: ChangePasswordForm) => {
    setPasswordServerError(null);
    setPasswordSuccess(null);

    try {
      await changePassword(data.currentPassword, data.newPassword);
      setPasswordSuccess("✓ Password berhasil diubah!");
      passwordForm.reset();
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err) {
      setPasswordServerError(
        err instanceof Error ? err.message : "Gagal mengubah password",
      );
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
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.label}>
                    User Name
                  </label>
                  <input
                    id="username"
                    type="text"
                    className={styles.input}
                    {...profileForm.register("username")}
                    disabled={profileForm.formState.isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName" className={styles.label}>
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className={styles.input}
                    {...profileForm.register("fullName")}
                    disabled={profileForm.formState.isSubmitting}
                  />
                  {profileForm.formState.errors.fullName && (
                    <span className={styles.fieldError}>
                      {profileForm.formState.errors.fullName.message}
                    </span>
                  )}
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
                    type="tel"
                    className={styles.input}
                    {...profileForm.register("phone")}
                    disabled={profileForm.formState.isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="address" className={styles.label}>
                    Alamat
                  </label>
                  <input
                    id="address"
                    type="text"
                    className={styles.input}
                    {...profileForm.register("address")}
                    disabled={profileForm.formState.isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    Kota
                  </label>
                  <input
                    id="city"
                    type="text"
                    className={styles.input}
                    {...profileForm.register("city")}
                    disabled={profileForm.formState.isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postal_code" className={styles.label}>
                    Kode Pos
                  </label>
                  <input
                    id="postal_code"
                    type="text"
                    className={styles.input}
                    {...profileForm.register("postal_code")}
                    disabled={profileForm.formState.isSubmitting}
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={profileForm.formState.isSubmitting}
                  >
                    <Check size={18} />
                    {profileForm.formState.isSubmitting ? "Saving..." : "Simpan Perubahan"}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                    disabled={profileForm.formState.isSubmitting}
                  >
                    <X size={18} />
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
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
                disabled={passwordForm.formState.isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
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
                    type={showCurrentPw ? "text" : "password"}
                    className={`${styles.input} ${styles.inputPasswordField}`}
                    {...passwordForm.register("currentPassword")}
                    disabled={passwordForm.formState.isSubmitting}
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
                {passwordForm.formState.errors.currentPassword && (
                  <span className={styles.fieldError}>
                    {passwordForm.formState.errors.currentPassword.message}
                  </span>
                )}
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
                    type={showNewPw ? "text" : "password"}
                    className={`${styles.input} ${styles.inputPasswordField}`}
                    {...passwordForm.register("newPassword")}
                    disabled={passwordForm.formState.isSubmitting}
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
                {passwordForm.formState.errors.newPassword && (
                  <span className={styles.fieldError}>
                    {passwordForm.formState.errors.newPassword.message}
                  </span>
                )}
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
                    type={showConfirmPw ? "text" : "password"}
                    className={`${styles.input} ${styles.inputPasswordField}`}
                    {...passwordForm.register("confirmPassword")}
                    disabled={passwordForm.formState.isSubmitting}
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
                {passwordForm.formState.errors.confirmPassword && (
                  <span className={styles.fieldError}>
                    {passwordForm.formState.errors.confirmPassword.message}
                  </span>
                )}
              </div>

              {passwordServerError && (
                <div className={styles.errorMessage} role="alert">
                  {passwordServerError}
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
                  disabled={passwordForm.formState.isSubmitting}
                >
                  <Check size={18} />
                  {passwordForm.formState.isSubmitting ? "Menyimpan..." : "Simpan Password"}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleClosePasswordModal}
                  disabled={passwordForm.formState.isSubmitting}
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
