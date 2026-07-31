import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const require = createRequire(import.meta.url)
const dirname = path.dirname(fileURLToPath(import.meta.url))
const govukFrontendPath = path.dirname(
  require.resolve('govuk-frontend/package.json')
)
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  build: {
    outDir: '.public',
    emptyOutDir: true,
    manifest: true,

    sourcemap: isProduction ? true : 'inline',
    rollupOptions: {
      input: {
        application: path.resolve(
          dirname,
          'src/client/javascripts/application.js'
        )
      },
      output: {
        entryFileNames: isProduction
          ? 'javascripts/[name].[hash].min.js'
          : 'javascripts/[name].js',
        chunkFileNames: isProduction
          ? 'javascripts/[name].[hash].min.js'
          : 'javascripts/[name].js',
        assetFileNames(info) {
          if (info.name?.endsWith('.css')) {
            return isProduction
              ? 'stylesheets/[name].[hash].min[extname]'
              : 'stylesheets/[name][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(info.name ?? '')) {
            return 'assets/fonts/[name][extname]'
          }
          return 'assets/images/[name][extname]'
        }
      }
    }
  },
  css: {
    lightningcss: {
      errorRecovery: true
    },
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(dirname, 'src/client/stylesheets')],
        quietDeps: true,
        sourceMapIncludeSources: true
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: path.join(govukFrontendPath, 'dist/govuk/assets/*'),
          dest: 'assets'
        }
      ]
    })
  ]
})
