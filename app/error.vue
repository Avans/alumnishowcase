<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t, locale } = useLocale()

const notFound = computed(() => props.error.statusCode === 404)
useHead({
  htmlAttrs: { lang: locale },
  title: () => (notFound.value ? t('meta.notFoundTitle') : t('meta.errorTitle')),
})
</script>

<template>
  <div class="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto]">
    <AppHeader />
    <main class="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 py-16 md:px-10 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <p class="display text-[clamp(9rem,28vw,24rem)] text-red">{{ notFound ? '404' : error.statusCode }}</p>
      </div>
      <div class="corner-tr bg-purple p-8 md:p-12">
        <h1 class="heading text-5xl">{{ notFound ? t('notFound.title') : t('meta.errorTitle') }}</h1>
        <p class="mt-4 max-w-md text-lg font-medium">{{ notFound ? t('notFound.text') : t('notFound.generic') }}</p>
        <button type="button" class="btn mt-8" @click="clearError({ redirect: '/' })">
          {{ t('notFound.home') }} <UiIcon name="arrow" :size="18" class="arrow" />
        </button>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
