/** Avans brand pastels with a readable foreground each. */
const PALETTE = [
  { bg: '#dfbeff', fg: '#131313' },
  { bg: '#ffe980', fg: '#131313' },
  { bg: '#8aed92', fg: '#131313' },
  { bg: '#80ccff', fg: '#131313' },
  { bg: '#ffc2c6', fg: '#131313' },
  { bg: '#ff5200', fg: '#131313' },
  { bg: '#001c70', fg: '#f7f6f3' },
  { bg: '#c6002a', fg: '#f7f6f3' },
] as const

export type Swatch = (typeof PALETTE)[number]

/** Stable colour for any string, so a company or person always looks the same. */
export function swatchFor(seed: string, avoid: string[] = []): Swatch {
  const options = PALETTE.filter((p) => !avoid.includes(p.bg))
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return options[hash % options.length]!
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function formatDate(iso: string | null | undefined, locale = 'nl-NL') {
  if (!iso) return ''
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

/** Unique, valid CSS identifier for view-transition-name. */
export function transitionName(id: string) {
  return `sc-${id.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`
}
