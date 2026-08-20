import crypto from 'node:crypto'

/**
 * @param {object} payload
 * @param {{ privateKey: crypto.KeyObject, keyId: string }} signingKey
 * @returns {string}
 */
export function signJwt(payload, { privateKey, keyId }) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: keyId })
  ).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signing = `${header}.${body}`
  const signature = crypto
    .createSign('sha256')
    .update(signing)
    .sign(privateKey, 'base64url')
  return `${signing}.${signature}`
}
