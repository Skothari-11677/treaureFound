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
  Rocket,
  Code,
  Terminal,
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

const confettiColors = ["#00ff00", "#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#ff9500", "#e91e63"];

const generateConfetti = () => {
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    x: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 3,
    size: 2 + Math.random() * 3,
  }));
};

const generateStars = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));
};

export default function VictoryCelebration({
  teamStats,
  isOpen,
  onClose,
}: VictoryCelebrationProps) {
  const [confetti, setConfetti] = useState(generateConfetti());
  const [stars, setStars] = useState(generateStars());
  const [showFireworks, setShowFireworks] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState(0);

  const topTeams = teamStats.slice(0, 3);

  useEffect(() => {
    if (isOpen) {
      // Phase animation sequence
      const phases = [
        () => setCelebrationPhase(1), // 0.8s
        () => setCelebrationPhase(2), // 1.6s  
        () => setCelebrationPhase(3), // 2.4s
        () => setShowFireworks(true), // 3.2s
      ];

      phases.forEach((phase, index) => {
        setTimeout(phase, (index + 1) * 800);
      });

      // Regenerate effects periodically
      const effectsInterval = setInterval(() => {
        setConfetti(generateConfetti());
        setStars(generateStars());
      }, 3000);

      // Victory sound effect
      toast.success("🎉 Victory Celebration Started! 🏆", {
        duration: 5000,
      });

      return () => {
        clearInterval(effectsInterval);
        setCelebrationPhase(0);
        setShowFireworks(false);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTrophyIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="w-12 h-12 md:w-16 md:h-16 text-yellow-400 drop-shadow-lg" />;
      case 1:
        return <Medal className="w-10 h-10 md:w-14 md:h-14 text-gray-400 drop-shadow-lg" />;
      case 2:
        return <Medal className="w-8 h-8 md:w-12 md:h-12 text-amber-600 drop-shadow-lg" />;
      default:
        return <Trophy className="w-8 h-8 text-terminal-green drop-shadow-lg" />;
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
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-auto">
      {/* Animated Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Enhanced Confetti Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute rounded-full animate-bounce"
            style={{
              backgroundColor: piece.color,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              left: `${piece.x}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              top: "-20px",
              animation: `confetti-fall ${piece.duration}s ${piece.delay}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Enhanced Fireworks Effect */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute w-6 h-6 rounded-full"
              style={{
                background: `radial-gradient(circle, ${confettiColors[i % confettiColors.length]} 20%, transparent 80%)`,
                left: `${15 + i * 6}%`,
                top: `${5 + (i % 4) * 25}%`,
                animation: `firework 3s ${i * 0.2}s ease-out infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Scrollable Content Container */}
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div className="relative w-full max-w-7xl mx-auto space-y-6">
          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 z-10 text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Compact Header */}
          <div className="text-center space-y-4">
            <div
              className={`transition-all duration-1000 ${
                celebrationPhase >= 1
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-10"
              }`}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Terminal className="w-8 h-8 text-terminal-green animate-pulse" />
                <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse">
                  TREASURE IN THE SHELL
                </h1>
                <Terminal className="w-8 h-8 text-terminal-green animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-terminal-green terminal-glow">
                🏆 VICTORY CEREMONY 🏆
              </h2>
              <p className="text-sm md:text-lg text-terminal-green-dim font-mono">
                &gt; CELEBRATING OUR CHAMPIONS &lt;
              </p>
            </div>
          </div>

          {/* Responsive Winners Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {topTeams.map((team, index) => {
              const heights = ["h-72 md:h-80", "h-64 md:h-72", "h-56 md:h-64"];
              const borderColors = [
                "border-yellow-400 shadow-yellow-400/30",
                "border-gray-400 shadow-gray-400/20", 
                "border-amber-600 shadow-amber-600/20"
              ];

              return (
                <div
                  key={team.teamId}
                  className={`transition-all duration-1000 delay-${index * 300} ${
                    celebrationPhase >= 2
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-20"
                  } ${index === 1 ? "md:order-first" : index === 0 ? "md:order-2" : "md:order-3"}`}
                >
                  <Card
                    className={`${heights[index]} bg-gradient-to-b from-card/90 to-card/60 border-2 ${borderColors[index]} shadow-2xl terminal-glow relative overflow-hidden group hover:scale-105 transition-transform duration-300`}
                  >
                    {/* Enhanced Sparkle Effects */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 8 }, (_, i) => (
                        <Sparkles
                          key={i}
                          className="absolute w-4 h-4 text-yellow-400 animate-ping"
                          style={{
                            left: `${15 + i * 12}%`,
                            top: `${10 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.3}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none" />

                    <CardContent className="h-full flex flex-col items-center justify-center p-4 text-center relative z-10 space-y-3">
                      {/* Position Number Badge */}
                      <div className="absolute top-3 left-3">
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-lg ${
                            index === 0
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                              : index === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black"
                              : "bg-gradient-to-br from-amber-500 to-amber-700 text-white"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* Trophy Icon with Animation */}
                      <div className="animate-bounce">
                        {getTrophyIcon(index)}
                      </div>

                      {/* Position Title */}
                      <Badge
                        variant="outline"
                        className={`text-xs md:text-sm font-bold px-3 py-1 bg-black/30 backdrop-blur-sm ${
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
                      <div className="space-y-1">
                        <h3 className="text-lg md:text-xl font-bold text-foreground">
                          Team {team.teamId}
                        </h3>
                        <p className="text-sm md:text-base text-terminal-green font-mono leading-tight">
                          {getTeamName(team.teamId)}
                        </p>
                        <Badge variant="secondary" className="text-xs bg-terminal-cyan/20 text-terminal-cyan">
                          {getPositionSubtitle(index)}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4 text-terminal-yellow" />
                          <span className="font-bold text-lg">
                            Level {team.maxLevel}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(team.avgRating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-xs">
                            {team.avgRating.toFixed(1)}/5
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {team.submissions} submission{team.submissions !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Compact Celebration Message */}
          <div
            className={`text-center transition-all duration-1000 delay-1000 ${
              celebrationPhase >= 3
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="bg-gradient-to-r from-terminal-green/20 to-terminal-cyan/20 border border-terminal-green/50 rounded-lg p-4 md:p-6 mb-6 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Rocket className="w-6 h-6 text-terminal-yellow animate-bounce" />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">
                  CONGRATULATIONS!
                </h3>
                <Code className="w-6 h-6 text-terminal-cyan animate-pulse" />
              </div>
              <p className="text-base md:text-lg text-terminal-green mb-2 font-mono">
                You've conquered the shell and claimed your treasure!
              </p>
              <p className="text-sm md:text-base text-terminal-green-dim">
                Thank you for this epic terminal adventure. Your skills made this event unforgettable! 🚀
              </p>
            </div>

            {/* Achievement Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-6">
              <Badge variant="outline" className="text-sm px-3 py-1 bg-black/30 backdrop-blur-sm">
                <Volume2 className="w-4 h-4 mr-2" />
                GDG Event
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1 bg-black/30 backdrop-blur-sm">
                <Trophy className="w-4 h-4 mr-2" />
                Champions
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1 bg-black/30 backdrop-blur-sm">
                <Star className="w-4 h-4 mr-2" />
                Memories
              </Badge>
            </div>

            {/* Action Button */}
            <Button
              onClick={onClose}
              size="lg"
              className="bg-gradient-to-r from-terminal-green to-terminal-cyan hover:from-terminal-green/80 hover:to-terminal-cyan/80 text-black font-bold px-6 py-3 text-base md:text-lg terminal-glow shadow-2xl"
            >
              <PartyPopper className="w-5 h-5 mr-2" />
              Continue Celebration
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          from {
            transform: translateY(-100vh) rotate(0deg);
          }
          to {
            transform: translateY(100vh) rotate(720deg);
          }
        }

        @keyframes firework {
          0% {
            opacity: 1;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(2) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
