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
  Calendar,
  Clock,
  Target,
  Zap,
  Brain,
  Trophy,
  Activity,
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
  submissionPattern: { level: number; time: string; rating: number }[];
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

interface TimelineData {
  hour: string;
  submissions: number;
  uniqueTeams: number;
  avgLevel: number;
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
  eventDuration: number; // hours
  peakActivityHour: string;
  mostChallengingLevel: number;
  fastestTeam: { teamId: string; timeToComplete: number };
  mostPersistentTeam: { teamId: string; submissions: number };
  branchDominance: string;
  participationTrend: "increasing" | "decreasing" | "steady";
}

export default function EventSummary() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [levelAnalytics, setLevelAnalytics] = useState<LevelAnalytics[]>([]);
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  // Chart refs for generating images
  const levelChartRef = useRef<HTMLCanvasElement>(null);
  const branchChartRef = useRef<HTMLCanvasElement>(null);
  const timelineChartRef = useRef<HTMLCanvasElement>(null);
  const difficultyChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadEventData();
  }, []);

  useEffect(() => {
    if (teamAnalytics.length > 0) {
      generateCharts();
    }
  }, [teamAnalytics, levelAnalytics, timelineData, branchStats]);

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

  const processComprehensiveAnalytics = (submissions: Submission[]) => {
    // Process team analytics with detailed patterns
    const teamMap = new Map<string, TeamAnalytics>();

    submissions.forEach((sub) => {
      const existing = teamMap.get(sub.team_id);
      const branch = getTeamBranch(sub.team_id);
      const branchCategory = getBranchCategory(branch);
      const submissionTime = new Date(sub.created_at);

      if (!existing) {
        teamMap.set(sub.team_id, {
          teamId: sub.team_id,
          teamName: getTeamName(sub.team_id),
          branch,
          branchCategory,
          maxLevel: sub.level,
          submissions: 1,
          avgRating: sub.difficulty_rating,
          firstSubmission: sub.created_at,
          lastSubmission: sub.created_at,
          timeToComplete: 0,
          submissionPattern: [{ level: sub.level, time: sub.created_at, rating: sub.difficulty_rating }],
        });
      } else {
        const updatedPattern = [...existing.submissionPattern, { level: sub.level, time: sub.created_at, rating: sub.difficulty_rating }];
        teamMap.set(sub.team_id, {
          ...existing,
          maxLevel: Math.max(existing.maxLevel, sub.level),
          submissions: existing.submissions + 1,
          avgRating: (existing.avgRating * existing.submissions + sub.difficulty_rating) / (existing.submissions + 1),
          lastSubmission: sub.created_at,
          timeToComplete: submissionTime.getTime() - new Date(existing.firstSubmission).getTime(),
          submissionPattern: updatedPattern,
        });
      }
    });

    const analytics = Array.from(teamMap.values()).map(team => ({
      ...team,
      timeToComplete: team.timeToComplete / (1000 * 60), // Convert to minutes
    }));
    setTeamAnalytics(analytics);

    // Process branch statistics with enhanced metrics
    const branchMap = new Map<string, BranchStats>();
    analytics.forEach((team) => {
      const existing = branchMap.get(team.branch);
      if (existing) {
        existing.teams += 1;
        existing.avgLevel = (existing.avgLevel * (existing.teams - 1) + team.maxLevel) / existing.teams;
        existing.totalSubmissions += team.submissions;
        existing.avgTimeToComplete = (existing.avgTimeToComplete * (existing.teams - 1) + team.timeToComplete) / existing.teams;
        if (team.maxLevel > analytics.find(t => t.teamId === existing.topTeam)?.maxLevel || 0) {
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

    // Process timeline data
    const timelineMap = new Map<string, TimelineData>();
    submissions.forEach((sub) => {
      const hour = new Date(sub.created_at).getHours().toString().padStart(2, '0') + ':00';
      const existing = timelineMap.get(hour);
      if (existing) {
        existing.submissions += 1;
        existing.avgLevel = (existing.avgLevel * existing.submissions + sub.level) / (existing.submissions + 1);
      } else {
        timelineMap.set(hour, {
          hour,
          submissions: 1,
          uniqueTeams: 1,
          avgLevel: sub.level,
        });
      }
    });
    setTimelineData(Array.from(timelineMap.values()).sort((a, b) => a.hour.localeCompare(b.hour)));

    // Process level analytics
    const levelMap = new Map<number, LevelAnalytics>();
    for (let level = 1; level <= 10; level++) {
      const teamsAtLevel = analytics.filter(team => team.maxLevel >= level);
      const levelSubmissions = submissions.filter(sub => sub.level === level);
      const avgRating = levelSubmissions.length > 0 
        ? levelSubmissions.reduce((sum, sub) => sum + sub.difficulty_rating, 0) / levelSubmissions.length 
        : 0;
      
      const branchDistribution: { [key: string]: number } = {};
      teamsAtLevel.forEach(team => {
        branchDistribution[team.branch] = (branchDistribution[team.branch] || 0) + 1;
      });

      levelMap.set(level, {
        level,
        teamsReached: teamsAtLevel.length,
        avgRating,
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
    const eventStart = new Date(Math.min(...submissions.map(s => new Date(s.created_at).getTime())));
    const eventEnd = new Date(Math.max(...submissions.map(s => new Date(s.created_at).getTime())));
    const eventDuration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60); // hours

    // Find peak activity hour
    const hourlyActivity = new Map<number, number>();
    submissions.forEach(sub => {
      const hour = new Date(sub.created_at).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    });
    const peakHour = Array.from(hourlyActivity.entries()).reduce((max, curr) => 
      curr[1] > max[1] ? curr : max
    )[0];

    // Most challenging level (lowest completion rate)
    const mostChallenging = levelAnalytics.reduce((min, curr) => 
      curr.completionRate < min.completionRate ? curr : min
    );

    // Fastest team
    const fastestTeam = analytics.reduce((fastest, curr) => 
      curr.timeToComplete < fastest.timeToComplete ? curr : fastest
    );

    // Most persistent team
    const mostPersistent = analytics.reduce((max, curr) => 
      curr.submissions > max.submissions ? curr : max
    );

    // Branch dominance
    const branchParticipation = new Map<string, number>();
    analytics.forEach(team => {
      const category = team.branchCategory;
      branchParticipation.set(category, (branchParticipation.get(category) || 0) + 1);
    });
    const dominantBranch = Array.from(branchParticipation.entries()).reduce((max, curr) => 
      curr[1] > max[1] ? curr : max
    )[0];

    setComprehensiveStats({
      eventDuration: Math.round(eventDuration * 10) / 10,
      peakActivityHour: `${peakHour.toString().padStart(2, '0')}:00`,
      mostChallengingLevel: mostChallenging.level,
      fastestTeam: { teamId: fastestTeam.teamId, timeToComplete: fastestTeam.timeToComplete },
      mostPersistentTeam: { teamId: mostPersistent.teamId, submissions: mostPersistent.submissions },
      branchDominance: dominantBranch,
      participationTrend: "steady", // Could be calculated based on timeline
    });
  };

  const generateCharts = () => {
    // Generate charts using Canvas API for embedding in reports
    generateLevelChart();
    generateBranchChart();
    generateTimelineChart();
    generateDifficultyChart();
  };

  const generateLevelChart = () => {
    const canvas = levelChartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw level progression chart
    const maxTeams = Math.max(...levelAnalytics.map(l => l.teamsReached));
    const barWidth = 60;
    const spacing = 80;
    const startX = 50;
    const chartHeight = 300;
    const startY = 350;
    
    levelAnalytics.forEach((level, index) => {
      const barHeight = (level.teamsReached / maxTeams) * chartHeight;
      const x = startX + index * spacing;
      const y = startY - barHeight;
      
      // Draw bar
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw level label
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L${level.level}`, x + barWidth/2, startY + 20);
      
      // Draw count
      ctx.fillText(level.teamsReached.toString(), x + barWidth/2, y - 10);
    });
    
    // Draw title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Level Progression', canvas.width/2, 30);
  };

  const generateBranchChart = () => {
    const canvas = branchChartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pie chart for branch distribution
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;
    
    const total = branchStats.reduce((sum, branch) => sum + branch.teams, 0);
    let currentAngle = 0;
    
    const colors = ['#00ff00', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#ff9500', '#e91e63'];
    
    branchStats.forEach((branch, index) => {
      const sliceAngle = (branch.teams / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${branch.branch}: ${branch.teams}`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
    
    // Draw title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Branch Distribution', centerX, 30);
  };

  const generateTimelineChart = () => {
    const canvas = timelineChartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw timeline chart
    if (timelineData.length === 0) return;
    
    const maxSubmissions = Math.max(...timelineData.map(t => t.submissions));
    const pointSpacing = (canvas.width - 100) / timelineData.length;
    const chartHeight = 300;
    const startY = 350;
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    timelineData.forEach((data, index) => {
      const x = 50 + index * pointSpacing;
      const y = startY - (data.submissions / maxSubmissions) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw hour label
      ctx.fillStyle = '#00ff00';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data.hour, x, startY + 20);
    });
    
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Submission Timeline', canvas.width/2, 30);
  };

  const generateDifficultyChart = () => {
    const canvas = difficultyChartRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw difficulty progression
    const barWidth = 60;
    const spacing = 80;
    const startX = 50;
    const chartHeight = 300;
    const startY = 350;
    
    levelAnalytics.forEach((level, index) => {
      const barHeight = (level.avgRating / 5) * chartHeight;
      const x = startX + index * spacing;
      const y = startY - barHeight;
      
      // Color based on difficulty
      const difficulty = level.avgRating;
      if (difficulty >= 4) ctx.fillStyle = '#ff6b6b';
      else if (difficulty >= 3) ctx.fillStyle = '#ffd700';
      else ctx.fillStyle = '#00ff00';
      
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw level label
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L${level.level}`, x + barWidth/2, startY + 20);
      
      // Draw rating
      ctx.fillText(level.avgRating.toFixed(1), x + barWidth/2, y - 10);
    });
    
    // Draw title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Average Difficulty Rating by Level', canvas.width/2, 30);
  };

  const generateComprehensiveReport = (): string => {
    const topPerformers = teamAnalytics
      .sort((a, b) => b.maxLevel - a.maxLevel || new Date(a.firstSubmission).getTime() - new Date(b.firstSubmission).getTime())
      .slice(0, 10);

    // Generate chart images as base64
    const levelChartData = levelChartRef.current?.toDataURL() || '';
    const branchChartData = branchChartRef.current?.toDataURL() || '';
    const timelineChartData = timelineChartRef.current?.toDataURL() || '';
    const difficultyChartData = difficultyChartRef.current?.toDataURL() || '';

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Treasure in the Shell - Comprehensive Event Report</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            margin: 20px; 
            background: #0a0a0a; 
            color: #00ff00;
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #00ff00; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .section { 
            margin-bottom: 40px; 
            page-break-inside: avoid;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0;
        }
        .stat-card { 
            border: 1px solid #00ff00; 
            padding: 15px; 
            text-align: center; 
            background: #001a00;
        }
        .chart-container {
            text-align: center;
            margin: 30px 0;
            background: #001a00;
            padding: 20px;
            border: 1px solid #00ff00;
        }
        .chart-container img {
            max-width: 100%;
            height: auto;
            border: 1px solid #00ff0050;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
        }
        th, td { 
            border: 1px solid #00ff00; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background-color: #003300; 
        }
        .top-team { 
            background-color: #001a00; 
        }
        .highlight-stat {
            background: linear-gradient(45deg, #003300, #001a00);
            border: 2px solid #ffd700;
            color: #ffd700;
        }
        .insight-box {
            background: #001a00;
            border-left: 4px solid #00ff00;
            padding: 15px;
            margin: 20px 0;
        }
        .branch-cs { color: #ffd700; }
        .branch-it { color: #4ecdc4; }
        .branch-electronics { color: #ff6b6b; }
        .branch-mixed { color: #e91e63; }
        @media print {
            body { background: white; color: black; }
            .chart-container { background: white; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 TREASURE IN THE SHELL 🏆</h1>
        <h2>Comprehensive Event Analytics Report</h2>
        <p>Google Developer Groups • IET DAVV</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Analysis Period: ${comprehensiveStats?.eventDuration.toFixed(1)} hours</p>
    </div>

    <div class="section">
        <h2>📊 Executive Summary</h2>
        <div class="stats-grid">
            <div class="stat-card highlight-stat">
                <h3>${teamAnalytics.length}</h3>
                <p>Total Teams Participated</p>
            </div>
            <div class="stat-card highlight-stat">
                <h3>${submissions.length}</h3>
                <p>Total Submissions</p>
            </div>
            <div class="stat-card highlight-stat">
                <h3>${teamAnalytics.length > 0 ? Math.max(...teamAnalytics.map(t => t.maxLevel)) : 0}</h3>
                <p>Highest Level Reached</p>
            </div>
            <div class="stat-card highlight-stat">
                <h3>${comprehensiveStats?.peakActivityHour}</h3>
                <p>Peak Activity Hour</p>
            </div>
        </div>
        
        <div class="insight-box">
            <h3>🎯 Key Insights</h3>
            <ul>
                <li><strong>Event Duration:</strong> ${comprehensiveStats?.eventDuration.toFixed(1)} hours of continuous competition</li>
                <li><strong>Most Challenging Level:</strong> Level ${comprehensiveStats?.mostChallengingLevel} proved most difficult</li>
                <li><strong>Fastest Team:</strong> Team ${comprehensiveStats?.fastestTeam.teamId} completed in ${Math.round(comprehensiveStats?.fastestTeam.timeToComplete || 0)} minutes</li>
                <li><strong>Most Persistent:</strong> Team ${comprehensiveStats?.mostPersistentTeam.teamId} made ${comprehensiveStats?.mostPersistentTeam.submissions} attempts</li>
                <li><strong>Branch Dominance:</strong> ${comprehensiveStats?.branchDominance} category had highest participation</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>📈 Visual Analytics</h2>
        
        <div class="chart-container">
            <h3>Level Progression Analysis</h3>
            <img src="${levelChartData}" alt="Level Progression Chart" />
            <p>Shows how many teams reached each difficulty level</p>
        </div>
        
        <div class="chart-container">
            <h3>Branch Participation Distribution</h3>
            <img src="${branchChartData}" alt="Branch Distribution Chart" />
            <p>Breakdown of participation by engineering branches</p>
        </div>
        
        <div class="chart-container">
            <h3>Activity Timeline</h3>
            <img src="${timelineChartData}" alt="Timeline Chart" />
            <p>Submission patterns throughout the event duration</p>
        </div>
        
        <div class="chart-container">
            <h3>Difficulty Perception by Level</h3>
            <img src="${difficultyChartData}" alt="Difficulty Chart" />
            <p>Average difficulty rating given by teams for each level</p>
        </div>
    </div>

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
                <th>Efficiency Score</th>
            </tr>
            ${topPerformers.map((team, index) => `
                <tr class="${index < 3 ? 'top-team' : ''}">
                    <td>${index + 1}${index === 0 ? ' 🥇' : index === 1 ? ' 🥈' : index === 2 ? ' 🥉' : ''}</td>
                    <td>${team.teamId} - ${team.teamName}</td>
                    <td class="branch-${team.branchCategory.toLowerCase().replace(' ', '-')}">${team.branch}</td>
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
                    <td class="branch-${branch.category.toLowerCase().replace(' ', '-')}">${branch.branch}</td>
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
              const topBranch = Object.entries(level.branchDistribution).reduce((max, curr) => 
                curr[1] > max[1] ? curr : max, ['', 0]
              );
              return `
                <tr>
                    <td><strong>Level ${level.level}</strong></td>
                    <td>${level.teamsReached}</td>
                    <td>${level.completionRate.toFixed(1)}%</td>
                    <td>${level.avgRating.toFixed(1)}/5 ${'⭐'.repeat(Math.round(level.avgRating))}</td>
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
            <div class="stat-card highlight-stat">
                <h3>🚀 Speed Champion</h3>
                <p>Team ${comprehensiveStats?.fastestTeam.teamId}</p>
                <small>${Math.round(comprehensiveStats?.fastestTeam.timeToComplete || 0)} minutes</small>
            </div>
            <div class="stat-card highlight-stat">
                <h3>💪 Persistence Award</h3>
                <p>Team ${comprehensiveStats?.mostPersistentTeam.teamId}</p>
                <small>${comprehensiveStats?.mostPersistentTeam.submissions} attempts</small>
            </div>
            <div class="stat-card highlight-stat">
                <h3>🎯 Perfect Efficiency</h3>
                <p>${teamAnalytics.filter(t => t.submissions === t.maxLevel).length} Teams</p>
                <small>Optimal submission rate</small>
            </div>
            <div class="stat-card highlight-stat">
                <h3>🔥 Peak Activity</h3>
                <p>${comprehensiveStats?.peakActivityHour}</p>
                <small>Highest submission hour</small>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📝 Event Conclusion & Recommendations</h2>
        <div class="insight-box">
            <h3>🎉 Event Success Metrics</h3>
            <ul>
                <li><strong>High Engagement:</strong> ${teamAnalytics.length} teams actively participated with ${submissions.length} total submissions</li>
                <li><strong>Diverse Participation:</strong> Representatives from ${branchStats.length} different branches and specializations</li>
                <li><strong>Appropriate Challenge:</strong> Progressive difficulty with ${levelAnalytics[levelAnalytics.length-1]?.completionRate.toFixed(1)}% reaching the final levels</li>
                <li><strong>Sustained Interest:</strong> Activity maintained over ${comprehensiveStats?.eventDuration.toFixed(1)} hours</li>
            </ul>
        </div>
        
        <div class="insight-box">
            <h3>🔍 Key Observations</h3>
            <ul>
                <li>Level ${comprehensiveStats?.mostChallengingLevel} showed the steepest difficulty curve, suggesting optimal challenge design</li>
                <li>${comprehensiveStats?.branchDominance} branch showed strongest performance, indicating field-specific advantages</li>
                <li>Average completion time of ${Math.round(teamAnalytics.reduce((sum, team) => sum + team.timeToComplete, 0) / teamAnalytics.length)} minutes per team</li>
                <li>Strong correlation between persistence and success - top teams averaged ${topPerformers.slice(0,3).reduce((sum, team) => sum + team.submissions, 0) / 3} submissions</li>
            </ul>
        </div>
        
        <div class="insight-box">
            <h3>💡 Future Event Recommendations</h3>
            <ul>
                <li>Consider adding intermediate checkpoints around Level ${Math.round(comprehensiveStats?.mostChallengingLevel || 5)} to maintain engagement</li>
                <li>Implement branch-specific bonuses to encourage wider participation from underrepresented fields</li>
                <li>Add real-time leaderboards to increase competitive spirit during peak hours (${comprehensiveStats?.peakActivityHour})</li>
                <li>Consider extending event duration slightly to allow for more strategic problem-solving</li>
            </ul>
        </div>
    </div>

    <footer style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #00ff00;">
        <p>📡 Generated by Treasure in the Shell Advanced Analytics Engine</p>
        <p>🤖 Powered by GDG IET DAVV • Data Science Division</p>
        <p>📊 Report includes comprehensive statistical analysis and visual insights</p>
        <small>This report contains ${submissions.length} data points analyzed across ${teamAnalytics.length} teams and ${branchStats.length} academic branches</small>
    </footer>
</body>
</html>`;
  };

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      // Ensure charts are generated
      generateCharts();
      
      // Wait a moment for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportHTML = generateComprehensiveReport();
      
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `treasure-in-shell-comprehensive-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("📊 Comprehensive report with charts downloaded successfully!");
    } catch (error) {
      toast.error("❌ Failed to generate comprehensive report");
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
          <p className="text-terminal-green font-mono">Processing comprehensive analytics...</p>
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
        <canvas ref={timelineChartRef} />
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
              📊 Comprehensive Event Analytics
            </h1>
            <p className="text-terminal-green-dim">
              Advanced analysis of "Treasure in the Shell" with visual insights
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

        {/* Key Insights Cards */}
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
                {comprehensiveStats?.eventDuration.toFixed(1)}h
              </div>
              <p className="text-sm text-terminal-green-dim">Total competition time</p>
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
                {comprehensiveStats?.fastestTeam.teamId}
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
                Level {comprehensiveStats?.mostChallengingLevel}
              </div>
              <p className="text-sm text-terminal-green-dim">Lowest completion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-terminal-green">
            <CardHeader className="pb-3">
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Peak Hour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {comprehensiveStats?.peakActivityHour}
              </div>
              <p className="text-sm text-terminal-green-dim">Highest activity time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-terminal-green/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-terminal-green/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-terminal-green/20">
              Performance
            </TabsTrigger>
            <TabsTrigger value="branches" className="data-[state=active]:bg-terminal-green/20">
              Branches
            </TabsTrigger>
            <TabsTrigger value="levels" className="data-[state=active]:bg-terminal-green/20">
              Levels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Top Performers */}
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

          <TabsContent value="performance" className="space-y-6">
            {/* Achievement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Speed Champion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    Team {comprehensiveStats?.fastestTeam.teamId}
                  </div>
                  <p className="text-sm text-yellow-400">
                    Completed in {Math.round(comprehensiveStats?.fastestTeam.timeToComplete || 0)} minutes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Perfect Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {teamAnalytics.filter(t => t.submissions === t.maxLevel).length} Teams
                  </div>
                  <p className="text-sm text-green-400">
                    Optimal submission ratio
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Persistence Award
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    Team {comprehensiveStats?.mostPersistentTeam.teamId}
                  </div>
                  <p className="text-sm text-purple-400">
                    {comprehensiveStats?.mostPersistentTeam.submissions} total attempts
                  </p>
                </CardContent>
              </Card>
            </div>
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
                          <span className="text-terminal-green-dim">Avg Time:</span>
                          <span className="text-foreground">{Math.round(branch.avgTimeToComplete)}m</span>
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
                        <th className="text-left p-3 text-terminal-green">Avg Time</th>
                        <th className="text-left p-3 text-terminal-green">Leading Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelAnalytics.map((level) => {
                        const topBranch = Object.entries(level.branchDistribution).reduce(
                          (max, curr) => (curr[1] > max[1] ? curr : max),
                          ['', 0]
                        );
                        const difficultyColor = 
                          level.avgRating >= 4 ? 'text-red-400' : 
                          level.avgRating >= 3 ? 'text-yellow-400' : 
                          'text-green-400';
                        
                        return (
                          <tr key={level.level} className="border-b border-terminal-green/10">
                            <td className="p-3">
                              <Badge variant="outline" className="font-bold">
                                Level {level.level}
                              </Badge>
                            </td>
                            <td className="p-3 text-foreground font-bold">{level.teamsReached}</td>
                            <td className="p-3 text-foreground">{level.completionRate.toFixed(1)}%</td>
                            <td className={`p-3 ${difficultyColor}`}>
                              {level.avgRating.toFixed(1)}/5 {'⭐'.repeat(Math.round(level.avgRating))}
                            </td>
                            <td className="p-3 text-foreground">{Math.round(level.avgTimeToReach)}m</td>
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
