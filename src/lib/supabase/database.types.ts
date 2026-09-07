export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; role: "student" | "teacher" | "admin"; status: "active" | "suspended" | "pending"; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string; role?: "student" | "teacher" | "admin"; status?: "active" | "suspended" | "pending"; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string; role?: "student" | "teacher" | "admin"; status?: "active" | "suspended" | "pending"; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      notes: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      teacher_student: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      note_shares: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      tests: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      test_questions: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      test_attempts: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      test_answers: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      chat_conversations: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      chat_messages: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      audit_events: { Row: Record<string, never>; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_teacher_of: { Args: { target_student: string }; Returns: boolean };
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
