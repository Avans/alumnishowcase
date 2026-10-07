<script setup lang="ts">
const route = useRoute()
const { isAdmin } = useIsAdmin()
const { t } = useLocale()

const scrolled = ref(false)
const open = ref(false)

const links = computed(() => [
  { label: t('nav.showcases'), to: '/#showcases' },
  { label: t('nav.companies'), to: '/#companies' },
])

function onScroll() {
  scrolled.value = window.scrollY > 12
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.documentElement.style.overflow = ''
})

watch(() => route.fullPath, () => (open.value = false))
watch(open, (v) => {
  if (import.meta.client) document.documentElement.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-[background-color,box-shadow] duration-300"
    :class="scrolled || open ? 'bg-paper/85 shadow-[0_1px_0_var(--color-sunken)] backdrop-blur-md' : ''"
    style="view-transition-name: site-header"
  >
    <div class="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-5 py-3.5 md:px-10">
      <NuxtLink to="/" class="group flex items-center gap-3" :aria-label="t('nav.home')">
        <span class="grid size-11 place-items-center rounded-[0.9rem] rounded-tr-[1.5rem] bg-red text-paper transition-transform duration-500 ease-out-expo group-hover:-rotate-6 group-hover:scale-105">
          <svg viewBox="0 0 64 64" class="size-7" aria-hidden="true"><path d="M14 50 29 14h6l15 36h-8l-3-8H25l-3 8zm13-14h10l-5-13z" fill="currentColor" /></svg>
        </span>
        <span class="leading-none">
          <span class="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">Avans ICT</span>
          <span class="heading block text-[1.6rem]">Alumni Showcase</span>
        </span>
      </NuxtLink>

      <nav class="hidden items-center gap-1 md:flex" :aria-label="t('nav.main')">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="relative rounded-full px-4 py-2 font-semibold after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-red after:transition-transform after:duration-500 after:ease-out-expo hover:after:scale-x-100"
        >
          {{ l.label }}
        </NuxtLink>
        <NuxtLink v-if="isAdmin" to="/admin" class="rounded-full px-4 py-2 font-semibold text-red">{{ t('nav.admin') }}</NuxtLink>
        <LanguageSwitcher class="mx-2" />
        <NuxtLink to="/submit" class="btn btn-sm">
          {{ t('nav.submit') }} <UiIcon name="arrow" :size="16" class="arrow" />
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2 md:hidden">
        <LanguageSwitcher />
        <button
          type="button"
          class="grid size-11 place-items-center rounded-full bg-ink text-paper"
          :aria-expanded="open"
          aria-controls="mobile-menu"
          :aria-label="open ? t('nav.closeMenu') : t('nav.openMenu')"
          @click="open = !open"
        >
          <UiIcon :name="open ? 'x' : 'menu'" />
        </button>
      </div>
    </div>

    <div class="scroll-bar absolute inset-x-0 bottom-0 h-[3px] bg-red" aria-hidden="true" />

    <Transition
      enter-active-class="transition duration-500 ease-out-expo"
      enter-from-class="-translate-y-4 opacity-0"
      leave-active-class="transition duration-300 ease-out-expo"
      leave-to-class="-translate-y-4 opacity-0"
    >
      <div v-if="open" id="mobile-menu" class="fixed inset-x-0 top-[68px] z-40 h-[calc(100dvh-68px)] overflow-auto bg-paper px-5 pb-10 pt-8 md:hidden">
        <ul class="space-y-1">
          <li v-for="(l, i) in [...links, { label: t('nav.submit'), to: '/submit' }]" :key="l.to" class="enter" :style="{ '--i': i }">
            <NuxtLink :to="l.to" class="display block py-1 text-[4.5rem]" @click="open = false">{{ l.label }}</NuxtLink>
          </li>
          <li v-if="isAdmin" class="enter" style="--i: 3">
            <NuxtLink to="/admin" class="display block py-1 text-[4.5rem] text-red">{{ t('nav.admin') }}</NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>
