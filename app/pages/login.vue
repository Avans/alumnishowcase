<script setup lang="ts">
const { t, tm, locale } = useLocale()
useHead({ title: () => t('meta.loginTitle'), meta: [{ name: 'robots', content: 'noindex' }] })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const origin = useRequestURL().origin

const email = ref('')
const sending = ref(false)
const sent = ref(false)
const failed = ref(false)

watch(user, (u) => u && navigateTo('/admin'), { immediate: true })

// Unknown addresses look identical to known ones, so nobody can probe who is an admin.
const SILENT_ERRORS = ['otp_disabled', 'signup_disabled', 'user_not_found']

async function send() {
  failed.value = false
  sending.value = true
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim(),
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/confirm` },
  })
  sending.value = false
  if (error && !SILENT_ERRORS.includes(error.code ?? '')) failed.value = true
  else sent.value = true
}
</script>

<template>
  <div class="mx-auto grid max-w-[1400px] items-center gap-12 px-5 pb-8 pt-10 md:px-10 md:pt-20 lg:grid-cols-[1.1fr_1fr]">
    <header>
      <h1 class="display text-[clamp(5rem,15vw,12rem)]">
        <span v-for="(line, i) in tm('login.title')" :key="`${locale}-${i}`" class="split-line" :style="{ '--i': i }">
          <span :class="{ 'text-red': i === 1 }">{{ line }}</span>
        </span>
      </h1>
      <p class="enter mt-6 max-w-md text-lg" style="--i: 2">{{ t('login.text') }}</p>
    </header>

    <div class="corner-tr bg-purple p-7 md:p-10">
      <Transition enter-active-class="transition duration-500 ease-out-expo" enter-from-class="translate-y-3 opacity-0" mode="out-in">
        <div v-if="sent" key="sent" role="status" class="text-center">
          <span class="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-ink text-green"><UiIcon name="mail" :size="28" /></span>
          <p class="heading text-4xl">{{ t('login.sentTitle') }}</p>
          <p class="mx-auto mt-3 max-w-sm font-medium">{{ t('login.sentText', { email }) }}</p>
          <button type="button" class="btn btn-outline mt-6" @click="sent = false">{{ t('login.other') }}</button>
        </div>

        <form v-else key="form" class="space-y-5" @submit.prevent="send">
          <div>
            <label for="admin-email" class="field-label">{{ t('login.email') }}</label>
            <input id="admin-email" v-model="email" type="email" required autocomplete="email" class="field" placeholder="naam@avans.nl" />
          </div>
          <p v-if="failed" class="field-error" role="alert">{{ t('login.error') }}</p>
          <button type="submit" class="btn w-full" :disabled="sending || !email.trim()">
            <template v-if="sending"><span class="size-4 animate-spin rounded-full border-2 border-paper border-t-transparent" /> {{ t('login.sending') }}</template>
            <template v-else>{{ t('login.send') }} <UiIcon name="arrow" :size="18" class="arrow" /></template>
          </button>
        </form>
      </Transition>
    </div>
  </div>
</template>
