import { createClient } from "@supabase/supabase-js"

console.log("ENV CHECK:", process.env.SUPABASE_URL)

export const supabase = createClient(
  console.log("SUPABASE URL:", "https://fofhpbpbixdghqbjpyha.supabase.co"),
  "sb_publishable_6Ge6fb3UBvKZ4dNBaBVVUA_ZxYpGr1M"
)