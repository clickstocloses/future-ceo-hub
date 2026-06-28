# Supabase Setup Guide - Recreate in Your Own Account

## Overview
The LevelBull Supabase project contains a complete learning management system (LMS) with user authentication, course modules, lessons, quizzes, and gamification features.

## Database Structure

### Core Tables:

1. **profiles** - User profiles with XP, streaks, and settings
   - Linked to auth.users (auto-delete on user removal)
   - Accessible by everyone (read), users update own
   - Fields: username, full_name, role, avatar_url, xp, streak, longest_streak, settings

2. **modules** - Course modules/sections
   - order_index for sorting
   - is_published flag
   - Viewable by everyone

3. **lessons** - Individual lessons within modules
   - Links to modules
   - Includes video_id, pdf_url, xp_reward
   - duration_minutes for tracking

4. **quiz_questions** - Quiz questions for lessons
   - question_text, options (JSONB), correct_index
   - Explanation field for feedback
   - Viewable by authenticated users only

5. **lesson_completions** - Tracks which lessons users completed
   - Stores: attempts, first_attempt_perfect, completed_at
   - Row-level security: users see/modify only their own
   - Unique constraint: user_id + lesson_id

6. **user_xp_log** - XP transaction history
   - Tracks earned XP with reason/description

7. **badges** - Achievement badges
   - name, slug, description, criteria, icon_name
   - Pre-defined achievements

8. **user_badges** - User's earned badges
   - Tracks earned_at timestamp
   - Viewable by all (to show profiles), insertable only by owner

9. **watch_prompts** - Prompts shown while watching videos
   - Associated with lessons
   - Ordered by order_index

10. **community_messages** - Chat/community feature
    - Channels and pinned messages
    - Users can view all, modify own

11. **message_reactions** - Emoji reactions on community messages

12. **schedule_sessions** - Scheduled live sessions/webinars
    - session_type, host_name, duration
    - Optional module_id linkage

13. **session_registrations** - User registrations for sessions

14. **notification_preferences** - User notification settings
    - Email frequency, in-app bells, badges, announcements, etc.

15. **offline_submissions** - Paper/open-ended submission grading
    - AI response, confidence level, score tracking

16. **ceo_helper_usage** - Track CEO helper chat usage
    - Daily message counts per user

## Security (Row Level Security Policies)

All tables have RLS enabled with policies:
- **Profiles**: Everyone can view, users update own
- **Modules/Lessons**: Everyone can view
- **Quiz Questions**: Authenticated users can view
- **Completions**: Users see/modify only their own
- **Badges**: Public viewing, users insert own
- **Messages**: Users view all, modify own
- **Sessions**: Public view, users register

## Edge Functions (Serverless)

Located in `supabase/functions/`:

1. **quiz** - Grades quiz submissions
2. **grade-open-ended** - AI-powered grading for open-ended questions
3. **grade-paper-submission** - Grades paper submissions with image support
4. **ceo-helper-chat** - AI chatbot helper for course questions

## Database Triggers

- `update_updated_at` trigger on profiles table (auto-updates modified_at)

## Steps to Recreate in Your Own Supabase Account

### 1. Create New Supabase Project
- Go to https://supabase.com
- Create new project
- Note the Project ID and API keys

### 2. Run Migrations
- Copy all files from `supabase/migrations/` folder
- Execute them in order in Supabase SQL editor
- Or use Supabase CLI: `supabase db push`

### 3. Deploy Edge Functions
- Copy `supabase/functions/` folder
- Deploy with: `supabase functions deploy`

### 4. Set Environment Variables
In your `.env` file:
```
VITE_SUPABASE_URL=https://your_project_id.supabase.co
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 5. Update Vercel Environment Variables
When deploying to Vercel, add the same three variables to your project settings.

## Key Features Supported

- ✅ User authentication with email/password
- ✅ User profiles with XP levels and streaks
- ✅ Course modules and lessons
- ✅ Video-based learning with watch prompts
- ✅ Quiz questions with auto-grading
- ✅ Open-ended question grading (AI-powered)
- ✅ Paper submission grading
- ✅ Badges/achievements system
- ✅ Community/chat with reactions
- ✅ Live session scheduling
- ✅ Notification preferences
- ✅ CEO Helper AI chatbot
- ✅ Accessibility settings (screen reader, font size, theme)

## Data Migration

If the LevelBull project has existing user data you want to keep:
1. Export data from existing Supabase
2. Import into your new Supabase project
3. Ensure all users exist before importing related data

## Next Steps

1. Create your Supabase account
2. Run migrations to set up the schema
3. Deploy the edge functions
4. Update environment variables
5. Deploy to Vercel with new credentials
