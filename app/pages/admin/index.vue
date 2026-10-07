<script setup lang="ts">
const { t, dateLocale } = useLocale()
useHead({ title: () => t('meta.adminTitle'), meta: [{ name: 'robots', content: 'noindex' }] })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { isAdmin, checked, check } = useIsAdmin()
const { push } = useToast()

const BUCKET = 'showcase-images'
const items = ref<AdminShowcase[]>([])
const loading = ref(true)
const tab = ref<ShowcaseStatus>('pending')
const confirmingDelete = ref<string | null>(null)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

const statuses: ShowcaseStatus[] = ['pending', 'approved', 'rejected']
const counts = computed(() => Object.fromEntries(statuses.map((s) => [s, items.value.filter((i) => i.status === s).length])) as Record<ShowcaseStatus, number>)
const visible = computed(() => items.value.filter((i) => i.status === tab.value))

async function load() {
  loading.value = true
  const { data, error } = await supabase
    .from('showcases')
    .select('*, showcase_contacts(email)')
    .order('created_at', { ascending: false })
  loading.value = false
  if (error) return push(t('admin.toast.loadFailed'), 'error')
  items.value = (data ?? []) as unknown as AdminShowcase[]
  if (!counts.value.pending && counts.value.approved) tab.value = 'approved'
}

onMounted(async () => {
  if (await check()) await load()
  else loading.value = false
})

async function update(item: AdminShowcase, patch: Partial<Pick<Showcase, 'status' | 'featured'>>, toast: string) {
  const previous = { status: item.status, featured: item.featured }
  Object.assign(item, patch)
  const { error } = await supabase.from('showcases').update(patch).eq('id', item.id)
  if (error) {
    Object.assign(item, previous)
    push(t('admin.toast.failed'), 'error')
  } else {
    push(t(`admin.toast.${toast}`, { company: item.company }), 'success')
  }
}

const setStatus = (item: AdminShowcase, status: ShowcaseStatus, toast: string) =>
  update(item, status === 'approved' ? { status } : { status, featured: false }, toast)

const toggleFeatured = (item: AdminShowcase) => update(item, { featured: !item.featured }, item.featured ? 'unfeatured' : 'featured')

async function remove(item: AdminShowcase) {
  if (confirmingDelete.value !== item.id) {
    confirmingDelete.value = item.id
    clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => (confirmingDelete.value = null), 4000)
    return
  }
  confirmingDelete.value = null
  if (item.image_path) await supabase.storage.from(BUCKET).remove([item.image_path])
  const { error } = await supabase.from('showcases').delete().eq('id', item.id)
  if (error) return push(t('admin.toast.failed'), 'error')
  items.value = items.value.filter((i) => i.id !== item.id)
  push(t('admin.toast.deleted'), 'success')
}

async function signOut() {
  await supabase.auth.signOut()
  isAdmin.value = false
  await navigateTo('/')
}

onBeforeUnmount(() => clearTimeout(confirmTimer))
</script>

