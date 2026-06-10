export interface BackupFile {
  name: string
  size: number
  modificationTime: string
  recordCount?: number
}

export interface BackupStatus {
  lastBackup: string | null
  totalFiles: number
  totalSize: number
  supabaseTransactionCount: number
  supabaseRedemptionCount: number
  hdfsTransactionCount: number
  hdfsRedemptionCount: number
  match: boolean
  files: BackupFile[]
}

export interface BackupRecord {
  id: string
  user_id: string
  category_id: string
  poin: number
  created_at: string
  machine_id: string | null
  status: string
}

export interface BackupRecordRedemption {
  id: string
  user_id: string
  reward_id: string
  redeemed_at: string
}

export interface FilePreview {
  filename: string
  totalRows: number
  page: number
  pageSize: number
  totalPages: number
  header: string[]
  rows: string[][]
}

export interface TriggerResult {
  success: boolean
  message: string
  timestamp: string
}
