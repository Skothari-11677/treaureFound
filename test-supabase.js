// Test Supabase Connection
// Run with: node test-supabase.js

import { createClient } from "@supabase/supabase-js";

// Use your credentials here
const supabaseUrl = "https://fcwkebruiyfahqzpzkoy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjd2tlYnJ1aXlmYWhxenB6a295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDkzMzgsImV4cCI6MjA2OTg4NTMzOH0.MkPoamGffTCklmC9uL1QJHfcD8I0ZeU8gA3zXqsWTNQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("🧪 Testing Supabase Connection...\n");

  try {
    // Test 1: Basic connection
    console.log("1️⃣ Testing basic connection...");
    const { data, error } = await supabase
      .from("submissions")
      .select("count", { count: "exact" });

    if (error) {
      console.error("❌ Connection failed:", error.message);
      return;
    }

    console.log("✅ Connection successful!");
    console.log(`📊 Current submissions count: ${data?.[0]?.count || 0}\n`);

    // Test 2: Insert test record
    console.log("2️⃣ Testing insert...");
    const { data: insertData, error: insertError } = await supabase
      .from("submissions")
      .insert({
        team_id: "999",
        level: 1,
        password: "test-password",
        difficulty_rating: 5,
      })
      .select();

    if (insertError) {
      console.error("❌ Insert failed:", insertError.message);
    } else {
      console.log("✅ Insert successful!");
      console.log("📝 Inserted record:", insertData[0]);
    }

    // Test 3: Real-time subscription
    console.log("\n3️⃣ Testing real-time subscription...");
    const subscription = supabase
      .channel("test-submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          console.log("🔴 Real-time update received:", payload);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time subscription active!");
        }
      });

    // Clean up test data
    setTimeout(async () => {
      console.log("\n🧹 Cleaning up test data...");
      await supabase.from("submissions").delete().eq("team_id", "999");
      subscription.unsubscribe();
      console.log("✅ Cleanup complete!");
      process.exit(0);
    }, 3000);
  } catch (error) {
    console.error("💥 Unexpected error:", error);
  }
}

testConnection();
