<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 40 })
const swatch = computed(() => swatchFor(props.name.trim().toLowerCase()))
</script>

<template>
  <span
    class="grid shrink-0 select-none place-items-center rounded-full font-condensed font-extrabold leading-none"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${size * 0.4}px`,
      background: swatch.bg,
      color: swatch.fg,
    }"
    aria-hidden="true"
  >
    {{ initials(name) }}
  </span>
</template>
