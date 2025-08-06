import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";
import { Shield, Lock, PartyPopper, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getTeamName } from "../lib/levels";
import MatrixBackground from "../components/MatrixBackground";
import VictoryCelebration from "../components/VictoryCelebration";

interface Submission {
  id: number;
  team_id: string;
  level: number;
  password: string;
  difficulty_rating: number;
  created_at: string;
}

interface TeamStats {
  teamId: string;
  maxLevel: number;
  submissions: number;
  lastSubmission: string;
  avgRating: number;
}

export default function Victory() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const navigate = useNavigate();

  const verifyPassword = (inputPassword: string): boolean => {
    return inputPassword === "GDG-IET";
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter the admin password");
      return;
    }

    setIsLoading(true);

    if (!verifyPassword(password)) {
      toast.error("❌ Incorrect admin password!");
      setPassword("");
      setIsLoading(false);
      return;
    }

    // Load submissions data
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("❌ Failed to load competition data");
        setIsLoading(false);
        return;
      }

      const filteredData = (data || []).filter(
        (submission) => submission.team_id !== "999",
      );

      setSubmissions(filteredData);
      setTeamStats(generateTeamStats(filteredData));
      setIsAuthenticated(true);
      toast.success("✅ Access granted! Preparing victory ceremony...");
    } catch (error) {
      toast.error("❌ Failed to connect to database");
    } finally {
      setIsLoading(false);
    }
  };

  const generateTeamStats = (submissions: Submission[]): TeamStats[] => {
    const teamMap = new Map<
      string,
      {
        maxLevel: number;
        submissions: number;
        lastSubmission: string;
        maxLevelCompletionTime: string;
        avgRating: number;
      }
    >();

    submissions.forEach((sub) => {
      const existing = teamMap.get(sub.team_id);
      if (!existing || sub.level > existing.maxLevel) {
        teamMap.set(sub.team_id, {
          maxLevel: sub.level,
          submissions: (existing?.submissions || 0) + 1,
          lastSubmission: sub.created_at,
          maxLevelCompletionTime: sub.created_at, // Track when highest level was completed
          avgRating: existing
            ? (existing.avgRating * existing.submissions +
                sub.difficulty_rating) /
              ((existing.submissions || 0) + 1)
            : sub.difficulty_rating,
        });
      } else {
        teamMap.set(sub.team_id, {
          ...existing,
          submissions: existing.submissions + 1,
          avgRating:
            (existing.avgRating * (existing.submissions - 1) +
              sub.difficulty_rating) /
            existing.submissions,
        });
      }
    });

    return Array.from(teamMap.entries())
      .map(([teamId, stats]) => ({ teamId, ...stats }))
      .sort((a, b) => {
        // First sort by highest level achieved
        if (b.maxLevel !== a.maxLevel) {
          return b.maxLevel - a.maxLevel;
        }
        // If same level, sort by who completed it first (earliest completion time)
        return new Date(a.maxLevelCompletionTime).getTime() - new Date(b.maxLevelCompletionTime).getTime();
      });
  };

  const startCelebration = () => {
    if (teamStats.length === 0) {
      toast.error("No teams to celebrate yet!");
      return;
    }
    setShowCelebration(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background terminal-bg p-4">
        <MatrixBackground />
        <div className="max-w-md mx-auto pt-16">
          {/* Back Button */}
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-8 text-terminal-green hover:bg-terminal-green/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terminal-green text-center">
                <Shield size={24} />
                Victory Ceremony Access
              </CardTitle>
              <p className="text-terminal-green-dim text-center text-sm">
                Admin authentication required
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-terminal-green flex items-center gap-2"
                  >
                    <Lock size={16} />
                    Admin Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-terminal-green-dim text-foreground font-mono text-center"
                    autoComplete="off"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!password || isLoading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold terminal-glow"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </div>
                  ) : (
                    <>
                      <PartyPopper className="w-4 h-4 mr-2" />
                      Access Victory Ceremony
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <div className="bg-terminal-green/10 border border-terminal-green/30 rounded p-4">
                  <PartyPopper className="w-8 h-8 text-terminal-yellow mx-auto mb-2" />
                  <p className="text-sm text-terminal-green font-mono">
                    Celebrate the champions of
                  </p>
                  <p className="text-sm text-terminal-green font-mono font-bold">
                    TREASURE IN THE SHELL
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background terminal-bg p-4">
      <MatrixBackground />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-terminal-green hover:bg-terminal-green/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-terminal-green">
              Victory Ceremony Control
            </h1>
            <p className="text-terminal-green-dim">
              Ready to celebrate our champions
            </p>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Competition Summary */}
        <Card className="bg-card/80 border-terminal-green mb-8">
          <CardHeader>
            <CardTitle className="text-terminal-green flex items-center gap-2">
              <PartyPopper size={20} />
              Competition Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-terminal-green/10 rounded border border-terminal-green/30">
                <div className="text-3xl font-bold text-terminal-green">
                  {teamStats.length}
                </div>
                <div className="text-sm text-terminal-green-dim">
                  Participating Teams
                </div>
              </div>
              <div className="text-center p-4 bg-terminal-green/10 rounded border border-terminal-green/30">
                <div className="text-3xl font-bold text-terminal-green">
                  {submissions.length}
                </div>
                <div className="text-sm text-terminal-green-dim">
                  Total Submissions
                </div>
              </div>
              <div className="text-center p-4 bg-terminal-green/10 rounded border border-terminal-green/30">
                <div className="text-3xl font-bold text-terminal-green">
                  {teamStats.length > 0
                    ? Math.max(...teamStats.map((t) => t.maxLevel))
                    : 0}
                </div>
                <div className="text-sm text-terminal-green-dim">
                  Highest Level Reached
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Preview */}
        {teamStats.length > 0 && (
          <Card className="bg-card/80 border-terminal-green mb-8">
            <CardHeader>
              <CardTitle className="text-terminal-green">
                🏆 Top 3 Champions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamStats.slice(0, 3).map((team, index) => (
                  <div
                    key={team.teamId}
                    className="flex items-center justify-between p-4 bg-terminal-green/5 border border-terminal-green/20 rounded"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">
                          Team {team.teamId} - {getTeamName(team.teamId)}
                        </div>
                        <div className="text-sm text-terminal-green-dim">
                          Level {team.maxLevel} • {team.avgRating.toFixed(1)}/5
                          stars
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Launch Celebration Button */}
        <div className="text-center">
          <Button
            onClick={startCelebration}
            disabled={teamStats.length === 0}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold px-12 py-6 text-xl terminal-glow"
          >
            <PartyPopper className="w-8 h-8 mr-3" />
            🎉 LAUNCH VICTORY CEREMONY 🎉
          </Button>

          {teamStats.length === 0 && (
            <p className="text-terminal-green-dim mt-4 text-sm">
              No submissions found. Teams need to complete challenges first.
            </p>
          )}
        </div>
      </div>

      {/* Victory Celebration Modal */}
      <VictoryCelebration
        teamStats={teamStats}
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}
