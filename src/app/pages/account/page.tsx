"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Check,
  X,
  Camera,
} from "lucide-react";
import styles from "./account.module.scss";
import { useUser } from "@/contexts/UserContext";
import type { UserProfile } from "@/hooks/useAuth";
import NotificationBell from "@/components/layout/NotificationBell";
import { getUserPointSummary } from "@/lib/mock/points";

export default function AccountRoute() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, loading, error, updateUser, signOut } = useUser();
  const [pointBalance, setPointBalance] = useState(0);
  const [pointError, setPointError] = useState<string | null>(null);

  //Proper type dengan nullable
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  //Update formData ketika user data loaded
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

  const loadPoints = useCallback(async () => {
    if (!user?.id) return;

    try {
      setPointError(null);
      const summary = await getUserPointSummary(user.id);
      setPointBalance(summary.netPoints);
    } catch (err) {
      setPointError(err instanceof Error ? err.message : "Gagal memuat poin");
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    void loadPoints();

    const intervalId = window.setInterval(() => {
      void loadPoints();
    }, 10000);

    const handleActivityChanged = () => {
      void loadPoints();
    };

    const handleFocus = () => {
      void loadPoints();
    };

    window.addEventListener("trasmart:activity-changed", handleActivityChanged);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        "trasmart:activity-changed",
        handleActivityChanged,
      );
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, loadPoints]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form ke original data
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
      alert("Profile updated successfully!");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update profile";
      console.error("Save error:", errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mainContainer}>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#c33",
            background: "#fee",
            borderRadius: "8px",
          }}
        >
          <p>Error loading profile: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.topbar}>
        <div className={styles.topbarContent}>
          <h2>My Account</h2>
          <p>Kelola informasi profil akun kamu</p>
        </div>
        <NotificationBell
          buttonClassName={styles.notificationBtn}
          badgeClassName={styles.notificationBadge}
        />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarLarge}>{user?.avatar || "👤"}</div>
              {isEditing && (
                <button className={styles.avatarEditBtn}>
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className={styles.profileBasic}>
              <h1 className={styles.profileName}>
                {user?.fullName || "Guest"}
              </h1>
              {user?.username && (
                <p className={styles.profileUsername}>
                  @{user.username || "Guest"}
                </p>
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
            <p className={styles.pointsHint}>
              Otomatis sinkron dari transaksi berhasil dan penukaran reward.
            </p>
            {pointError && <p className={styles.pointsError}>{pointError}</p>}
          </div>

          <div className={styles.actionsCard}>
            <h3 className={styles.actionsTitle}>Aksi Cepat</h3>
            <button className={styles.actionBtn}>Ubah Password</button>
            <button className={styles.actionBtn}>Preferensi Notifikasi</button>
            <button
              className={styles.actionBtn + " " + styles.dangerBtn}
              onClick={signOut}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
