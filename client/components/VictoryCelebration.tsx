import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { toast } from "sonner";
import {
  Trophy,
  Crown,
  Star,
  Sparkles,
  Medal,
  PartyPopper,
  Zap,
  X,
  Volume2,
} from "lucide-react";
import { getTeamName } from "../lib/levels";

interface TeamStats {
  teamId: string;
  maxLevel: number;
  submissions: number;
  lastSubmission: string;
  avgRating: number;
}

interface VictoryCelebrationProps {
  teamStats: TeamStats[];
  isOpen: boolean;
  onClose: () => void;
}

const confettiColors = ["#00ff00", "#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1"];

const generateConfetti = () => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
  }));
};

export default function VictoryCelebration({
  teamStats,
  isOpen,
  onClose,
}: VictoryCelebrationProps) {
  const [confetti, setConfetti] = useState(generateConfetti());
  const [showFireworks, setShowFireworks] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState(0);

  const topTeams = teamStats.slice(0, 3);

  useEffect(() => {
    if (isOpen) {
      // Phase animation sequence
      const phases = [
        () => setCelebrationPhase(1), // 0.5s
        () => setCelebrationPhase(2), // 1.5s
        () => setCelebrationPhase(3), // 2.5s
        () => setShowFireworks(true), // 3.5s
      ];

      phases.forEach((phase, index) => {
        setTimeout(phase, (index + 1) * 1000);
      });

      // Regenerate confetti periodically
      const confettiInterval = setInterval(() => {
        setConfetti(generateConfetti());
      }, 2000);

      // Play celebration sound effect
      toast.success("🎉 Victory Celebration Started! 🏆", {
        duration: 5000,
      });

      return () => {
        clearInterval(confettiInterval);
        setCelebrationPhase(0);
        setShowFireworks(false);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTrophyIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="w-16 h-16 text-yellow-400" />;
      case 1:
        return <Medal className="w-14 h-14 text-gray-400" />;
      case 2:
        return <Medal className="w-12 h-12 text-amber-600" />;
      default:
        return <Trophy className="w-10 h-10" />;
    }
  };

  const getPositionTitle = (position: number) => {
    switch (position) {
      case 0:
        return "🥇 CHAMPION";
      case 1:
        return "🥈 RUNNER-UP";
      case 2:
        return "🥉 THIRD PLACE";
      default:
        return "FINALIST";
    }
  };

  const getPositionSubtitle = (position: number) => {
    switch (position) {
      case 0:
        return "SHELL MASTER";
      case 1:
        return "CODE WARRIOR";
      case 2:
        return "TERMINAL NINJA";
      default:
        return "CHALLENGER";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Confetti Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: piece.color,
              left: `${piece.x}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              top: "-10px",
              animation: `confetti-fall ${piece.duration}s ${piece.delay}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Fireworks Effect */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: `radial-gradient(circle, ${confettiColors[i % confettiColors.length]} 30%, transparent 70%)`,
                left: `${20 + i * 10}%`,
                top: `${10 + (i % 3) * 30}%`,
                animation: `firework 2s ${i * 0.3}s ease-out infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Celebration Content */}
      <div className="relative w-full max-w-6xl mx-auto">
        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div
            className={`transition-all duration-1000 ${
              celebrationPhase >= 1
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-10"
            }`}
          >
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 mb-4 animate-pulse">
              🏆 TREASURE IN THE SHELL 🏆
            </h1>
            <h2 className="text-3xl font-bold text-terminal-green mb-2 terminal-glow">
              VICTORY CEREMONY
            </h2>
            <p className="text-xl text-terminal-green-dim font-mono">
              &gt; CELEBRATING OUR CHAMPIONS &lt;
            </p>
          </div>
        </div>

        {/* Winners Podium */}
        <div className="flex items-end justify-center gap-8 mb-12">
          {topTeams.map((team, index) => {
            const heights = ["h-80", "h-64", "h-48"];
            const scales = ["scale-110", "scale-100", "scale-95"];
            const glows = [
              "shadow-2xl shadow-yellow-500/50",
              "shadow-xl shadow-gray-400/30",
              "shadow-lg shadow-amber-600/30",
            ];

            return (
              <div
                key={team.teamId}
                className={`transition-all duration-1000 delay-${index * 500} ${
                  celebrationPhase >= 2
                    ? `opacity-100 translate-y-0 ${scales[index]}`
                    : "opacity-0 translate-y-20"
                }`}
              >
                <Card
                  className={`${heights[index]} w-64 bg-gradient-to-b from-card/90 to-card/60 border-2 ${
                    index === 0
                      ? "border-yellow-400"
                      : index === 1
                        ? "border-gray-400"
                        : "border-amber-600"
                  } ${glows[index]} terminal-glow relative overflow-hidden`}
                >
                  {/* Sparkle Effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 12 }, (_, i) => (
                      <Sparkles
                        key={i}
                        className={`absolute w-6 h-6 text-yellow-400 animate-ping`}
                        style={{
                          left: `${10 + i * 8}%`,
                          top: `${10 + (i % 4) * 20}%`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>

                  <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center relative z-10">
                    {/* Position Number */}
                    <div className="absolute top-4 left-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                          index === 0
                            ? "bg-yellow-400 text-black"
                            : index === 1
                              ? "bg-gray-400 text-black"
                              : "bg-amber-600 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Trophy Icon */}
                    <div className="mb-6 animate-bounce">
                      {getTrophyIcon(index)}
                    </div>

                    {/* Position Title */}
                    <Badge
                      variant="outline"
                      className={`mb-4 text-lg font-bold px-4 py-2 ${
                        index === 0
                          ? "border-yellow-400 text-yellow-400"
                          : index === 1
                            ? "border-gray-400 text-gray-400"
                            : "border-amber-600 text-amber-600"
                      }`}
                    >
                      {getPositionTitle(index)}
                    </Badge>

                    {/* Team Info */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Team {team.teamId}
                      </h3>
                      <p className="text-lg text-terminal-green font-mono mb-1">
                        {getTeamName(team.teamId)}
                      </p>
                      <p className="text-sm text-terminal-cyan font-mono">
                        {getPositionSubtitle(index)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5 text-terminal-yellow" />
                        <span className="font-bold text-xl">
                          Level {team.maxLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(team.avgRating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm">
                          {team.avgRating.toFixed(1)}/5
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {team.submissions} submission
                        {team.submissions !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Celebration Message */}
        <div
          className={`text-center transition-all duration-1000 delay-1000 ${
            celebrationPhase >= 3
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-gradient-to-r from-terminal-green/20 to-terminal-cyan/20 border border-terminal-green/50 rounded-lg p-8 mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <PartyPopper className="w-8 h-8 text-terminal-yellow" />
              <h3 className="text-3xl font-bold text-foreground">
                CONGRATULATIONS!
              </h3>
              <PartyPopper className="w-8 h-8 text-terminal-yellow" />
            </div>
            <p className="text-xl text-terminal-green mb-4 font-mono">
              You've conquered the shell and claimed your treasure!
            </p>
            <p className="text-lg text-terminal-green-dim">
              Thank you for participating in this epic terminal adventure.
              <br />
              Your skills, persistence, and teamwork made this event
              unforgettable!
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Volume2 className="w-5 h-5 mr-2" />
              GDG Event Complete
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Trophy className="w-5 h-5 mr-2" />
              Champions Crowned
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Star className="w-5 h-5 mr-2" />
              Memories Made
            </Badge>
          </div>

          <Button
            onClick={onClose}
            size="lg"
            className="bg-gradient-to-r from-terminal-green to-terminal-cyan hover:from-terminal-green/80 hover:to-terminal-cyan/80 text-black font-bold px-8 py-4 text-lg terminal-glow"
          >
            <PartyPopper className="w-6 h-6 mr-2" />
            Continue Celebration
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          from {
            transform: translateY(-100vh) rotate(0deg);
          }
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }

        @keyframes firework {
          0% {
            opacity: 1;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
