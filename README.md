# 💻 Treasure in the Shell

**Crack the Clues. Break the Shell. Claim the Root. 💎🧑‍💻**

A real-time terminal puzzle challenge application for cybersecurity events. Teams progress through 10 levels, submit passwords, and track their progress on a live leaderboard.

## 🚀 Features

- **Real-time Submissions**: Live updates when teams complete levels
- **Terminal Theme**: Authentic hacker/cybersecurity aesthetic with matrix background
- **Level Validation**: Automatic level detection based on password submission
- **Team Management**: Pre-defined teams (101-160) with dropdown selection
- **Difficulty Rating**: 1-5 star rating system for each level
- **Admin Dashboard**: Real-time monitoring with team leaderboards and statistics
- **Database Security**: Secure Supabase integration with proper validation
- **Responsive Design**: Works on all devices and screen sizes

## 🎯 Event Details

- **Event**: Google Developer Groups on Campus • IET DAVV
- **Challenge**: A Terminal Puzzle Challenge 🧠
- **Levels**: 10 interconnected levels (completing level 4 means levels 1-3 are also completed)
- **Teams**: 60 teams (IDs 101-160)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + Supabase
- **Database**: PostgreSQL (via Supabase)
- **Styling**: TailwindCSS with custom terminal theme
- **Icons**: Lucide React
- **Fonts**: Fira Code (monospace)
- **Real-time**: Supabase real-time subscriptions

## 📊 Database Schema

```sql
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  team_id VARCHAR(10) NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
  password TEXT NOT NULL,
  difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase database**:
   - Create a new Supabase project
   - Go to SQL Editor and run the contents of `database-setup.sql`
   - Update the Supabase credentials in `client/lib/supabase.ts` and `server/routes/submissions.ts`

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Main submission form: `http://localhost:8080/`
   - Admin panel: `http://localhost:8080/admin`

## 🔐 Level Passwords

The application includes 10 levels with the following passwords:

- **Level 1**: `ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If`
- **Level 2**: `263JGJPfgU6LtdEvgfWU1XP5yac29mFx`
- **Level 3**: `MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx`
- **Level 4**: `2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ`
- **Level 5**: `4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw`
- **Level 6**: `HWasnPhtq9AVKe0dmk45nxy20cvUa6EG`
- **Level 7**: `morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj`
- **Level 8**: `dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc`
- **Level 9**: `4CKMh1JI91bUIZZPXDqGanal4xvAg0JM`
- **Level 10**: `FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey`

## 🏆 How It Works

1. **Team Selection**: Teams choose their ID (101-160) from dropdown
2. **Password Submission**: Teams enter the password they discovered
3. **Level Detection**: Application automatically determines the completed level
4. **Difficulty Rating**: Teams rate the difficulty (1-5 stars)
5. **Real-time Updates**: Admin panel shows live updates of all submissions
6. **Leaderboard**: Teams ranked by highest level completed

## 📱 Pages

### Submission Form (`/`)
- Team ID dropdown (101-160)
- Password input field
- Difficulty rating (1-5 stars)
- Success notifications
- Terminal-themed UI with matrix background

### Admin Panel (`/admin`)
- Real-time submission feed
- Team leaderboard with rankings
- Level distribution statistics
- Auto-refresh functionality
- Projector-optimized display

## 🚀 Deployment (Netlify)

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist/spa`
   - Add serverless function from `netlify/functions/api.ts`

3. **Environment Variables**:
   - No additional environment variables needed (credentials are in code for this event)

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Copy your project URL and anon key
3. Update credentials in:
   - `client/lib/supabase.ts`
   - `server/routes/submissions.ts`

### Team Management

To modify team ranges, update `generateTeamOptions()` in `client/lib/levels.ts`:

```typescript
export function generateTeamOptions(): string[] {
  const teams = []
  for (let i = 101; i <= 160; i++) { // Modify range here
    teams.push(i.toString())
  }
  return teams
}
```

## 🎨 Customization

### Theme Colors

Update terminal colors in `client/global.css`:

```css
:root {
  --terminal-green: 120 100% 50%;
  --terminal-green-dim: 120 50% 40%;
  --terminal-cyan: 180 100% 50%;
  --terminal-yellow: 60 100% 50%;
  --terminal-red: 0 100% 60%;
}
```

### Matrix Background

The matrix effect can be disabled by removing `<MatrixBackground />` components from:
- `client/components/SubmissionForm.tsx`
- `client/components/AdminPanel.tsx`

## 🔍 Monitoring

### Real-time Features

- **Supabase Realtime**: Automatic updates when new submissions arrive
- **Auto-refresh**: Backup refresh every 30 seconds
- **Toast Notifications**: Live feedback for submissions and admin updates
- **Live Statistics**: Real-time team rankings and level distributions

### Admin Features

- **Team Leaderboard**: Sorted by highest level completed
- **Recent Submissions**: Chronological list of all submissions
- **Level Statistics**: Distribution of completions per level
- **Refresh Controls**: Manual refresh with loading states

## 🛡️ Security

- **Password Validation**: Server-side validation of all level passwords
- **Input Sanitization**: Proper validation of team IDs and ratings
- **Database Security**: Row Level Security enabled in Supabase
- **CORS Protection**: Configured for secure API access

## 📞 Support

For technical issues during the event:

1. Check the browser console for error messages
2. Verify Supabase connection status
3. Test admin panel refresh functionality
4. Monitor network requests in developer tools

## 🏁 Event Day Checklist

- [ ] Supabase database is set up and accessible
- [ ] Admin panel displays correctly on projector
- [ ] All team IDs (101-160) are available in dropdown
- [ ] Real-time updates are working
- [ ] Backup refresh functionality tested
- [ ] All level passwords validated

---

**Built for Google Developer Groups on Campus • IET DAVV**  
*A Terminal Puzzle Challenge* 🧠💻
