import { exec } from "child_process";
import { promisify } from "util";
import type {
  BackupFile,
  BackupStatus,
  FilePreview,
  TriggerResult,
} from "@/types/backup";

const execAsync = promisify(exec);
const HDFS_CONTAINER = "hadoop-namenode";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const BACKUP_DIR_TXN = "/backups/transactions";
const BACKUP_DIR_RED = "/backups/redemptions";

interface HdfsFileEntry {
  pathSuffix: string;
  length: number;
  modificationTime: string;
  type: "FILE" | "DIRECTORY";
}

async function hdfsExec(args: string[], input?: string): Promise<string> {
  const cmd = ["docker", "exec"];
  if (input !== undefined) cmd.push("-i");
  cmd.push(HDFS_CONTAINER, ...args);

  const shellCmd = cmd.map((s) => (/\s/.test(s) ? `"${s}"` : s)).join(" ");
  const opts: { input?: string; timeout: number } = { timeout: 15000 };
  if (input !== undefined) opts.input = input;

  try {
    const { stdout } = await execAsync(shellCmd, opts);
    return stdout;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`hdfs cmd failed: ${msg}`);
  }
}

function parseLsOutput(output: string): HdfsFileEntry[] {
  const files: HdfsFileEntry[] = [];
  for (const line of output.trim().split("\n")) {
    if (line.startsWith("Found") || line.startsWith("dr")) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 8) {
      files.push({
        pathSuffix: parts[parts.length - 1].split("/").pop() || "",
        length: parseInt(parts[4], 10) || 0,
        modificationTime: `${parts[5]} ${parts[6]}`,
        type: "FILE",
      });
    }
  }
  return files;
}

function parseCsvRows(
  csvText: string,
  page: number,
  pageSize: number,
): { header: string[]; rows: string[][]; totalRows: number } {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { header: [], rows: [], totalRows: 0 };
  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const allRows = lines.slice(1).map((line) =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
  );
  const start = (page - 1) * pageSize;
  const paged = allRows.slice(start, start + pageSize);
  return { header, rows: paged, totalRows: allRows.length };
}

