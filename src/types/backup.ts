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

export interface AnalyticsJob {
  id: string
  name: string
  input: string
  output: string
}

export interface AnalyticsResult {
  jobId: string
  jobName: string
  header: string[]
  rows: string[][]
  totalRows: number
  lastRun: string | null
}
