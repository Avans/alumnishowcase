<script setup lang="ts">
type CardData = Pick<
  Showcase,
  'title' | 'summary' | 'image_url' | 'tags' | 'company' | 'alumni_name' | 'alumni_role' | 'featured'
> & { id?: string; slug?: string }

const props = defineProps<{ showcase: CardData; preview?: boolean }>()

const swatch = computed(() => swatchFor(companyKey(props.showcase.company)))
const byline = computed(() => [props.showcase.alumni_role, props.showcase.company].filter(Boolean).join(' · '))
const vtName = computed(() => (!props.preview && props.showcase.id ? transitionName(props.showcase.id) : undefined))
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden bg-white transition-[transform,box-shadow] duration-500 ease-out-expo corner-tr hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-24px_rgba(19,19,19,0.35)]"
    :style="{ '--accent': swatch.bg }"
  >
    <div class="corner-tr relative aspect-[4/3] overflow-hidden bg-sunken">
      <img
        :src="showcase.image_url"
        :alt="$t('card.cover', { title: showcase.title })"
        loading="lazy"
        decoding="async"
        class="size-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.07]"
        :style="vtName ? { viewTransitionName: vtName } : undefined"
      />
      <span v-if="showcase.featured" class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-yellow px-3 py-1 text-xs font-bold uppercase tracking-wide">
        <UiIcon name="star" :size="12" /> {{ $t('card.featured') }}
      </span>
      <span class="arrow-circle absolute bottom-3 right-3 !size-11 shadow-lg"><UiIcon name="arrow" :size="20" /></span>
    </div>

    <div class="flex flex-1 flex-col p-5 pb-6">
      <h3 class="heading text-[2rem] md:text-[2.15rem]">
        <NuxtLink
          v-if="!preview && showcase.slug"
          :to="`/showcase/${showcase.slug}`"
          class="after:absolute after:inset-0 after:z-10 after:content-['']"
        >
          {{ showcase.title }}
        </NuxtLink>
        <template v-else>{{ showcase.title }}</template>
      </h3>
      <p class="mt-3 line-clamp-3 text-[0.98rem] leading-relaxed text-ink-soft">{{ showcase.summary }}</p>

      <div class="mt-auto flex items-center gap-3 pt-6">
        <Avatar :name="showcase.alumni_name" :size="42" />
        <div class="min-w-0 leading-tight">
          <p class="truncate font-bold">{{ showcase.alumni_name }}</p>
          <p v-if="byline" class="truncate text-sm text-muted">{{ byline }}</p>
        </div>
      </div>

      <ul v-if="showcase.tags.length" class="mt-4 flex flex-wrap gap-2">
        <li v-for="t in showcase.tags" :key="t" class="pill">{{ t }}</li>
      </ul>
    </div>

    <span class="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-700 ease-out-expo group-hover:scale-x-100" aria-hidden="true" />
  </article>
</template>
