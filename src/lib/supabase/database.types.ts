// Generated from the live `Clarix` Supabase schema (project ref sxugaizwmqigtioqgefx).
// Regenerate after any migration with:
//   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
// Never hand-edit: change the schema through a migration under supabase/migrations/ instead.

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
      cooperative_memberships: {
        Row: {
          cooperative_id: string
          created_at: string
          id: string
          joined_at: string | null
          savings_balance: number
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          cooperative_id: string
          created_at?: string
          id?: string
          joined_at?: string | null
          savings_balance?: number
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          cooperative_id?: string
          created_at?: string
          id?: string
          joined_at?: string | null
          savings_balance?: number
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_memberships_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooperative_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperative_staff_roles: {
        Row: {
          accepted_at: string | null
          cooperative_id: string
          granted_by: string | null
          id: string
          invited_at: string
          permissions: Json
          role: Database["public"]["Enums"]["staff_role"]
          status: Database["public"]["Enums"]["staff_role_status"]
          title: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          cooperative_id: string
          granted_by?: string | null
          id?: string
          invited_at?: string
          permissions?: Json
          role: Database["public"]["Enums"]["staff_role"]
          status?: Database["public"]["Enums"]["staff_role_status"]
          title?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          cooperative_id?: string
          granted_by?: string | null
          id?: string
          invited_at?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["staff_role"]
          status?: Database["public"]["Enums"]["staff_role_status"]
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_staff_roles_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooperative_staff_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooperative_staff_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperatives: {
        Row: {
          created_at: string
          description: string | null
          id: string
          min_savings_ratio_default: number
          name: string
          organization_id: string
          requirements: string | null
          reservation_expiry_days_override: number | null
          status: Database["public"]["Enums"]["cooperative_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          min_savings_ratio_default?: number
          name: string
          organization_id: string
          requirements?: string | null
          reservation_expiry_days_override?: number | null
          status?: Database["public"]["Enums"]["cooperative_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          min_savings_ratio_default?: number
          name?: string
          organization_id?: string
          requirements?: string | null
          reservation_expiry_days_override?: number | null
          status?: Database["public"]["Enums"]["cooperative_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cooperatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          byte_size: number | null
          extracted_fields: Json | null
          id: string
          mime_type: string | null
          original_filename: string | null
          pay_period: string | null
          review_status: Database["public"]["Enums"]["document_review_status"]
          reviewed_at: string | null
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_at: string
          user_id: string
        }
        Insert: {
          byte_size?: number | null
          extracted_fields?: Json | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          pay_period?: string | null
          review_status?: Database["public"]["Enums"]["document_review_status"]
          reviewed_at?: string | null
          storage_path: string
          type?: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string
          user_id: string
        }
        Update: {
          byte_size?: number | null
          extracted_fields?: Json | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          pay_period?: string | null
          review_status?: Database["public"]["Enums"]["document_review_status"]
          reviewed_at?: string | null
          storage_path?: string
          type?: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deduction_basis: Database["public"]["Enums"]["deduction_basis"]
          deduction_max_percentage: number
          employee_id_label: string
          employee_id_pattern: string
          id: string
          name: string
          reservation_expiry_days_default: number
        }
        Insert: {
          created_at?: string
          deduction_basis?: Database["public"]["Enums"]["deduction_basis"]
          deduction_max_percentage?: number
          employee_id_label?: string
          employee_id_pattern?: string
          id?: string
          name: string
          reservation_expiry_days_default?: number
        }
        Update: {
          created_at?: string
          deduction_basis?: Database["public"]["Enums"]["deduction_basis"]
          deduction_max_percentage?: number
          employee_id_label?: string
          employee_id_pattern?: string
          id?: string
          name?: string
          reservation_expiry_days_default?: number
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          granted_at: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          employee_id: string | null
          id: string
          name: string | null
          organization_id: string
          phone: string | null
          salary_gross: number | null
          salary_net: number | null
          salary_source_doc_id: string | null
          salary_verified_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_id?: string | null
          id: string
          name?: string | null
          organization_id: string
          phone?: string | null
          salary_gross?: number | null
          salary_net?: number | null
          salary_source_doc_id?: string | null
          salary_verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_id?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          phone?: string | null
          salary_gross?: number | null
          salary_net?: number | null
          salary_source_doc_id?: string | null
          salary_verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_salary_source_doc_id_fkey"
            columns: ["salary_source_doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_cooperative_admin: {
        Args: { target_cooperative_id: string }
        Returns: boolean
      }
      is_active_staff: {
        Args: { target_cooperative_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      cooperative_status: "active" | "inactive"
      deduction_basis: "gross" | "net"
      document_review_status: "pending_review" | "confirmed" | "corrected"
      document_type: "payslip"
      membership_status: "pending" | "active" | "suspended"
      staff_role: "admin" | "officer"
      staff_role_status: "invited" | "active" | "revoked"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      cooperative_status: ["active", "inactive"],
      deduction_basis: ["gross", "net"],
      document_review_status: ["pending_review", "confirmed", "corrected"],
      document_type: ["payslip"],
      membership_status: ["pending", "active", "suspended"],
      staff_role: ["admin", "officer"],
      staff_role_status: ["invited", "active", "revoked"],
    },
  },
} as const
