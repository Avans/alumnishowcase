<script setup lang="ts">
const route = useRoute()
const { showcases, companies, error } = useShowcases()
const { t, tm, tc, locale } = useLocale()
const config = useRuntimeConfig()

useHead({ title: () => t('meta.homeTitle') })
useSeoMeta({
  ogTitle: () => t('meta.homeTitle'),
  ogDescription: () => t('meta.description'),
})

const heroLines = computed(() => tm('hero.title'))
const companyTitle = computed(() => tm('companies.title'))
const ctaTitle = computed(() => tm('cta.title'))
const stats = computed(() => [
  { n: showcases.value.length, label: t('stats.showcases'), color: 'text-red' },
  { n: companies.value.length, label: t('stats.companies'), color: 'text-navy' },
  { n: alumniCount.value, label: t('stats.alumni'), color: 'text-ink' },
])

const q = ref(String(route.query.q ?? ''))
const company = ref(String(route.query.company ?? ''))
const tag = ref(String(route.query.tag ?? ''))

const alumniCount = computed(() => new Set(showcases.value.map((s) => s.alumni_name.trim().toLowerCase())).size)
const deckItems = computed(() => {
  const featured = showcases.value.filter((s) => s.featured)
  return (featured.length >= 2 ? featured : showcases.value).slice(0, 4)
})

const topTags = computed(() => {
  const counts = new Map<string, number>()
  for (const s of showcases.value) for (const t of s.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([t]) => t)
})

const activeCompany = computed(() => companies.value.find((c) => c.key === company.value))

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return showcases.value.filter((s) => {
    if (company.value && companyKey(s.company) !== company.value) return false
    if (tag.value && !s.tags.includes(tag.value)) return false
    if (!needle) return true
    return [s.title, s.summary, s.company, s.alumni_name, s.alumni_role ?? '', ...s.tags].join(' ').toLowerCase().includes(needle)
  })
})
const hasFilters = computed(() => Boolean(q.value.trim() || company.value || tag.value))

