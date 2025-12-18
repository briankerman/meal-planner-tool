# Meal Planner Tool

AI-powered meal planning application built with Next.js, Supabase, and OpenAI.

## Features

- 🤖 AI-generated personalized meal plans
- 🍽️ Recipe management and storage
- 📅 Weekly/monthly meal planning calendar
- 🛒 Automatic shopping list generation
- 👤 User authentication and profiles
- 💾 Cloud-based data storage

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- An OpenAI API key
- A Vercel account (for deployment)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your keys
3. Navigate to SQL Editor in your Supabase dashboard
4. Open `DATABASE_SCHEMA.md` and run all SQL commands to create tables

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add all variables from `.env.local`

### Option 2: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Add environment variables
6. Deploy

## GitHub Setup

If you haven't pushed to GitHub yet:

```bash
# Configure git (first time only)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Create initial commit
git add -A
git commit -m "feat: initial project setup"

# Create GitHub repository and push
# (Go to github.com and create a new repository first)
git remote add origin https://github.com/yourusername/meal-planner-tool.git
git branch -M main
git push -u origin main
```

## Project Structure

```
meal-planner-tool/
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── lib/                 # Utility libraries
│   ├── supabase/        # Supabase clients
│   └── openai/          # OpenAI integration
├── components/          # React components (to be added)
├── middleware.ts        # Auth middleware
└── DATABASE_SCHEMA.md   # Database setup instructions
```

## Next Steps

1. **Set up Git**: Configure git user and create initial commit
2. **Create GitHub repo**: Push code to GitHub
3. **Set up Supabase**: Run database schema SQL
4. **Get API keys**: Add Supabase and OpenAI keys to environment variables
5. **Deploy to Vercel**: Connect GitHub repo and deploy
6. **Start building**: Add authentication pages, meal planning UI, etc.

## Development Roadmap

- [ ] Authentication pages (login/signup)
- [ ] User profile management
- [ ] Recipe creation and editing
- [ ] Meal plan generator UI
- [ ] Calendar view for meal planning
- [ ] Shopping list generation
- [ ] Recipe search and filtering
- [ ] Nutrition tracking
- [ ] Recipe image uploads

## License

MIT

