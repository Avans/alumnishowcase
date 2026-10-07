<script setup lang="ts">
const props = defineProps<{ to: number; duration?: number }>()

const el = ref<HTMLElement>()
const shown = ref(props.to)
let frame = 0

function run(target: number) {
  const duration = props.duration ?? 1600
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration)
    shown.value = Math.round((p === 1 ? 1 : 1 - 2 ** (-10 * p)) * target)
    if (p < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !el.value) return
  shown.value = 0
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      io.disconnect()
      run(props.to)
    },
    { threshold: 0.5 },
  )
  io.observe(el.value)
  onBeforeUnmount(() => {
    io.disconnect()
    cancelAnimationFrame(frame)
  })
})

watch(
  () => props.to,
  (v) => {
    cancelAnimationFrame(frame)
    shown.value = v
  },
)
</script>

<template>
  <span ref="el" class="tabular-nums">{{ shown }}</span>
</template>