watch([q, company, tag], () => {
  if (!import.meta.client) return
  const params = new URLSearchParams()
  if (q.value.trim()) params.set('q', q.value.trim())
  if (company.value) params.set('company', company.value)
  if (tag.value) params.set('tag', tag.value)
  const qs = params.toString()
  history.replaceState(history.state, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`)
})

function scrollToGrid() {
  document.getElementById('showcases')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function selectCompany(key: string) {
  company.value = company.value === key ? '' : key
  scrollToGrid()
}
function clearFilters() {
  q.value = ''
  company.value = ''
  tag.value = ''
}

const hero = ref<HTMLElement>()
function onHeroMove(e: PointerEvent) {
  const el = hero.value
  if (!el) return
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5) * 2))
  el.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5) * 2))
}
const drift = (x: number, y: number) =>
  ({ transform: `translate3d(calc(var(--mx, 0) * ${x}px), calc(var(--my, 0) * ${y}px), 0)` })
</script>

<template>
  <div>
    <!-- Hero -->
    <section ref="hero" class="relative overflow-hidden" @pointermove="onHeroMove">
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute left-0 top-0 w-[min(64rem,96vw)] transition-transform duration-700 ease-out" :style="drift(-10, -8)">
          <svg viewBox="0 0 640 600" preserveAspectRatio="none" class="scroll-rotate h-[min(46rem,92vh)] w-full origin-top-left text-purple" style="animation-range: 0 60vh">
            <path d="M0 0H500C575 0 612 44 600 118L520 600H0Z" fill="currentColor" />
          </svg>
        </div>
        <div class="absolute right-[6%] top-[9%] size-24 animate-[float_8s_ease-in-out_infinite] rounded-full bg-red md:size-32" style="--r: 0deg" />
        <div class="absolute -left-10 bottom-16 hidden flex-col gap-3 md:flex" :style="drift(14, 6)">
          <span v-for="n in 3" :key="n" class="size-20 rounded-full bg-orange" :style="{ marginLeft: `${n * 14}px` }" />
        </div>
        <div class="absolute bottom-10 right-[34%] hidden h-10 w-28 rotate-[-12deg] rounded-full bg-navy lg:block" :style="drift(-18, 12)" />
      </div>

      <div class="relative mx-auto grid max-w-[1400px] items-center gap-12 px-5 pb-20 pt-10 md:px-10 lg:min-h-[44rem] lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-14">
        <div>
          <p class="eyebrow enter mb-6 rounded-full bg-paper/80 py-2 pl-3 pr-4 backdrop-blur" style="--i: 0">
            <span class="size-2.5 animate-[pulse-ring_1.8s_ease-out_infinite] rounded-full bg-red" />
            {{ $tc('hero.eyebrow', showcases.length) }}
          </p>

          <h1
            class="display"
            :class="heroLines.length > 2 ? 'text-[clamp(4.5rem,13vw,11rem)]' : 'text-[clamp(5.5rem,17vw,13rem)]'"
          >
            <span v-for="(line, i) in heroLines" :key="`${locale}-${i}`" class="split-line" :style="{ '--i': i }">
              <span :class="{ 'text-red': i === heroLines.length - 1 }">{{ line }}</span>
            </span>
          </h1>

          <p class="enter mt-8 max-w-xl text-lg leading-relaxed md:text-xl" style="--i: 2">
            {{ t('hero.intro') }}
          </p>

          <div class="enter mt-10 grid max-w-lg gap-3" style="--i: 4">
            <ActionBlock to="/submit" :label="t('hero.submit')" tone="navy" />
            <ActionBlock to="/#showcases" :label="t('hero.browse')" tone="red" />
          </div>
        </div>

        <div class="enter" style="--i: 3">
          <HeroDeck :items="deckItems" />
        </div>
      </div>
    </section>

    <!-- Company ticker -->
    <div class="relative z-10 overflow-x-clip py-3">
      <div class="-rotate-[1.2deg] scale-x-[1.04]">
        <CompanyMarquee :companies="companies" @select="selectCompany" />
      </div>
    </div>

    <!-- Stats -->
    <section class="mx-auto max-w-[1400px] px-5 pb-6 pt-24 md:px-10 md:pt-32" :aria-label="t('stats.label')">
      <div class="grid gap-10 md:grid-cols-3">
        <div v-for="(stat, i) in stats" :key="stat.label" v-reveal="i * 120" class="border-t-[3px] border-ink pt-4">
          <p class="display text-[clamp(6rem,14vw,11rem)]" :class="stat.color"><CountUp :to="stat.n" /></p>
          <p class="heading -mt-1 text-3xl">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <!-- Showcases -->
    <section id="showcases" class="mx-auto max-w-[1400px] px-5 pt-20 md:px-10 md:pt-28">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <h2 v-reveal class="display text-[clamp(4rem,9vw,7.5rem)]">{{ t('showcases.title') }}</h2>
        <p v-reveal="100" class="max-w-md text-lg text-ink-soft">
          {{ t('showcases.intro') }}
        </p>
      </div>

      <div v-reveal="150" class="mt-10 flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <label class="relative min-w-[16rem] flex-1 md:max-w-md">
            <span class="sr-only">{{ t('showcases.searchLabel') }}</span>
            <UiIcon name="search" :size="20" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input v-model="q" type="search" class="field !rounded-full !pl-12" :placeholder="t('showcases.searchPlaceholder')" />
          </label>

          <button
            v-if="activeCompany"
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-bold text-paper transition-transform hover:scale-105"
            @click="company = ''"
          >
            {{ activeCompany.name }} <UiIcon name="x" :size="14" />
            <span class="sr-only">{{ t('showcases.clearCompany') }}</span>
          </button>
        </div>

        <div v-if="topTags.length" class="flex flex-wrap gap-2" role="group" :aria-label="t('showcases.tagGroup')">
          <button
            type="button"
            class="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold transition-colors"
            :class="!tag ? 'bg-ink text-paper' : 'hover:bg-sunken'"
            :aria-pressed="!tag"
            @click="tag = ''"
          >
            {{ t('showcases.all') }}
          </button>
          <button
            v-for="t in topTags"
            :key="t"
            type="button"
            class="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold transition-colors"
            :class="tag === t ? 'bg-ink text-paper' : 'hover:bg-sunken'"
            :aria-pressed="tag === t"
            @click="tag = tag === t ? '' : t"
          >
            {{ t }}
          </button>
        </div>
      </div>

      <p v-if="error" class="mt-12 rounded-2xl bg-pink p-6 font-semibold" role="alert">
        {{ t('showcases.error') }}
      </p>

      <TransitionGroup
        v-else-if="filtered.length"
        tag="ul"
        class="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        leave-active-class="transition duration-300 ease-out"
        leave-to-class="!scale-95 !opacity-0"
        move-class="!transition-transform !duration-700 !ease-out-expo"
        aria-live="polite"
      >
        <li v-for="(s, i) in filtered" :key="s.id" v-reveal="(i % 3) * 90">
          <ShowcaseCard :showcase="s" />
        </li>
      </TransitionGroup>

      <div v-else class="corner-tr mt-10 grid place-items-center gap-4 bg-sunken px-6 py-20 text-center">
        <template v-if="hasFilters">
          <p class="heading text-5xl">{{ t('showcases.noMatchTitle') }}</p>
          <p class="max-w-md text-ink-soft">{{ t('showcases.noMatchText') }}</p>
          <button type="button" class="btn" @click="clearFilters">{{ t('showcases.clear') }}</button>
        </template>
        <template v-else>
          <p class="heading text-5xl">{{ t('showcases.emptyTitle') }}</p>
          <p class="max-w-md text-ink-soft">{{ t('showcases.emptyText') }}</p>
          <NuxtLink to="/submit" class="btn">{{ t('showcases.emptyCta') }} <UiIcon name="arrow" :size="18" class="arrow" /></NuxtLink>
        </template>
      </div>
    </section>

    <!-- Companies -->
    <section id="companies" class="relative mt-28 bg-navy text-paper" style="border-top-left-radius: clamp(3rem, 9vw, 8rem); border-bottom-right-radius: clamp(3rem, 9vw, 8rem)">
      <div class="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <h2 v-reveal class="display text-[clamp(4rem,9vw,7.5rem)]">
            <template v-for="(line, i) in companyTitle" :key="i"><br v-if="i" />{{ line }}</template>
          </h2>
          <p v-reveal="100" class="max-w-md text-lg text-paper/80">{{ t('companies.intro') }}</p>
        </div>

        <ul v-if="companies.length" class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <li v-for="(c, i) in companies" :key="c.key" v-reveal="{ delay: (i % 4) * 90, variant: 'scale' }">
            <CompanyTile :company="c" :active="company === c.key" @select="selectCompany" />
          </li>
        </ul>

        <div v-else v-reveal class="corner-tr mt-14 grid gap-4 bg-paper/10 p-8 md:p-12">
          <p class="heading text-4xl md:text-5xl">{{ t('companies.emptyTitle') }}</p>
          <p class="max-w-xl text-lg text-paper/80">{{ t('companies.emptyText') }}</p>
          <NuxtLink to="/submit" class="btn btn-paper mt-2 w-fit">{{ t('showcases.emptyCta') }} <UiIcon name="arrow" :size="18" class="arrow" /></NuxtLink>
        </div>
      </div>
    </section>

    <!-- Call to action -->
    <section class="mx-auto mt-28 max-w-[1400px] px-5 md:px-10">
      <div v-reveal="{ variant: 'scale' }" class="corner-tr relative overflow-hidden bg-purple px-6 py-16 md:px-16 md:py-24">
        <div class="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-yellow md:size-96" aria-hidden="true" />
        <div class="pointer-events-none absolute -bottom-10 right-[22%] size-32 rounded-full bg-red" aria-hidden="true" />
        <div class="relative max-w-3xl">
          <h2 class="display text-[clamp(4rem,10vw,8.5rem)]">
            <template v-for="(line, i) in ctaTitle" :key="i"><br v-if="i" />{{ line }}</template>
          </h2>
          <p class="mt-6 max-w-xl text-lg md:text-xl">{{ t('cta.text') }}</p>
          <div class="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <NuxtLink to="/submit" class="btn">{{ t('cta.button') }} <UiIcon name="arrow" :size="18" class="arrow" /></NuxtLink>
            <p class="font-semibold">
              {{ t('cta.questions') }}
              <a :href="`mailto:${config.public.adminContactEmail}`" class="underline decoration-2 underline-offset-4 hover:no-underline">{{ config.public.adminContactEmail }}</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
