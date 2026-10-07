/**
 * Admin status is decided by the database (`public.is_admin()`), never by the
 * client. This only mirrors it so the UI can show or hide admin affordances.
 */
export function useIsAdmin() {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const isAdmin = useState<boolean>('is-admin', () => false)
  const checked = useState<boolean>('is-admin-checked', () => false)

  async function check() {
    if (!user.value) {
      isAdmin.value = false
      checked.value = true
      return false
    }
    const { data } = await supabase.rpc('is_admin')
    isAdmin.value = data === true
    checked.value = true
    return isAdmin.value
  }

  if (import.meta.client) {
    watch(
      () => user.value?.sub,
      () => {
        checked.value = false
        check()
      },
      { immediate: true },
    )
  }

  return { isAdmin, checked, check }
}