<template>
  <div class="mx-auto max-w-[1400px] px-5 pb-8 pt-8 md:px-10 md:pt-14">
    <header class="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p class="eyebrow mb-3"><span class="size-2.5 rounded-full bg-red" /> {{ t('admin.eyebrow') }}</p>
        <h1 class="display text-[clamp(4.5rem,11vw,9rem)]">{{ t('admin.title') }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <p v-if="user?.email" class="text-sm font-semibold text-muted">{{ t('admin.signedIn', { email: user.email }) }}</p>
        <button type="button" class="btn btn-outline btn-sm" @click="signOut"><UiIcon name="logout" :size="16" /> {{ t('admin.signOut') }}</button>
      </div>
    </header>

    <section v-if="checked && !isAdmin" class="corner-tr mt-12 bg-pink p-8 md:p-12">
      <h2 class="heading text-4xl">{{ t('admin.notAdminTitle') }}</h2>
      <p class="mt-3 max-w-xl font-medium">{{ t('admin.notAdminText', { email: user?.email ?? '' }) }}</p>
    </section>

    <template v-else>
      <div class="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div class="inline-flex flex-wrap gap-2" role="tablist">
          <button
            v-for="s in statuses"
            :key="s"
            type="button"
            role="tab"
            :aria-selected="tab === s"
            class="inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2 font-bold transition-colors"
            :class="tab === s ? 'bg-ink text-paper' : 'hover:bg-sunken'"
            @click="tab = s"
          >
            {{ t(`admin.tabs.${s}`) }}
            <span class="grid min-w-6 place-items-center rounded-full px-1.5 text-sm tabular-nums" :class="tab === s ? 'bg-paper text-ink' : 'bg-sunken'">{{ counts[s] }}</span>
          </button>
        </div>
        <button type="button" class="btn btn-outline btn-sm" :disabled="loading" @click="load">{{ t('admin.refresh') }}</button>
      </div>

      <p v-if="loading" class="mt-12 font-semibold text-muted" role="status">{{ t('admin.loading') }}</p>
      <p v-else-if="!visible.length" class="corner-tr mt-10 bg-sunken p-12 text-center text-lg font-semibold">{{ t('admin.empty') }}</p>

      <TransitionGroup
        v-else
        tag="ul"
        class="mt-8 space-y-5"
        enter-active-class="transition duration-500 ease-out-expo"
        enter-from-class="translate-y-4 opacity-0"
        leave-active-class="transition duration-300 ease-out-expo"
        leave-to-class="scale-95 opacity-0"
        move-class="transition duration-500 ease-out-expo"
      >
        <li v-for="item in visible" :key="item.id" class="corner-tr grid gap-5 bg-white p-4 md:grid-cols-[13rem_1fr_auto] md:p-5">
          <img :src="item.image_url" :alt="t('card.cover', { title: item.title })" class="aspect-[4/3] w-full rounded-2xl object-cover" />

          <div class="min-w-0">
            <NuxtLink :to="`/showcase/${item.slug}`" class="heading block text-3xl transition-colors hover:text-red md:text-4xl">{{ item.title }}</NuxtLink>
            <p class="mt-2 line-clamp-2 text-ink-soft">{{ item.summary }}</p>
            <p class="mt-3 text-sm font-semibold">
              {{ item.alumni_name }}<template v-if="item.alumni_role"> · {{ item.alumni_role }}</template> · {{ item.company }}
            </p>
            <p class="text-sm text-muted">{{ t('admin.submitted', { date: formatDate(item.created_at, dateLocale) }) }}</p>

            <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span class="font-semibold">
                {{ t('admin.contactPreference') }}: {{ t(`contactMethod.${item.contact_method}`) }}
                <a v-if="item.contact_url" :href="item.contact_url" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-red">{{ hostname(item.contact_url) }}</a>
              </span>
              <PrivateEmail v-if="item.showcase_contacts?.email" :email="item.showcase_contacts.email" />
            </div>

            <ul v-if="item.links.length" class="mt-3 flex flex-wrap gap-2">
              <li v-for="l in item.links" :key="l.url">
                <a :href="l.url" target="_blank" rel="noopener noreferrer" class="pill hover:bg-ink hover:text-paper">{{ l.label }} <UiIcon name="arrow-up-right" :size="12" /></a>
              </li>
            </ul>
          </div>

          <div class="flex flex-wrap content-start gap-2 md:w-44 md:flex-col">
            <button v-if="item.status !== 'approved'" type="button" class="btn btn-green btn-sm" @click="setStatus(item, 'approved', 'approved')"><UiIcon name="check" :size="16" /> {{ t('admin.approve') }}</button>
            <button v-if="item.status === 'pending'" type="button" class="btn btn-outline btn-sm" @click="setStatus(item, 'rejected', 'rejected')"><UiIcon name="x" :size="16" /> {{ t('admin.reject') }}</button>
            <button v-if="item.status === 'approved'" type="button" class="btn btn-outline btn-sm" @click="setStatus(item, 'rejected', 'rejected')"><UiIcon name="x" :size="16" /> {{ t('admin.reject') }}</button>
            <button v-if="item.status === 'rejected'" type="button" class="btn btn-outline btn-sm" @click="setStatus(item, 'pending', 'restored')"><UiIcon name="undo" :size="16" /> {{ t('admin.restore') }}</button>
            <button v-if="item.status === 'approved'" type="button" class="btn btn-sm" :aria-pressed="item.featured" @click="toggleFeatured(item)"><UiIcon name="star" :size="16" /> {{ item.featured ? t('admin.unfeature') : t('admin.feature') }}</button>
            <button type="button" class="btn btn-outline btn-sm !border-red !text-red [--btn-hover-fg:var(--color-paper)] [--btn-hover:var(--color-red)]" @click="remove(item)">
              <UiIcon name="trash" :size="16" /> {{ confirmingDelete === item.id ? t('admin.deleteConfirm') : t('admin.delete') }}
            </button>
          </div>
        </li>
      </TransitionGroup>
    </template>
  </div>
</template>
