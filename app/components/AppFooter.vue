<script setup lang="ts">
const config = useRuntimeConfig()
const { t } = useLocale()
const email = config.public.adminContactEmail
const year = new Date().getFullYear()
</script>

<template>
  <footer id="contact" class="relative mt-28 overflow-hidden bg-red text-paper" style="border-top-left-radius: clamp(3rem, 9vw, 8rem)">
    <div class="mx-auto grid max-w-[1400px] gap-12 px-5 pb-6 pt-16 md:grid-cols-[1.4fr_1fr_1.1fr] md:px-10 md:pt-24">
      <div>
        <p class="heading max-w-md text-4xl md:text-5xl">{{ t('footer.tagline') }}</p>
        <NuxtLink to="/submit" class="btn btn-paper mt-8">
          {{ t('footer.add') }} <UiIcon name="arrow" :size="18" class="arrow" />
        </NuxtLink>
      </div>

      <nav :aria-label="t('footer.explore')">
        <p class="eyebrow mb-4 opacity-80">{{ t('footer.explore') }}</p>
        <ul class="space-y-2 text-lg font-semibold">
          <li><NuxtLink class="hover:underline" to="/#showcases">{{ t('footer.allShowcases') }}</NuxtLink></li>
          <li><NuxtLink class="hover:underline" to="/#companies">{{ t('nav.companies') }}</NuxtLink></li>
          <li><NuxtLink class="hover:underline" to="/submit">{{ t('nav.submit') }}</NuxtLink></li>
        </ul>
      </nav>

      <div>
        <p class="eyebrow mb-4 opacity-80">{{ t('footer.contact') }}</p>
        <p class="max-w-xs text-lg font-semibold">{{ t('footer.contactText') }}</p>
        <a
          :href="`mailto:${email}`"
          class="group mt-3 inline-flex items-center gap-3 break-all text-xl font-extrabold underline decoration-2 underline-offset-[6px] hover:no-underline md:text-2xl"
        >
          <UiIcon name="mail" :size="24" class="shrink-0 transition-transform duration-500 ease-out-expo group-hover:-rotate-12 group-hover:scale-110" />
          {{ email }}
        </a>
        <NuxtLink to="/admin" class="mt-8 block text-sm font-semibold opacity-70 hover:opacity-100">{{ t('footer.adminLogin') }}</NuxtLink>
      </div>
    </div>

    <p
      class="display pointer-events-none select-none whitespace-nowrap px-5 pt-8 text-center text-[clamp(3.5rem,14.5vw,15rem)] leading-[0.8] text-paper/[0.14]"
      aria-hidden="true"
    >
      Alumni Showcase
    </p>

    <p class="mx-auto max-w-[1400px] px-5 pb-6 text-sm font-semibold opacity-80 md:px-10">{{ t('footer.copyright', { year }) }}</p>
  </footer>
</template>
