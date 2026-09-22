// Supabase Database types generated from the live project.
// Regenerate with the Supabase MCP `generate_typescript_types` tool
// (or: supabase gen types typescript --project-id <ref>)
// and overwrite this file. Last sync: learning-engine upgrade
// (study materials, test scheduling, security events, pgvector RPCs).
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
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          ip_hash: string | null
          metadata_json: Json | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          metadata_json?: Json | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          metadata_json?: Json | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          context_metadata_json: Json | null
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          context_metadata_json?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          context_metadata_json?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      note_shares: {
        Row: {
          created_at: string
          note_id: string
          shared_by_user_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          shared_by_user_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          shared_by_user_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_shares_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_shares_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_shares_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          owner_user_id: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["note_visibility"]
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          owner_user_id: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          owner_user_id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "notes_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          grade_level: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          subject: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string
          grade_level?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          subject?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          grade_level?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          subject?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      study_material_chunks: {
        Row: {
          chunk_index: number
          id: string
          material_id: string
          metadata_json: Json
          page_number: number
          text: string
        }
        Insert: {
          chunk_index?: number
          id?: string
          material_id: string
          metadata_json?: Json
          page_number?: number
          text?: string
        }
        Update: {
          chunk_index?: number
          id?: string
          material_id?: string
          metadata_json?: Json
          page_number?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_material_chunks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      study_material_embeddings: {
        Row: {
          chunk_id: string
          embedding: string
          model: string
        }
        Insert: {
          chunk_id: string
          embedding: string
          model?: string
        }
        Update: {
          chunk_id?: string
          embedding?: string
          model?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_material_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: true
            referencedRelation: "study_material_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          chapter: string
          compression_ratio: number
          created_at: string
          description: string
          embedding_model: string
          embedding_status: string
          extraction_status: string
          grade_level: string
          id: string
          mime_type: string
          optimization_status: string
          original_filename: string
          original_size_bytes: number
          page_count: number
          processing_error: string | null
          processing_status: string
          storage_path: string
          stored_size_bytes: number
          subject: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          chapter?: string
          compression_ratio?: number
          created_at?: string
          description?: string
          embedding_model?: string
          embedding_status?: string
          extraction_status?: string
          grade_level?: string
          id?: string
          mime_type?: string
          optimization_status?: string
          original_filename?: string
          original_size_bytes?: number
          page_count?: number
          processing_error?: string | null
          processing_status?: string
          storage_path?: string
          stored_size_bytes?: number
          subject?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          chapter?: string
          compression_ratio?: number
          created_at?: string
          description?: string
          embedding_model?: string
          embedding_status?: string
          extraction_status?: string
          grade_level?: string
          id?: string
          mime_type?: string
          optimization_status?: string
          original_filename?: string
          original_size_bytes?: number
          page_count?: number
          processing_error?: string | null
          processing_status?: string
          storage_path?: string
          stored_size_bytes?: number
          subject?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_student: {
        Row: {
          created_at: string
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_student_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_student_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_answers: {
        Row: {
          answer_json: Json | null
          attempt_id: string
          awarded_points: number | null
          feedback: string | null
          id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_json?: Json | null
          attempt_id: string
          awarded_points?: number | null
          feedback?: string | null
          id?: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_json?: Json | null
          attempt_id?: string
          awarded_points?: number | null
          feedback?: string | null
          id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          created_at: string
          deadline_at: string | null
          id: string
          max_score: number | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submission_reason: string | null
          submitted_at: string | null
          test_id: string
        }
        Insert: {
          created_at?: string
          deadline_at?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submission_reason?: string | null
          submitted_at?: string | null
          test_id: string
        }
        Update: {
          created_at?: string
          deadline_at?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id?: string
          submission_reason?: string | null
          submitted_at?: string | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          id: string
          options_json: Json | null
          points: number
          position: number
          prompt: string
          test_id: string
          type: string
        }
        Insert: {
          id?: string
          options_json?: Json | null
          points: number
          position: number
          prompt: string
          test_id: string
          type: string
        }
        Update: {
          id?: string
          options_json?: Json | null
          points?: number
          position?: number
          prompt?: string
          test_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_question_keys: {
        Row: {
          question_id: string
          correct_answer_json: Json
        }
        Insert: {
          question_id: string
          correct_answer_json?: Json
        }
        Update: {
          question_id?: string
          correct_answer_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "test_question_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_security_events: {
        Row: {
          attempt_id: string
          created_at: string
          event_type: string
          id: string
          metadata_json: Json
          student_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata_json?: Json
          student_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata_json?: Json
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_security_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_security_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          assessment_pdf_path: string | null
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          instructions: string
          published_at: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["content_status"]
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_pdf_path?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          instructions?: string
          published_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_pdf_path?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          instructions?: string
          published_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_teacher_student: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
      admin_db_check: { Args: never; Returns: string }
      admin_list_audit: {
        Args: {
          p_action?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          action: string
          actor_name: string
          actor_user_id: string
          created_at: string
          id: string
          metadata_json: Json
          resource_id: string
          resource_type: string
          total_count: number
        }[]
      }
      admin_list_profiles: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_search?: string
          p_status?: string
        }
        Returns: {
          created_at: string
          display_name: string
          grade_level: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          subject: string
          total_count: number
          updated_at: string
          username: string
        }[]
      }
      admin_list_relationships: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          created_at: string
          status: string
          student_id: string
          student_name: string
          student_status: Database["public"]["Enums"]["user_status"]
          teacher_id: string
          teacher_name: string
          total_count: number
        }[]
      }
      admin_list_tests: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          attempt_count: number
          created_at: string
          id: string
          published_at: string
          question_count: number
          status: Database["public"]["Enums"]["content_status"]
          teacher_id: string
          teacher_name: string
          title: string
          total_count: number
        }[]
      }
      admin_overview: { Args: never; Returns: Json }
      admin_prepare_user: {
        Args: {
          p_display_name: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_status?: Database["public"]["Enums"]["user_status"]
          p_user_id: string
        }
        Returns: {
          created_at: string
          display_name: string
          grade_level: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          subject: string | null
          updated_at: string
          username: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_provision_profile: {
        Args: {
          p_display_name: string
          p_grade_level?: string
          p_phone?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_subject?: string
          p_user_id: string
          p_username: string
        }
        Returns: {
          created_at: string
          display_name: string
          grade_level: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          subject: string | null
          updated_at: string
          username: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_profile_status: {
        Args: {
          p_status: Database["public"]["Enums"]["user_status"]
          p_user_id: string
        }
        Returns: boolean
      }
      admin_unassign_teacher_student: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
      admin_update_profile: {
        Args: {
          p_display_name: string
          p_grade_level?: string
          p_phone?: string
          p_subject?: string
          p_user_id: string
        }
        Returns: boolean
      }
      create_teacher_test: {
        Args: {
          p_duration_seconds?: number
          p_instructions?: string
          p_title: string
        }
        Returns: string
      }
      create_test: {
        Args: {
          p_duration_seconds?: number
          p_instructions?: string
          p_title: string
        }
        Returns: string
      }
      create_test_question: {
        Args: {
          p_correct_answer: Json
          p_options: Json
          p_points: number
          p_position: number
          p_prompt: string
          p_test_id: string
          p_type: string
        }
        Returns: string
      }
      finalize_expired_attempts: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_teacher_of: { Args: { target_student: string }; Returns: boolean }
      log_test_security_event: {
        Args: { p_attempt_id: string; p_event_type: string; p_metadata?: Json }
        Returns: boolean
      }
      match_material_chunks: {
        Args: {
          p_limit?: number
          p_material_id?: string
          p_query: string
          p_threshold?: number
        }
        Returns: {
          chunk_id: string
          chunk_text: string
          distance: number
          material_id: string
          material_title: string
          page_number: number
        }[]
      }
      match_material_chunks_lexical: {
        Args: { p_limit?: number; p_material_id?: string; p_query: string }
        Returns: {
          chunk_id: string
          chunk_text: string
          material_id: string
          material_title: string
          page_number: number
          similarity: number
        }[]
      }
      schedule_test: {
        Args: { p_end_time?: string; p_start_time?: string; p_test_id: string }
        Returns: boolean
      }
      start_test_attempt: { Args: { p_test_id: string }; Returns: string }
      submit_test_attempt: {
        Args: { p_attempt_id: string; p_reason?: string }
        Returns: {
          max_score: number
          score: number
          status: Database["public"]["Enums"]["attempt_status"]
        }[]
      }
      delete_test_question: {
        Args: { p_question_id: string }
        Returns: boolean
      }
      publish_teacher_test: { Args: { p_test_id: string }; Returns: boolean }
      save_test_answer: {
        Args: { p_answer: Json; p_attempt_id: string; p_question_id: string }
        Returns: undefined
      }
      upsert_test_question: {
        Args: {
          p_correct?: Json
          p_options?: Json
          p_points?: number
          p_position?: number
          p_prompt?: string
          p_question_id?: string
          p_test_id?: string
          p_type?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      attempt_status:
        | "created"
        | "in_progress"
        | "submitted"
        | "graded"
        | "reviewed"
      content_status: "draft" | "published" | "archived"
      note_visibility: "private" | "shared" | "published"
      user_status: "active" | "suspended" | "pending"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
      app_role: ["student", "teacher", "admin"],
      attempt_status: [
        "created",
        "in_progress",
        "submitted",
        "graded",
        "reviewed",
      ],
      content_status: ["draft", "published", "archived"],
      note_visibility: ["private", "shared", "published"],
      user_status: ["active", "suspended", "pending"],
    },
  },
} as const