async function supabaseCount(table: string): Promise<number> {
  if (!SUPABASE_KEY) return 0;
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0`;
  try {
    const resp = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=exact",
      },
    });
    if (!resp.ok) return 0;
    const range = resp.headers.get("content-range") || "*/0";
    return parseInt(range.split("/")[1] || "0", 10);
  } catch {
    return 0;
  }
}

export async function getBackupStatus(): Promise<BackupStatus> {
  let txnFiles: HdfsFileEntry[] = [];
  let redFiles: HdfsFileEntry[] = [];

  try {
    const out = await hdfsExec(["hdfs", "dfs", "-ls", BACKUP_DIR_TXN]);
    txnFiles = parseLsOutput(out);
  } catch {
    txnFiles = [];
  }

  try {
    const out = await hdfsExec(["hdfs", "dfs", "-ls", BACKUP_DIR_RED]);
    redFiles = parseLsOutput(out);
  } catch {
    redFiles = [];
  }

  const allFiles: BackupFile[] = [
    ...txnFiles.map((f) => ({
      name: f.pathSuffix,
      size: f.length,
      modificationTime: new Date(f.modificationTime).toISOString(),
    })),
    ...redFiles.map((f) => ({
      name: `redemptions/${f.pathSuffix}`,
      size: f.length,
      modificationTime: new Date(f.modificationTime).toISOString(),
    })),
  ].sort((a, b) => b.modificationTime.localeCompare(a.modificationTime));

  const totalFiles = allFiles.length;
  const totalSize = allFiles.reduce((s, f) => s + f.size, 0);
  const lastBackup = allFiles.length > 0 ? allFiles[0].modificationTime : null;

  async function countLines(dir: string, files: HdfsFileEntry[]): Promise<number> {
    try {
      const allPaths = files
        .filter((f) => f.type === "FILE")
        .map((f) => `${dir}/${f.pathSuffix}`);
      if (allPaths.length === 0) return 0;
      const output = await hdfsExec(["hdfs", "dfs", "-cat", ...allPaths]);
      const lineCount = output.trim().split("\n").length;
      return Math.max(lineCount - files.length, 0);
    } catch {
      return 0;
    }
  }

  const [hdfsTxnCount, hdfsRedCount] = await Promise.all([
    countLines(BACKUP_DIR_TXN, txnFiles),
    countLines(BACKUP_DIR_RED, redFiles),
  ]);

  const supabaseTxnCount = await supabaseCount("transactions");
  const supabaseRedCount = await supabaseCount("user_redemptions");
  const match =
    supabaseTxnCount === hdfsTxnCount && supabaseRedCount === hdfsRedCount;

  return {
    lastBackup,
    totalFiles,
    totalSize,
    supabaseTransactionCount: supabaseTxnCount,
    supabaseRedemptionCount: supabaseRedCount,
    hdfsTransactionCount: hdfsTxnCount,
    hdfsRedemptionCount: hdfsRedCount,
    match,
    files: allFiles,
  };
}

export async function getBackupFiles(): Promise<BackupFile[]> {
  try {
    const [txnRaw, redRaw] = await Promise.all([
      hdfsExec(["hdfs", "dfs", "-ls", BACKUP_DIR_TXN]),
      hdfsExec(["hdfs", "dfs", "-ls", BACKUP_DIR_RED]),
    ]);
    const txnFiles = parseLsOutput(txnRaw);
    const redFiles = parseLsOutput(redRaw);
    return [
      ...txnFiles.map((f) => ({ name: f.pathSuffix, size: f.length, modificationTime: new Date(f.modificationTime).toISOString() })),
      ...redFiles.map((f) => ({ name: `redemptions/${f.pathSuffix}`, size: f.length, modificationTime: new Date(f.modificationTime).toISOString() })),
    ].sort((a, b) => b.modificationTime.localeCompare(a.modificationTime));
  } catch {
    return [];
  }
}

export async function getFilePreview(
  filename: string,
  page = 1,
  pageSize = 50,
): Promise<FilePreview> {
  const isRedemption = filename.startsWith("redemptions/");
  const cleanName = isRedemption ? filename.slice("redemptions/".length) : filename;
  const dir = isRedemption ? BACKUP_DIR_RED : BACKUP_DIR_TXN;
  const path = `${dir}/${cleanName}`;

  const csvText = await hdfsExec(["hdfs", "dfs", "-cat", path]);
  const { header, rows, totalRows } = parseCsvRows(csvText, page, pageSize);
  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1);

  return {
    filename,
    totalRows,
    page,
    pageSize,
    totalPages,
    header,
    rows,
  };
}

export async function getFileRaw(filename: string): Promise<string> {
  const isRedemption = filename.startsWith("redemptions/");
  const cleanName = isRedemption ? filename.slice("redemptions/".length) : filename;
  const dir = isRedemption ? BACKUP_DIR_RED : BACKUP_DIR_TXN;
  return hdfsExec(["hdfs", "dfs", "-cat", `${dir}/${cleanName}`]);
}

export async function triggerBackup(): Promise<TriggerResult> {
  try {
    const scriptPath = "scripts/export_to_hdfs.py";

    if (!SUPABASE_KEY) {
      return {
        success: false,
        message: "SUPABASE_SERVICE_KEY must be set on server",
        timestamp: new Date().toISOString(),
      };
    }

    const env = {
      ...process.env,
      SUPABASE_URL: SUPABASE_URL || "",
      SUPABASE_SERVICE_KEY: SUPABASE_KEY,
    };

    const shellCmd = `python "${scriptPath}"`;
    const { stdout, stderr } = await execAsync(shellCmd, {
      env: env as NodeJS.ProcessEnv,
      cwd: process.cwd(),
      timeout: 120000,
    });

    console.log("Backup stdout:", stdout);
    if (stderr) console.error("Backup stderr:", stderr);

    return {
      success: true,
      message: "Backup berhasil",
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menjalankan backup";
    console.error("Backup trigger error:", msg);
    return {
      success: false,
      message: msg,
      timestamp: new Date().toISOString(),
    };
  }
}
