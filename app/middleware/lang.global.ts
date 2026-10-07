/** `?lang=en` or `?lang=nl` makes a language shareable via a link. */
export default defineNuxtRouteMiddleware((to) => {
  const requested = to.query.lang
  if (requested === 'nl' || requested === 'en') useLocale().setLocale(requested)
})
