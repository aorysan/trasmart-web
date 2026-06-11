"use client";

import { memo, useState, useCallback } from "react";
import {
  Database,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Server,
  Activity,
  Upload,
} from "lucide-react";
import styles from "./backup.module.scss";
import type { BackupStatus, FilePreview, TriggerResult } from "@/types/backup";

interface BackupContentProps {
  initialStatus: BackupStatus | null;
  hdfsOnline: boolean;
  errorMessage: string | null;
}

const PAGE_SIZE = 50;

const BackupContent = memo(function BackupContent({
  initialStatus,
  hdfsOnline,
  errorMessage,
}: BackupContentProps) {
  const [status, setStatus] = useState(initialStatus);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/backup/status");
      const json = await res.json();
      if (json.success) setStatus(json.data);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleTriggerBackup = useCallback(async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/backup/trigger", { method: "POST" });
      const result: TriggerResult = await res.json();
      setTriggerResult(result);
      if (result.success) {
        setTimeout(() => handleRefresh(), 1000);
      }
    } catch {
      setTriggerResult({ success: false, message: "Gagal terhubung ke server", timestamp: new Date().toISOString() });
    } finally {
      setTriggering(false);
    }
  }, [handleRefresh]);

  const handleSelectFile = useCallback(async (filename: string) => {
    setSelectedFile(filename);
    setPreviewPage(1);
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await fetch(`/api/backup/files/${encodeURIComponent(filename)}?page=1&pageSize=${PAGE_SIZE}`);
      const json = await res.json();
      if (json.success) setPreview(json.data);
      else setPreviewError(json.message);
    } catch {
      setPreviewError("Gagal memuat preview");
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const handlePreviewPage = useCallback(async (page: number) => {
    if (!selectedFile) return;
    setPreviewPage(page);
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/backup/files/${encodeURIComponent(selectedFile)}?page=${page}&pageSize=${PAGE_SIZE}`);
      const json = await res.json();
      if (json.success) setPreview(json.data);
    } catch {
      // ignore
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedFile]);

  const handleDownload = useCallback(async (filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = `/api/backup/files/${encodeURIComponent(filename)}?download=true`;
      a.download = filename;
      a.click();
    } catch {
      // ignore
    }
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.greeting}>
            <HardDrive size={18} />
            <span>HDFS Backup</span>
          </div>
          <h1 className={styles.headerTitle}>Riwayat Backup</h1>
          <p className={styles.headerDesc}>
            Pantau dan kelola cadangan data transaksi &amp; redeem reward di Hadoop HDFS.
          </p>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={refreshing}
            type="button"
          >
            <RefreshCw size={16} className={refreshing ? styles.spinning : ""} />
            {refreshing ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </header>

      {!hdfsOnline && (
        <div className={styles.errorBanner}>
          <AlertCircle size={20} />
          <div>
            <strong>HDFS tidak terhubung</strong>
            <p>{errorMessage || "Pastikan Hadoop cluster sudah berjalan (docker compose up)"}</p>
          </div>
        </div>
      )}

      {triggerResult && (
        <div className={`${styles.resultBanner} ${triggerResult.success ? styles.resultSuccess : styles.resultError}`}>
          {triggerResult.success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span>{triggerResult.message}</span>
          <button className={styles.resultClose} onClick={() => setTriggerResult(null)} type="button">
            &times;
          </button>
        </div>
      )}

      <div className={styles.statusCards}>
        <div className={styles.statusCard}>
          <div className={styles.statusCardIcon}>
            <Server size={20} />
          </div>
          <div className={styles.statusCardBody}>
            <span className={styles.statusCardLabel}>Koneksi HDFS</span>
            <span className={styles.statusCardValue}>
              {hdfsOnline ? "Tersambung" : "Putus"}
            </span>
            <span className={`${styles.statusBadge} ${hdfsOnline ? styles.badgeOnline : styles.badgeOffline}`}>
              {hdfsOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusCardIcon}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.statusCardBody}>
            <span className={styles.statusCardLabel}>Verifikasi Data</span>
            <span className={styles.statusCardValue}>
              {status?.match ? "Match" : "Belum Sync"}
            </span>
            {status && (
              <span className={styles.statusCardSub}>
                Supabase: {status.supabaseTransactionCount.toLocaleString("id-ID")} txn
                {" | "}HDFS: {status.hdfsTransactionCount.toLocaleString("id-ID")} txn
              </span>
            )}
          </div>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusCardIcon}>
            <FileText size={20} />
          </div>
          <div className={styles.statusCardBody}>
            <span className={styles.statusCardLabel}>File Backup</span>
            <span className={styles.statusCardValue}>
              {status?.totalFiles ?? 0}
            </span>
            <span className={styles.statusCardSub}>
              Total {formatSize(status?.totalSize ?? 0)}
            </span>
          </div>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusCardIcon}>
            <Calendar size={20} />
          </div>
          <div className={styles.statusCardBody}>
            <span className={styles.statusCardLabel}>Terakhir Backup</span>
            <span className={styles.statusCardValue}>
              {status?.lastBackup ? formatDate(status.lastBackup) : "--"}
            </span>
            <button
              className={styles.triggerBtn}
              onClick={handleTriggerBackup}
              disabled={triggering || !hdfsOnline}
              type="button"
            >
              <Upload size={14} />
              {triggering ? "Memproses..." : "Backup Sekarang"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.gridContainer}>
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <FileText size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>File Backup di HDFS</h3>
                <p className={styles.cardSubtitle}>
                  Klik file untuk melihat isi data
                </p>
              </div>
            </div>

            {!hdfsOnline ? (
              <p className={styles.emptyText}>
                HDFS tidak tersedia. Jalankan Hadoop cluster terlebih dahulu.
              </p>
            ) : status && status.files.length > 0 ? (
              <div className={styles.fileList}>
                {status.files.map((file) => (
                  <button
                    key={file.name}
                    className={`${styles.fileItem} ${selectedFile === file.name ? styles.fileItemActive : ""}`}
                    onClick={() => handleSelectFile(file.name)}
                    type="button"
                  >
                    <div className={styles.fileIcon}>
                      <FileText size={16} />
                    </div>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileMeta}>
                        {formatSize(file.size)} &middot; {formatDate(file.modificationTime)}
                      </span>
                    </div>
                    <ChevronRight size={16} className={styles.fileArrow} />
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Database size={48} strokeWidth={1.5} />
                <p>Belum ada data backup</p>
                <span>Klik &quot;Backup Sekarang&quot; untuk memulai</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <Search size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Preview Data</h3>
                <p className={styles.cardSubtitle}>
                  {selectedFile
                    ? `Menampilkan ${selectedFile}`
                    : "Pilih file dari daftar di samping"}
                </p>
              </div>
              {selectedFile && (
                <button
                  className={styles.downloadBtn}
                  onClick={() => handleDownload(selectedFile)}
                  type="button"
                  title="Download CSV"
                >
                  <Download size={16} />
                </button>
              )}
            </div>

            {loadingPreview ? (
              <div className={styles.loadingState}>
                <Activity size={32} className={styles.spinning} />
                <span>Memuat data...</span>
              </div>
            ) : previewError ? (
              <div className={styles.errorState}>
                <AlertCircle size={32} />
                <span>{previewError}</span>
              </div>
            ) : preview ? (
              <div className={styles.previewTable}>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {preview.header.map((col, i) => (
                          <th key={i}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.length === 0 ? (
                        <tr>
                          <td colSpan={preview.header.length} className={styles.tableEmpty}>
                            Tidak ada data
                          </td>
                        </tr>
                      ) : (
                        preview.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>{cell}</td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {preview.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      onClick={() => handlePreviewPage(previewPage - 1)}
                      disabled={previewPage <= 1}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                      Sebelumnya
                    </button>
                    <span className={styles.pageInfo}>
                      Halaman {previewPage} dari {preview.totalPages}
                      {" "}({preview.totalRows.toLocaleString("id-ID")} baris)
                    </span>
                    <button
                      className={styles.pageBtn}
                      onClick={() => handlePreviewPage(previewPage + 1)}
                      disabled={previewPage >= preview.totalPages}
                      type="button"
                    >
                      Berikutnya
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Search size={48} strokeWidth={1.5} />
                <p>Pilih file untuk preview</p>
                <span>Klik file di daftar sebelah kiri</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default BackupContent;
