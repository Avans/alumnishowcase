<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
    <TransitionGroup
      enter-active-class="transition duration-500 ease-out-expo"
      enter-from-class="translate-y-6 scale-90 opacity-0"
      leave-active-class="transition duration-300 ease-out-expo"
      leave-to-class="translate-y-3 opacity-0"
      move-class="transition duration-500 ease-out-expo"
    >
      <button
        v-for="t in toasts"
        :key="t.id"
        type="button"
        class="pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-3 pl-4 pr-5 text-left text-sm font-semibold shadow-xl"
        :class="{
          'bg-ink text-paper': t.tone === 'info',
          'bg-green text-ink': t.tone === 'success',
          'bg-red text-paper': t.tone === 'error',
        }"
        @click="dismiss(t.id)"
      >
        <UiIcon :name="t.tone === 'success' ? 'check' : t.tone === 'error' ? 'x' : 'sparkle'" :size="16" />
        {{ t.message }}
      </button>
    </TransitionGroup>
  </div>
</template>
