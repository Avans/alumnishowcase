<script setup lang="ts">
const { t, tm, te, locale } = useLocale()
const config = useRuntimeConfig()
useHead({ title: () => t('meta.submitTitle') })

const MAX_DIMENSION = 1600
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const PROGRAMMES = [
  'Informatica',
  'Technische Informatica',
  'Business IT & Management',
  'Communication & Multimedia Design',
  'Associate degree Software Development',
]

const { companies } = useShowcases()

const form = reactive({
  title: '',
  summary: '',
  links: [{ label: '', url: '' }] as { label: string; url: string }[],
  tags: [] as string[],
  company: '',
  alumniName: '',
  alumniRole: '',
  programme: '',
  graduationYear: '',
  contactMethod: 'linkedin' as 'linkedin' | 'website' | 'email',
  contactUrl: '',
  contactEmail: '',
  consent: false,
  homepage: '',
})
const tagInput = ref('')
const image = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const imageBusy = ref(false)
const dragging = ref(false)
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const done = ref(false)
const submittedName = ref('')
let startedAt = Date.now()
onMounted(() => (startedAt = Date.now()))
onBeforeUnmount(() => imagePreview.value && URL.revokeObjectURL(imagePreview.value))

const { push } = useToast()
const heroLines = computed(() => tm('submit.title'))

/* Image: validate, then shrink in the browser so uploads stay small and fast. */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
    if (blob && blob.type === 'image/webp' && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' })
    }
  } catch {
    // Fall back to the original file.
  }
  return file
}

async function setImage(file: File | undefined) {
  if (!file) return
  delete errors.value.image
  if (!ACCEPTED.includes(file.type)) {
    errors.value.image = t('submit.imageType')
    return
  }
  imageBusy.value = true
  const result = await shrink(file)
  imageBusy.value = false
  if (result.size > MAX_IMAGE_BYTES) {
    errors.value.image = t('submit.imageTooBig')
    return
  }
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  image.value = result
  imagePreview.value = URL.createObjectURL(result)
}
function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  setImage(input.files?.[0])
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragging.value = false
  setImage(e.dataTransfer?.files?.[0])
}
function removeImage() {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  image.value = null
  imagePreview.value = null
}

/* Links and tags */
function addLink() {
  if (form.links.length < MAX_LINKS) form.links.push({ label: '', url: '' })
}
function removeLink(i: number) {
  form.links.splice(i, 1)
}
function addTag(raw = tagInput.value) {
  const tag = raw.trim().replace(/^#/, '')
  tagInput.value = ''
  if (!tag || form.tags.length >= MAX_TAGS) return
  if (!form.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) form.tags.push(tag.slice(0, 24))
}
function onTagKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && !tagInput.value) {
    form.tags.pop()
  }
}

/* Validation (same schema as the server) */
function toPayload() {
  const year = form.graduationYear.trim()
  return {
    title: form.title,
    summary: form.summary,
    links: form.links
      .filter((l) => l.url.trim() || l.label.trim())
      .map((l) => ({ label: l.label.trim() || hostname(l.url.trim()), url: l.url })),
    tags: form.tags,
    company: form.company,
    alumniName: form.alumniName,
    alumniRole: form.alumniRole,
    programme: form.programme,
    graduationYear: year ? Number(year) : undefined,
    contactMethod: form.contactMethod,
    contactUrl: form.contactMethod === 'email' ? undefined : form.contactUrl,
    contactEmail: form.contactEmail,
    consent: form.consent,
  }
}

function applyIssues(issues: { path: string | (string | number)[]; message: string }[]) {
  for (const issue of issues) {
    const key = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
    errors.value[key] ??= te(issue.message)
  }
}

async function focusFirstError() {
  await nextTick()
  const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.focus({ preventScroll: true })
}

async function submit() {
  errors.value = {}
  const parsed = submissionSchema.safeParse(toPayload())
  if (!parsed.success) applyIssues(parsed.error.issues.map((i) => ({ path: i.path as (string | number)[], message: i.message })))
  if (!image.value) errors.value.image = t('submit.imageRequired')
  if (!parsed.success || !image.value) {
    push(t('submit.fixFields'), 'error')
    return focusFirstError()
  }

  submitting.value = true
  try {
    const body = new FormData()
    body.append('payload', JSON.stringify({ ...parsed.data, _hp: form.homepage, _elapsed: Date.now() - startedAt }))
    body.append('image', image.value, image.value.name)
    await $fetch('/api/submissions', { method: 'POST', body })
    submittedName.value = form.alumniName.trim().split(/\s+/)[0] ?? ''
    done.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: any) {
    const data = e?.data?.data
    if (Array.isArray(data?.issues)) {
      applyIssues(data.issues)
      focusFirstError()
    }
    push(data?.code ? t(`errors.api.${data.code}`) : t('submit.failed'), 'error')
  } finally {
    submitting.value = false
  }
}

