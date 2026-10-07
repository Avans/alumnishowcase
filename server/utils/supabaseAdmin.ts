import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { Database } from '../../app/types/database.types'

// Accepted names, in order of preference. The Supabase module only snapshots
// the un-prefixed ones at *build* time, so the key is also read from the
// environment when a request comes in. That way a variable added on the host
// works after a redeploy without depending on what existed during the build.
const KEY_VARS = [
  'NUXT_SUPABASE_SECRET_KEY',
  'SUPABASE_SECRET_KEY',
  'NUXT_SUPABASE_SERVICE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]
const URL_VARS = ['NUXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']

const first = (names: string[]) => names.map((n) => process.env[n]).find((v) => v && v.trim())

/** Service-role client for trusted server code. Never expose it to the browser. */
export function useSupabaseAdmin(event: H3Event): SupabaseClient<Database> {
  const cached = event.context._supabaseAdmin as SupabaseClient<Database> | undefined
  if (cached) return cached

  const config = useRuntimeConfig(event)
  const url = first(URL_VARS) || config.public.supabase?.url
  const key = first(KEY_VARS) || config.supabase?.secretKey || config.supabase?.serviceKey

  if (!url || !key) {
    console.error(
      `[supabase] Cannot create the admin client: ${!url ? 'no project URL' : 'no server key'}. ` +
        `Set ${!url ? URL_VARS.join(' or ') : KEY_VARS.join(' or ')} in the server environment, then redeploy.`,
    )
    throw createError({
      statusCode: 500,
      message: 'The server is missing its Supabase configuration.',
      data: { code: 'serverConfig' },
    })
  }

  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  event.context._supabaseAdmin = client
  return client
}
