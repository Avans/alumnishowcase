<script setup lang="ts">
const props = defineProps<{ company: CompanySummary; active?: boolean }>()
defineEmits<{ select: [key: string] }>()

// Tiles sit on the navy section, so navy would vanish.
const swatch = computed(() => swatchFor(props.company.key, ['#001c70']))
</script>

<template>
  <button
    type="button"
    class="group corner-tr flex min-h-[15rem] w-full flex-col p-6 text-left transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1.5 hover:-rotate-1"
    :class="active ? 'ring-4 ring-paper ring-offset-4 ring-offset-navy' : ''"
    :style="{ background: swatch.bg, color: swatch.fg }"
    :aria-pressed="active"
    @click="$emit('select', company.key)"
  >
    <span class="flex items-start justify-between gap-4">
      <span class="display text-[5.5rem]">{{ company.name.charAt(0) }}</span>
      <span class="arrow-circle size-11"><UiIcon name="arrow" :size="20" /></span>
    </span>
    <span class="heading mt-auto block text-[2rem] [overflow-wrap:anywhere]">{{ company.name }}</span>
    <span class="mt-2 block text-sm font-semibold opacity-80">
      {{ $tc('companies.showcaseCount', company.count) }} · {{ $tc('companies.alumniCount', company.alumni) }}
    </span>
  </button>
</template>
