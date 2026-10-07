<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const config = useRuntimeConfig()
const { isAdmin } = useIsAdmin()
const { showcases } = useShowcases()
const { t, locale } = useLocale()
const slug = String(route.params.slug)

const { data: showcase } = await useAsyncData(`showcase-${slug}`, async () => {
  const { data, error } = await supabase.from('showcases').select('*').eq('slug', slug).maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data as Showcase | null
})

if (!showcase.value) {
  throw createError({ statusCode: 404, statusMessage: 'Showcase not found', fatal: true })
}

const s = computed(() => showcase.value!)

useSeoMeta({
  title: () => s.value.title,
  description: () => s.value.summary,
  ogTitle: () => s.value.title,
  ogDescription: () => s.value.summary,
  ogImage: () => s.value.image_url,
  twitterCard: 'summary_large_image',
})

const safeLinks = computed(() => s.value.links.filter((l) => /^https?:\/\//i.test(l.url)))
const companyLink = computed(() => ({ path: '/', query: { company: companyKey(s.value.company) }, hash: '#showcases' }))
const swatch = computed(() => swatchFor(companyKey(s.value.company)))

const related = computed(() => {
  const others = showcases.value.filter((x) => x.id !== s.value.id)
  const key = companyKey(s.value.company)
  const same = others.filter((x) => companyKey(x.company) === key)
  const rest = others.filter((x) => companyKey(x.company) !== key)
  return { sameCompany: same.slice(0, 3), more: [...same, ...rest].slice(0, 3) }
})

const introMailto = computed(() => {
  const params = { title: s.value.title, name: s.value.alumni_name }
  const subject = t('detail.mailSubject', params)
  const body = t('detail.mailBody', params)
  return `mailto:${config.public.adminContactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})

// The private email is only ever returned by the database to admins (RLS).
const privateEmail = ref<string | null>(null)
watch(
  [isAdmin, () => s.value.id],
  async ([admin, id]) => {
    privateEmail.value = null
    if (!admin) return
    const { data } = await supabase.from('showcase_contacts').select('email').eq('showcase_id', id).maybeSingle()
    privateEmail.value = data?.email ?? null
  },
  { immediate: true },
)

const hasPublicLink = computed(() => s.value.contact_method !== 'email' && /^https?:\/\//i.test(s.value.contact_url ?? ''))
const contactLabel = computed(() => t(`contactMethod.${s.value.contact_method}`))
</script>

<template>
  <article>
    <div class="mx-auto max-w-[1400px] px-5 pt-6 md:px-10">
      <NuxtLink to="/#showcases" class="group inline-flex items-center gap-2 rounded-full py-2 pr-4 font-bold">
        <span class="grid size-9 place-items-center rounded-full bg-ink text-paper transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">
          <UiIcon name="arrow" :size="16" class="rotate-180" />
        </span>
        {{ t('detail.back') }}
      </NuxtLink>

      <p v-if="s.status !== 'approved'" class="mt-4 rounded-2xl bg-yellow px-5 py-3 font-bold" role="status">
        {{ t('detail.preview', { status: t(`detail.status.${s.status}`) }) }}
      </p>

      <header class="mt-8">
        <ul class="enter mb-6 flex flex-wrap items-center gap-2" style="--i: 0">
          <li>
            <NuxtLink :to="companyLink" class="pill !px-4 !py-1.5 text-sm" :style="{ background: swatch.bg, color: swatch.fg }">{{ s.company }}</NuxtLink>
          </li>
          <li v-for="t in s.tags" :key="t" class="pill !bg-transparent ring-2 ring-ink/15">{{ t }}</li>
        </ul>
        <h1 class="display max-w-[16ch] text-[clamp(3.75rem,10vw,9rem)]">
          <span class="split-line"><span>{{ s.title }}</span></span>
        </h1>
      </header>

      <div class="corner-tr relative mt-10 aspect-[16/9] overflow-hidden bg-sunken md:rounded-tr-[6rem]">
        <img
          :src="s.image_url"
          :alt="t('detail.coverAlt', { title: s.title })"
          class="size-full object-cover"
          :style="{ viewTransitionName: transitionName(s.id) }"
          fetchpriority="high"
        />
      </div>

      <div class="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <div>
          <p v-reveal class="text-2xl font-medium leading-snug md:text-[2rem] md:leading-[1.25]">{{ s.summary }}</p>

          <section v-if="safeLinks.length" class="mt-14" aria-labelledby="explore">
            <h2 id="explore" v-reveal class="heading text-4xl">{{ t('detail.explore') }}</h2>
            <ul class="mt-6 divide-y-2 divide-ink/10 border-y-2 border-ink/10">
              <li v-for="(l, i) in safeLinks" :key="l.url" v-reveal="i * 70">
                <a
                  :href="l.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group -mx-4 flex items-center justify-between gap-4 rounded-2xl px-4 py-5 transition-colors duration-300 hover:bg-ink hover:text-paper"
                >
                  <span class="min-w-0">
                    <span class="heading block text-3xl">{{ l.label }}</span>
                    <span class="block truncate text-sm font-semibold opacity-60">{{ hostname(l.url) }}</span>
                  </span>
                  <span class="arrow-circle shrink-0 !bg-ink !text-paper group-hover:!bg-paper group-hover:!text-ink">
                    <UiIcon name="arrow-up-right" :size="22" />
                  </span>
                </a>
              </li>
            </ul>
          </section>
        </div>

        <aside v-reveal="{ variant: 'scale' }" class="lg:sticky lg:top-28 lg:self-start" :aria-label="t('detail.aboutAlumnus')">
          <div class="corner-tr bg-purple p-7 md:p-9">
            <p class="eyebrow mb-5 opacity-70">{{ t('detail.builtBy') }}</p>
            <div class="flex items-center gap-4">
              <Avatar :name="s.alumni_name" :size="68" />
              <div class="min-w-0">
                <h2 class="heading text-4xl">{{ s.alumni_name }}</h2>
                <p v-if="s.alumni_role" class="font-semibold">{{ s.alumni_role }}</p>
              </div>
            </div>

            <dl class="mt-6 grid gap-3 text-sm">
              <div class="flex items-center justify-between gap-4 border-t-2 border-ink/15 pt-3">
                <dt class="font-semibold opacity-70">{{ t('detail.company') }}</dt>
                <dd class="font-bold"><NuxtLink :to="companyLink" class="underline decoration-2 underline-offset-4 hover:no-underline">{{ s.company }}</NuxtLink></dd>
              </div>
              <div v-if="s.programme" class="flex items-center justify-between gap-4 border-t-2 border-ink/15 pt-3">
                <dt class="font-semibold opacity-70">{{ t('detail.programme') }}</dt>
                <dd class="text-right font-bold">{{ s.programme }}</dd>
              </div>
              <div v-if="s.graduation_year" class="flex items-center justify-between gap-4 border-t-2 border-ink/15 pt-3">
                <dt class="font-semibold opacity-70">{{ t('detail.classOf') }}</dt>
                <dd class="font-bold">{{ s.graduation_year }}</dd>
              </div>
            </dl>

            <div class="mt-8 border-t-2 border-ink/15 pt-6">
              <p class="eyebrow mb-3 opacity-70">{{ hasPublicLink ? t('detail.preferredContact', { method: contactLabel }) : t('detail.contactViaAvans') }}</p>

              <a
                v-if="hasPublicLink && s.contact_url"
                :href="s.contact_url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn w-full"
              >
                <UiIcon :name="s.contact_method === 'linkedin' ? 'linkedin' : 'globe'" :size="18" />
                {{ s.contact_method === 'linkedin' ? t('detail.connectLinkedin') : t('detail.visit', { host: hostname(s.contact_url) }) }}
              </a>

              <template v-else>
                <p class="mb-4 text-sm font-medium leading-relaxed">
                  {{ t('detail.prefersEmail', { name: s.alumni_name.split(' ')[0] }) }}
                </p>
                <a :href="introMailto" class="btn w-full"><UiIcon name="mail" :size="18" /> {{ t('detail.requestIntro') }}</a>
              </template>

              <div v-if="isAdmin" class="mt-6 rounded-2xl bg-paper/70 p-4">
                <p class="eyebrow mb-3 text-red"><UiIcon name="lock" :size="14" /> {{ t('detail.adminOnly') }}</p>
                <PrivateEmail v-if="privateEmail" :email="privateEmail" />
                <p v-else class="text-sm font-medium opacity-70">{{ t('detail.noEmail') }}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section v-if="related.more.length" class="mt-28" aria-labelledby="more">
        <h2 id="more" v-reveal class="display text-[clamp(3rem,7vw,5.5rem)]">
          {{ related.sameCompany.length ? t('detail.moreFrom', { company: s.company }) : t('detail.moreExplore') }}
        </h2>
        <ul class="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <li v-for="(r, i) in related.more" :key="r.id" v-reveal="i * 90">
            <ShowcaseCard :showcase="r" />
          </li>
        </ul>
      </section>
    </div>
  </article>
</template>
