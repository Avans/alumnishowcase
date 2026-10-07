<script setup lang="ts">
const props = defineProps<{ email: string }>()

const shown = ref(false)
const { push } = useToast()
const { t } = useLocale()

const masked = computed(() => `${'•'.repeat(8)}@${props.email.split('@')[1] ?? ''}`)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.email)
    push(t('privateEmail.copied'), 'success')
  } catch {
    push(t('privateEmail.copyFailed'), 'error')
  }
}
</script>

<template>
  <div class="inline-flex max-w-full items-center gap-2 rounded-full bg-ink py-1.5 pl-4 pr-1.5 text-paper">
    <UiIcon name="lock" :size="15" class="shrink-0 text-yellow" />
    <span class="min-w-0 truncate font-mono text-sm" :aria-label="shown ? email : t('privateEmail.hidden')">
      {{ shown ? email : masked }}
    </span>
    <button
      type="button"
      class="grid size-8 shrink-0 place-items-center rounded-full bg-paper/15 transition-colors hover:bg-paper/30"
      :aria-label="shown ? t('privateEmail.hide') : t('privateEmail.show')"
      :aria-pressed="shown"
      @click="shown = !shown"
    >
      <UiIcon :name="shown ? 'eye-off' : 'eye'" :size="16" />
    </button>
    <button
      v-if="shown"
      type="button"
      class="grid size-8 shrink-0 place-items-center rounded-full bg-paper/15 transition-colors hover:bg-paper/30"
      :aria-label="t('privateEmail.copy')"
      @click="copy"
    >
      <UiIcon name="copy" :size="16" />
    </button>
  </div>
</template>
