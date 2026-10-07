<script setup lang="ts">
const { locale, t } = useLocale()
useHead({ htmlAttrs: { lang: locale } })
useSeoMeta({ description: () => t('meta.description'), ogLocale: () => (locale.value === 'nl' ? 'nl_NL' : 'en_GB') })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ToastHost />
</template>
