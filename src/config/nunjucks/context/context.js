import path from 'node:path'
import { readFileSync } from 'node:fs'
import { config } from '../../config.js'
import { logger } from '../../../server/common/helpers/logging/logger.js'

const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/.vite/manifest.json'
)

/**
 * @typedef {object} NunjucksContext
 * @property {string} assetPath
 * @property {string} serviceName
 * @property {string} serviceUrl
 * @property {unknown[]} breadcrumbs
 * @property {string} assetJs
 * @property {string} assetCss
 */

let viteManifest

/**
 * @returns {NunjucksContext}
 */
export function context() {
  if (!viteManifest) {
    try {
      viteManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(
        `Vite ${path.basename(manifestPath)} not found or corrupted`,
        error
      )
      viteManifest = null
    }
  }

  const entry = viteManifest
    ? Object.values(viteManifest).find((e) => e.isEntry)
    : null

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    breadcrumbs: [],
    assetJs: `${assetPath}/${entry?.file ?? 'javascripts/application.js'}`,
    assetCss: `${assetPath}/${entry?.css?.[0] ?? 'stylesheets/application.css'}`
  }
}
