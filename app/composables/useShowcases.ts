export function useShowcases() {
  const supabase = useSupabaseClient()

  const { data, error, status, refresh } = useAsyncData<Showcase[]>(
    'showcases',
    async () => {
      const { data, error } = await supabase
        .from('showcases')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('approved_at', { ascending: false })

      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      // `links` is jsonb; the database constraint guarantees its shape.
      return (data ?? []) as unknown as Showcase[]
    },
    { default: () => [] },
  )

  const companies = computed(() => summarizeCompanies(data.value))

  return { showcases: data, companies, error, status, refresh }
}
