<script setup lang="ts">
const props = defineProps<{ companies: CompanySummary[] }>()
const emit = defineEmits<{ select: [key: string] }>()

const row = computed(() => {
  const base = props.companies
  if (!base.length) return []
  let list = [...base]
  while (list.length < 8) list = [...list, ...base]
  return list
})
const duration = computed(() => `${Math.max(30, row.value.length * 5)}s`)
</script>

<template>
  <div
    v-if="row.length"
    class="marquee relative overflow-hidden bg-ink py-5 text-paper md:py-6"
    :style="{ '--marquee-duration': duration }"
    role="region"
    :aria-label="$t('marquee.label')"
  >
    <div class="marquee-track">
      <ul v-for="copy in 2" :key="copy" class="flex shrink-0 items-center" :aria-hidden="copy === 2 ? true : undefined">
        <li v-for="(c, i) in row" :key="`${copy}-${i}`" class="flex items-center">
          <NuxtLink
            :to="{ path: '/', query: { company: c.key }, hash: '#showcases' }"
            class="display px-5 text-[clamp(2.75rem,6vw,5.5rem)] transition-colors duration-300 hover:text-yellow md:px-8"
            :tabindex="copy === 2 ? -1 : undefined"
            @click.prevent="emit('select', c.key)"
          >
            {{ c.name }}
          </NuxtLink>
          <UiIcon name="sparkle" :size="30" class="shrink-0 animate-[spin_9s_linear_infinite] text-red-bright" />
        </li>
      </ul>
    </div>
  </div>
</template>
