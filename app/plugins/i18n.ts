/** Makes `$t`, `$tc` and `$tm` available in every template. */
export default defineNuxtPlugin(() => {
  const { t, tc, tm } = useLocale()
  return { provide: { t, tc, tm } }
})
