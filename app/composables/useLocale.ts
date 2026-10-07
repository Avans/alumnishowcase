import nl from '~/locales/nl'
import en from '~/locales/en'
import type { MessageKey, Messages } from '~/locales/types'

export type Locale = 'nl' | 'en'
export const LOCALES: readonly Locale[] = ['nl', 'en']
export const DEFAULT_LOCALE: Locale = 'nl'

const messages: Record<Locale, Messages> = { nl, en }
type Params = Record<string, string | number | undefined>

function resolve(dict: unknown, key: string): string | string[] | undefined {
  let node: any = dict
  for (const part of key.split('.')) {
    node = node?.[part]
    if (node === undefined) return undefined
  }
  return node
}

const fill = (text: string, params?: Params) =>
  params ? text.replace(/\{(\w+)\}/g, (_, k: string) => (params[k] === undefined ? `{${k}}` : String(params[k]))) : text

/**
 * Tiny i18n layer. Dutch is the default; the choice is kept in a cookie so
 * server-rendered HTML already comes back in the right language.
 */
export function useLocale() {
  const cookie = useCookie<Locale>('lang', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' })
  const locale = useState<Locale>('locale', () => (cookie.value === 'en' ? 'en' : DEFAULT_LOCALE))

  const lookup = (key: string) => resolve(messages[locale.value], key) ?? resolve(messages[DEFAULT_LOCALE], key)

  function t(key: MessageKey | (string & {}), params?: Params): string {
    const value = lookup(key)
    if (typeof value !== 'string') {
      if (import.meta.dev) console.warn(`[i18n] Missing message: ${key}`)
      return key
    }
    return fill(value, params)
  }

  /** Plural helper: "one|many" with {n} interpolation. */
  function tc(key: MessageKey | (string & {}), n: number): string {
    const [one = '', many = one] = t(key).split('|')
    return fill(n === 1 ? one : many, { n })
  }

  /** Raw list message, e.g. the lines of a headline. */
  function tm(key: MessageKey | (string & {})): string[] {
    const value = lookup(key)
    return Array.isArray(value) ? value : []
  }

  /** Translates a validation message key coming from the shared zod schema. */
  function te(message: string): string {
    const field = message.split('.')[0]!
    const [min, max] = (LIMITS as Record<string, readonly number[]>)[field] ?? []
    const value = lookup(`errors.${message}`)
    return typeof value === 'string' ? fill(value, { min, max }) : message
  }

  function setLocale(next: Locale) {
    locale.value = next
    cookie.value = next
    if (import.meta.client) {
      document.documentElement.lang = next
      const url = new URL(location.href)
      if (url.searchParams.has('lang')) {
        url.searchParams.delete('lang')
        history.replaceState(history.state, '', url)
      }
    }
  }

  const dateLocale = computed(() => (locale.value === 'nl' ? 'nl-NL' : 'en-GB'))

  return { locale, t, tc, tm, te, setLocale, dateLocale }
}
