import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import {
  Shield,
  RefreshCw,
  Users,
  Trophy,
  Star,
  Clock,
  RotateCcw,
  ChevronDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import MatrixBackground from "./MatrixBackground";

interface Submission {
  id: number;
  team_id: string;
  level: number;
  password: string;
  difficulty_rating: number;
  created_at: string;
}

export default function AdminPanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [lastSubmissionId, setLastSubmissionId] = useState<number>(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const fetchSubmissions = async (showNewSubmissionToast = false) => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);

        // Provide specific error messages
        if (error.message.includes('relation "submissions" does not exist')) {
          toast.error(
            "❌ Database table not found! Please run the SQL setup script in Supabase.",
          );
        } else if (error.message.includes("permission denied")) {
          toast.error("❌ Database access denied. Check Supabase permissions.");
        } else {
          toast.error(`❌ Database error: ${error.message}`);
        }
      } else {
        const newData = data || [];
        // Filter out test entries (team 999)
        const filteredData = newData.filter(
          (submission) => submission.team_id !== "999",
        );

        // Check for new submissions
        if (
          showNewSubmissionToast &&
          filteredData.length > 0 &&
          submissions.length > 0
        ) {
          const latestSubmission = filteredData[0];
          if (latestSubmission.id > lastSubmissionId) {
            toast.success(
              `🎉 New submission from Team ${latestSubmission.team_id} - Level ${latestSubmission.level}!`,
            );
            setLastSubmissionId(latestSubmission.id);
          }
        } else if (filteredData.length > 0) {
          setLastSubmissionId(filteredData[0].id);
        }

        setSubmissions(filteredData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSubmissions();

    // Set up polling for live updates (since realtime is not available)
    const interval = setInterval(() => {
      fetchSubmissions(true); // Pass true to show new submission toasts
    }, 3000); // Poll every 3 seconds for near real-time updates

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleReset = async () => {
    if (resetPassword !== "GDG-IET") {
      toast.error("❌ Incorrect password!");
      return;
    }

    setIsResetting(true);
    try {
      // Delete all submissions (including test entries)
      const { error } = await supabase
        .from("submissions")
        .delete()
        .neq("id", 0); // Delete all records

      if (error) {
        console.error("Reset error:", error);
        toast.error("❌ Failed to reset submissions");
      } else {
        toast.success("✅ All submissions have been reset!");
        setSubmissions([]);
        setShowResetDialog(false);
        setResetPassword("");
        setLastSubmissionId(0);
      }
    } catch (error: any) {
      console.error("Reset error:", error);
      toast.error("❌ Network error during reset");
    } finally {
      setIsResetting(false);
    }
  };

  const getTeamStats = () => {
    const teamMap = new Map<
      string,
      {
        maxLevel: number;
        submissions: number;
        lastSubmission: string;
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
      .sort(
        (a, b) => b.maxLevel - a.maxLevel || a.teamId.localeCompare(b.teamId),
      );
  };

  const getLevelStats = () => {
    const levelMap = new Map<number, number>();
    submissions.forEach((sub) => {
      levelMap.set(sub.level, (levelMap.get(sub.level) || 0) + 1);
    });
    return levelMap;
  };

  const teamStats = getTeamStats();
  const levelStats = getLevelStats();

  const getSelectedTeamDetails = () => {
    if (!selectedTeam) return null;

    const teamSubmissions = submissions.filter(
      (sub) => sub.team_id === selectedTeam,
    );
    const levels = teamSubmissions
      .map((sub) => ({
        level: sub.level,
        rating: sub.difficulty_rating,
        time: sub.created_at,
        password: sub.password,
      }))
      .sort((a, b) => b.level - a.level);

    return {
      totalSubmissions: teamSubmissions.length,
      maxLevel: Math.max(...levels.map((l) => l.level), 0),
      averageRating:
        levels.length > 0
          ? (
              levels.reduce((sum, l) => sum + l.rating, 0) / levels.length
            ).toFixed(1)
          : "0",
      levels: levels,
    };
  };

  const selectedTeamDetails = getSelectedTeamDetails();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLevelColor = (level: number) => {
    if (level >= 8)
      return "bg-terminal-red/20 text-terminal-red border-terminal-red";
    if (level >= 6)
      return "bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow";
    if (level >= 4)
      return "bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan";
    return "bg-terminal-green/20 text-terminal-green border-terminal-green";
  };

  // Generate team options for dropdown
  const teamOptions = Array.from({ length: 60 }, (_, i) =>
    (101 + i).toString(),
  );

  return (
    <div className="min-h-screen bg-background terminal-bg p-4">
      <MatrixBackground />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="text-terminal-green" size={32} />
            <div>
              <h1 className="text-3xl font-bold terminal-text">
                ADMIN CONTROL PANEL
              </h1>
              <p className="text-terminal-green-dim">
                Real-time submission monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-terminal-green-dim">
              <p>Last Update: {lastUpdate.toLocaleTimeString()}</p>
              <p>Total Submissions: {submissions.length}</p>
              <p className="flex items-center gap-1">
                <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse"></div>
                Live Polling (3s)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="outline"
                className="border-terminal-red text-terminal-red hover:bg-terminal-red/10"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={() => fetchSubmissions()}
                disabled={isLoading}
                variant="outline"
                className="border-terminal-green text-terminal-green hover:bg-terminal-green/10"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Team Leaderboard */}
        <Card className="bg-card/80 border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Trophy size={20} />
              Team Leaderboard
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Live rankings based on highest level achieved
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {teamStats.map(
                (
                  { teamId, maxLevel, submissions, lastSubmission, avgRating },
                  index,
                ) => (
                  <div
                    key={teamId}
                    className={`p-3 rounded border flex items-center justify-between transition-colors hover:bg-muted/50 ${
                      index < 3
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-background/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-medium text-muted-foreground min-w-[2rem]">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            Team {teamId}
                          </span>
                          {index < 3 && (
                            <Badge variant="secondary" className="text-xs">
                              TOP 3
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last: {formatTime(lastSubmission)} • Rating: {avgRating.toFixed(1)}/5
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-medium text-foreground">Level {maxLevel}</div>
                        <div className="text-xs text-muted-foreground">Max Level</div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{submissions}</div>
                        <div className="text-xs text-muted-foreground">Submissions</div>
                      </div>
                    </div>
                  </div>
                ),
              )}
              {teamStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Level Distribution */}
          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity size={20} />
                Level Progress Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
                  const count = levelStats.get(level) || 0;
                  const percentage =
                    submissions.length > 0
                      ? (count / submissions.length) * 100
                      : 0;
                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Level {level}
                        </span>
                        <span className="text-muted-foreground font-mono text-sm">
                          {count} teams ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted/20 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Challenge Statistics */}
          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp size={20} />
                Challenge Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {teamStats.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Active Teams
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {submissions.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Submissions
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {teamStats.length > 0
                      ? Math.max(...teamStats.map((t) => t.maxLevel))
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Highest Level
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {submissions.length > 0
                      ? (
                          submissions.reduce(
                            (sum, s) => sum + s.difficulty_rating,
                            0,
                          ) / submissions.length
                        ).toFixed(1)
                      : "0"}/5
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Level Rating
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Details Dropdown */}
        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users size={20} />
              Team Submission Details
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Select a team to view their detailed submission history
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-input border-terminal-green-dim text-foreground">
                  <SelectValue placeholder="Select a team (101-160)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-terminal-green-dim max-h-60">
                  {teamOptions.map((team) => {
                    const teamData = teamStats.find((t) => t.teamId === team);
                    return (
                      <SelectItem
                        key={team}
                        value={team}
                        className="text-foreground"
                      >
                        Team {team}{" "}
                        {teamData
                          ? `(Level ${teamData.maxLevel}, ${teamData.submissions} submissions)`
                          : "(No submissions)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedTeamDetails && (
                <div className="mt-4 p-4 bg-terminal-green/5 rounded-lg border border-terminal-green-dim">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-terminal-green">
                      Team {selectedTeam}
                    </h3>
                    <Badge
                      variant="outline"
                      className={getLevelColor(selectedTeamDetails.maxLevel)}
                    >
                      Max Level: {selectedTeamDetails.maxLevel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-terminal-green border-terminal-green"
                    >
                      {selectedTeamDetails.totalSubmissions} Submissions
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-terminal-yellow border-terminal-yellow"
                    >
                      {selectedTeamDetails.averageRating}⭐ Avg Rating
                    </Badge>
                  </div>

                  {selectedTeamDetails.levels.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-terminal-green-dim">
                        Submission History:
                      </h4>
                      {selectedTeamDetails.levels.map((submission, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-card/50 rounded border border-terminal-green-dim"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={getLevelColor(submission.level)}
                            >
                              Level {submission.level}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {Array.from(
                                { length: submission.rating },
                                (_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    className="text-terminal-yellow"
                                    fill="currentColor"
                                  />
                                ),
                              )}
                              <span className="text-xs text-terminal-green-dim ml-1">
                                ({submission.rating}/5)
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-terminal-green-dim">
                            {formatDate(submission.time)}{" "}
                            {formatTime(submission.time)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reset Dialog */}
        {showResetDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-terminal-red rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-terminal-red mb-4">
                ⚠️ Reset All Submissions
              </h3>
              <p className="text-terminal-green-dim mb-4">
                This will permanently delete ALL submissions. This action cannot
                be undone.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-terminal-green text-sm font-medium">
                    Enter admin password:
                  </label>
                  <Input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="mt-1 bg-input border-terminal-red text-foreground"
                    placeholder="Admin password required"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowResetDialog(false);
                      setResetPassword("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={isResetting || !resetPassword}
                    className="flex-1 bg-terminal-red hover:bg-terminal-red/90 text-black"
                  >
                    {isResetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Resetting...
                      </>
                    ) : (
                      "Reset All"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
