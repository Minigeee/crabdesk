export type Database = {
  public: {
    Tables: {
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
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string
          role: 'admin' | 'agent' | 'customer'
          organization_id: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          full_name: string
          role?: 'admin' | 'agent' | 'customer'
          organization_id?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'agent' | 'customer'
          organization_id?: string | null
          team_id?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          created_at: string
          name: string
          domain: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          domain?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          domain?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          ticket_id: string
          user_id: string
          message: string
          is_internal: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          ticket_id: string
          user_id: string
          message: string
          is_internal?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          ticket_id?: string
          user_id?: string
          message?: string
          is_internal?: boolean
        }
      }
      teams: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
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
      [_ in never]: never
    }
  }
} 