import { randomBytes, randomUUID } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { MAX_IMAGE_BYTES, slugify, submissionSchema } from '#shared/utils/validation'

const BUCKET = 'showcase-images'
const MIN_FILL_MS = 2500

const IMAGE_TYPES = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', ext: 'webp', test: (b: Buffer) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'image/avif', ext: 'avif', test: (b: Buffer) => b.subarray(4, 12).toString('latin1') === 'ftypavif' },
]

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { max: 5, windowMs: 60 * 60 * 1000 })

  const declaredLength = Number(getHeader(event, 'content-length') ?? 0)
  if (declaredLength > MAX_IMAGE_BYTES + 256 * 1024) {
    throw createError({ statusCode: 413, message: 'That image is too large. Please keep it under 5 MB.', data: { code: 'imageTooBig' } })
  }

  const parts = await readMultipartFormData(event)
  const payloadPart = parts?.find((p) => p.name === 'payload' && !p.filename)
  const imagePart = parts?.find((p) => p.name === 'image' && p.filename)

  if (!payloadPart || !imagePart) {
    throw createError({ statusCode: 400, message: 'Please fill in the form and add an image.', data: { code: 'badRequest' } })
  }

  let raw: any
  try {
    raw = JSON.parse(payloadPart.data.toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, message: 'Malformed submission.', data: { code: 'badRequest' } })
  }

  // Bots tend to fill the hidden field or post instantly. Pretend all is well.
  if ((typeof raw?._hp === 'string' && raw._hp !== '') || !(Number(raw?._elapsed) >= MIN_FILL_MS)) {
    return { ok: true }
  }

  const parsed = submissionSchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: 'Some fields need your attention.',
      data: { code: 'invalid', issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    })
  }
  const input = parsed.data

  if (imagePart.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 413, message: 'That image is too large. Please keep it under 5 MB.', data: { code: 'imageTooBig' } })
  }
  const kind = IMAGE_TYPES.find((t) => t.test(imagePart.data))
  if (!kind) {
    throw createError({ statusCode: 415, message: 'Please upload a JPEG, PNG, WebP or AVIF image.', data: { code: 'imageType' } })
  }

  const supabase = serverSupabaseServiceRole(event)

  const imagePath = `${new Date().getUTCFullYear()}/${randomUUID()}.${kind.ext}`
  const upload = await supabase.storage.from(BUCKET).upload(imagePath, imagePart.data, {
    contentType: kind.mime,
    cacheControl: '31536000',
    upsert: false,
  })
  if (upload.error) {
    console.error('[submissions] image upload failed', upload.error)
    throw createError({ statusCode: 500, message: 'We could not store your image. Please try again.', data: { code: 'storage' } })
  }
  const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl

  const cleanup = async (showcaseId?: string) => {
    if (showcaseId) await supabase.from('showcases').delete().eq('id', showcaseId)
    await supabase.storage.from(BUCKET).remove([imagePath])
  }

  let showcaseId: string | undefined
  for (let attempt = 0; attempt < 3 && !showcaseId; attempt++) {
    const { data, error } = await supabase
      .from('showcases')
      .insert({
        slug: `${slugify(input.title, 50)}-${randomBytes(3).toString('hex')}`,
        status: 'pending',
        title: input.title,
        summary: input.summary,
        image_url: imageUrl,
        image_path: imagePath,
        links: input.links,
        tags: input.tags,
        company: input.company,
        alumni_name: input.alumniName,
        alumni_role: input.alumniRole ?? null,
        programme: input.programme ?? null,
        graduation_year: input.graduationYear ?? null,
        contact_method: input.contactMethod,
        contact_url: input.contactMethod === 'email' ? null : (input.contactUrl ?? null),
      })
      .select('id')
      .single()

    if (error && error.code !== '23505') {
      console.error('[submissions] insert failed', error)
      await cleanup()
      throw createError({ statusCode: 500, message: 'We could not save your showcase. Please try again.', data: { code: 'save' } })
    }
    showcaseId = data?.id
  }
  if (!showcaseId) {
    await cleanup()
    throw createError({ statusCode: 500, message: 'We could not save your showcase. Please try again.', data: { code: 'save' } })
  }

  const contact = await supabase.from('showcase_contacts').insert({ showcase_id: showcaseId, email: input.contactEmail })
  if (contact.error) {
    console.error('[submissions] contact insert failed', contact.error)
    await cleanup(showcaseId)
    throw createError({ statusCode: 500, message: 'We could not save your showcase. Please try again.', data: { code: 'save' } })
  }

  setResponseStatus(event, 201)
  return { ok: true }
})
