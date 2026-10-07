<script setup lang="ts">
const props = defineProps<{ items: Showcase[] }>()

const deck = computed(() => props.items.slice(0, 4))
const n = computed(() => deck.value.length)

const active = ref(0)
const leaving = ref(-1)
const paused = ref(false)
const tilt = reactive({ x: 0, y: 0 })
let timer: ReturnType<typeof setInterval> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined

function advance() {
  if (n.value < 2 || leaving.value !== -1) return
  leaving.value = active.value
  leaveTimer = setTimeout(() => {
    active.value = (active.value + 1) % n.value
    leaving.value = -1
  }, 520)
}

function jump(i: number) {
  if (i === active.value || leaving.value !== -1) return
  active.value = i
}

function cardStyle(i: number) {
  const order = (i - active.value + n.value) % n.value
  if (leaving.value === i) {
    return { transform: 'translate3d(-78%, -4%, 0) rotate(-16deg)', opacity: 0, zIndex: 40 }
  }
  return {
    transform: `translate3d(${order * 8}%, ${order * -7}%, 0) rotate(${order * 4 - 2}deg) scale(${1 - order * 0.05})`,
    opacity: order > 2 ? 0 : 1,
    zIndex: 30 - order * 10,
  }
}

function onPointerMove(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tilt.x = ((e.clientY - rect.top) / rect.height - 0.5) * -6
  tilt.y = ((e.clientX - rect.left) / rect.width - 0.5) * 8
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => {
    if (!paused.value && document.visibilityState === 'visible') advance()
  }, 4800)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(leaveTimer)
})
</script>

<template>
  <div
    class="relative mx-auto w-full max-w-[560px]"
    @pointerenter="paused = true"
    @pointerleave="((paused = false), (tilt.x = 0), (tilt.y = 0))"
    @pointermove="onPointerMove"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <div
      class="relative aspect-[5/4.4] w-full transition-transform duration-500 ease-out"
      :style="{ transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }"
    >
      <template v-if="n > 0">
        <NuxtLink
          v-for="(s, i) in deck"
          :key="s.id"
          :to="`/showcase/${s.slug}`"
          class="group absolute left-0 top-[12%] block w-[82%] transition-[transform,opacity] duration-[900ms] ease-out-expo will-change-transform"
          :style="cardStyle(i)"
          :tabindex="(i - active + n) % n === 0 ? 0 : -1"
          :aria-hidden="(i - active + n) % n === 0 ? undefined : true"
        >
          <span class="corner-tr block overflow-hidden bg-white shadow-[0_30px_60px_-20px_rgba(19,19,19,0.45)] ring-1 ring-black/5">
            <img :src="s.image_url" :alt="$t('card.cover', { title: s.title })" class="aspect-[4/3] w-full object-cover" decoding="async" />
            <span class="flex items-center justify-between gap-3 p-4">
              <span class="min-w-0">
                <span class="heading block truncate text-2xl">{{ s.title }}</span>
                <span class="block truncate text-sm font-medium text-muted">{{ s.company }} · {{ s.alumni_name }}</span>
              </span>
              <span class="arrow-circle !bg-ink !text-paper size-10 shrink-0"><UiIcon name="arrow" :size="18" /></span>
            </span>
          </span>
        </NuxtLink>
      </template>

      <NuxtLink
        v-else
        to="/submit"
        class="group corner-tr absolute left-[4%] top-[14%] flex aspect-[4/3] w-[78%] flex-col items-center justify-center gap-4 bg-purple text-center"
      >
        <span class="arrow-circle size-16"><UiIcon name="plus" :size="26" /></span>
        <span class="heading whitespace-pre-line text-4xl">{{ $t('deck.emptyTitle') }}</span>
      </NuxtLink>

      <span class="pointer-events-none absolute -right-2 top-0 size-24 animate-[float_7s_ease-in-out_infinite] text-yellow md:size-28" style="--r: 0deg" aria-hidden="true">
        <UiIcon name="sparkle" :size="112" class="size-full" />
      </span>
    </div>

    <div v-if="n > 1" class="mt-4 flex items-center gap-2" role="tablist" :aria-label="$t('deck.label')">
      <button
        v-for="(s, i) in deck"
        :key="s.id"
        type="button"
        role="tab"
        :aria-selected="i === active"
        :aria-label="$t('deck.show', { title: s.title })"
        class="h-2.5 rounded-full transition-all duration-500 ease-out-expo"
        :class="i === active ? 'w-10 bg-ink' : 'w-2.5 bg-ink/25 hover:bg-ink/50'"
        @click="jump(i)"
      />
    </div>
  </div>
</template>
