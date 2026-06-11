import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { getBackupStatus } from "@/lib/data/backup";
import BackupContent from "./BackupContent";
import styles from "./backup.module.scss";

export const revalidate = 0;

export default async function BackupRoute() {
  await connection();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let status;
  let errorMessage: string | null = null;
  try {
    status = await getBackupStatus();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Gagal memuat status backup";
  }

  const hdfsOnline = !errorMessage;

  return (
    <div className={styles.mainContainer}>
      <BackupContent
        initialStatus={status ?? null}
        hdfsOnline={hdfsOnline}
        errorMessage={errorMessage}
      />
    </div>
  );
}
