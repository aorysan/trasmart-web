"use client";

import React, { useState } from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import AppSidebar from "@/app/components/layout/AppSidebar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Check,
  X,
  Bell,
  Camera,
} from "lucide-react";
import styles from "./account.module.scss";

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

export default function AccountRoute() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "User",
    email: "example@gmail.com",
    phone: "+62 812-3456-7890",
    address: "Jl.Soekarno-Hatta No. 123, Malang",
    avatar: "👤",
  });

  const [formData, setFormData] = useState<UserProfile>(profile);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
    alert("Profile updated successfully!");
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

  return (
    <SidebarProvider>
      <div className={styles.accountLayout}>
        <AppSidebar />
        <main className={styles.accountContent}>
          <div className={styles.mainContainer}>
            <div className={styles.topbar}>
              <div className={styles.topbarContent}>
                <h2>My Account</h2>
                <p>Kelola informasi profil akun kamu</p>
              </div>
              <button className={styles.notificationBtn}>
                <Bell size={24} />
                <span className={styles.notificationBadge}></span>
              </button>
            </div>

            <div className={styles.contentWrapper}>
              <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <div className={styles.avatarContainer}>
                    <div className={styles.avatarLarge}>{profile.avatar}</div>
                    {isEditing && (
                      <button className={styles.avatarEditBtn}>
                        <Camera size={16} />
                      </button>
                    )}
                  </div>
                  <div className={styles.profileBasic}>
                    <h1 className={styles.profileName}>{profile.fullName}</h1>
                    <p className={styles.profileRole}>Member TrasMart</p>
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
                          <p className={styles.detailLabel}>Nama Lengkap</p>
                          <p className={styles.detailValue}>{profile.fullName}</p>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <div className={styles.detailIcon}>
                          <Mail size={20} />
                        </div>
                        <div className={styles.detailContent}>
                          <p className={styles.detailLabel}>Email</p>
                          <p className={styles.detailValue}>{profile.email}</p>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <div className={styles.detailIcon}>
                          <Phone size={20} />
                        </div>
                        <div className={styles.detailContent}>
                          <p className={styles.detailLabel}>Nomor Telepon</p>
                          <p className={styles.detailValue}>{profile.phone}</p>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <div className={styles.detailIcon}>
                          <MapPin size={20} />
                        </div>
                        <div className={styles.detailContent}>
                          <p className={styles.detailLabel}>Alamat</p>
                          <p className={styles.detailValue}>{profile.address}</p>
                        </div>
                      </div>
                      <button className={styles.editBtn} onClick={handleEdit}>
                        <Edit size={18} />
                        Edit Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.formGroup}>
                        <label htmlFor="fullName" className={styles.label}>
                          Nama Lengkap
                        </label>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          className={styles.input}
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className={styles.input}
                          value={formData.email}
                          onChange={handleInputChange}
                        />
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
                          value={formData.phone}
                          onChange={handleInputChange}
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
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className={styles.formActions}>
                        <button className={styles.saveBtn} onClick={handleSave}>
                          <Check size={18} />
                          Simpan Perubahan
                        </button>
                        <button className={styles.cancelBtn} onClick={handleCancel}>
                          <X size={18} />
                          Batal
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.sidebar}>
                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Account Stats</h3>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Poin</span>
                    <span className={styles.statValue}>350 Pts</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Setor</span>
                    <span className={styles.statValue}>12.5 kg</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Member Sejak</span>
                    <span className={styles.statValue}>Jan 2026</span>
                  </div>
                </div>

                <div className={styles.actionsCard}>
                  <h3 className={styles.actionsTitle}>Aksi Cepat</h3>
                  <button className={styles.actionBtn}>Ubah Password</button>
                  <button className={styles.actionBtn}>Preferensi Notifikasi</button>
                  <button className={styles.actionBtn + " " + styles.dangerBtn}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
