# Vercel Deployment Guide - Future CEO Hub

## Quick Start (5 minutes)

### 1. Create GitHub Repository
```bash
git remote add origin https://github.com/YOUR_USERNAME/future-ceo-hub.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
- Go to https://vercel.com/new
- Select "Import Git Repository"
- Choose your GitHub repo
- Click "Import"

### 3. Set Environment Variables
In Vercel dashboard, go to **Settings > Environment Variables** and add:

```
VITE_SUPABASE_URL=https://stpwmpodfvvqdurqwcok.supabase.co
VITE_SUPABASE_PROJECT_ID=stpwmpodfvvqdurqwcok
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

### 4. Deploy
Click "Deploy" — done! ✅

---

## What's Included

✅ **React + Vite** - Fast, modern frontend  
✅ **TypeScript** - Type-safe code  
✅ **Tailwind CSS** - Responsive styling  
✅ **shadcn/ui** - Beautiful components  
✅ **Supabase** - PostgreSQL backend  
✅ **Auth** - Email/password authentication  
✅ **Edge Functions** - Serverless functions  

---

## Project Structure

```
project-root/
├── src/
│   ├── pages/          # Route pages
│   ├── components/     # UI components
│   ├── stores/         # Zustand state (userStore)
│   ├── integrations/   # Supabase client
│   └── ...
├── supabase/
│   ├── migrations/     # Database schema
│   └── functions/      # Edge functions
├── public/            # Static assets
├── .env.example       # Environment template
└── package.json
```

---

## Key Features

### Authentication
- Email/password login & signup
- Password reset via email
- Session persistence

### Learning
- Modules → Lessons progression
- Video + watch prompts
- Quiz questions with auto-grading
- Paper submissions with AI grading

### Gamification
- XP system with levels (Budget Rookie → Empire Owner)
- Streak tracking
- Badges/achievements
- Leaderboards

### Community
- Chat messages with reactions
- Live session scheduling
- Notifications preferences

### Accessibility
- Screen reader support
- Font size adjustments
- Theme preferences
- High contrast modes

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Linting
npm run lint
```

---

## Troubleshooting

### Login not working?
- Check Supabase credentials in `.env`
- Verify user exists in Supabase auth
- Check browser console for errors

### Database queries failing?
- Verify Row Level Security policies in Supabase
- Check user is authenticated
- Ensure user has permission to access table

### Build failing on Vercel?
- Check all env variables are set
- Run `npm run build` locally to debug
- Check Vercel build logs

---

## Next Steps

1. **Add Custom Domain**
   - Vercel > Project > Settings > Domains
   - Add your domain

2. **Set Up Email Notifications**
   - Configure Supabase SMTP settings
   - Test password reset flow

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy
   ```

4. **Populate Content**
   - Add modules/lessons in Supabase
   - Create badges
   - Schedule live sessions

---

## Support

For issues:
1. Check [Supabase docs](https://supabase.com/docs)
2. Check [Vercel docs](https://vercel.com/docs)
3. Check [Vite docs](https://vitejs.dev)

