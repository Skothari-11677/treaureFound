import { supabase } from "./supabase";

export async function initializeDatabase() {
  try {
    // Check if the table exists by trying to select from it
    const { data, error } = await supabase
      .from("submissions")
      .select("count", { count: "exact" })
      .limit(0);

    if (error) {
      console.error("Database table does not exist:", error);
      throw new Error(
        "Database not initialized. Please run the SQL setup script in Supabase.",
      );
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("Database initialization check failed:", error);
    throw error;
  }
}

export async function testDatabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Database connection test failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Database connection error:", error);
    return { success: false, error: error.message };
  }
}
