export const LEVEL_PASSWORDS = {
  1: "ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If",
  2: "263JGJPfgU6LtdEvgfWU1XP5yac29mFx",
  3: "MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx",
  4: "2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ",
  5: "4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw",
  6: "HWasnPhtq9AVKe0dmk45nxy20cvUa6EG",
  7: "morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj",
  8: "dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc",
  9: "4CKMh1JI91bUIZZPXDqGanal4xvAg0JM",
  10: "FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey",
} as const;

export function validatePassword(password: string): number | null {
  for (let level = 10; level >= 1; level--) {
    if (LEVEL_PASSWORDS[level as keyof typeof LEVEL_PASSWORDS] === password) {
      return level;
    }
  }
  return null;
}

export const TEAM_NAMES = {
  101: "Sparkle",
  102: "Brogrammers",
  103: "Codehub",
  104: "Impostor_coder",
  105: "Alt_F4",
  106: "Terminal Spoolers",
  107: "BlackHat Buffs",
  108: "Coda-Sorous",
  109: "Orion",
  110: "PyJa Alchemists",
  111: "TechSpark",
  112: "Ctrl C+ Ctrl V",
  113: "XP Hunters",
  114: "Cache Me If You Can",
  115: "Techtonic",
  116: "2bitHacker",
  117: "Charlie",
  118: "Bug Smashers",
  119: "CriticalDuo",
  120: "Mumbai Indians",
  121: "Uncs_fromholysinc",
  122: "Tech nova",
  123: "2 Guys 1 Bug",
  124: "AlgoRhythms",
  125: "Team Explorers",
  126: "Rizzlers",
  127: "Hustlers",
  128: "JARVIS",
  129: "The Masters",
  130: "Shel-earners",
  131: "The Shell Troopers",
  132: "D2",
  133: "The digital disruptors",
  134: "Knight Coders",
  135: "The ultimate",
  136: "The Silent shells",
  137: "Seekers",
  138: "OFI",
  139: "Team blue",
  140: "PairCoders [M]^2",
  141: "2gether",
  142: "Let it Happen",
  143: "PseudoCoders",
  144: "TeamDriver",
  145: "Cryptic Coders",
  146: "XL1",
  147: "The techies",
  148: "YSRJ CRANUXX",
  149: "Clue finders",
  150: "ShadowSec",
  151: "Dynamic",
  152: "codeDuo",
} as const;

export function getTeamName(teamId: string): string {
  const id = parseInt(teamId);
  return TEAM_NAMES[id as keyof typeof TEAM_NAMES] || `Team ${teamId}`;
}

export function generateTeamOptions(): string[] {
  const teams = [];
  for (let i = 101; i <= 200; i++) {
    teams.push(i.toString());
  }
  return teams;
}

export function generateTeamOptionsWithNames(): Array<{
  id: string;
  name: string;
}> {
  const teams = [];
  for (let i = 101; i <= 160; i++) {
    const id = i.toString();
    const name = getTeamName(id);
    teams.push({ id, name });
  }
  return teams;
}
