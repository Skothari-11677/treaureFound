import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Shield, RefreshCw, Users, Trophy, Star, Clock } from 'lucide-react'
import Navigation from './Navigation'

interface Submission {
  id: number
  team_id: string
  level: number
  password: string
  difficulty_rating: number
  created_at: string
}

export default function AdminPanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching submissions:', error)
        toast.error('Failed to fetch submissions')
      } else {
        setSubmissions(data || [])
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Network error:', error)
      toast.error('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()

    // Set up real-time subscription
    const subscription = supabase
      .channel('submissions')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'submissions' 
        }, 
        (payload) => {
          console.log('New submission:', payload)
          setSubmissions(prev => [payload.new as Submission, ...prev])
          setLastUpdate(new Date())
          toast.success(`New submission from Team ${(payload.new as Submission).team_id}!`)
        }
      )
      .subscribe()

    // Auto-refresh every 30 seconds as backup
    const interval = setInterval(fetchSubmissions, 30000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const getTeamStats = () => {
    const teamMap = new Map<string, { maxLevel: number, submissions: number, lastSubmission: string }>()
    
    submissions.forEach(sub => {
      const existing = teamMap.get(sub.team_id)
      if (!existing || sub.level > existing.maxLevel) {
        teamMap.set(sub.team_id, {
          maxLevel: sub.level,
          submissions: (existing?.submissions || 0) + 1,
          lastSubmission: sub.created_at
        })
      } else {
        teamMap.set(sub.team_id, {
          ...existing,
          submissions: existing.submissions + 1
        })
      }
    })

    return Array.from(teamMap.entries())
      .map(([teamId, stats]) => ({ teamId, ...stats }))
      .sort((a, b) => b.maxLevel - a.maxLevel || a.teamId.localeCompare(b.teamId))
  }

  const getLevelStats = () => {
    const levelMap = new Map<number, number>()
    submissions.forEach(sub => {
      levelMap.set(sub.level, (levelMap.get(sub.level) || 0) + 1)
    })
    return levelMap
  }

  const teamStats = getTeamStats()
  const levelStats = getLevelStats()

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'bg-terminal-red/20 text-terminal-red border-terminal-red'
    if (level >= 6) return 'bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow'
    if (level >= 4) return 'bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan'
    return 'bg-terminal-green/20 text-terminal-green border-terminal-green'
  }

  return (
    <div className="min-h-screen bg-background terminal-bg p-4">
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
            </div>
            <Button 
              onClick={fetchSubmissions} 
              disabled={isLoading}
              variant="outline"
              className="border-terminal-green text-terminal-green hover:bg-terminal-green/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Level Distribution */}
          <Card className="bg-card/80 border-terminal-green">
            <CardHeader>
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Trophy size={20} />
                Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                  <div key={level} className="flex items-center justify-between">
                    <Badge variant="outline" className={getLevelColor(level)}>
                      Level {level}
                    </Badge>
                    <span className="text-terminal-green font-mono">
                      {levelStats.get(level) || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Leaderboard */}
          <Card className="bg-card/80 border-terminal-green lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-terminal-green flex items-center gap-2">
                <Users size={20} />
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {teamStats.map(({ teamId, maxLevel, submissions, lastSubmission }, index) => (
                  <div 
                    key={teamId}
                    className={`p-3 rounded border ${
                      index < 3 
                        ? 'border-terminal-yellow bg-terminal-yellow/10' 
                        : 'border-terminal-green-dim bg-card/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-terminal-green">
                        Team {teamId}
                      </span>
                      {index < 3 && (
                        <Badge className="bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow">
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-terminal-green-dim">Max Level:</span>
                        <Badge variant="outline" className={getLevelColor(maxLevel)}>
                          {maxLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-terminal-green-dim">Submissions:</span>
                        <span className="text-terminal-green font-mono">{submissions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-terminal-green-dim">Last:</span>
                        <span className="text-terminal-green-dim font-mono text-xs">
                          {formatTime(lastSubmission)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card className="bg-card/80 border-terminal-green">
          <CardHeader>
            <CardTitle className="text-terminal-green flex items-center gap-2">
              <Clock size={20} />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {submissions.map((submission) => (
                <div 
                  key={submission.id}
                  className="flex items-center justify-between p-3 bg-card/50 rounded border border-terminal-green-dim"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-terminal-green border-terminal-green">
                      Team {submission.team_id}
                    </Badge>
                    <Badge variant="outline" className={getLevelColor(submission.level)}>
                      Level {submission.level}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: submission.difficulty_rating }, (_, i) => (
                        <Star key={i} size={12} className="text-terminal-yellow" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm text-terminal-green-dim">
                    <div>{formatDate(submission.created_at)}</div>
                    <div className="font-mono">{formatTime(submission.created_at)}</div>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="text-center py-8 text-terminal-green-dim">
                  No submissions yet. Waiting for teams to start cracking...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
