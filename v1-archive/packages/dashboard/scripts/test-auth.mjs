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

async function testAuthSystem() {
  try {
    console.log('🧪 Testing Tachi Authentication System...')
    console.log('=====================================')
    
    // Test 1: Create a test user
    console.log('\n1. Testing user creation...')
    const testAddress = '0x742D35Cc6635C0532925a3b8D8bc8C3F8F7e9d3E'
    
    // Clean up any existing test user
    await supabase
      .from('users')
      .delete()
      .eq('address', testAddress.toLowerCase())
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        address: testAddress.toLowerCase(),
        user_type: 'publisher',
        name: 'Test Publisher'
      })
      .select()
      .single()
    
    if (userError) {
      console.log('❌ User creation failed:', userError.message)
      return
    }
    
    console.log('✅ User created successfully:', {
      id: newUser.id,
      address: newUser.address,
      type: newUser.user_type
    })
    
    // Test 2: Create a nonce
    console.log('\n2. Testing nonce creation...')
    const testNonce = 'test_nonce_' + Date.now()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    const { data: nonceData, error: nonceError } = await supabase
      .from('auth_nonces')
      .insert({
        address: testAddress.toLowerCase(),
        nonce: testNonce,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()
    
    if (nonceError) {
      console.log('❌ Nonce creation failed:', nonceError.message)
      return
    }
    
    console.log('✅ Nonce created successfully:', {
      nonce: nonceData.nonce,
      expires: nonceData.expires_at
    })
    
    // Test 3: Create a session
    console.log('\n3. Testing session creation...')
    const sessionToken = 'test_session_' + Date.now()
    const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: newUser.id,
        session_token: sessionToken,
        expires_at: sessionExpires.toISOString()
      })
      .select()
      .single()
    
    if (sessionError) {
      console.log('❌ Session creation failed:', sessionError.message)
      return
    }
    
    console.log('✅ Session created successfully:', {
      token: sessionData.session_token,
      expires: sessionData.expires_at
    })
    
    // Test 4: Create an API key
    console.log('\n4. Testing API key creation...')
    const keyHash = 'test_key_hash_' + Date.now()
    
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .insert({
        user_id: newUser.id,
        name: 'Test API Key',
        key_hash: keyHash
      })
      .select()
      .single()
    
    if (apiKeyError) {
      console.log('❌ API key creation failed:', apiKeyError.message)
      return
    }
    
    console.log('✅ API key created successfully:', {
      id: apiKeyData.id,
      name: apiKeyData.name
    })
    
    // Test 5: Query data with joins
    console.log('\n5. Testing data relationships...')
    const { data: userWithSessions, error: joinError } = await supabase
      .from('users')
      .select(`
        *,
        user_sessions(*),
        api_keys(*)
      `)
      .eq('id', newUser.id)
      .single()
    
    if (joinError) {
      console.log('❌ Join query failed:', joinError.message)
      return
    }
    
    console.log('✅ Relationships working:', {
      user: userWithSessions.address,
      sessions: userWithSessions.user_sessions?.length || 0,
      apiKeys: userWithSessions.api_keys?.length || 0
    })
    
    // Test 6: Clean up test data
    console.log('\n6. Cleaning up test data...')
    
    // Delete in correct order (foreign key constraints)
    await supabase.from('user_sessions').delete().eq('user_id', newUser.id)
    await supabase.from('api_keys').delete().eq('user_id', newUser.id)
    await supabase.from('auth_nonces').delete().eq('address', testAddress.toLowerCase())
    await supabase.from('users').delete().eq('id', newUser.id)
    
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 All authentication tests passed!')
    console.log('✅ Database integration is working correctly')
    console.log('✅ Ready for production use')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAuthSystem()