function reset() {
  Object.assign(form, {
    title: '', summary: '', links: [{ label: '', url: '' }], tags: [], consent: false, homepage: '',
  })
  removeImage()
  done.value = false
  startedAt = Date.now()
}

const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='#edebe4'/><circle cx='620' cy='160' r='90' fill='#dfbeff'/><path d='M0 600V430l190-120 170 110 140-80 300 150v110z' fill='#d0d0d1'/></svg>`,
  )

const preview = computed(() => ({
  title: form.title.trim() || t('submit.previewTitle'),
  summary: form.summary.trim() || t('submit.previewSummary'),
  image_url: imagePreview.value ?? placeholder,
  tags: form.tags,
  company: form.company.trim() || t('submit.previewCompany'),
  alumni_name: form.alumniName.trim() || t('submit.previewName'),
  alumni_role: form.alumniRole.trim() || null,
  featured: false,
}))

const methods = computed(() => [
  { value: 'linkedin', label: t('contactMethod.linkedin'), icon: 'linkedin' },
  { value: 'website', label: t('contactMethod.website'), icon: 'globe' },
  { value: 'email', label: t('contactMethod.email'), icon: 'mail' },
] as const)
</script>

<template>
  <div class="mx-auto max-w-[1400px] px-5 pb-8 pt-8 md:px-10 md:pt-14">
    <!-- Success -->
    <section v-if="done" class="corner-tr relative mx-auto max-w-4xl overflow-hidden bg-green px-6 py-20 text-center md:px-16 md:py-28" aria-live="polite">
      <svg viewBox="0 0 120 120" class="mx-auto mb-8 size-32" aria-hidden="true">
        <circle cx="60" cy="60" r="54" fill="#131313" class="origin-center animate-[pop-in_0.7s_var(--ease-spring)_both]" />
        <path d="M36 62l16 16 32-36" fill="none" stroke="#8aed92" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" style="animation: draw 0.7s 0.45s var(--ease-out-expo) forwards" />
      </svg>
      <h1 class="display text-[clamp(4rem,10vw,8rem)]">{{ submittedName ? t('submit.thanksName', { name: submittedName }) : t('submit.thanks') }}</h1>
      <p class="mx-auto mt-6 max-w-xl text-lg font-medium">
        {{ t('submit.thanksText') }}
      </p>
      <div class="mt-10 flex flex-wrap justify-center gap-3">
        <NuxtLink to="/" class="btn">{{ t('submit.back') }} <UiIcon name="arrow" :size="18" class="arrow" /></NuxtLink>
        <button type="button" class="btn btn-outline" @click="reset">{{ t('submit.another') }}</button>
      </div>
    </section>

    <template v-else>
      <header class="max-w-5xl">
        <p class="eyebrow enter mb-5" style="--i: 0">
          <span class="size-2.5 rounded-full bg-red" /> {{ t('submit.eyebrow') }}
        </p>
        <h1 class="display text-[clamp(4rem,10.5vw,9rem)]">
          <span v-for="(line, i) in heroLines" :key="`${locale}-${i}`" class="split-line" :style="{ '--i': i }">
            <span :class="{ 'text-red': i === heroLines.length - 1 }">{{ line }}</span>
          </span>
        </h1>
        <p class="enter mt-6 max-w-2xl text-lg md:text-xl" style="--i: 2">
          {{ t('submit.intro') }}
        </p>
      </header>

      <form class="mt-14 grid items-start gap-12 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_27rem]" novalidate @submit.prevent="submit">
        <div class="space-y-14">
          <!-- 01 The case -->
          <fieldset v-reveal class="space-y-7">
            <legend class="mb-6 flex items-baseline gap-4"><span class="display text-6xl text-red">01</span><span class="heading text-4xl">{{ t('submit.s1') }}</span></legend>

            <div>
              <label class="field-label" for="title">{{ t('submit.titleLabel') }}</label>
              <input id="title" v-model="form.title" class="field" maxlength="100" :placeholder="t('submit.titlePlaceholder')" :aria-invalid="!!errors.title" autocomplete="off" />
              <p v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</p>
            </div>

            <div>
              <div class="flex items-end justify-between">
                <label class="field-label" for="summary">{{ t('submit.summaryLabel') }}</label>
                <span class="mb-2 text-sm font-semibold tabular-nums" :class="form.summary.length > SUMMARY_MAX ? 'text-red' : 'text-muted'">{{ form.summary.length }}/{{ SUMMARY_MAX }}</span>
              </div>
              <textarea id="summary" v-model="form.summary" rows="4" class="field resize-y" :placeholder="t('submit.summaryPlaceholder')" :aria-invalid="!!errors.summary" />
              <p v-if="errors.summary" class="field-error" role="alert">{{ errors.summary }}</p>
            </div>

            <div>
              <span class="field-label" id="image-label">{{ t('submit.imageLabel') }}</span>
              <div
                class="relative grid min-h-56 place-items-center overflow-hidden rounded-3xl border-[3px] border-dashed bg-white transition-colors duration-300"
                :class="[dragging ? 'border-red bg-pink/40' : errors.image ? 'border-red' : 'border-line hover:border-ink']"
                :data-invalid="!!errors.image"
                @dragover.prevent="dragging = true"
                @dragleave.prevent="dragging = false"
                @drop.prevent="onDrop"
              >
                <img v-if="imagePreview" :src="imagePreview" :alt="t('submit.imagePreviewAlt')" class="aspect-[16/9] max-h-80 w-full object-cover" />
                <label v-else class="flex cursor-pointer flex-col items-center gap-3 p-8 text-center" :class="{ 'animate-pulse': imageBusy }">
                  <span class="grid size-14 place-items-center rounded-full bg-ink text-paper"><UiIcon name="upload" :size="24" /></span>
                  <span class="font-bold">{{ imageBusy ? t('submit.imageBusy') : t('submit.imageDrop') }}</span>
                  <span class="text-sm text-muted">{{ t('submit.imageHint') }}</span>
                  <input type="file" class="sr-only" :accept="ACCEPTED.join(',')" aria-labelledby="image-label" @change="onFileInput" />
                </label>
                <div v-if="imagePreview" class="absolute right-3 top-3 flex gap-2">
                  <label class="btn btn-paper btn-sm cursor-pointer">
                    {{ t('submit.imageReplace') }}
                    <input type="file" class="sr-only" :accept="ACCEPTED.join(',')" @change="onFileInput" />
                  </label>
                  <button type="button" class="btn btn-sm" :aria-label="t('submit.imageRemove')" @click="removeImage"><UiIcon name="trash" :size="16" /></button>
                </div>
              </div>
              <p v-if="errors.image" class="field-error" role="alert">{{ errors.image }}</p>
            </div>

            <div>
              <span class="field-label">{{ t('submit.linksLabel') }}</span>
              <p class="field-hint -mt-1 mb-3">{{ t('submit.linksHint', { max: MAX_LINKS }) }}</p>
              <TransitionGroup tag="ul" class="space-y-3" enter-active-class="transition duration-500 ease-out-expo" enter-from-class="-translate-y-3 opacity-0" leave-active-class="transition duration-300 ease-out-expo absolute" leave-to-class="opacity-0 scale-95" move-class="transition duration-500 ease-out-expo">
                <li v-for="(l, i) in form.links" :key="i" class="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[10rem_1fr_auto]">
                  <input v-model="l.label" class="field col-span-2 sm:col-span-1" maxlength="40" :placeholder="i === 0 ? t('submit.linkDemo') : t('submit.linkLabelPlaceholder')" :aria-label="t('submit.linkNLabel', { n: i + 1 })" :aria-invalid="!!errors[`links.${i}.label`]" />
                  <input v-model="l.url" type="url" inputmode="url" class="field" placeholder="https://" :aria-label="t('submit.linkNUrl', { n: i + 1 })" :aria-invalid="!!errors[`links.${i}.url`]" />
                  <button v-if="form.links.length > 1" type="button" class="grid size-[3.2rem] place-items-center rounded-full bg-sunken transition-colors hover:bg-ink hover:text-paper" :aria-label="t('submit.linkRemove', { n: i + 1 })" @click="removeLink(i)">
                    <UiIcon name="x" :size="18" />
                  </button>
                  <span v-else class="size-[3.2rem]" />
                  <p v-if="errors[`links.${i}.url`] || errors[`links.${i}.label`]" class="field-error col-span-full -mt-1" role="alert">{{ errors[`links.${i}.url`] || errors[`links.${i}.label`] }}</p>
                </li>
              </TransitionGroup>
              <p v-if="errors.links" class="field-error" role="alert">{{ errors.links }}</p>
              <button v-if="form.links.length < MAX_LINKS" type="button" class="btn btn-outline btn-sm mt-4" @click="addLink"><UiIcon name="plus" :size="16" /> {{ t('submit.linkAdd') }}</button>
            </div>

            <div>
              <label class="field-label" for="tags">{{ t('submit.tagsLabel') }} <span class="font-medium text-muted">{{ t('submit.tagsOptional', { max: MAX_TAGS }) }}</span></label>
              <div class="field flex flex-wrap items-center gap-2 !py-2.5 focus-within:!border-ink" :aria-invalid="!!errors.tags">
                <span v-for="tag in form.tags" :key="tag" class="pill !bg-purple">
                  {{ tag }}
                  <button type="button" :aria-label="$t('submit.tagRemove', { tag })" @click="form.tags = form.tags.filter((x) => x !== tag)"><UiIcon name="x" :size="12" /></button>
                </span>
                <input id="tags" v-model="tagInput" class="min-w-[8rem] flex-1 bg-transparent py-1 outline-none" :placeholder="form.tags.length < MAX_TAGS ? t('submit.tagsPlaceholder') : ''" :disabled="form.tags.length >= MAX_TAGS" @keydown="onTagKey" @blur="addTag()" />
              </div>
            </div>
          </fieldset>

          <!-- 02 You -->
          <fieldset v-reveal class="space-y-7">
            <legend class="mb-6 flex items-baseline gap-4"><span class="display text-6xl text-red">02</span><span class="heading text-4xl">{{ t('submit.s2') }}</span></legend>

            <div class="grid gap-7 sm:grid-cols-2">
              <div>
                <label class="field-label" for="name">{{ t('submit.nameLabel') }}</label>
                <input id="name" v-model="form.alumniName" class="field" autocomplete="name" maxlength="80" :aria-invalid="!!errors.alumniName" />
                <p v-if="errors.alumniName" class="field-error" role="alert">{{ errors.alumniName }}</p>
              </div>
              <div>
                <label class="field-label" for="role">{{ t('submit.roleLabel') }} <span class="font-medium text-muted">{{ t('submit.optional') }}</span></label>
                <input id="role" v-model="form.alumniRole" class="field" autocomplete="organization-title" maxlength="80" :placeholder="t('submit.rolePlaceholder')" />
              </div>
              <div class="sm:col-span-2">
                <label class="field-label" for="company">{{ t('submit.companyLabel') }}</label>
                <input id="company" v-model="form.company" class="field" list="company-list" autocomplete="organization" maxlength="80" :placeholder="t('submit.companyPlaceholder')" :aria-invalid="!!errors.company" />
                <datalist id="company-list"><option v-for="c in companies" :key="c.key" :value="c.name" /></datalist>
                <p v-if="errors.company" class="field-error" role="alert">{{ errors.company }}</p>
                <p v-else class="field-hint">{{ t('submit.companyHint') }}</p>
              </div>
              <div>
                <label class="field-label" for="programme">{{ t('submit.programmeLabel') }} <span class="font-medium text-muted">{{ t('submit.optional') }}</span></label>
                <input id="programme" v-model="form.programme" class="field" list="programme-list" maxlength="80" />
                <datalist id="programme-list"><option v-for="p in PROGRAMMES" :key="p" :value="p" /></datalist>
              </div>
              <div>
                <label class="field-label" for="year">{{ t('submit.yearLabel') }} <span class="font-medium text-muted">{{ t('submit.optional') }}</span></label>
                <input id="year" v-model="form.graduationYear" class="field" inputmode="numeric" maxlength="4" :placeholder="t('submit.yearPlaceholder')" :aria-invalid="!!errors.graduationYear" />
                <p v-if="errors.graduationYear" class="field-error" role="alert">{{ errors.graduationYear }}</p>
              </div>
            </div>
          </fieldset>

          <!-- 03 Contact -->
          <fieldset v-reveal class="space-y-7">
            <legend class="mb-6 flex items-baseline gap-4"><span class="display text-6xl text-red">03</span><span class="heading text-4xl">{{ t('submit.s3') }}</span></legend>

            <div role="radiogroup" :aria-label="t('submit.contactGroup')" class="grid gap-3 sm:grid-cols-3">
              <label
                v-for="m in methods"
                :key="m.value"
                class="group relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy"
                :class="form.contactMethod === m.value ? 'border-ink bg-ink text-paper' : 'border-sunken bg-white hover:border-ink'"
              >
                <input v-model="form.contactMethod" type="radio" name="contact-method" :value="m.value" class="sr-only" />
                <UiIcon :name="m.icon" :size="20" /> {{ m.label }}
                <UiIcon v-if="form.contactMethod === m.value" name="check" :size="18" class="ml-auto text-green" />
              </label>
            </div>
            <p class="field-hint -mt-3">{{ t('submit.contactQuestion') }}</p>

            <Transition enter-active-class="transition duration-500 ease-out-expo" enter-from-class="-translate-y-2 opacity-0" mode="out-in">
              <div v-if="form.contactMethod !== 'email'" :key="form.contactMethod">
                <label class="field-label" for="contact-url">
                  {{ form.contactMethod === 'linkedin' ? t('submit.linkedinLabel') : t('submit.websiteLabel') }}
                  <span class="font-medium text-muted">{{ t('submit.optional') }}</span>
                </label>
                <input id="contact-url" v-model="form.contactUrl" type="url" inputmode="url" class="field" :placeholder="form.contactMethod === 'linkedin' ? t('submit.linkedinPlaceholder') : 'https://'" :aria-invalid="!!errors.contactUrl" />
                <p v-if="errors.contactUrl" class="field-error" role="alert">{{ errors.contactUrl }}</p>
                <p v-else class="field-hint">{{ t('submit.contactUrlHint') }}</p>
              </div>
              <p v-else key="email" class="rounded-2xl bg-sunken p-4 text-sm font-medium">
                {{ t('submit.emailNote') }}
              </p>
            </Transition>

            <div class="corner-tr bg-yellow p-6">
              <label class="field-label flex items-center gap-2" for="email"><UiIcon name="lock" :size="16" /> {{ t('submit.emailLabel') }} <span class="font-medium">{{ t('submit.emailPrivate') }}</span></label>
              <input id="email" v-model="form.contactEmail" type="email" class="field" autocomplete="email" maxlength="254" :placeholder="t('submit.emailPlaceholder')" :aria-invalid="!!errors.contactEmail" />
              <p v-if="errors.contactEmail" class="field-error" role="alert">{{ errors.contactEmail }}</p>
              <p v-else class="field-hint !text-ink/70">{{ t('submit.emailHint', { admin: config.public.adminContactEmail }) }}</p>
            </div>

            <!-- Honeypot: real people never see or fill this. -->
            <div class="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label>Homepage <input v-model="form.homepage" name="homepage" tabindex="-1" autocomplete="off" /></label>
            </div>

            <div>
              <label class="flex cursor-pointer items-start gap-3 font-medium" :data-invalid="!!errors.consent">
                <input v-model="form.consent" type="checkbox" class="mt-1 size-5 shrink-0 accent-red" :aria-invalid="!!errors.consent" />
                <span>{{ t('submit.consent') }}</span>
              </label>
              <p v-if="errors.consent" class="field-error" role="alert">{{ errors.consent }}</p>
            </div>

            <button type="submit" class="btn btn-red w-full !py-5 text-lg sm:w-auto" :disabled="submitting">
              <template v-if="submitting"><span class="size-4 animate-spin rounded-full border-2 border-paper border-t-transparent" /> {{ t('submit.sending') }}</template>
              <template v-else>{{ t('submit.submitBtn') }} <UiIcon name="arrow" :size="20" class="arrow" /></template>
            </button>
          </fieldset>
        </div>

        <!-- Live preview -->
        <aside class="hidden lg:sticky lg:top-28 lg:block" :aria-label="t('submit.preview')">
          <p class="eyebrow mb-4 text-muted"><span class="size-2 animate-pulse rounded-full bg-red" /> {{ t('submit.preview') }}</p>
          <div class="pointer-events-none -rotate-1 transition-transform duration-500 ease-out-expo">
            <ShowcaseCard :showcase="preview" preview />
          </div>
        </aside>
      </form>
    </template>
  </div>
</template>
