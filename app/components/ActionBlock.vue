<script setup lang="ts">
defineProps<{ to: string; label: string; tone?: 'navy' | 'red' | 'ink' | 'purple' }>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="group corner-tr flex items-center justify-between gap-6 px-6 py-5 transition-transform duration-500 ease-out-expo hover:-translate-y-1 md:px-8 md:py-7"
    :class="{
      'bg-navy text-paper': !tone || tone === 'navy',
      'bg-red text-paper': tone === 'red',
      'bg-ink text-paper': tone === 'ink',
      'bg-purple text-ink': tone === 'purple',
    }"
  >
    <span class="heading text-3xl md:text-[2.6rem]">{{ label }}</span>
    <span class="arrow-circle shrink-0"><UiIcon name="arrow" :size="22" /></span>
  </NuxtLink>
</template>
