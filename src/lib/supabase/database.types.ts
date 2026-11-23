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
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          cooperative_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          note: string | null
          old_value: Json | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperative_loan_products: {
        Row: {
          cooperative_id: string
          created_at: string
          id: string
          interest_terms: string | null
          is_public: boolean
          max_tenure_months: number
          min_savings_ratio: number
          name: string
        }
        Insert: {
          cooperative_id: string
          created_at?: string
          id?: string
          interest_terms?: string | null
          is_public?: boolean
          max_tenure_months: number
          min_savings_ratio: number
          name: string
        }
        Update: {
          cooperative_id?: string
          created_at?: string
          id?: string
          interest_terms?: string | null
          is_public?: boolean
          max_tenure_months?: number
          min_savings_ratio?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_loan_products_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
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
      deduction_reconciliation: {
        Row: {
          actual_amount_received: number | null
          entered_at: string
          entered_by: string | null
          expected_amount: number
          id: string
          membership_id: string
          period: string
        }
        Insert: {
          actual_amount_received?: number | null
          entered_at?: string
          entered_by?: string | null
          expected_amount: number
          id?: string
          membership_id: string
          period: string
        }
        Update: {
          actual_amount_received?: number | null
          entered_at?: string
          entered_by?: string | null
          expected_amount?: number
          id?: string
          membership_id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "deduction_reconciliation_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "cooperative_memberships"
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
      loans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          entered_by: string | null
          expected_end_date: string | null
          id: string
          loan_product_id: string | null
          membership_id: string
          monthly_repayment: number
          origin: Database["public"]["Enums"]["loan_origin"]
          outstanding_balance_at_entry: number | null
          over_capacity: boolean
          rejected_at: string | null
          requested_amount: number
          reservation_expires_at: string | null
          reserved_at: string | null
          shortfall_at_submission: number | null
          started_on: string | null
          status: Database["public"]["Enums"]["loan_status"]
          tenure_months: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          entered_by?: string | null
          expected_end_date?: string | null
          id?: string
          loan_product_id?: string | null
          membership_id: string
          monthly_repayment: number
          origin?: Database["public"]["Enums"]["loan_origin"]
          outstanding_balance_at_entry?: number | null
          over_capacity?: boolean
          rejected_at?: string | null
          requested_amount: number
          reservation_expires_at?: string | null
          reserved_at?: string | null
          shortfall_at_submission?: number | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_months: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          entered_by?: string | null
          expected_end_date?: string | null
          id?: string
          loan_product_id?: string | null
          membership_id?: string
          monthly_repayment?: number
          origin?: Database["public"]["Enums"]["loan_origin"]
          outstanding_balance_at_entry?: number | null
          over_capacity?: boolean
          rejected_at?: string | null
          requested_amount?: number
          reservation_expires_at?: string | null
          reserved_at?: string | null
          shortfall_at_submission?: number | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "cooperative_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      member_roster_entries: {
        Row: {
          cooperative_id: string
          employee_id: string
          id: string
          imported_at: string
          imported_by: string | null
          linked_at: string | null
          membership_id: string | null
          name: string | null
          savings_balance: number
        }
        Insert: {
          cooperative_id: string
          employee_id: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          linked_at?: string | null
          membership_id?: string | null
          name?: string | null
          savings_balance?: number
        }
        Update: {
          cooperative_id?: string
          employee_id?: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          linked_at?: string | null
          membership_id?: string | null
          name?: string | null
          savings_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_roster_entries_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roster_entries_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "cooperative_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          id: string
          message: string
          read_at: string | null
          target_url: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          target_url?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          target_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
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
      access_grants: {
        Row: {
          id: string
          requested_by: string
          cooperative_id: string
          member_user_id: string | null
          reason: string
          status: Database["public"]["Enums"]["access_grant_status"]
          requested_at: string
          activates_at: string
          expires_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          requested_by: string
          cooperative_id: string
          member_user_id?: string | null
          reason: string
          status?: Database["public"]["Enums"]["access_grant_status"]
          requested_at?: string
          activates_at: string
          expires_at: string
          revoked_at?: string | null
        }
        Update: {
          id?: string
          requested_by?: string
          cooperative_id?: string
          member_user_id?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["access_grant_status"]
          requested_at?: string
          activates_at?: string
          expires_at?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperative_internal_notes: {
        Row: {
          cooperative_id: string
          note: string
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          cooperative_id: string
          note: string
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          cooperative_id?: string
          note?: string
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_internal_notes_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: true
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
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
      savings_transactions: {
        Row: {
          amount: number
          description: string | null
          id: string
          loan_id: string | null
          membership_id: string
          recorded_at: string
          recorded_by: string | null
          type: Database["public"]["Enums"]["savings_transaction_type"]
        }
        Insert: {
          amount: number
          description?: string | null
          id?: string
          loan_id?: string | null
          membership_id: string
          recorded_at?: string
          recorded_by?: string | null
          type: Database["public"]["Enums"]["savings_transaction_type"]
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          loan_id?: string | null
          membership_id?: string
          recorded_at?: string
          recorded_by?: string | null
          type?: Database["public"]["Enums"]["savings_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "cooperative_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          cooperative_id: string
          email: string
          id: string
          invited_at: string
          invited_by: string | null
          permissions: Json
          role: Database["public"]["Enums"]["staff_role"]
          title: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          cooperative_id: string
          email: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          permissions?: Json
          role: Database["public"]["Enums"]["staff_role"]
          title?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          cooperative_id?: string
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["staff_role"]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
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
          notification_preferences: Json
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
          notification_preferences?: Json
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
          notification_preferences?: Json
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
      capacity_for_membership: {
        Args: { proposed_monthly_repayment?: number; target_membership_id: string }
        Returns: {
          available: number
          cap: number
          committed: number
          eligible: boolean
          headroom: number
          proposed: number
          shortfall: number
        }[]
      }
      capacity_for_user: {
        Args: { proposed_monthly_repayment?: number }
        Returns: {
          available: number
          cap: number
          committed: number
          eligible: boolean
          headroom: number
          proposed: number
          shortfall: number
        }[]
      }
      submit_loan_application: {
        Args: {
          loan_product_id?: string
          requested_amount: number
          target_membership_id: string
          tenure_months: number
        }
        Returns: {
          available: number
          cap: number
          committed: number
          eligible: boolean
          loan_id: string
          meets_savings_ratio: boolean
          monthly_repayment: number
          reservation_expires_at: string
          savings_required: number
          savings_shortfall: number
          shortfall: number
        }[]
      }
      is_active_cooperative_admin: {
        Args: { target_cooperative_id: string }
        Returns: boolean
      }
      is_active_staff: {
        Args: { target_cooperative_id: string }
        Returns: boolean
      }
      claim_staff_invitations: { Args: never; Returns: number }
      cooperative_has_existing_loans: {
        Args: { target_cooperative_id: string }
        Returns: boolean
      }
      record_existing_loan: {
        Args: {
          expected_end_month: string
          loan_product_id?: string
          monthly_repayment: number
          note?: string
          original_amount?: number
          outstanding_balance: number
          start_month: string
          target_membership_id: string
        }
        Returns: {
          available_after: number
          available_before: number
          cap: number
          committed_after: number
          committed_before: number
          loan_id: string
        }[]
      }
      complete_loan: {
        Args: { note?: string; target_loan_id: string }
        Returns: {
          completed: boolean
          released_monthly: number
          repaid_total: number
          requested_amount: number
        }[]
      }
      expire_lapsed_reservations: {
        Args: { target_cooperative_id: string }
        Returns: number
      }
      decide_loan_application: {
        Args: { decision: string; note?: string; target_loan_id: string }
        Returns: {
          available_before: number
          monthly_repayment: number
          status: string
          was_over_cap: boolean
        }[]
      }
      invite_cooperative_staff: {
        Args: {
          invite_email: string
          invite_permissions?: Json
          invite_role?: Database["public"]["Enums"]["staff_role"]
          invite_title?: string
          invite_name?: string
          target_cooperative_id: string
        }
        Returns: {
          already_staff: boolean
          had_account: boolean
          invitation_id: string
        }[]
      }
      is_platform_admin: { Args: never; Returns: boolean }
      request_access_grant: {
        Args: {
          target_cooperative_id: string
          grant_reason: string
          target_member_user_id?: string | null
          delay_minutes?: number
          window_hours?: number
        }
        Returns: string
      }
      revoke_access_grant: { Args: { grant_id: string }; Returns: boolean }
      log_elevated_view: {
        Args: {
          grant_id: string
          viewed_table: string
          viewed_id?: string | null
          detail?: string | null
        }
        Returns: undefined
      }
      has_active_access_grant: {
        Args: { target_cooperative_id: string; target_member?: string | null }
        Returns: boolean
      }
      record_platform_event: {
        Args: {
          event_action: string
          event_target_table: string
          event_target_id?: string | null
          event_old?: Json | null
          event_new?: Json | null
          event_note?: string | null
        }
        Returns: string
      }
      list_platform_admins: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          name: string | null
          email: string | null
          granted_at: string
        }[]
      }
      grant_platform_admin: {
        Args: { admin_email: string }
        Returns: { granted: boolean; reason: string }[]
      }
      revoke_platform_admin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      staff_has_permission: {
        Args: { permission_key: string; target_cooperative_id: string }
        Returns: boolean
      }
      platform_overview: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_cooperatives: number
          active_cooperatives: number
          employee_headcount: number
          pending_invites: number
        }[]
      }
      platform_cooperative_directory: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          status: "active" | "inactive"
          created_at: string
          member_count: number
          officer_count: number
          admin_name: string | null
          admin_email: string | null
          admin_status: "invited" | "active" | null
          admin_invited_at: string | null
          admin_accepted_at: string | null
          pending_invite_email: string | null
          pending_invite_sent_at: string | null
          has_expiry_override: boolean
          internal_note: string | null
          roster_not_on_clarix_count: number
        }[]
      }
    }
    Enums: {
      cooperative_status: "active" | "inactive"
      deduction_basis: "gross" | "net"
      document_review_status: "pending_review" | "confirmed" | "corrected"
      document_type: "payslip"
      loan_origin: "clarix" | "pre_existing"
      loan_status:
        | "draft"
        | "reserved"
        | "pending_review"
        | "active"
        | "rejected"
        | "completed"
        | "expired"
      membership_status: "pending" | "active" | "suspended"
      access_grant_status: "pending" | "active" | "expired" | "revoked"
      notification_category:
        | "loan_decision"
        | "membership_decision"
        | "new_loan_product"
        | "salary_reverification"
        | "access_request"
      savings_transaction_type:
        | "contribution"
        | "withdrawal_record"
        | "loan_repayment"
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
      loan_origin: ["clarix", "pre_existing"],
      loan_status: ["draft","reserved","pending_review","active","rejected","completed","expired"],
      membership_status: ["pending", "active", "suspended"],
      access_grant_status: ["pending", "active", "expired", "revoked"],
      notification_category: [
        "access_request",
        "loan_decision",
        "membership_decision",
        "new_loan_product",
        "salary_reverification",
      ],
      savings_transaction_type: ["contribution","withdrawal_record","loan_repayment"],
      staff_role: ["admin", "officer"],
      staff_role_status: ["invited", "active", "revoked"],
    },
  },
} as const
