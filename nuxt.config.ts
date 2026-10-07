import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-07',
  devtools: { enabled: false },

  modules: ['@nuxtjs/supabase', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  experimental: { viewTransition: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en', class: 'no-js' },
      titleTemplate: '%s · Avans ICT Alumni Showcase',
      meta: [
        { name: 'theme-color', content: '#f7f6f3' },
        { name: 'description', content: 'Cases, products and ideas built by Avans ICT alumni. Get inspired, discover where alumni work, and add your own showcase.' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      script: [{ innerHTML: "document.documentElement.classList.replace('no-js','js')" }],
    },
  },

  fonts: {
    families: [
      { name: 'Hanken Grotesk', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Sofia Sans Extra Condensed', provider: 'google', weights: [800, 900] },
      { name: 'Sofia Sans Condensed', provider: 'google', weights: [700, 800] },
    ],
  },

  supabase: {
    types: '~/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/admin(/.*)?'],
      exclude: [],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  runtimeConfig: {
    public: {
      // Shown to visitors who want an intro to an alumnus that prefers email.
      adminContactEmail: 's.vandockum@avans.nl',
    },
  },
})
