import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTables() {
  try {
    console.log('🚀 Creating tables via Supabase API...')
    
    // Test basic connection first
    console.log('🔍 Testing connection...')
    
    // Try to create users table using direct API
    console.log('👤 Creating users table...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          address: '0x1234567890123456789012345678901234567890',
          user_type: 'publisher'
        }
      ])
      .select()

    if (userError) {
      console.log('ℹ️  Users table might not exist yet, that\'s expected')
      console.log('Error:', userError.message)
    } else {
      console.log('✅ Users table exists and working!')
      
      // Clean up test data
      await supabase
        .from('users')
        .delete()
        .eq('address', '0x1234567890123456789012345678901234567890')
    }
    
    // Check what tables exist
    console.log('📋 Checking existing tables...')
    
    // Try to query different tables to see which exist
    const tablesToCheck = ['users', 'user_sessions', 'api_keys', 'auth_nonces']
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table '${table}' not found:`, error.message)
        } else {
          console.log(`✅ Table '${table}' exists`)
        }
      } catch (e) {
        console.log(`❌ Table '${table}' error:`, e.message)
      }
    }
    
    console.log('\n📝 Next steps:')
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/yxyxiszugprlxqmuxgnv')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of supabase/migrations/001_initial_schema.sql')
    console.log('4. Run the SQL script to create the tables')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTables()