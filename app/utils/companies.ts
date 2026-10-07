export interface CompanySummary {
  key: string
  name: string
  count: number
  alumni: number
  showcases: Showcase[]
}

const LEGAL_SUFFIX = /\s+(b\.?v\.?|n\.?v\.?|inc\.?|ltd\.?|llc|gmbh|plc)$/i

/** Normalises company names so "Philips", "philips " and "Philips B.V." group together. */
export function companyKey(name: string) {
  const key = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(LEGAL_SUFFIX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return key || name.trim().toLowerCase()
}

/** Distils the company overview out of the showcases themselves. */
export function summarizeCompanies(showcases: Showcase[]): CompanySummary[] {
  type Group = { spellings: Map<string, number>; showcases: Showcase[]; people: Set<string> }
  const groups = new Map<string, Group>()

  for (const showcase of showcases) {
    const key = companyKey(showcase.company)
    const group: Group = groups.get(key) ?? { spellings: new Map(), showcases: [], people: new Set() }
    const spelling = showcase.company.trim()
    group.spellings.set(spelling, (group.spellings.get(spelling) ?? 0) + 1)
    group.showcases.push(showcase)
    group.people.add(showcase.alumni_name.trim().toLowerCase())
    groups.set(key, group)
  }

  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      name: [...group.spellings.entries()].sort((a, b) => b[1] - a[1])[0]![0],
      count: group.showcases.length,
      alumni: group.people.size,
      showcases: group.showcases,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
