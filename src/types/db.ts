/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND
 * Regenerate: pnpm supabase:gen-types
 * Sources: (1) supabase/mcp_gentypes.json from Cursor "generate_typescript_types" MCP, or
 * (2) npx supabase gen types (needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF; see .env.example).
 * ESLint: src/types/db.ts is in eslint.config.js globalIgnores (generated string literals, not UI).
 */


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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          payload: Json
          subject_id: string
          subject_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          payload?: Json
          subject_id: string
          subject_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          payload?: Json
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      chemical_applications: {
        Row: {
          applicator_id: string
          applied_at: string
          created_at: string
          field_id: string
          id: string
          task_id: string
        }
        Insert: {
          applicator_id: string
          applied_at?: string
          created_at?: string
          field_id: string
          id?: string
          task_id: string
        }
        Update: {
          applicator_id?: string
          applied_at?: string
          created_at?: string
          field_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chemical_applications_applicator_id_fkey"
            columns: ["applicator_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_applications_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["equipment_category"]
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fields: {
        Row: {
          address: string | null
          area_hectares: number | null
          boundary: unknown
          created_at: string
          crop: string
          gps_center: unknown
          id: string
          name: string
          notes: string | null
          plant_count: number | null
          planted_year: number | null
          updated_at: string
          variety: string | null
        }
        Insert: {
          address?: string | null
          area_hectares?: number | null
          boundary?: unknown
          created_at?: string
          crop: string
          gps_center: unknown
          id?: string
          name: string
          notes?: string | null
          plant_count?: number | null
          planted_year?: number | null
          updated_at?: string
          variety?: string | null
        }
        Update: {
          address?: string | null
          area_hectares?: number | null
          boundary?: unknown
          created_at?: string
          crop?: string
          gps_center?: unknown
          id?: string
          name?: string
          notes?: string | null
          plant_count?: number | null
          planted_year?: number | null
          updated_at?: string
          variety?: string | null
        }
        Relationships: []
      }
      issues: {
        Row: {
          category: Database["public"]["Enums"]["issue_category"]
          created_at: string
          field_id: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          photo_url: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          task_id: string | null
          voice_note_url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["issue_category"]
          created_at?: string
          field_id?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          photo_url: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          task_id?: string | null
          voice_note_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["issue_category"]
          created_at?: string
          field_id?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          photo_url?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          task_id?: string | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      },
      notifications: {
        Row: {
          activity_log_id: string
          created_at: string
          delivered_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          activity_log_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          activity_log_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_settings: {
        Row: {
          created_at: string
          id: string
          operation_name: string
          timezone: string
          updated_at: string
          user_id: string
          weather_city: string
        }
        Insert: {
          created_at?: string
          id?: string
          operation_name: string
          timezone?: string
          updated_at?: string
          user_id: string
          weather_city: string
        }
        Update: {
          created_at?: string
          id?: string
          operation_name?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          weather_city?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          full_name: string
          id: string
          notification_prefs: Json
          phone: string
          role: Database["public"]["Enums"]["person_role"]
          setup_token: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          notification_prefs?: Json
          phone: string
          role: Database["public"]["Enums"]["person_role"]
          setup_token?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          notification_prefs?: Json
          phone?: string
          role?: Database["public"]["Enums"]["person_role"]
          setup_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_equipment: {
        Row: {
          attached_at: string
          attached_by: string
          equipment_id: string
          task_id: string
        }
        Insert: {
          attached_at?: string
          attached_by: string
          equipment_id: string
          task_id: string
        }
        Update: {
          attached_at?: string
          attached_by?: string
          equipment_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_equipment_attached_by_fkey"
            columns: ["attached_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_equipment_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          activity: string
          assignee_id: string
          blocked_at: string | null
          completed_at: string | null
          completion_photo_url: string | null
          created_at: string
          created_by: string
          due_date: string
          field_id: string
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          activity: string
          assignee_id: string
          blocked_at?: string | null
          completed_at?: string | null
          completion_photo_url?: string | null
          created_at?: string
          created_by: string
          due_date: string
          field_id: string
          id?: string
          notes?: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          activity?: string
          assignee_id?: string
          blocked_at?: string | null
          completed_at?: string | null
          completion_photo_url?: string | null
          created_at?: string
          created_by?: string
          due_date?: string
          field_id?: string
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_person_id: { Args: never; Returns: string }
      is_owner: { Args: never; Returns: boolean }
      reassign_task: {
        Args: { p_new_assignee: string; p_task_id: string }
        Returns: undefined
      }
      task_by_id: {
        Args: { p_id: string }
        Returns: {
          activity: string
          assignee_id: string
          blocked_at: string | null
          completed_at: string | null
          completion_photo_url: string | null
          created_at: string
          created_by: string
          due_date: string
          field_id: string
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      equipment_category: "VEHICLE" | "TOOL" | "CHEMICAL" | "CRATE"
      issue_category:
        | "PEST"
        | "EQUIPMENT"
        | "INJURY"
        | "IRRIGATION"
        | "WEATHER"
        | "THEFT"
        | "SUPPLY"
      person_role: "OWNER" | "FOREMAN" | "AGRONOMIST" | "WORKER"
      task_priority: "LOW" | "NORMAL" | "URGENT"
      task_status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "CANCELLED"
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
      equipment_category: ["VEHICLE", "TOOL", "CHEMICAL", "CRATE"],
      issue_category: [
        "PEST",
        "EQUIPMENT",
        "INJURY",
        "IRRIGATION",
        "WEATHER",
        "THEFT",
        "SUPPLY",
      ],
      person_role: ["OWNER", "FOREMAN", "AGRONOMIST", "WORKER"],
      task_priority: ["LOW", "NORMAL", "URGENT"],
      task_status: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"],
    },
  },
} as const

