# GitHub Setup Instructions

Your code is committed and ready to push. Follow these steps:

## Option 1: Using GitHub Website (Recommended)

1. Go to https://github.com/new
2. Repository name: `meal-planner-tool`
3. Description: `AI-powered meal planning application`
4. Choose: **Public** (or Private if you prefer)
5. **DO NOT** check "Initialize with README" (we already have one)
6. Click "Create repository"

7. Copy the repository URL shown (should be like: `https://github.com/YOUR_USERNAME/meal-planner-tool.git`)

8. In your terminal, run:
```bash
cd C:\Users\junct\mealplanningtool
git remote add origin https://github.com/YOUR_USERNAME/meal-planner-tool.git
git branch -M main
git push -u origin main
```

## Option 2: Using GitHub CLI (if you have it installed)

If you have GitHub CLI installed:
```bash
cd C:\Users\junct\mealplanningtool
gh repo create meal-planner-tool --public --source=. --remote=origin --push
```

## After Pushing

Your code will be on GitHub and ready to:
- Deploy to Vercel
- Collaborate with others
- Track changes over time

## Next: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Select `meal-planner-tool` from your repositories
5. Add environment variables (from .env.example)
6. Click "Deploy"

Your site will be live in ~2 minutes!
