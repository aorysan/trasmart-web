import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import styles from "./dashboard.module.scss";

import { getDashboardData } from "@/lib/data/dashboard";
import { createClient } from "@/lib/utils/supabase/server";
import DashboardContent from "./DashboardContent";

export const revalidate = 0;

export default async function DashboardRoute({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  await connection();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let data;
  try {
    data = await getDashboardData(user.id, supabase);
  } catch (err) {
    return (
      <div className={styles.mainContainer}>
        <p>
          Gagal memuat data:{" "}
          {err instanceof Error ? err.message : "Terjadi kesalahan"}
        </p>
      </div>
    );
  }

  const params = await searchParams;

  return (
    <DashboardContent
      userId={user.id}
      wallet={data.wallet}
      cta={data.cta}
      chart={data.chart}
      allTransactionsByDate={data.allTransactionsByDate}
      searchParamsDate={params?.date}
    />
  );
}
