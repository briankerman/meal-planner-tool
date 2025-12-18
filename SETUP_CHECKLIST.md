# Setup Checklist

Complete these steps to get your Meal Planner Tool running.

## ✅ Initial Setup (Completed)

- [x] Next.js project structure created
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] Supabase client libraries configured
- [x] OpenAI integration setup
- [x] Git repository initialized

## 📋 Your Action Items

### 1. Configure Git (Required for commits)

Run these commands in your terminal:

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

Then create the initial commit:

```bash
cd C:\Users\junct\mealplanningtool
git add -A
git commit -m "feat: initial project setup"
```

### 2. Install Node Dependencies

You'll need to add Node.js to your PATH or run with full path:

```bash
cd C:\Users\junct\mealplanningtool
"C:\Program Files\nodejs\npm.cmd" install
```

Or add `C:\Program Files\nodejs` to your PATH environment variable.

### 3. Set Up Supabase

- [ ] Create account at [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Get your project URL and anon key from Project Settings > API
- [ ] Open SQL Editor in Supabase dashboard
- [ ] Copy and run all SQL from `DATABASE_SCHEMA.md`
- [ ] Enable Email authentication in Authentication > Providers

### 4. Get OpenAI API Key

- [ ] Create account at [platform.openai.com](https://platform.openai.com)
- [ ] Go to API Keys section
- [ ] Create new secret key
- [ ] Save it securely (you'll only see it once)

### 5. Configure Environment Variables

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Supabase URL and key
- [ ] Fill in OpenAI API key

### 6. Create GitHub Repository

- [ ] Go to [github.com](https://github.com) and create new repository
- [ ] Name it `meal-planner-tool` (or your preferred name)
- [ ] Keep it public or private (your choice)
- [ ] Don't initialize with README (we already have one)

Then push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/meal-planner-tool.git
git branch -M main
git push -u origin main
```

### 7. Deploy to Vercel

#### Option A: Vercel Dashboard (Easiest)

- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign in with GitHub
- [ ] Click "Add New Project"
- [ ] Import your `meal-planner-tool` repository
- [ ] Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
- [ ] Click Deploy

#### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
# Follow prompts and add environment variables
```

### 8. Test Your Deployment

- [ ] Visit your Vercel deployment URL
- [ ] Verify the homepage loads
- [ ] Check that styles are working
- [ ] Test signup/login (after implementing auth pages)

## 🎯 Next Development Steps

After setup is complete:

1. **Build Authentication Pages**
   - Create `/app/login/page.tsx`
   - Create `/app/signup/page.tsx`
   - Implement Supabase auth flows

2. **Create Dashboard**
   - Protected route for logged-in users
   - Display user's meal plans

3. **Meal Plan Generator**
   - Form to input preferences
   - Integration with OpenAI API
   - Save to Supabase database

4. **Recipe Management**
   - Create/edit/delete recipes
   - Recipe search and filtering
   - Favorite recipes

5. **Shopping List**
   - Auto-generate from meal plans
   - Manual additions
   - Check off items

## 🆘 Troubleshooting

### Node.js not found
Add `C:\Program Files\nodejs` to your system PATH:
1. Search "Environment Variables" in Windows
2. Edit System Environment Variables
3. Add to PATH variable
4. Restart terminal/VSCode

### Supabase connection errors
- Verify URL and keys are correct
- Check `.env.local` file exists
- Restart dev server after changing env vars

### OpenAI API errors
- Ensure API key is valid
- Check you have credits/billing set up
- Verify API key has correct permissions

## 📚 Helpful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)
