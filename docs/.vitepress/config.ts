import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vitek Plugin',
  description: 'File-based HTTP API generation for Vite',
  base: '/vitek-plugin/',
  head: [
    ['link', { rel: 'icon', type: 'image/webp', href: '/vitek-plugin/logo.webp' }],
  ],
  appearance: false,
  themeConfig: {
    logo: '/logo.webp',
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Comparison', link: '/comparison' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Development', link: '/development' },
      { text: 'Contributing', link: '/contributing' },
      { text: 'Support', link: '/support' },
      { text: 'GitHub', link: 'https://github.com/martinsbicudo/vitek-plugin' },
      { text: 'NPM', link: 'https://www.npmjs.com/package/vitek-plugin' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'File Structure', link: '/guide/file-structure' },
          { text: 'Routing', link: '/guide/routing' },
          { text: 'Middlewares', link: '/guide/middlewares' },
          { text: 'Response Handling', link: '/guide/response-handling' },
          { text: 'Error Handling', link: '/guide/error-handling' },
          { text: 'Request Validation', link: '/guide/request-validation' },
          { text: 'Type Generation', link: '/guide/type-generation' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Production server', link: '/guide/production-server' },
          { text: 'Deployment & integrations', link: '/guide/production-deploy' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Comparison', link: '/comparison' },
          { text: 'API Reference', link: '/api/' },
          { text: 'Examples', link: '/examples' },
        ],
      },
      {
        text: 'Project',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'How It Works', link: '/how-it-works' },
          { text: 'Development', link: '/development' },
          { text: 'Contributing', link: '/contributing' },
          { text: 'License', link: '/license' },
          { text: 'Support', link: '/support' },
        ],
      },
    ],
  },
})
