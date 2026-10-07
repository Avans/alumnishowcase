export type ShowcaseStatus = 'pending' | 'approved' | 'rejected'
export type ContactMethod = 'linkedin' | 'website' | 'email'

export interface ShowcaseLink {
  label: string
  url: string
}

export interface Showcase {
  id: string
  slug: string
  status: ShowcaseStatus
  featured: boolean
  title: string
  summary: string
  image_url: string
  image_path: string | null
  links: ShowcaseLink[]
  tags: string[]
  company: string
  alumni_name: string
  alumni_role: string | null
  programme: string | null
  graduation_year: number | null
  contact_method: ContactMethod
  contact_url: string | null
  created_at: string
  approved_at: string | null
}

/** A showcase as seen by an admin, including the private contact email. */
export interface AdminShowcase extends Showcase {
  showcase_contacts: { email: string } | null
}
