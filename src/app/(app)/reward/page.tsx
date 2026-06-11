import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { getRewardData } from "@/lib/data/reward";
import RewardContent from "./RewardContent";

export const revalidate = 0;

export default async function RewardRoute() {
  await connection();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let initialData;
  try {
    initialData = await getRewardData(user.id, supabase as never);
  } catch (err) {
    return (
      <div className="main-container">
        <p>Gagal memuat data reward: {err instanceof Error ? err.message : "Unknown error"}</p>
      </div>
    );
  }

  return <RewardContent initialData={initialData} />;
}
