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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          created_at: string | null
          creator_id: string
          device_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          device_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          device_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          amount: number
          commission_earned: number
          created_at: string | null
          creator_id: string
          id: string
          paid_at: string | null
          status: string | null
          tier: string
          user_id: string | null
        }
        Insert: {
          amount: number
          commission_earned: number
          created_at?: string | null
          creator_id: string
          id?: string
          paid_at?: string | null
          status?: string | null
          tier: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          commission_earned?: number
          created_at?: string | null
          creator_id?: string
          id?: string
          paid_at?: string | null
          status?: string | null
          tier?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_coupons: {
        Row: {
          code: string
          created_at: string | null
          creator_id: string
          discount_percent: number
          expires_at: string | null
          id: string
          max_uses: number | null
          uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          creator_id: string
          discount_percent: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          creator_id?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_coupons_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          breakdown: Json
          created_at: string | null
          deleted_at: string | null
          id: string
          image_thumbnail_url: string | null
          image_url: string | null
          is_public: boolean | null
          like_count: number | null
          score: number
          tips: Json
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          breakdown: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_thumbnail_url?: string | null
          image_url?: string | null
          is_public?: boolean | null
          like_count?: number | null
          score: number
          tips: Json
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          breakdown?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_thumbnail_url?: string | null
          image_url?: string | null
          is_public?: boolean | null
          like_count?: number | null
          score?: number
          tips?: Json
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          analysis_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          affiliate_link: string
          approved_at: string | null
          commission_rate: number
          created_at: string | null
          id: string
          instagram_follower_count: number | null
          instagram_handle: string | null
          name: string
          status: string | null
          suspended_at: string | null
          tier: string | null
          tiktok_follower_count: number | null
          tiktok_handle: string | null
          total_earned: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_link: string
          approved_at?: string | null
          commission_rate: number
          created_at?: string | null
          id?: string
          instagram_follower_count?: number | null
          instagram_handle?: string | null
          name: string
          status?: string | null
          suspended_at?: string | null
          tier?: string | null
          tiktok_follower_count?: number | null
          tiktok_handle?: string | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_link?: string
          approved_at?: string | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          instagram_follower_count?: number | null
          instagram_handle?: string | null
          name?: string
          status?: string | null
          suspended_at?: string | null
          tier?: string | null
          tiktok_follower_count?: number | null
          tiktok_handle?: string | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_weekly: {
        Row: {
          created_at: string | null
          id: string
          rank: number
          score: number
          user_id: string
          week_starting: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rank: number
          score: number
          user_id: string
          week_starting: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rank?: number
          score?: number
          user_id?: string
          week_starting?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_weekly_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          accepted_at: string | null
          bonus_scans_given: number | null
          created_at: string | null
          from_user_id: string
          id: string
          referral_code: string
          status: string | null
          to_user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          bonus_scans_given?: number | null
          created_at?: string | null
          from_user_id: string
          id?: string
          referral_code: string
          status?: string | null
          to_user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          bonus_scans_given?: number | null
          created_at?: string | null
          from_user_id?: string
          id?: string
          referral_code?: string
          status?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          analysis_id: string | null
          created_at: string | null
          flagged_by: string | null
          id: string
          notes: string | null
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string | null
          flagged_by?: string | null
          id?: string
          notes?: string | null
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_id?: string | null
          created_at?: string | null
          flagged_by?: string | null
          id?: string
          notes?: string | null
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_logs: {
        Row: {
          analysis_id: string | null
          created_at: string | null
          id: string
          platform: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string | null
          id?: string
          platform: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string | null
          id?: string
          platform?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_logs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          source: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          source?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          source?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          ban_type: string
          created_at: string | null
          duration_days: number | null
          expires_at: string | null
          id: string
          issued_by: string | null
          reason: string
          user_id: string
        }
        Insert: {
          ban_type: string
          created_at?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          issued_by?: string | null
          reason: string
          user_id: string
        }
        Update: {
          ban_type?: string
          created_at?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          issued_by?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_device_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          marketing_emails: boolean | null
          profile_visibility: string | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          marketing_emails?: boolean | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          marketing_emails?: boolean | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_verified: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          google_id: string | null
          id: string
          last_active: string | null
          location: string | null
          referral_code: string
          referred_by: string | null
          scans_remaining: number | null
          tier: string | null
          total_scans_used: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          age_verified?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          google_id?: string | null
          id: string
          last_active?: string | null
          location?: string | null
          referral_code: string
          referred_by?: string | null
          scans_remaining?: number | null
          tier?: string | null
          total_scans_used?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          age_verified?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          google_id?: string | null
          id?: string
          last_active?: string | null
          location?: string | null
          referral_code?: string
          referred_by?: string | null
          scans_remaining?: number | null
          tier?: string | null
          total_scans_used?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          vote_type: string
          voteable_id: string
          voteable_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: string
          voteable_id: string
          voteable_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: string
          voteable_id?: string
          voteable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
