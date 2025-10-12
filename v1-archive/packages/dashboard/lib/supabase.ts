import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase environment variables. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file. ' +
    'See packages/dashboard/.env.example for reference.'
  )
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
          address: string | null
          user_type: 'publisher' | 'crawler'
          created_at: string
          last_active_at: string
          name?: string
          email?: string
          website?: string
          onboarding_completed: boolean
          email_verified: boolean
        }
        Insert: {
          id?: string
          address?: string | null
          user_type: 'publisher' | 'crawler'
          created_at?: string
          last_active_at?: string
          name?: string
          email?: string
          website?: string
          onboarding_completed?: boolean
          email_verified?: boolean
        }
        Update: {
          id?: string
          address?: string | null
          user_type?: 'publisher' | 'crawler'
          created_at?: string
          last_active_at?: string
          name?: string
          email?: string
          website?: string
          onboarding_completed?: boolean
          email_verified?: boolean
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
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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
      publisher_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          website?: string | null
          description?: string | null
          contact_email?: string | null
          price_per_request: string
          rate_limit_per_hour: number
          terms_of_service?: string | null
          status: 'pending' | 'active' | 'suspended' | 'inactive'
          total_earnings: string
          total_requests: number
          stripe_account_id?: string | null
          webhook_url?: string | null
          webhook_secret?: string | null
          webhook_secret_preview?: string | null
          webhook_rotated_at?: string | null
          is_paused: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          website?: string | null
          description?: string | null
          contact_email?: string | null
          price_per_request?: string
          rate_limit_per_hour?: number
          terms_of_service?: string | null
          status?: 'pending' | 'active' | 'suspended' | 'inactive'
          total_earnings?: string
          total_requests?: number
          stripe_account_id?: string | null
          webhook_url?: string | null
          webhook_secret?: string | null
          webhook_secret_preview?: string | null
          webhook_rotated_at?: string | null
          is_paused?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          website?: string | null
          description?: string | null
          contact_email?: string | null
          price_per_request?: string
          rate_limit_per_hour?: number
          terms_of_service?: string | null
          status?: 'pending' | 'active' | 'suspended' | 'inactive'
          total_earnings?: string
          total_requests?: number
          stripe_account_id?: string | null
          webhook_url?: string | null
          webhook_secret?: string | null
          webhook_secret_preview?: string | null
          webhook_rotated_at?: string | null
          is_paused?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      crawl_transactions: {
        Row: {
          id: string
          publisher_id: string
          type: 'earning' | 'withdrawal' | 'refund'
          status: 'pending' | 'processing' | 'completed' | 'failed'
          amount: string
          amount_eth?: string | null
          crawler_address?: string | null
          crawler_name?: string | null
          url?: string | null
          tx_hash?: string | null
          block_number?: number | null
          request_id?: string | null
          notes?: Record<string, any> | null
          created_at: string
          completed_at?: string | null
        }
        Insert: {
          id?: string
          publisher_id: string
          type: 'earning' | 'withdrawal' | 'refund'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          amount: string
          amount_eth?: string | null
          crawler_address?: string | null
          crawler_name?: string | null
          url?: string | null
          tx_hash?: string | null
          block_number?: number | null
          request_id?: string | null
          notes?: Record<string, any> | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          publisher_id?: string
          type?: 'earning' | 'withdrawal' | 'refund'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          amount?: string
          amount_eth?: string | null
          crawler_address?: string | null
          crawler_name?: string | null
          url?: string | null
          tx_hash?: string | null
          block_number?: number | null
          request_id?: string | null
          notes?: Record<string, any> | null
          created_at?: string
          completed_at?: string | null
        }
      }
      withdrawal_requests: {
        Row: {
          id: string
          publisher_id: string
          user_id: string
          amount_eth: string
          to_address: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          tx_hash?: string | null
          error_message?: string | null
          created_at: string
          processed_at?: string | null
        }
        Insert: {
          id?: string
          publisher_id: string
          user_id: string
          amount_eth: string
          to_address: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          tx_hash?: string | null
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          publisher_id?: string
          user_id?: string
          amount_eth?: string
          to_address?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          tx_hash?: string | null
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
      billing_balances: {
        Row: {
          publisher_id: string
          on_chain_balance_wei: string
          pending_withdrawal_wei: string
          available_to_withdraw_wei: string
          locked_in_escrow_wei: string
          total_earnings_usd: string
          total_requests: number
          wallet_address?: string | null
          last_indexed_block?: number | null
          last_updated: string
        }
        Insert: {
          publisher_id: string
          on_chain_balance_wei?: string
          pending_withdrawal_wei?: string
          available_to_withdraw_wei?: string
          locked_in_escrow_wei?: string
          total_earnings_usd?: string
          total_requests?: number
          wallet_address?: string | null
          last_indexed_block?: number | null
          last_updated?: string
        }
        Update: {
          publisher_id?: string
          on_chain_balance_wei?: string
          pending_withdrawal_wei?: string
          available_to_withdraw_wei?: string
          locked_in_escrow_wei?: string
          total_earnings_usd?: string
          total_requests?: number
          wallet_address?: string | null
          last_indexed_block?: number | null
          last_updated?: string
        }
      }
      api_key_events: {
        Row: {
          id: string
          api_key_id: string
          event_type: 'created' | 'revoked' | 'used' | 'rotated' | 'regenerated'
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          api_key_id: string
          event_type: 'created' | 'revoked' | 'used' | 'rotated' | 'regenerated'
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          api_key_id?: string
          event_type?: 'created' | 'revoked' | 'used' | 'rotated' | 'regenerated'
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      playground_sessions: {
        Row: {
          id: string
          publisher_id: string
          user_id: string
          request_payload: Record<string, any>
          response_payload?: Record<string, any> | null
          status: 'queued' | 'sent' | 'failed' | 'completed'
          error_message?: string | null
          created_at: string
          completed_at?: string | null
        }
        Insert: {
          id?: string
          publisher_id: string
          user_id: string
          request_payload: Record<string, any>
          response_payload?: Record<string, any> | null
          status?: 'queued' | 'sent' | 'failed' | 'completed'
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          publisher_id?: string
          user_id?: string
          request_payload?: Record<string, any>
          response_payload?: Record<string, any> | null
          status?: 'queued' | 'sent' | 'failed' | 'completed'
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      publisher_webhook_logs: {
        Row: {
          id: string
          publisher_id: string
          destination_url: string
          status: 'pending' | 'success' | 'failed'
          status_code?: number | null
          latency_ms?: number | null
          payload?: Record<string, any> | null
          response_body?: string | null
          created_at: string
        }
        Insert: {
          id?: string
          publisher_id: string
          destination_url: string
          status?: 'pending' | 'success' | 'failed'
          status_code?: number | null
          latency_ms?: number | null
          payload?: Record<string, any> | null
          response_body?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          publisher_id?: string
          destination_url?: string
          status?: 'pending' | 'success' | 'failed'
          status_code?: number | null
          latency_ms?: number | null
          payload?: Record<string, any> | null
          response_body?: string | null
          created_at?: string
        }
      }
    }
  }
}
