<script setup lang="ts">
const { t } = useLocale()
useHead({ title: () => t('meta.loginTitle'), meta: [{ name: 'robots', content: 'noindex' }] })

const user = useSupabaseUser()
const route = useRoute()
const failed = ref(Boolean(route.query.error || route.query.error_description))

watch(user, (u) => u && navigateTo('/admin'), { immediate: true })

onMounted(() => {
  // The session is exchanged client-side; give it a moment before giving up.
  setTimeout(() => {
    if (!user.value) failed.value = true
  }, 6000)
})
</script>

<template>
  <div class="mx-auto grid max-w-3xl place-items-center gap-6 px-5 py-24 text-center" role="status" aria-live="polite">
    <template v-if="!failed">
      <span class="size-14 animate-spin rounded-full border-[5px] border-ink border-t-red" />
      <p class="heading text-4xl">{{ t('confirm.working') }}</p>
    </template>
    <template v-else>
      <p class="heading text-5xl">{{ t('confirm.failed') }}</p>
      <NuxtLink to="/login" class="btn">{{ t('confirm.retry') }} <UiIcon name="arrow" :size="18" class="arrow" /></NuxtLink>
    </template>
  </div>
</template>
