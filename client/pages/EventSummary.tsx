import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Users,
  Award,
  TrendingUp,
  FileText,
  Clock,
  Target,
  Zap,
  Brain,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getTeamName } from "../lib/levels";
import { getTeamBranch, getBranchCategory } from "../lib/teamBranches";
import MatrixBackground from "../components/MatrixBackground";

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
  timeToComplete: number; // minutes
}

interface BranchStats {
  branch: string;
  teams: number;
  avgLevel: number;
  totalSubmissions: number;
  category: string;
  avgTimeToComplete: number;
  topTeam: string;
}

interface LevelAnalytics {
  level: number;
  teamsReached: number;
  avgRating: number;
  avgTimeToReach: number;
  branchDistribution: { [key: string]: number };
  completionRate: number;
}

interface ComprehensiveStats {
  eventDuration: number;
  mostChallengingLevel: number;
  fastestTeam: { teamId: string; timeToComplete: number };
  mostPersistentTeam: { teamId: string; submissions: number };
  branchDominance: string;
}

export default function EventSummary() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [levelAnalytics, setLevelAnalytics] = useState<LevelAnalytics[]>([]);
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  // Chart refs for generating images
  const levelChartRef = useRef<HTMLCanvasElement>(null);
  const branchChartRef = useRef<HTMLCanvasElement>(null);
  const difficultyChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadEventData();
  }, []);

  useEffect(() => {
    if (teamAnalytics.length > 0) {
      generateCharts();
    }
  }, [teamAnalytics, levelAnalytics, branchStats]);

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
      processComprehensiveAnalytics(filteredData);
      toast.success("✅ Event data loaded successfully");
    } catch (error) {
      toast.error("❌ Failed to connect to database");
    } finally {
      setIsLoading(false);
    }
  };

  const safeValue = (value: any, fallback: any = "N/A") => {
    return value !== undefined && value !== null && !isNaN(value) ? value : fallback;
  };

  const safeString = (value: any, fallback: string = "Unknown") => {
    return value && value.toString().trim() !== "" ? value.toString() : fallback;
  };

  const processComprehensiveAnalytics = (submissions: Submission[]) => {
    if (!submissions || submissions.length === 0) {
      setTeamAnalytics([]);
      setBranchStats([]);
      setLevelAnalytics([]);
      setComprehensiveStats(null);
      return;
    }

    // Process team analytics
    const teamMap = new Map<string, TeamAnalytics>();

    submissions.forEach((sub) => {
      if (!sub.team_id || !sub.level || !sub.created_at) return;
      
      const existing = teamMap.get(sub.team_id);
      const branch = safeString(getTeamBranch(sub.team_id));
      const branchCategory = safeString(getBranchCategory(branch));
      const submissionTime = new Date(sub.created_at);

      if (!existing) {
        teamMap.set(sub.team_id, {
          teamId: sub.team_id,
          teamName: safeString(getTeamName(sub.team_id)),
          branch,
          branchCategory,
          maxLevel: safeValue(sub.level, 0),
          submissions: 1,
          avgRating: safeValue(sub.difficulty_rating, 0),
          firstSubmission: sub.created_at,
          lastSubmission: sub.created_at,
          timeToComplete: 0,
        });
      } else {
        const timeToComplete = submissionTime.getTime() - new Date(existing.firstSubmission).getTime();
        teamMap.set(sub.team_id, {
          ...existing,
          maxLevel: Math.max(existing.maxLevel, safeValue(sub.level, 0)),
          submissions: existing.submissions + 1,
          avgRating: (existing.avgRating * existing.submissions + safeValue(sub.difficulty_rating, 0)) / (existing.submissions + 1),
          lastSubmission: sub.created_at,
          timeToComplete: safeValue(timeToComplete / (1000 * 60), 0), // Convert to minutes
        });
      }
    });

    const analytics = Array.from(teamMap.values()).filter(team => team.teamId && team.maxLevel > 0);
    setTeamAnalytics(analytics);

    // Process branch statistics
    const branchMap = new Map<string, BranchStats>();
    analytics.forEach((team) => {
      const existing = branchMap.get(team.branch);
      if (existing) {
        existing.teams += 1;
        existing.avgLevel = (existing.avgLevel * (existing.teams - 1) + team.maxLevel) / existing.teams;
        existing.totalSubmissions += team.submissions;
        existing.avgTimeToComplete = (existing.avgTimeToComplete * (existing.teams - 1) + team.timeToComplete) / existing.teams;
        
        const currentTopTeam = analytics.find(t => t.teamId === existing.topTeam);
        if (team.maxLevel > (currentTopTeam?.maxLevel || 0)) {
          existing.topTeam = team.teamId;
        }
      } else {
        branchMap.set(team.branch, {
          branch: team.branch,
          teams: 1,
          avgLevel: team.maxLevel,
          totalSubmissions: team.submissions,
          category: team.branchCategory,
          avgTimeToComplete: team.timeToComplete,
          topTeam: team.teamId,
        });
      }
    });
    setBranchStats(Array.from(branchMap.values()));

    // Process level analytics
    const levelMap = new Map<number, LevelAnalytics>();
    for (let level = 1; level <= 10; level++) {
      const teamsAtLevel = analytics.filter(team => team.maxLevel >= level);
      const levelSubmissions = submissions.filter(sub => sub.level === level);
      const avgRating = levelSubmissions.length > 0 
        ? levelSubmissions.reduce((sum, sub) => sum + safeValue(sub.difficulty_rating, 0), 0) / levelSubmissions.length 
        : 0;
      
      const branchDistribution: { [key: string]: number } = {};
      teamsAtLevel.forEach(team => {
        if (team.branch) {
          branchDistribution[team.branch] = (branchDistribution[team.branch] || 0) + 1;
        }
      });

      levelMap.set(level, {
        level,
        teamsReached: teamsAtLevel.length,
        avgRating: safeValue(avgRating, 0),
        avgTimeToReach: teamsAtLevel.length > 0 
          ? teamsAtLevel.reduce((sum, team) => sum + team.timeToComplete, 0) / teamsAtLevel.length 
          : 0,
        branchDistribution,
        completionRate: analytics.length > 0 ? (teamsAtLevel.length / analytics.length) * 100 : 0,
      });
    }
    setLevelAnalytics(Array.from(levelMap.values()));

    // Generate comprehensive stats
    generateComprehensiveStats(analytics, submissions);
  };

  const generateComprehensiveStats = (analytics: TeamAnalytics[], submissions: Submission[]) => {
    if (!analytics.length || !submissions.length) {
      setComprehensiveStats(null);
      return;
    }

    const eventStart = new Date(Math.min(...submissions.map(s => new Date(s.created_at).getTime())));
    const eventEnd = new Date(Math.max(...submissions.map(s => new Date(s.created_at).getTime())));
    const eventDuration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60); // hours

    // Most challenging level (lowest completion rate)
    const levelCompletionRates = levelAnalytics.filter(l => l.completionRate > 0);
    const mostChallenging = levelCompletionRates.length > 0 
      ? levelCompletionRates.reduce((min, curr) => curr.completionRate < min.completionRate ? curr : min)
      : { level: 1 };

    // Fastest team
    const teamsWithTime = analytics.filter(t => t.timeToComplete > 0);
    const fastestTeam = teamsWithTime.length > 0 
      ? teamsWithTime.reduce((fastest, curr) => curr.timeToComplete < fastest.timeToComplete ? curr : fastest)
      : analytics[0] || { teamId: "N/A", timeToComplete: 0 };

    // Most persistent team
    const mostPersistent = analytics.reduce((max, curr) => 
      curr.submissions > max.submissions ? curr : max
    );

    // Branch dominance
    const branchParticipation = new Map<string, number>();
    analytics.forEach(team => {
      if (team.branchCategory) {
        const category = team.branchCategory;
        branchParticipation.set(category, (branchParticipation.get(category) || 0) + 1);
      }
    });
    
    const dominantBranch = branchParticipation.size > 0 
      ? Array.from(branchParticipation.entries()).reduce((max, curr) => 
          curr[1] > max[1] ? curr : max
        )[0]
      : "Mixed";

    setComprehensiveStats({
      eventDuration: safeValue(Math.round(eventDuration * 10) / 10, 0),
      mostChallengingLevel: safeValue(mostChallenging.level, 1),
      fastestTeam: { 
        teamId: safeString(fastestTeam.teamId), 
        timeToComplete: safeValue(fastestTeam.timeToComplete, 0) 
      },
      mostPersistentTeam: { 
        teamId: safeString(mostPersistent.teamId), 
        submissions: safeValue(mostPersistent.submissions, 0) 
      },
      branchDominance: safeString(dominantBranch),
    });
  };

  const generateCharts = () => {
    generateLevelChart();
    generateBranchChart();
    generateDifficultyChart();
  };

  const generateLevelChart = () => {
    const canvas = levelChartRef.current;
    if (!canvas || !levelAnalytics.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 500;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Draw level progression chart
    const maxTeams = Math.max(...levelAnalytics.map(l => l.teamsReached), 1);
    const barWidth = 80;
    const spacing = 95;
    const startX = 60;
    const chartHeight = 350;
    const startY = 420;
    
    levelAnalytics.forEach((level, index) => {
      const barHeight = (level.teamsReached / maxTeams) * chartHeight;
      const x = startX + index * spacing;
      const y = startY - barHeight;
      
      // Draw bar
      ctx.fillStyle = '#00AA00';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw bar outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Draw level label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Level ${level.level}`, x + barWidth/2, startY + 25);
      
      // Draw count
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${level.teamsReached} teams`, x + barWidth/2, y - 10);
    });
    
    // Draw title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Teams Reaching Each Level', canvas.width/2, 40);
    
    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 430);
    ctx.lineTo(950, 430);
    ctx.moveTo(50, 60);
    ctx.lineTo(50, 430);
    ctx.stroke();
  };

  const generateBranchChart = () => {
    const canvas = branchChartRef.current;
    if (!canvas || !branchStats.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 500;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Draw pie chart for branch distribution
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 20;
    const radius = 150;
    
    const total = branchStats.reduce((sum, branch) => sum + branch.teams, 0);
    let currentAngle = 0;
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC', '#26A69A'];
    
    branchStats.forEach((branch, index) => {
      const sliceAngle = (branch.teams / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 50);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 50);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${branch.branch}`, labelX, labelY);
      ctx.fillText(`${branch.teams} teams`, labelX, labelY + 15);
      
      currentAngle += sliceAngle;
    });
    
    // Draw title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Branch Distribution', centerX, 40);
  };

  const generateDifficultyChart = () => {
    const canvas = difficultyChartRef.current;
    if (!canvas || !levelAnalytics.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 500;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Draw difficulty progression
    const barWidth = 80;
    const spacing = 95;
    const startX = 60;
    const chartHeight = 350;
    const startY = 420;
    
    levelAnalytics.forEach((level, index) => {
      const normalizedRating = Math.max(level.avgRating, 0);
      const barHeight = (normalizedRating / 5) * chartHeight;
      const x = startX + index * spacing;
      const y = startY - barHeight;
      
      // Color based on difficulty
      if (normalizedRating >= 4) ctx.fillStyle = '#FF6B6B';
      else if (normalizedRating >= 3) ctx.fillStyle = '#FFA726';
      else if (normalizedRating >= 2) ctx.fillStyle = '#66BB6A';
      else ctx.fillStyle = '#4ECDC4';
      
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw bar outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Draw level label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Level ${level.level}`, x + barWidth/2, startY + 25);
      
      // Draw rating
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${normalizedRating.toFixed(1)}/5`, x + barWidth/2, y - 10);
    });
    
    // Draw title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Average Difficulty Rating by Level', canvas.width/2, 40);
    
    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 430);
    ctx.lineTo(950, 430);
    ctx.moveTo(50, 60);
    ctx.lineTo(50, 430);
    ctx.stroke();
  };

  const generateComprehensiveReport = (): string => {
    const topPerformers = teamAnalytics
      .sort((a, b) => b.maxLevel - a.maxLevel || new Date(a.firstSubmission).getTime() - new Date(b.firstSubmission).getTime())
      .slice(0, 10);

    // Generate chart images as base64
    const levelChartData = levelChartRef.current?.toDataURL() || '';
    const branchChartData = branchChartRef.current?.toDataURL() || '';
    const difficultyChartData = difficultyChartRef.current?.toDataURL() || '';

    const stats = comprehensiveStats || {
      eventDuration: 0,
      mostChallengingLevel: 1,
      fastestTeam: { teamId: "N/A", timeToComplete: 0 },
      mostPersistentTeam: { teamId: "N/A", submissions: 0 },
      branchDominance: "Mixed"
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Treasure in the Shell - Event Report</title>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.4;
            color: #000000;
            background: #ffffff;
            font-size: 12px;
        }
        .page {
            page-break-after: always;
            padding: 20px;
        }
        .page:last-child {
            page-break-after: avoid;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #000000; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .header h2 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
        }
        .section h2 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #000000;
            padding-bottom: 5px;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            margin: 20px 0;
        }
        .stat-card { 
            border: 2px solid #000000; 
            padding: 15px; 
            text-align: center; 
            background: #f5f5f5;
        }
        .stat-card h3 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .chart-container {
            text-align: center;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .chart-container img {
            max-width: 100%;
            height: auto;
            border: 2px solid #000000;
        }
        .chart-container h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
            font-size: 10px;
        }
        th, td { 
            border: 1px solid #000000; 
            padding: 6px; 
            text-align: left; 
        }
        th { 
            background-color: #e0e0e0; 
            font-weight: bold;
        }
        .top-team { 
            background-color: #f0f0f0; 
            font-weight: bold;
        }
        .insight-box {
            background: #f9f9f9;
            border: 2px solid #000000;
            padding: 15px;
            margin: 15px 0;
        }
        .insight-box h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .insight-box ul {
            margin-left: 20px;
        }
        .insight-box li {
            margin-bottom: 5px;
        }
        @media print {
            .no-print { display: none; }
            body { font-size: 11px; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <h1>🏆 TREASURE IN THE SHELL 🏆</h1>
            <h2>Event Analytics Report</h2>
            <p><strong>Google Developer Groups • IET DAVV</strong></p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Event Duration: ${stats.eventDuration} hours</p>
        </div>

        <div class="section">
            <h2>📊 Executive Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${teamAnalytics.length}</h3>
                    <p><strong>Total Teams</strong></p>
                </div>
                <div class="stat-card">
                    <h3>${submissions.length}</h3>
                    <p><strong>Total Submissions</strong></p>
                </div>
                <div class="stat-card">
                    <h3>${teamAnalytics.length > 0 ? Math.max(...teamAnalytics.map(t => t.maxLevel)) : 0}</h3>
                    <p><strong>Highest Level</strong></p>
                </div>
                <div class="stat-card">
                    <h3>Level ${stats.mostChallengingLevel}</h3>
                    <p><strong>Most Challenging</strong></p>
                </div>
            </div>
            
            <div class="insight-box">
                <h3>🎯 Key Insights</h3>
                <ul>
                    <li><strong>Event Duration:</strong> ${stats.eventDuration} hours of continuous competition</li>
                    <li><strong>Fastest Team:</strong> Team ${stats.fastestTeam.teamId} completed in ${Math.round(stats.fastestTeam.timeToComplete)} minutes</li>
                    <li><strong>Most Persistent:</strong> Team ${stats.mostPersistentTeam.teamId} made ${stats.mostPersistentTeam.submissions} attempts</li>
                    <li><strong>Branch Dominance:</strong> ${stats.branchDominance} category had highest participation</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="page">
        <div class="section">
            <h2>📈 Visual Analytics</h2>
            
            <div class="chart-container">
                <h3>Level Progression Analysis</h3>
                <img src="${levelChartData}" alt="Level Progression Chart" />
                <p>Shows how many teams reached each difficulty level</p>
            </div>
        </div>
    </div>

    <div class="page">
        <div class="section">
            <div class="chart-container">
                <h3>Branch Participation Distribution</h3>
                <img src="${branchChartData}" alt="Branch Distribution Chart" />
                <p>Breakdown of participation by engineering branches</p>
            </div>
            
            <div class="chart-container">
                <h3>Difficulty Perception by Level</h3>
                <img src="${difficultyChartData}" alt="Difficulty Chart" />
                <p>Average difficulty rating given by teams for each level</p>
            </div>
        </div>
    </div>

    <div class="page">
        <div class="section">
            <h2>🏅 Performance Leaderboard</h2>
            <table>
                <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Branch</th>
                    <th>Max Level</th>
                    <th>Time (min)</th>
                    <th>Submissions</th>
                    <th>Avg Rating</th>
                    <th>Efficiency</th>
                </tr>
                ${topPerformers.map((team, index) => `
                    <tr class="${index < 3 ? 'top-team' : ''}">
                        <td>${index + 1}${index === 0 ? ' 🥇' : index === 1 ? ' 🥈' : index === 2 ? ' 🥉' : ''}</td>
                        <td>${team.teamId} - ${team.teamName}</td>
                        <td>${team.branch}</td>
                        <td><strong>${team.maxLevel}</strong></td>
                        <td>${Math.round(team.timeToComplete)}</td>
                        <td>${team.submissions}</td>
                        <td>${team.avgRating.toFixed(1)}/5</td>
                        <td>${((team.maxLevel / team.submissions) * 100).toFixed(0)}%</td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <div class="section">
            <h2>🎓 Branch Performance Analysis</h2>
            <table>
                <tr>
                    <th>Branch</th>
                    <th>Teams</th>
                    <th>Avg Level</th>
                    <th>Success Rate</th>
                    <th>Avg Time (min)</th>
                    <th>Top Performer</th>
                    <th>Category</th>
                </tr>
                ${branchStats.sort((a, b) => b.avgLevel - a.avgLevel).map(branch => `
                    <tr>
                        <td>${branch.branch}</td>
                        <td>${branch.teams}</td>
                        <td><strong>${branch.avgLevel.toFixed(1)}</strong></td>
                        <td>${((branch.avgLevel / 10) * 100).toFixed(0)}%</td>
                        <td>${Math.round(branch.avgTimeToComplete)}</td>
                        <td>Team ${branch.topTeam}</td>
                        <td>${branch.category}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    </div>

    <div class="page">
        <div class="section">
            <h2>📊 Level-by-Level Breakdown</h2>
            <table>
                <tr>
                    <th>Level</th>
                    <th>Teams Reached</th>
                    <th>Completion Rate</th>
                    <th>Avg Difficulty</th>
                    <th>Avg Time (min)</th>
                    <th>Top Branch</th>
                </tr>
                ${levelAnalytics.map(level => {
                  const topBranch = Object.entries(level.branchDistribution).length > 0 
                    ? Object.entries(level.branchDistribution).reduce((max, curr) => 
                        curr[1] > max[1] ? curr : max, ['N/A', 0]
                      )
                    : ['N/A', 0];
                  return `
                    <tr>
                        <td><strong>Level ${level.level}</strong></td>
                        <td>${level.teamsReached}</td>
                        <td>${level.completionRate.toFixed(1)}%</td>
                        <td>${level.avgRating.toFixed(1)}/5</td>
                        <td>${Math.round(level.avgTimeToReach)}</td>
                        <td>${topBranch[0]} (${topBranch[1]} teams)</td>
                    </tr>
                  `;
                }).join('')}
            </table>
        </div>

        <div class="section">
            <h2>🏆 Achievement Highlights</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>🚀 Speed Champion</h3>
                    <p><strong>Team ${stats.fastestTeam.teamId}</strong></p>
                    <small>${Math.round(stats.fastestTeam.timeToComplete)} minutes</small>
                </div>
                <div class="stat-card">
                    <h3>💪 Persistence Award</h3>
                    <p><strong>Team ${stats.mostPersistentTeam.teamId}</strong></p>
                    <small>${stats.mostPersistentTeam.submissions} attempts</small>
                </div>
                <div class="stat-card">
                    <h3>🎯 Perfect Efficiency</h3>
                    <p><strong>${teamAnalytics.filter(t => t.submissions === t.maxLevel).length} Teams</strong></p>
                    <small>Optimal submission rate</small>
                </div>
                <div class="stat-card">
                    <h3>🔥 Total Branches</h3>
                    <p><strong>${branchStats.length}</strong></p>
                    <small>Different specializations</small>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📝 Event Conclusion</h2>
            <div class="insight-box">
                <h3>🎉 Event Success Summary</h3>
                <p>The "Treasure in the Shell" event successfully engaged <strong>${teamAnalytics.length} teams</strong> 
                across <strong>${branchStats.length} different branches</strong>, generating <strong>${submissions.length} total submissions</strong> 
                over a <strong>${stats.eventDuration}-hour</strong> period. The progressive difficulty design effectively 
                challenged participants while maintaining engagement throughout the competition.</p>
            </div>
        </div>

        <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #000000;">
            <p><strong>Generated by Treasure in the Shell Analytics System</strong></p>
            <p>Powered by GDG IET DAVV • Data Science Division</p>
            <small>Report includes analysis of ${submissions.length} submissions from ${teamAnalytics.length} teams across ${branchStats.length} branches</small>
        </footer>
    </div>
</body>
</html>`;
  };

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      // Ensure charts are generated
      generateCharts();
      
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportHTML = generateComprehensiveReport();
      
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `treasure-in-shell-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("📊 Print-ready report downloaded! Use Ctrl+P to print as PDF");
    } catch (error) {
      toast.error("❌ Failed to generate report");
    } finally {
      setIsGeneratingPDF(false);
    }
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
      
      {/* Hidden canvases for chart generation */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <canvas ref={levelChartRef} />
        <canvas ref={branchChartRef} />
        <canvas ref={difficultyChartRef} />
      </div>

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
              📊 Event Summary Report
            </h1>
            <p className="text-terminal-green-dim">
              Professional analytics for "Treasure in the Shell" event
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
                Download PDF Report
              </>
            )}
          </Button>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Event Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {comprehensiveStats?.eventDuration || 0}h
              </div>
              <p className="text-sm text-terminal-green-dim">Total time</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Fastest Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {comprehensiveStats?.fastestTeam.teamId || "N/A"}
              </div>
              <p className="text-sm text-terminal-green-dim">
                {Math.round(comprehensiveStats?.fastestTeam.timeToComplete || 0)} minutes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Hardest Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Level {comprehensiveStats?.mostChallengingLevel || 1}
              </div>
              <p className="text-sm text-terminal-green-dim">Most challenging</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Target className="w-5 h-5" />
                Perfect Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {teamAnalytics.filter(t => t.submissions === t.maxLevel).length}
              </div>
              <p className="text-sm text-terminal-green-dim">Optimal efficiency</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-terminal-green/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-terminal-green/20">
              Top Teams
            </TabsTrigger>
            <TabsTrigger value="branches" className="data-[state=active]:bg-terminal-green/20">
              Branches
            </TabsTrigger>
            <TabsTrigger value="levels" className="data-[state=active]:bg-terminal-green/20">
              Level Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-card/80 border-terminal-green">
              <CardHeader>
                <CardTitle className="text-terminal-green flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top 10 Performers
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
                        <th className="text-left p-3 text-terminal-green">Level</th>
                        <th className="text-left p-3 text-terminal-green">Time</th>
                        <th className="text-left p-3 text-terminal-green">Efficiency</th>
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
                            <td className="p-3 text-foreground">{Math.round(team.timeToComplete)}m</td>
                            <td className="p-3 text-foreground">
                              {((team.maxLevel / team.submissions) * 100).toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            <Card className="bg-card/80 border-terminal-green">
              <CardHeader>
                <CardTitle className="text-terminal-green flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Branch Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchStats.sort((a, b) => b.avgLevel - a.avgLevel).map((branch) => (
                    <div
                      key={branch.branch}
                      className="p-4 border border-terminal-green/30 rounded bg-gradient-to-br from-terminal-green/5 to-terminal-cyan/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{branch.branch}</h3>
                        <Badge variant="outline" className="text-xs">
                          {branch.category}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-terminal-green-dim">Teams:</span>
                          <span className="text-foreground font-bold">{branch.teams}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-terminal-green-dim">Avg Level:</span>
                          <span className="text-foreground font-bold">{branch.avgLevel.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-terminal-green-dim">Success Rate:</span>
                          <span className="text-foreground">{((branch.avgLevel / 10) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-terminal-green-dim">Top Team:</span>
                          <span className="text-terminal-cyan">Team {branch.topTeam}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels" className="space-y-6">
            <Card className="bg-card/80 border-terminal-green">
              <CardHeader>
                <CardTitle className="text-terminal-green flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Level-by-Level Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-terminal-green/30">
                        <th className="text-left p-3 text-terminal-green">Level</th>
                        <th className="text-left p-3 text-terminal-green">Teams</th>
                        <th className="text-left p-3 text-terminal-green">Completion</th>
                        <th className="text-left p-3 text-terminal-green">Difficulty</th>
                        <th className="text-left p-3 text-terminal-green">Leading Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelAnalytics.map((level) => {
                        const topBranch = Object.entries(level.branchDistribution).length > 0
                          ? Object.entries(level.branchDistribution).reduce(
                              (max, curr) => (curr[1] > max[1] ? curr : max),
                              ['N/A', 0]
                            )
                          : ['N/A', 0];
                        
                        return (
                          <tr key={level.level} className="border-b border-terminal-green/10">
                            <td className="p-3">
                              <Badge variant="outline" className="font-bold">
                                Level {level.level}
                              </Badge>
                            </td>
                            <td className="p-3 text-foreground font-bold">{level.teamsReached}</td>
                            <td className="p-3 text-foreground">{level.completionRate.toFixed(1)}%</td>
                            <td className="p-3 text-foreground">
                              {level.avgRating.toFixed(1)}/5
                            </td>
                            <td className="p-3 text-terminal-cyan">
                              {topBranch[0]} ({topBranch[1]})
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
