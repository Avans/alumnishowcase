import { z } from 'zod'

export const MAX_LINKS = 6
export const MAX_TAGS = 5
// Hosts like Vercel reject request bodies above ~4.5 MB, so stay safely below it.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const SUMMARY_MAX = 280

/** [min, max] per field. Also used to fill {min}/{max} in translated messages. */
export const LIMITS = {
  title: [3, 100],
  summary: [10, SUMMARY_MAX],
  linkLabel: [1, 40],
  link: [1, 500],
  links: [1, MAX_LINKS],
  tag: [1, 24],
  tags: [0, MAX_TAGS],
  company: [1, 80],
  alumniName: [2, 80],
  alumniRole: [0, 80],
  programme: [0, 80],
  contactUrl: [0, 500],
} as const

// Validation messages are message keys (see `errors.*` in the locale files),
// so the same schema serves the Dutch and English UI and the server.
const text = (field: 'title' | 'summary' | 'linkLabel' | 'tag' | 'company' | 'alumniName') => {
  const [min, max] = LIMITS[field]
  return z
    .string(`${field}.required`)
    .trim()
    .min(min, min === 1 ? `${field}.required` : `${field}.min`)
    .max(max, `${field}.max`)
}

const optionalText = (field: 'alumniRole' | 'programme') =>
  z
    .string()
    .trim()
    .max(LIMITS[field][1], `${field}.max`)
    .optional()
    .transform((v) => v || undefined)

const httpUrl = (field: 'link' | 'contactUrl') =>
  z
    .string(`${field}.required`)
    .trim()
    .min(1, `${field}.required`)
    .max(500, `${field}.max`)
    .pipe(z.url({ protocol: /^https?$/, error: `${field}.invalid` }))

const maxYear = new Date().getFullYear() + 6

export const submissionSchema = z
  .object({
    title: text('title'),
    summary: text('summary'),
    links: z
      .array(z.object({ label: text('linkLabel'), url: httpUrl('link') }), 'links.min')
      .min(1, 'links.min')
      .max(MAX_LINKS, 'links.max'),
    tags: z.array(text('tag'), 'tags.max').max(MAX_TAGS, 'tags.max'),
    company: text('company'),
    alumniName: text('alumniName'),
    alumniRole: optionalText('alumniRole'),
    programme: optionalText('programme'),
    graduationYear: z
      .number('year.invalid')
      .int('year.invalid')
      .min(1990, 'year.invalid')
      .max(maxYear, 'year.invalid')
      .optional(),
    contactMethod: z.enum(['linkedin', 'website', 'email'], 'contactMethod.required'),
    contactUrl: z
      .string()
      .trim()
      .max(LIMITS.contactUrl[1], 'contactUrl.max')
      .optional()
      .transform((v) => v || undefined),
    contactEmail: z
      .string('email.required')
      .trim()
      .toLowerCase()
      .min(1, 'email.required')
      .max(254, 'email.max')
      .pipe(z.email('email.invalid')),
    consent: z.literal(true, 'consent.required'),
  })
  .superRefine((val, ctx) => {
    // The link is optional: without one, visitors reach the alumnus via the admin.
    if (val.contactMethod === 'email' || !val.contactUrl) return

    const parsed = httpUrl('contactUrl').safeParse(val.contactUrl)
    if (!parsed.success) {
      ctx.addIssue({ code: 'custom', path: ['contactUrl'], message: parsed.error.issues[0]!.message })
      return
    }

    if (val.contactMethod === 'linkedin') {
      const host = new URL(parsed.data).hostname.toLowerCase()
      if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) {
        ctx.addIssue({ code: 'custom', path: ['contactUrl'], message: 'contactUrl.linkedin' })
      }
    }
  })

export type Submission = z.infer<typeof submissionSchema>

export function slugify(input: string, max = 60) {
  return (
    input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max)
      .replace(/-+$/g, '') || 'showcase'
  )
}
