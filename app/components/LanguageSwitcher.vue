<script setup lang="ts">
const { locale, setLocale, t } = useLocale()
</script>

<template>
  <div class="relative inline-grid grid-cols-2 rounded-full bg-sunken p-1 text-sm font-extrabold" role="group" :aria-label="t('lang.label')">
    <span
      class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-ink transition-transform duration-500 ease-out-expo"
      :class="locale === 'en' ? 'translate-x-full' : ''"
      aria-hidden="true"
    />
    <button
      v-for="l in LOCALES"
      :key="l"
      type="button"
      class="relative z-10 rounded-full px-3 py-1.5 tracking-wide transition-colors duration-300"
      :class="locale === l ? 'text-paper' : 'text-ink hover:text-red'"
      :aria-pressed="locale === l"
      :lang="l"
      :title="t(`lang.${l}`)"
      @click="setLocale(l)"
    >
      {{ l.toUpperCase() }}
    </button>
  </div>
</template>
