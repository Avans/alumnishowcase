import type { DirectiveBinding } from 'vue'

type RevealValue = number | { delay?: number; variant?: 'up' | 'scale' | 'left' } | undefined

function normalize(value: RevealValue) {
  if (typeof value === 'number') return { delay: value, variant: 'up' }
  return { delay: value?.delay ?? 0, variant: value?.variant ?? 'up' }
}

/**
 * `v-reveal` fades and lifts an element in once it scrolls into view.
 * The hidden state is rendered on the server so there is no flash on load.
 */
export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | undefined

  const getObserver = () =>
    (observer ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-in', '')
          observer?.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    ))

  nuxtApp.vueApp.directive('reveal', {
    created(el: HTMLElement, binding: DirectiveBinding<RevealValue>) {
      const { delay, variant } = normalize(binding.value)
      el.setAttribute('data-reveal', variant)
      el.style.setProperty('--d', `${delay}ms`)
    },
    mounted(el: HTMLElement) {
      getObserver().observe(el)
    },
    unmounted(el: HTMLElement) {
      observer?.unobserve(el)
    },
    getSSRProps(binding: DirectiveBinding<RevealValue>) {
      const { delay, variant } = normalize(binding.value)
      return { 'data-reveal': variant, style: { '--d': `${delay}ms` } }
    },
  })
})
