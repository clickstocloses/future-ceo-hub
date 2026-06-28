export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          criteria: string
          description: string
          icon_name: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          criteria: string
          description: string
          icon_name: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          criteria?: string
          description?: string
          icon_name?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      ceo_helper_usage: {
        Row: {
          date: string
          id: string
          message_count: number
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          message_count?: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          message_count?: number
          user_id?: string
        }
        Relationships: []
      }
      community_messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          user_id: string
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          user_id?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          attempts: number
          completed_at: string
          first_attempt_perfect: boolean
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string
          first_attempt_perfect?: boolean
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string
          first_attempt_perfect?: boolean
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          module_id: string
          order_index: number
          pdf_url: string | null
          subtitle: string | null
          title: string
          video_id: string | null
          xp_reward: number
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          module_id: string
          order_index: number
          pdf_url?: string | null
          subtitle?: string | null
          title: string
          video_id?: string | null
          xp_reward?: number
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          module_id?: string
          order_index?: number
          pdf_url?: string | null
          subtitle?: string | null
          title?: string
          video_id?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          order_index: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          announcements: boolean | null
          badge_earned: boolean | null
          community_reply: boolean | null
          created_at: string | null
          email_frequency: string | null
          id: string
          inapp_bell: boolean | null
          inapp_celebration: boolean | null
          inapp_streak: boolean | null
          inapp_xp_popup: boolean | null
          new_lesson: boolean | null
          new_session: boolean | null
          rank_change: boolean | null
          streak_reminder: boolean | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          announcements?: boolean | null
          badge_earned?: boolean | null
          community_reply?: boolean | null
          created_at?: string | null
          email_frequency?: string | null
          id?: string
          inapp_bell?: boolean | null
          inapp_celebration?: boolean | null
          inapp_streak?: boolean | null
          inapp_xp_popup?: boolean | null
          new_lesson?: boolean | null
          new_session?: boolean | null
          rank_change?: boolean | null
          streak_reminder?: boolean | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          announcements?: boolean | null
          badge_earned?: boolean | null
          community_reply?: boolean | null
          created_at?: string | null
          email_frequency?: string | null
          id?: string
          inapp_bell?: boolean | null
          inapp_celebration?: boolean | null
          inapp_streak?: boolean | null
          inapp_xp_popup?: boolean | null
          new_lesson?: boolean | null
          new_session?: boolean | null
          rank_change?: boolean | null
          streak_reminder?: boolean | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      offline_submissions: {
        Row: {
          ai_response: Json | null
          confidence_level: string | null
          created_at: string | null
          id: string
          image_url: string | null
          lesson_id: string
          passed: boolean | null
          score: number | null
          total: number | null
          user_id: string
        }
        Insert: {
          ai_response?: Json | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          lesson_id: string
          passed?: boolean | null
          score?: number | null
          total?: number | null
          user_id: string
        }
        Update: {
          ai_response?: Json | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          lesson_id?: string
          passed?: boolean | null
          score?: number | null
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accessibility_prompt_shown: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          last_login: string | null
          longest_streak: number
          pinned_badges: Json | null
          preferred_accent: string | null
          preferred_font_size: string | null
          preferred_theme: string | null
          profile_visible: boolean | null
          role: string
          screen_reader_enabled: boolean | null
          screen_reader_speed: number | null
          streak: number
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          accessibility_prompt_shown?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id: string
          last_login?: string | null
          longest_streak?: number
          pinned_badges?: Json | null
          preferred_accent?: string | null
          preferred_font_size?: string | null
          preferred_theme?: string | null
          profile_visible?: boolean | null
          role?: string
          screen_reader_enabled?: boolean | null
          screen_reader_speed?: number | null
          streak?: number
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          accessibility_prompt_shown?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          last_login?: string | null
          longest_streak?: number
          pinned_badges?: Json | null
          preferred_accent?: string | null
          preferred_font_size?: string | null
          preferred_theme?: string | null
          profile_visible?: boolean | null
          role?: string
          screen_reader_enabled?: boolean | null
          screen_reader_speed?: number | null
          streak?: number
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          explanation: string | null
          id: string
          is_open_ended: boolean
          lesson_id: string
          options: Json
          order_index: number
          question_text: string
        }
        Insert: {
          correct_index: number
          explanation?: string | null
          id?: string
          is_open_ended?: boolean
          lesson_id: string
          options: Json
          order_index?: number
          question_text: string
        }
        Update: {
          correct_index?: number
          explanation?: string | null
          id?: string
          is_open_ended?: boolean
          lesson_id?: string
          options?: Json
          order_index?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          host_name: string
          id: string
          module_id: string | null
          session_type: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          host_name: string
          id?: string
          module_id?: string | null
          session_type: string
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          host_name?: string
          id?: string
          module_id?: string | null
          session_type?: string
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "schedule_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accessibility_preferences: {
        Row: {
          auditory_impaired: boolean
          created_at: string
          has_set_preferences: boolean
          updated_at: string
          user_id: string
          visually_impaired: boolean
        }
        Insert: {
          auditory_impaired?: boolean
          created_at?: string
          has_set_preferences?: boolean
          updated_at?: string
          user_id: string
          visually_impaired?: boolean
        }
        Update: {
          auditory_impaired?: boolean
          created_at?: string
          has_set_preferences?: boolean
          updated_at?: string
          user_id?: string
          visually_impaired?: boolean
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp_log: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      watch_prompts: {
        Row: {
          id: string
          lesson_id: string
          order_index: number
          prompt_text: string
        }
        Insert: {
          id?: string
          lesson_id: string
          order_index: number
          prompt_text: string
        }
        Update: {
          id?: string
          lesson_id?: string
          order_index?: number
          prompt_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_prompts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_quiz_answer: {
        Args: { p_answer_index: number; p_question_id: string }
        Returns: {
          correct: boolean
          correct_index: number
          explanation: string
        }[]
      }
      get_quiz_questions: {
        Args: { p_lesson_id: string }
        Returns: {
          explanation: string
          id: string
          is_open_ended: boolean
          lesson_id: string
          options: Json
          order_index: number
          question_text: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
