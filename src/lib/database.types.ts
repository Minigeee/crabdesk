export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          locale: string
          org_id: string
          published_at: string | null
          seo_metadata: Json
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          locale?: string
          org_id: string
          published_at?: string | null
          seo_metadata?: Json
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          locale?: string
          org_id?: string
          published_at?: string | null
          seo_metadata?: Json
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          bucket: string
          created_at: string
          filename: string
          id: string
          metadata: Json
          mime_type: string
          org_id: string
          path: string
          size: number
          ticket_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          filename: string
          id?: string
          metadata?: Json
          mime_type: string
          org_id: string
          path: string
          size: number
          ticket_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          filename?: string
          id?: string
          metadata?: Json
          mime_type?: string
          org_id?: string
          path?: string
          size?: number
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_ticket_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_log_action"]
          actor_id: string | null
          changes: Json
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          org_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_log_action"]
          actor_id?: string | null
          changes: Json
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          org_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_log_action"]
          actor_id?: string | null
          changes?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_actor_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          first_seen_at: string
          id: string
          last_seen_at: string
          metadata: Json
          name: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          name?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          name?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          bcc_emails: string[] | null
          cc_emails: string[] | null
          created_at: string
          from_email: string
          from_name: string | null
          headers: Json
          html_body: string | null
          id: string
          in_reply_to: string | null
          message_id: string
          metadata: Json
          reference_ids: string[] | null
          subject: string
          text_body: string | null
          thread_id: string
          to_emails: string[]
        }
        Insert: {
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          from_email: string
          from_name?: string | null
          headers?: Json
          html_body?: string | null
          id?: string
          in_reply_to?: string | null
          message_id: string
          metadata?: Json
          reference_ids?: string[] | null
          subject: string
          text_body?: string | null
          thread_id: string
          to_emails: string[]
        }
        Update: {
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          headers?: Json
          html_body?: string | null
          id?: string
          in_reply_to?: string | null
          message_id?: string
          metadata?: Json
          reference_ids?: string[] | null
          subject?: string
          text_body?: string | null
          thread_id?: string
          to_emails?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          created_at: string
          from_email: string
          headers: Json | null
          id: string
          in_reply_to: string | null
          last_message_at: string
          message_id: string | null
          metadata: Json
          org_id: string
          provider_message_ids: string[]
          provider_thread_id: string
          raw_payload: Json | null
          reference_ids: string[] | null
          subject: string
          ticket_id: string
          to_email: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email: string
          headers?: Json | null
          id?: string
          in_reply_to?: string | null
          last_message_at: string
          message_id?: string | null
          metadata?: Json
          org_id: string
          provider_message_ids: string[]
          provider_thread_id: string
          raw_payload?: Json | null
          reference_ids?: string[] | null
          subject: string
          ticket_id: string
          to_email: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string
          headers?: Json | null
          id?: string
          in_reply_to?: string | null
          last_message_at?: string
          message_id?: string | null
          metadata?: Json
          org_id?: string
          provider_message_ids?: string[]
          provider_thread_id?: string
          raw_payload?: Json | null
          reference_ids?: string[] | null
          subject?: string
          ticket_id?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_threads_ticket_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          content_type: Database["public"]["Enums"]["message_content_type"]
          created_at: string
          id: string
          is_private: boolean
          metadata: Json
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
          updated_at: string
        }
        Insert: {
          content: string
          content_type?: Database["public"]["Enums"]["message_content_type"]
          created_at?: string
          id?: string
          is_private?: boolean
          metadata?: Json
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: Database["public"]["Enums"]["message_content_type"]
          created_at?: string
          id?: string
          is_private?: boolean
          metadata?: Json
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_ticket_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          branding: Json
          created_at: string
          domain: string
          email_settings: Json
          id: string
          name: string
          settings: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          domain: string
          email_settings?: Json
          id?: string
          name: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          domain?: string
          email_settings?: Json
          id?: string
          name?: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: number
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          email_alias: string | null
          id: string
          name: string
          org_id: string
          routing_rules: Json
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email_alias?: string | null
          id?: string
          name: string
          org_id: string
          routing_rules?: Json
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email_alias?: string | null
          id?: string
          name?: string
          org_id?: string
          routing_rules?: Json
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assignee_id: string | null
          contact_id: string
          created_at: string
          email_metadata: Json
          id: string
          metadata: Json
          number: number
          org_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          source: Database["public"]["Enums"]["ticket_source"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          contact_id: string
          created_at?: string
          email_metadata?: Json
          id?: string
          metadata?: Json
          number?: never
          org_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          source: Database["public"]["Enums"]["ticket_source"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          contact_id?: string
          created_at?: string
          email_metadata?: Json
          id?: string
          metadata?: Json
          number?: never
          org_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          source?: Database["public"]["Enums"]["ticket_source"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_team_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          id: string
          is_admin: boolean
          name: string
          org_id: string
          preferences: Json
          role: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          name: string
          org_id: string
          preferences?: Json
          role?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          name?: string
          org_id?: string
          preferences?: Json
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      fetch_team_org_id: {
        Args: {
          _team_id: string
        }
        Returns: string
      }
      fetch_ticket_org_id: {
        Args: {
          _ticket_id: string
        }
        Returns: string
      }
      has_org_access: {
        Args: {
          _org_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: {
          _org_id: string
        }
        Returns: boolean
      }
      process_email: {
        Args: {
          p_org_id: string
          p_from_email: string
          p_from_name: string
          p_to_email: string
          p_subject: string
          p_message_id: string
          p_in_reply_to?: string
          p_reference_ids?: string[]
          p_headers?: Json
          p_text_body?: string
          p_html_body?: string
          p_raw_payload?: Json
        }
        Returns: Json
      }
      search_contacts: {
        Args: {
          p_org_id: string
          p_query?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_ascending?: boolean
        }
        Returns: {
          contacts: Json
          total_count: number
        }[]
      }
    }
    Enums: {
      article_status: "draft" | "published" | "archived"
      audit_log_action: "insert" | "update" | "delete" | "restore"
      message_content_type: "text" | "html" | "markdown"
      message_sender_type: "contact" | "user" | "system"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_source: "email" | "api"
      ticket_status: "open" | "pending" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

