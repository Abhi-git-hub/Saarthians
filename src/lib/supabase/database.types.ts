// Supabase Database types reconstructed from supabase/migrations/*.sql
// (0001_core through 20260910130000_teacher_question_workflow).
//
// No live database access was available when these were written, so the
// migrations are the source of truth. If drift is suspected, regenerate with:
//   supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
// and diff against this file.
//
// Deliberate omissions (not inventions):
// - Relationships[] is empty everywhere: foreign-key constraint names are
//   Postgres-generated (not named in migrations) and cannot be known here.
// - updated_at on test_answers comes from 20260909140000_admin_control_plane.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          username: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status: Database["public"]["Enums"]["user_status"];
          phone: string | null;
          grade_level: string | null;
          subject: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          username?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["user_status"];
          phone?: string | null;
          grade_level?: string | null;
          subject?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          username?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["user_status"];
          phone?: string | null;
          grade_level?: string | null;
          subject?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teacher_student: {
        Row: { teacher_id: string; student_id: string; status: string; created_at: string };
        Insert: { teacher_id: string; student_id: string; status?: string; created_at?: string };
        Update: { teacher_id?: string; student_id?: string; status?: string; created_at?: string };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          owner_user_id: string;
          title: string;
          content: string;
          visibility: Database["public"]["Enums"]["note_visibility"];
          status: Database["public"]["Enums"]["content_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          title: string;
          content?: string;
          visibility?: Database["public"]["Enums"]["note_visibility"];
          status?: Database["public"]["Enums"]["content_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          title?: string;
          content?: string;
          visibility?: Database["public"]["Enums"]["note_visibility"];
          status?: Database["public"]["Enums"]["content_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      note_shares: {
        Row: { note_id: string; student_id: string; shared_by_user_id: string; created_at: string };
        Insert: { note_id: string; student_id: string; shared_by_user_id: string; created_at?: string };
        Update: { note_id?: string; student_id?: string; shared_by_user_id?: string; created_at?: string };
        Relationships: [];
      };
      tests: {
        Row: {
          id: string;
          teacher_id: string;
          title: string;
          instructions: string;
          duration_seconds: number | null;
          status: Database["public"]["Enums"]["content_status"];
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          title: string;
          instructions?: string;
          duration_seconds?: number | null;
          status?: Database["public"]["Enums"]["content_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          title?: string;
          instructions?: string;
          duration_seconds?: number | null;
          status?: Database["public"]["Enums"]["content_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      test_questions: {
        Row: {
          id: string;
          test_id: string;
          type: string;
          prompt: string;
          options_json: Json | null;
          correct_answer_json: Json;
          points: number;
          position: number;
        };
        Insert: {
          id?: string;
          test_id: string;
          type: string;
          prompt: string;
          options_json?: Json | null;
          correct_answer_json: Json;
          points: number;
          position: number;
        };
        Update: {
          id?: string;
          test_id?: string;
          type?: string;
          prompt?: string;
          options_json?: Json | null;
          correct_answer_json?: Json;
          points?: number;
          position?: number;
        };
        Relationships: [];
      };
      test_attempts: {
        Row: {
          id: string;
          test_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["attempt_status"];
          started_at: string | null;
          submitted_at: string | null;
          score: number | null;
          max_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          student_id: string;
          status?: Database["public"]["Enums"]["attempt_status"];
          started_at?: string | null;
          submitted_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          student_id?: string;
          status?: Database["public"]["Enums"]["attempt_status"];
          started_at?: string | null;
          submitted_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      test_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          answer_json: Json | null;
          awarded_points: number | null;
          feedback: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          answer_json?: Json | null;
          awarded_points?: number | null;
          feedback?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          answer_json?: Json | null;
          awarded_points?: number | null;
          feedback?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_conversations: {
        Row: { id: string; user_id: string; title: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; title?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; title?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          context_metadata_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          context_metadata_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          context_metadata_json?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata_json: Json | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata_json?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          metadata_json?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_teacher_of: { Args: { target_student: string }; Returns: boolean };
      current_profile_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      current_profile_status: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["user_status"];
      };
      handle_new_user: { Args: Record<string, never>; Returns: unknown };
      protect_profile_authorization_fields: { Args: Record<string, never>; Returns: unknown };
      create_teacher_test: {
        Args: { p_title: string; p_instructions?: string; p_duration_seconds?: number | null };
        Returns: string;
      };
      create_test_question: {
        Args: {
          p_test_id: string;
          p_type: string;
          p_prompt: string;
          p_options: Json;
          p_correct_answer: Json;
          p_points: number;
          p_position: number;
        };
        Returns: string;
      };
      publish_teacher_test: { Args: { p_test_id: string }; Returns: boolean };
      save_test_answer: {
        Args: { p_attempt_id: string; p_question_id: string; p_answer: Json };
        Returns: undefined;
      };
      submit_test_attempt: {
        Args: { p_attempt_id: string };
        Returns: {
          score: number;
          max_score: number;
          status: Database["public"]["Enums"]["attempt_status"];
        }[];
      };
      start_test_attempt: { Args: { p_test_id: string }; Returns: string };
      admin_provision_profile: {
        Args: {
          p_user_id: string;
          p_display_name: string;
          p_username: string;
          p_role: Database["public"]["Enums"]["app_role"];
          p_phone?: string | null;
          p_grade_level?: string | null;
          p_subject?: string | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      admin_overview: { Args: Record<string, never>; Returns: Json };
      admin_list_profiles: {
        Args: {
          p_role?: string | null;
          p_status?: string | null;
          p_search?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          display_name: string;
          username: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status: Database["public"]["Enums"]["user_status"];
          phone: string | null;
          grade_level: string | null;
          subject: string | null;
          created_at: string;
          updated_at: string;
          total_count: number;
        }[];
      };
      admin_set_profile_status: {
        Args: { p_user_id: string; p_status: Database["public"]["Enums"]["user_status"] };
        Returns: boolean;
      };
      admin_update_profile: {
        Args: {
          p_user_id: string;
          p_display_name: string;
          p_phone?: string | null;
          p_grade_level?: string | null;
          p_subject?: string | null;
        };
        Returns: boolean;
      };
      admin_assign_teacher_student: {
        Args: { p_teacher_id: string; p_student_id: string };
        Returns: boolean;
      };
      admin_unassign_teacher_student: {
        Args: { p_teacher_id: string; p_student_id: string };
        Returns: boolean;
      };
      admin_list_relationships: {
        Args: { p_search?: string | null; p_limit?: number; p_offset?: number };
        Returns: {
          teacher_id: string;
          teacher_name: string;
          student_id: string;
          student_name: string;
          student_status: Database["public"]["Enums"]["user_status"];
          status: string;
          created_at: string;
          total_count: number;
        }[];
      };
      admin_list_tests: {
        Args: { p_status?: string | null; p_search?: string | null; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          title: string;
          status: Database["public"]["Enums"]["content_status"];
          teacher_id: string;
          teacher_name: string;
          question_count: number;
          attempt_count: number;
          created_at: string;
          published_at: string | null;
          total_count: number;
        }[];
      };
      admin_list_audit: {
        Args: { p_action?: string | null; p_search?: string | null; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          created_at: string;
          actor_user_id: string | null;
          actor_name: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata_json: Json | null;
          total_count: number;
        }[];
      };
      admin_db_check: { Args: Record<string, never>; Returns: string };
      upsert_test_question: {
        Args: {
          p_question_id?: string | null;
          p_test_id?: string | null;
          p_type?: string | null;
          p_prompt?: string | null;
          p_options?: Json | null;
          p_correct?: Json | null;
          p_points?: number | null;
          p_position?: number | null;
        };
        Returns: string;
      };
      delete_test_question: { Args: { p_question_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "student" | "teacher" | "admin";
      user_status: "active" | "suspended" | "pending";
      note_visibility: "private" | "shared" | "published";
      content_status: "draft" | "published" | "archived";
      attempt_status: "created" | "in_progress" | "submitted" | "graded" | "reviewed";
    };
    CompositeTypes: Record<string, never>;
  };
};
