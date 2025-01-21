export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          domain: string | null
          settings: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          domain?: string | null
          settings?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          domain?: string | null
          settings?: Json
          metadata?: Json
        }
      }
      teams: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          organization_id: string | null
          settings: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          organization_id?: string | null
          settings?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          organization_id?: string | null
          settings?: Json
          metadata?: Json
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string
          role: 'admin' | 'agent' | 'customer'
          organization_id: string | null
          team_id: string | null
          avatar_url: string | null
          settings: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          full_name: string
          role?: 'admin' | 'agent' | 'customer'
          organization_id?: string | null
          team_id?: string | null
          avatar_url?: string | null
          settings?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'agent' | 'customer'
          organization_id?: string | null
          team_id?: string | null
          avatar_url?: string | null
          settings?: Json
          metadata?: Json
        }
      }
      tickets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          customer_id: string
          assigned_to: string | null
          team_id: string | null
          organization_id: string | null
          parent_ticket_id: string | null
          due_date: string | null
          tags: string[]
          settings: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          customer_id: string
          assigned_to?: string | null
          team_id?: string | null
          organization_id?: string | null
          parent_ticket_id?: string | null
          due_date?: string | null
          tags?: string[]
          settings?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          customer_id?: string
          assigned_to?: string | null
          team_id?: string | null
          organization_id?: string | null
          parent_ticket_id?: string | null
          due_date?: string | null
          tags?: string[]
          settings?: Json
          metadata?: Json
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          ticket_id: string
          user_id: string
          message: string
          is_internal: boolean
          parent_id: string | null
          attachments: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          ticket_id: string
          user_id: string
          message: string
          is_internal?: boolean
          parent_id?: string | null
          attachments?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          ticket_id?: string
          user_id?: string
          message?: string
          is_internal?: boolean
          parent_id?: string | null
          attachments?: Json
          metadata?: Json
        }
      }
      articles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string
          author_id: string
          status: string
          published_at: string | null
          tags: string[]
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content: string
          author_id: string
          status?: string
          published_at?: string | null
          tags?: string[]
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string
          author_id?: string
          status?: string
          published_at?: string | null
          tags?: string[]
          metadata?: Json
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          parent_id: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          parent_id?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          metadata?: Json
        }
      }
      article_categories: {
        Row: {
          article_id: string
          category_id: string
        }
        Insert: {
          article_id: string
          category_id: string
        }
        Update: {
          article_id?: string
          category_id?: string
        }
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          team_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          team_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      metrics: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          value: number
          dimension: string
          timestamp: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          value: number
          dimension: string
          timestamp: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          value?: number
          dimension?: string
          timestamp?: string
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'agent' | 'customer'
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed'
      ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
    }
  }
} 