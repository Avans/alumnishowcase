<template>
  <div class="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto]">
    <a
      href="#main"
      class="sr-only z-[60] rounded-full bg-ink px-5 py-3 font-bold text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      {{ $t('nav.skip') }}
    </a>
    <AppHeader />
    <main id="main" class="min-w-0">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
