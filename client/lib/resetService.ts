import { supabase } from "./supabase";
import { toast } from "sonner";

export class ResetService {
  private static instance: ResetService;

  static getInstance(): ResetService {
    if (!ResetService.instance) {
      ResetService.instance = new ResetService();
    }
    return ResetService.instance;
  }

  async verifyPassword(password: string): Promise<boolean> {
    return password === "GDG-IET";
  }

  async getSubmissionCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error getting count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Count error:", error);
      return 0;
    }
  }

  async deleteAllSubmissions(): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    const startTime = Date.now();
    console.log("🔄 Starting complete database reset...");

    try {
      // Step 1: Get initial count
      const initialCount = await this.getSubmissionCount();
      console.log(`📊 Found ${initialCount} records to delete`);

      if (initialCount === 0) {
        return { success: true, deletedCount: 0 };
      }

      // Step 2: Try multiple deletion strategies
      const strategies = [
        this.deleteWithGreaterThanEqual.bind(this),
        this.deleteWithNotEqual.bind(this),
        this.deleteWithTruncate.bind(this),
        this.deleteByBatch.bind(this),
      ];

      for (let i = 0; i < strategies.length; i++) {
        console.log(`🎯 Trying deletion strategy ${i + 1}...`);

        try {
          const result = await strategies[i]();
          if (result.success) {
            // Verify deletion worked
            const remainingCount = await this.getSubmissionCount();
            if (remainingCount === 0) {
              const duration = Date.now() - startTime;
              console.log(
                `✅ Reset completed successfully in ${duration}ms using strategy ${i + 1}`,
              );
              return { success: true, deletedCount: initialCount };
            } else {
              console.log(
                `⚠️ Strategy ${i + 1} partially worked. ${remainingCount} records remain.`,
              );
            }
          }
        } catch (error) {
          console.log(`❌ Strategy ${i + 1} failed:`, error);
        }
      }

      // If all strategies failed, return error
      return {
        success: false,
        deletedCount: 0,
        error:
          "All deletion strategies failed. Database may have permission issues.",
      };
    } catch (error: any) {
      console.error("Critical reset error:", error);
      return {
        success: false,
        deletedCount: 0,
        error: error.message || "Unknown error occurred",
      };
    }
  }

  private async deleteWithGreaterThanEqual(): Promise<{ success: boolean }> {
    const { error } = await supabase.from("submissions").delete().gte("id", 0);

    return { success: !error };
  }

  private async deleteWithNotEqual(): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from("submissions")
      .delete()
      .neq("id", -999999);

    return { success: !error };
  }

  private async deleteWithTruncate(): Promise<{ success: boolean }> {
    // This uses a direct SQL command - might need special permissions
    const { error } = await supabase.rpc("truncate_submissions");
    return { success: !error };
  }

  private async deleteByBatch(): Promise<{ success: boolean }> {
    try {
      // Get all IDs first
      const { data, error } = await supabase.from("submissions").select("id");

      if (error || !data) {
        return { success: false };
      }

      // Delete in batches of 100
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const ids = batch.map((item) => item.id);

        const { error: deleteError } = await supabase
          .from("submissions")
          .delete()
          .in("id", ids);

        if (deleteError) {
          console.error("Batch delete error:", deleteError);
          return { success: false };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  async performCompleteReset(password: string): Promise<{
    success: boolean;
    message: string;
    deletedCount?: number;
  }> {
    // Verify password
    if (!this.verifyPassword(password)) {
      return {
        success: false,
        message: "❌ Incorrect admin password!",
      };
    }

    // Show initial progress
    toast.loading("🔄 Initiating database reset...", { id: "reset-progress" });

    try {
      // Get initial count for user feedback
      const initialCount = await this.getSubmissionCount();

      if (initialCount === 0) {
        toast.success("✅ Database is already empty!", {
          id: "reset-progress",
        });
        return {
          success: true,
          message: "Database is already empty",
          deletedCount: 0,
        };
      }

      // Update progress
      toast.loading(`🗑️ Deleting ${initialCount} submissions...`, {
        id: "reset-progress",
      });

      // Perform deletion
      const result = await this.deleteAllSubmissions();

      if (result.success) {
        toast.success(
          `✅ Successfully deleted ${result.deletedCount} submissions!`,
          {
            id: "reset-progress",
            duration: 5000,
          },
        );

        return {
          success: true,
          message: `Successfully deleted ${result.deletedCount} submissions`,
          deletedCount: result.deletedCount,
        };
      } else {
        toast.error(`❌ Reset failed: ${result.error}`, {
          id: "reset-progress",
        });
        return {
          success: false,
          message: result.error || "Reset operation failed",
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred";
      toast.error(`❌ Critical error: ${errorMessage}`, {
        id: "reset-progress",
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}

export const resetService = ResetService.getInstance();
