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
      alters: {
        Row: {
          access_needs: string | null
          age_range: string | null
          archived_at: string | null
          color: string | null
          communication_style: string | null
          created_at: string
          emoji: string | null
          fronting_confidence: string | null
          grounding_preferences: string | null
          id: string
          is_active: boolean
          music_preferences: string | null
          name: string
          nickname: string | null
          notes: string | null
          private_fields: string[] | null
          pronouns: string
          role: string | null
          safe_foods: string | null
          species: string | null
          triggers_to_avoid: string | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          access_needs?: string | null
          age_range?: string | null
          archived_at?: string | null
          color?: string | null
          communication_style?: string | null
          created_at?: string
          emoji?: string | null
          fronting_confidence?: string | null
          grounding_preferences?: string | null
          id?: string
          is_active?: boolean
          music_preferences?: string | null
          name: string
          nickname?: string | null
          notes?: string | null
          private_fields?: string[] | null
          pronouns?: string
          role?: string | null
          safe_foods?: string | null
          species?: string | null
          triggers_to_avoid?: string | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          access_needs?: string | null
          age_range?: string | null
          archived_at?: string | null
          color?: string | null
          communication_style?: string | null
          created_at?: string
          emoji?: string | null
          fronting_confidence?: string | null
          grounding_preferences?: string | null
          id?: string
          is_active?: boolean
          music_preferences?: string | null
          name?: string
          nickname?: string | null
          notes?: string | null
          private_fields?: string[] | null
          pronouns?: string
          role?: string | null
          safe_foods?: string | null
          species?: string | null
          triggers_to_avoid?: string | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          dark_mode: boolean
          font_size: string
          high_contrast: boolean
          plain_language: boolean
          reduced_motion: boolean
          screen_reader_optimized: boolean
          sound_off: boolean
          spacing: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dark_mode?: boolean
          font_size?: string
          high_contrast?: boolean
          plain_language?: boolean
          reduced_motion?: boolean
          screen_reader_optimized?: boolean
          sound_off?: boolean
          spacing?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dark_mode?: boolean
          font_size?: string
          high_contrast?: boolean
          plain_language?: boolean
          reduced_motion?: boolean
          screen_reader_optimized?: boolean
          sound_off?: boolean
          spacing?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          event_date: string
          event_time: string | null
          id: string
          notes: string | null
          preferred_fronter: string | null
          recovery_time: string | null
          sensory_prep: string | null
          support_needed: string | null
          title: string
          transport_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_time?: string | null
          id?: string
          notes?: string | null
          preferred_fronter?: string | null
          recovery_time?: string | null
          sensory_prep?: string | null
          support_needed?: string | null
          title: string
          transport_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_time?: string | null
          id?: string
          notes?: string | null
          preferred_fronter?: string | null
          recovery_time?: string | null
          sensory_prep?: string | null
          support_needed?: string | null
          title?: string
          transport_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_check_ins: {
        Row: {
          alter_id: string | null
          check_date: string
          created_at: string
          dissociation: number
          fatigue: number
          id: string
          mood: number
          notes: string | null
          pain: number
          seizure_risk: number | null
          stress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alter_id?: string | null
          check_date?: string
          created_at?: string
          dissociation: number
          fatigue: number
          id?: string
          mood: number
          notes?: string | null
          pain: number
          seizure_risk?: number | null
          stress: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alter_id?: string | null
          check_date?: string
          created_at?: string
          dissociation?: number
          fatigue?: number
          id?: string
          mood?: number
          notes?: string | null
          pain?: number
          seizure_risk?: number | null
          stress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      front_events: {
        Row: {
          alter_ids: string[]
          created_at: string
          end_time: string | null
          id: string
          location: string | null
          memory_continuity: Database["public"]["Enums"]["memory_continuity"]
          notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["front_status"]
          symptoms: string | null
          trigger_info: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alter_ids?: string[]
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          memory_continuity?: Database["public"]["Enums"]["memory_continuity"]
          notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["front_status"]
          symptoms?: string | null
          trigger_info?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alter_ids?: string[]
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          memory_continuity?: Database["public"]["Enums"]["memory_continuity"]
          notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["front_status"]
          symptoms?: string | null
          trigger_info?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      internal_messages: {
        Row: {
          content: string
          created_at: string
          from_alter_id: string | null
          id: string
          is_pinned: boolean
          is_read: boolean
          priority: Database["public"]["Enums"]["message_priority"]
          to_alter_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_alter_id?: string | null
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          priority?: Database["public"]["Enums"]["message_priority"]
          to_alter_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_alter_id?: string | null
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          priority?: Database["public"]["Enums"]["message_priority"]
          to_alter_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          alter_id: string | null
          archived_at: string | null
          content: string
          created_at: string
          id: string
          is_draft: boolean
          mood: number | null
          tags: string[]
          title: string | null
          type: Database["public"]["Enums"]["journal_type"]
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          alter_id?: string | null
          archived_at?: string | null
          content: string
          created_at?: string
          id?: string
          is_draft?: boolean
          mood?: number | null
          tags?: string[]
          title?: string | null
          type?: Database["public"]["Enums"]["journal_type"]
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          alter_id?: string | null
          archived_at?: string | null
          content?: string
          created_at?: string
          id?: string
          is_draft?: boolean
          mood?: number | null
          tags?: string[]
          title?: string | null
          type?: Database["public"]["Enums"]["journal_type"]
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          system_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          system_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          system_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safety_plans: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          steps: string[]
          title: string
          trusted_contacts: Json
          type: Database["public"]["Enums"]["safety_plan_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          steps?: string[]
          title: string
          trusted_contacts?: Json
          type: Database["public"]["Enums"]["safety_plan_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          steps?: string[]
          title?: string
          trusted_contacts?: Json
          type?: Database["public"]["Enums"]["safety_plan_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived_at: string | null
          assigned_to: string
          category: Database["public"]["Enums"]["task_category"]
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          is_recurring: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      front_status:
        | "fronting"
        | "co-fronting"
        | "co-conscious"
        | "passive-influence"
        | "blurry"
        | "unknown"
        | "dormant"
        | "unavailable"
        | "stuck"
        | "nonverbal"
      journal_type:
        | "text"
        | "mood"
        | "sensory"
        | "flashback"
        | "medical"
        | "seizure"
        | "victory"
        | "memory-reconstruction"
      memory_continuity: "present" | "partial" | "absent" | "unknown"
      message_priority: "low" | "normal" | "high" | "urgent"
      safety_plan_type:
        | "grounding"
        | "crisis"
        | "shutdown"
        | "meltdown"
        | "flashback"
        | "seizure"
        | "medical"
        | "hospital-card"
      task_category:
        | "general"
        | "medication"
        | "hygiene"
        | "meals"
        | "hydration"
        | "therapy"
        | "mobility"
        | "community"
      visibility: "private" | "shared" | "emergency-only"
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
    Enums: {
      front_status: [
        "fronting",
        "co-fronting",
        "co-conscious",
        "passive-influence",
        "blurry",
        "unknown",
        "dormant",
        "unavailable",
        "stuck",
        "nonverbal",
      ],
      journal_type: [
        "text",
        "mood",
        "sensory",
        "flashback",
        "medical",
        "seizure",
        "victory",
        "memory-reconstruction",
      ],
      memory_continuity: ["present", "partial", "absent", "unknown"],
      message_priority: ["low", "normal", "high", "urgent"],
      safety_plan_type: [
        "grounding",
        "crisis",
        "shutdown",
        "meltdown",
        "flashback",
        "seizure",
        "medical",
        "hospital-card",
      ],
      task_category: [
        "general",
        "medication",
        "hygiene",
        "meals",
        "hydration",
        "therapy",
        "mobility",
        "community",
      ],
      visibility: ["private", "shared", "emergency-only"],
    },
  },
} as const
