import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in your values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── AUTH HELPERS ──────────────────────────────────────────────────────────────

/**
 * SIGN UP
 * Creates the user in Supabase Auth. Supabase automatically sends a
 * confirmation email with a verification link. Once clicked, the user
 * is redirected back to /auth/callback which creates their passport row.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.name
 * @param {string} params.major
 * @param {string} params.year
 */
export async function signUp({ email, name, major, year }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    // We use a random UUID as a throwaway password — users will always
    // sign in via magic link, so they never need to know this value.
    password: crypto.randomUUID(),
    options: {
      // These go into auth.users.raw_user_meta_data
      data: { name, major, year },
      // Where Supabase redirects after the user clicks the verification link
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

/**
 * MAGIC LINK SIGN IN (passwordless)
 * Sends a one-time login link to the user's email.
 * On click → redirected to /auth/callback → session is established.
 *
 * @param {string} email
 */
export async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // only allow existing verified accounts
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

/**
 * SIGN OUT — clears the local session
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * GET SESSION — returns the current active session (or null)
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session ?? null, error }
}

// ─── PASSPORT DB HELPERS ───────────────────────────────────────────────────────

/**
 * Fetch a user's passport row. Returns null if not found.
 * @param {string} userId  — auth.users.id (UUID)
 */
export async function getPassport(userId) {
  const { data, error } = await supabase
    .from('passports')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') return { data: null, error: null } // not found
  return { data, error }
}

/**
 * Create a new passport row after a user verifies their email for the first time.
 * Pulls name/major/year from the user's metadata set during sign-up.
 *
 * @param {import('@supabase/supabase-js').User} user
 */
export async function createPassport(user) {
  const meta = user.user_metadata ?? {}
  const passportNo = `UTD-${String(Date.now()).slice(-5)}-${new Date().getFullYear()}`

  const { data, error } = await supabase
    .from('passports')
    .insert({
      user_id: user.id,
      email: user.email,
      name: meta.name ?? '',
      major: meta.major ?? '',
      year: meta.year ?? '',
      passport_no: passportNo,
      issued_at: new Date().toISOString(),
      about_me: '',
      fun_fact: '',
      utd_memory: '',
      coffee_order: '',
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update specific fields on a passport row.
 * Pass only the keys you want to change.
 *
 * @param {string} userId
 * @param {object} updates  e.g. { about_me: "...", fun_fact: "..." }
 */
export async function updatePassport(userId, updates) {
  const { data, error } = await supabase
    .from('passports')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  return { data, error }
}

// ─── PHOTO UPLOAD HELPERS ──────────────────────────────────────────────────────

/**
 * Upload a photo to Supabase Storage.
 * Stored at: passport-photos/{userId}/{slot}.jpg
 * Returns the public URL of the uploaded photo.
 *
 * @param {string} userId
 * @param {number} slotIndex  0-5 (which gallery slot)
 * @param {File}   file       the File object from <input type="file">
 */
export async function uploadGalleryPhoto(userId, slotIndex, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/gallery-${slotIndex}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('passport-photos')
    .upload(path, file, { upsert: true }) // upsert:true overwrites existing

  if (uploadError) return { url: null, error: uploadError }

  const { data } = supabase.storage
    .from('passport-photos')
    .getPublicUrl(path)

  return { url: data.publicUrl, error: null }
}

/**
 * Upload the profile photo.
 * Stored at: passport-photos/{userId}/profile.jpg
 *
 * @param {string} userId
 * @param {File}   file
 */
export async function uploadProfilePhoto(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/profile.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('passport-photos')
    .upload(path, file, { upsert: true })

  if (uploadError) return { url: null, error: uploadError }

  const { data } = supabase.storage
    .from('passport-photos')
    .getPublicUrl(path)

  return { url: data.publicUrl, error: null }
}
