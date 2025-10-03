import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (only available on server)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          address: string
          user_type: 'publisher' | 'crawler'
          created_at: string
          last_active_at: string
          name?: string
          email?: string
          website?: string
        }
        Insert: {
          id?: string
          address: string
          user_type: 'publisher' | 'crawler'
          created_at?: string
          last_active_at?: string
          name?: string
          email?: string
          website?: string
        }
        Update: {
          id?: string
          address?: string
          user_type?: 'publisher' | 'crawler'
          created_at?: string
          last_active_at?: string
          name?: string
          email?: string
          website?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          expires_at?: string
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          permissions: string[]
          expires_at?: string
          created_at: string
          last_used_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          permissions: string[]
          expires_at?: string
          created_at?: string
          last_used_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          permissions?: string[]
          expires_at?: string
          created_at?: string
          last_used_at?: string
        }
      }
      auth_nonces: {
        Row: {
          id: string
          address: string
          nonce: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          address: string
          nonce: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          address?: string
          nonce?: string
          expires_at?: string
          created_at?: string
        }
      }
    }
  }
}