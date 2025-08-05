import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { supabase } from "../lib/supabase";
import {
  validatePassword,
  generateTeamOptions,
  getTeamName,
} from "../lib/levels";
import { toast } from "sonner";
import { Star, Terminal, Lock, Users, AlertCircle } from "lucide-react";
import MatrixBackground from "./MatrixBackground";

export default function SubmissionForm() {
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [difficultyRating, setDifficultyRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{
    level: number;
    time: string;
  } | null>(null);

  const teamOptions = generateTeamOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId || !password || difficultyRating === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    const level = validatePassword(password);
    if (!level) {
      toast.error(
        "Invalid password! Make sure you entered the correct password.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("submissions").insert({
        team_id: teamId,
        level: level,
        password: password,
        difficulty_rating: difficultyRating,
      });

      if (error) {
        console.error("Submission error:", error);

        // Provide specific error messages
        if (error.message.includes('relation "submissions" does not exist')) {
          toast.error(
            "❌ Database not set up! Please run the SQL setup script in Supabase first.",
          );
        } else if (error.message.includes("permission denied")) {
          toast.error(
            "❌ Database permissions issue. Check RLS policies in Supabase.",
          );
        } else if (error.message.includes("violates check constraint")) {
          toast.error("❌ Invalid data format. Please check your inputs.");
        } else {
          toast.error(`❌ Database error: ${error.message}`);
        }
      } else {
        toast.success(`✅ Level ${level} completed successfully! 🎉`);
        setLastSubmission({ level, time: new Date().toLocaleTimeString() });
        setPassword("");
        setDifficultyRating(0);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(
        `❌ Network error: ${error.message || "Please check your connection"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setDifficultyRating(star)}
            className={`p-1 transition-colors ${
              star <= difficultyRating
                ? "text-terminal-yellow"
                : "text-muted-foreground hover:text-terminal-yellow"
            }`}
          >
            <Star
              size={20}
              fill={star <= difficultyRating ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background terminal-bg p-4">
      <MatrixBackground />
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Terminal className="text-terminal-green" size={32} />
          </div>
          <h1 className="text-2xl font-bold terminal-text mb-2">
            TREASURE IN THE SHELL
          </h1>
          <p className="text-terminal-green-dim text-sm">
            A GDG EVENT
          </p>
        </div>

        {lastSubmission && (
          <Card className="mb-6 bg-card/50 border-terminal-green terminal-glow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-terminal-green/20 text-terminal-green border-terminal-green"
                >
                  LEVEL {lastSubmission.level} COMPLETED
                </Badge>
                <span className="text-xs text-terminal-green-dim">
                  {lastSubmission.time}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/80 border-terminal-green">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-terminal-green">
              <Lock size={20} />
              Submit Your Progress
            </CardTitle>
            <CardDescription className="text-terminal-green-dim">
              Enter your team credentials and level password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="team"
                  className="text-terminal-green flex items-center gap-2"
                >
                  <Users size={16} />
                  Team ID
                </Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger className="bg-input border-terminal-green-dim text-foreground">
                    <SelectValue placeholder="Select your team (101-160)" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-terminal-green-dim max-h-60 overflow-y-auto">
                    {teamOptions.map((team) => (
                      <SelectItem
                        key={team}
                        value={team}
                        className="text-foreground"
                      >
                        Team {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teamId && (
                  <div className="mt-2 p-2 bg-terminal-green/10 border border-terminal-green/30 rounded-md">
                    <p className="text-sm text-terminal-green font-medium">
                      Selected: Team {teamId} - {getTeamName(teamId)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-terminal-green flex items-center gap-2"
                >
                  <Lock size={16} />
                  Level Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter the password you discovered"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-terminal-green-dim text-foreground font-mono"
                  autoComplete="off"
                />
                <p className="text-xs text-terminal-green-dim flex items-center gap-1">
                  <AlertCircle size={12} />
                  Password determines your completed level automatically
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-terminal-green flex items-center gap-2">
                  <Star size={16} />
                  Level Rating
                </Label>
                <div className="flex items-center gap-2">
                  {renderStars()}
                  <span className="text-xs text-terminal-green-dim ml-2">
                    {difficultyRating === 0
                      ? "Rate this level"
                      : `${difficultyRating}/5 stars`}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground terminal-glow"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  "Submit Progress"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-terminal-green-dim">
            💻 A Terminal Puzzle Challenge 🧠
          </p>
          <p className="text-xs text-terminal-green-dim mt-1">
            Google Developer Groups • IET DAVV
          </p>
        </div>
      </div>
    </div>
  );
}
