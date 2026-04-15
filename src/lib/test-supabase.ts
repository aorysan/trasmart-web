import { createClient } from "./utils/supabase/client";

export async function testConnection() {
  try {
    const supabase = createClient();

    // Test 1: Check connection
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Error connecting to Supabase:", error);
      return false;
    }

    console.log("✅ Supabase connection successful!");
    console.log("Data:", data);
    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return false;
  }
}

// Add this for console access
if (typeof window !== "undefined") {
  (window as any).testConnection = testConnection;
}
