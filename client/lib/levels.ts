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

export function generateTeamOptions(): string[] {
  const teams = [];
  for (let i = 101; i <= 160; i++) {
    teams.push(i.toString());
  }
  return teams;
}
