#!/usr/bin/env sh
# Runs the Nuxt dev server against the local Supabase stack (`npm run db:start`)
# instead of the project in .env. Shell variables take precedence over .env.
set -eu

STATUS="$(supabase status -o env)"
get() { printf '%s\n' "$STATUS" | sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}$/\1/p" | head -n 1; }

export SUPABASE_URL="$(get API_URL)"
export SUPABASE_KEY="$(get PUBLISHABLE_KEY)"
[ -n "$SUPABASE_KEY" ] || SUPABASE_KEY="$(get ANON_KEY)"

SECRET="$(get SECRET_KEY)"
if [ -n "$SECRET" ]; then export SUPABASE_SECRET_KEY="$SECRET"; else export SUPABASE_SERVICE_KEY="$(get SERVICE_ROLE_KEY)"; fi

echo "Using local Supabase at $SUPABASE_URL"
exec npx nuxt dev "$@"
