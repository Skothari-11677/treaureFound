import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Users,
  Award,
  TrendingUp,
  FileText,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getTeamName } from "../lib/levels";
import { getTeamBranch, getBranchCategory, getAllBranches, BRANCH_CATEGORIES } from "../lib/teamBranches";
import MatrixBackground from "../components/MatrixBackground";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface Submission {
  id: number;
  team_id: string;
  level: number;
  password: string;
  difficulty_rating: number;
  created_at: string;
}

interface TeamAnalytics {
  teamId: string;
  teamName: string;
  branch: string;
  branchCategory: string;
  maxLevel: number;
  submissions: number;
  avgRating: number;
  firstSubmission: string;
  lastSubmission: string;
}

interface BranchStats {
  branch: string;
  teams: number;
  avgLevel: number;
  totalSubmissions: number;
  category: string;
}

interface LevelDistribution {
  level: number;
  teams: number;
  branches: { [key: string]: number };
}

const CHART_COLORS = ["#00ff00", "#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#ff9500", "#e91e63", "#9c27b0"];

export default function EventSummary() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<LevelDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEventData();
  }, []);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("❌ Failed to load event data");
        return;
      }

      const filteredData = (data || []).filter(
        (submission) => submission.team_id !== "999"
      );

      setSubmissions(filteredData);
      processAnalytics(filteredData);
      toast.success("✅ Event data loaded successfully");
    } catch (error) {
      toast.error("❌ Failed to connect to database");
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalytics = (submissions: Submission[]) => {
    // Process team analytics
    const teamMap = new Map<string, TeamAnalytics>();

    submissions.forEach((sub) => {
      const existing = teamMap.get(sub.team_id);
      const branch = getTeamBranch(sub.team_id);
      const branchCategory = getBranchCategory(branch);

      if (!existing || sub.level > existing.maxLevel) {
        teamMap.set(sub.team_id, {
          teamId: sub.team_id,
          teamName: getTeamName(sub.team_id),
          branch,
          branchCategory,
          maxLevel: sub.level,
          submissions: (existing?.submissions || 0) + 1,
          avgRating: existing
            ? (existing.avgRating * existing.submissions + sub.difficulty_rating) /
              ((existing.submissions || 0) + 1)
            : sub.difficulty_rating,
          firstSubmission: existing?.firstSubmission || sub.created_at,
          lastSubmission: sub.created_at,
        });
      } else {
        teamMap.set(sub.team_id, {
          ...existing,
          submissions: existing.submissions + 1,
          avgRating:
            (existing.avgRating * (existing.submissions - 1) + sub.difficulty_rating) /
            existing.submissions,
          lastSubmission: sub.created_at,
        });
      }
    });

    const analytics = Array.from(teamMap.values());
    setTeamAnalytics(analytics);

    // Process branch statistics
    const branchMap = new Map<string, BranchStats>();
    analytics.forEach((team) => {
      const existing = branchMap.get(team.branch);
      if (existing) {
        existing.teams += 1;
        existing.avgLevel = (existing.avgLevel + team.maxLevel) / 2;
        existing.totalSubmissions += team.submissions;
      } else {
        branchMap.set(team.branch, {
          branch: team.branch,
          teams: 1,
          avgLevel: team.maxLevel,
          totalSubmissions: team.submissions,
          category: team.branchCategory,
        });
      }
    });

    setBranchStats(Array.from(branchMap.values()));

    // Process level distribution
    const levelMap = new Map<number, LevelDistribution>();
    for (let level = 1; level <= 10; level++) {
      levelMap.set(level, {
        level,
        teams: 0,
        branches: {},
      });
    }

    analytics.forEach((team) => {
      for (let level = 1; level <= team.maxLevel; level++) {
        const levelData = levelMap.get(level)!;
        levelData.teams += 1;
        levelData.branches[team.branch] = (levelData.branches[team.branch] || 0) + 1;
      }
    });

    setLevelDistribution(Array.from(levelMap.values()));
  };

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      // Generate comprehensive HTML report
      const reportHTML = generateHTMLReport();
      
      // Convert to blob and download
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `treasure-in-shell-event-summary-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("📄 Report downloaded successfully!");
    } catch (error) {
      toast.error("❌ Failed to generate report");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateHTMLReport = (): string => {
    const topPerformers = teamAnalytics
      .sort((a, b) => b.maxLevel - a.maxLevel || new Date(a.firstSubmission).getTime() - new Date(b.firstSubmission).getTime())
      .slice(0, 10);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Treasure in the Shell - Event Summary Report</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background: #0a0a0a; color: #00ff00; }
        .header { text-align: center; border-bottom: 2px solid #00ff00; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { border: 1px solid #00ff00; padding: 15px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #00ff00; padding: 8px; text-align: left; }
        th { background-color: #003300; }
        .top-team { background-color: #001a00; }
        .branch-cs { color: #ffd700; }
        .branch-it { color: #4ecdc4; }
        .branch-ei { color: #ff6b6b; }
        .branch-mixed { color: #e91e63; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 TREASURE IN THE SHELL 🏆</h1>
        <h2>Event Summary Report</h2>
        <p>Google Developer Groups • IET DAVV</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>📊 Event Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${teamAnalytics.length}</h3>
                <p>Total Teams Participated</p>
            </div>
            <div class="stat-card">
                <h3>${submissions.length}</h3>
                <p>Total Submissions</p>
            </div>
            <div class="stat-card">
                <h3>${teamAnalytics.length > 0 ? Math.max(...teamAnalytics.map(t => t.maxLevel)) : 0}</h3>
                <p>Highest Level Reached</p>
            </div>
            <div class="stat-card">
                <h3>${branchStats.length}</h3>
                <p>Different Branches</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🏅 Top 10 Performers</h2>
        <table>
            <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Branch</th>
                <th>Max Level</th>
                <th>Submissions</th>
                <th>Avg Rating</th>
            </tr>
            ${topPerformers.map((team, index) => `
                <tr class="${index < 3 ? 'top-team' : ''}">
                    <td>${index + 1}</td>
                    <td>${team.teamId} - ${team.teamName}</td>
                    <td class="branch-${team.branchCategory.toLowerCase().replace(' ', '-')}">${team.branch}</td>
                    <td>${team.maxLevel}</td>
                    <td>${team.submissions}</td>
                    <td>${team.avgRating.toFixed(1)}/5</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>🎓 Branch-wise Performance</h2>
        <table>
            <tr>
                <th>Branch</th>
                <th>Teams</th>
                <th>Avg Level</th>
                <th>Total Submissions</th>
                <th>Category</th>
            </tr>
            ${branchStats.map(branch => `
                <tr>
                    <td>${branch.branch}</td>
                    <td>${branch.teams}</td>
                    <td>${branch.avgLevel.toFixed(1)}</td>
                    <td>${branch.totalSubmissions}</td>
                    <td class="branch-${branch.category.toLowerCase().replace(' ', '-')}">${branch.category}</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>📈 Level Progression</h2>
        <table>
            <tr>
                <th>Level</th>
                <th>Teams Reached</th>
                <th>Completion Rate</th>
            </tr>
            ${levelDistribution.map(level => `
                <tr>
                    <td>Level ${level.level}</td>
                    <td>${level.teams}</td>
                    <td>${((level.teams / teamAnalytics.length) * 100).toFixed(1)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>🏆 Event Conclusion</h2>
        <p>The "Treasure in the Shell" event was a tremendous success with ${teamAnalytics.length} teams participating across multiple engineering branches. The challenging terminal puzzle encouraged collaborative problem-solving and showcased the technical skills of our participants.</p>
        
        <h3>Key Highlights:</h3>
        <ul>
            <li>Multi-branch participation showing diverse technical interest</li>
            <li>Progressive difficulty levels providing appropriate challenge</li>
            <li>Strong engagement with ${submissions.length} total submissions</li>
            <li>Competitive spirit with teams reaching up to Level ${teamAnalytics.length > 0 ? Math.max(...teamAnalytics.map(t => t.maxLevel)) : 0}</li>
        </ul>
    </div>

    <footer style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #00ff00;">
        <p>📡 Generated by Treasure in the Shell Event System</p>
        <p>🤖 Powered by GDG IET DAVV</p>
    </footer>
</body>
</html>`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background terminal-bg p-4 flex items-center justify-center">
        <MatrixBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-terminal-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-terminal-green font-mono">Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background terminal-bg p-4">
      <MatrixBackground />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-terminal-green hover:bg-terminal-green/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-terminal-green">
              📊 Event Summary Analytics
            </h1>
            <p className="text-terminal-green-dim">
              Comprehensive analysis of "Treasure in the Shell" event
            </p>
          </div>
          <Button
            onClick={generatePDFReport}
            disabled={isGeneratingPDF}
            className="bg-gradient-to-r from-terminal-green to-terminal-cyan hover:from-terminal-green/80 hover:to-terminal-cyan/80 text-black font-bold"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </>
            )}
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{teamAnalytics.length}</div>
              <p className="text-sm text-terminal-green-dim">Participated in event</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{submissions.length}</div>
              <p className="text-sm text-terminal-green-dim">Total attempts made</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Award className="w-5 h-5" />
                Max Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {teamAnalytics.length > 0 ? Math.max(...teamAnalytics.map(t => t.maxLevel)) : 0}
              </div>
              <p className="text-sm text-terminal-green-dim">Highest level reached</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Branches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{branchStats.length}</div>
              <p className="text-sm text-terminal-green-dim">Different branches</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Level Distribution Chart */}
          <Card className="bg-card/80 border-terminal-green">
            <CardHeader>
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Level Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={levelDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00ff0030" />
                  <XAxis 
                    dataKey="level" 
                    stroke="#00ff00" 
                    fontSize={12}
                    tickFormatter={(value) => `L${value}`}
                  />
                  <YAxis stroke="#00ff00" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#001a00', 
                      border: '1px solid #00ff00',
                      color: '#00ff00'
                    }}
                  />
                  <Bar dataKey="teams" fill="#00ff00" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Branch Distribution Pie Chart */}
          <Card className="bg-card/80 border-terminal-green">
            <CardHeader>
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Users className="w-5 h-5" />
                Branch Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={branchStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ branch, teams }) => `${branch}: ${teams}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="teams"
                  >
                    {branchStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#001a00', 
                      border: '1px solid #00ff00',
                      color: '#00ff00'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers Table */}
        <Card className="bg-card/80 border-terminal-green">
          <CardHeader>
            <CardTitle className="text-terminal-green flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-terminal-green/30">
                    <th className="text-left p-3 text-terminal-green">Rank</th>
                    <th className="text-left p-3 text-terminal-green">Team</th>
                    <th className="text-left p-3 text-terminal-green">Branch</th>
                    <th className="text-left p-3 text-terminal-green">Max Level</th>
                    <th className="text-left p-3 text-terminal-green">Submissions</th>
                    <th className="text-left p-3 text-terminal-green">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {teamAnalytics
                    .sort((a, b) => b.maxLevel - a.maxLevel || new Date(a.firstSubmission).getTime() - new Date(b.firstSubmission).getTime())
                    .slice(0, 10)
                    .map((team, index) => (
                      <tr key={team.teamId} className="border-b border-terminal-green/10">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-bold">#{index + 1}</span>
                            {index < 3 && (
                              <Badge variant="outline" className="text-xs">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-semibold text-foreground">Team {team.teamId}</div>
                            <div className="text-sm text-terminal-green-dim">{team.teamName}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {team.branch}
                          </Badge>
                        </td>
                        <td className="p-3 text-foreground font-bold">Level {team.maxLevel}</td>
                        <td className="p-3 text-foreground">{team.submissions}</td>
                        <td className="p-3 text-foreground">{team.avgRating.toFixed(1)}/5</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Branch Statistics */}
        <Card className="bg-card/80 border-terminal-green">
          <CardHeader>
            <CardTitle className="text-terminal-green flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Branch-wise Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchStats.map((branch, index) => (
                <div
                  key={branch.branch}
                  className="p-4 border border-terminal-green/30 rounded bg-terminal-green/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{branch.branch}</h3>
                    <Badge variant="outline" className="text-xs">
                      {branch.category}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-terminal-green-dim">Teams:</span>
                      <span className="text-foreground">{branch.teams}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green-dim">Avg Level:</span>
                      <span className="text-foreground">{branch.avgLevel.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green-dim">Submissions:</span>
                      <span className="text-foreground">{branch.totalSubmissions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
