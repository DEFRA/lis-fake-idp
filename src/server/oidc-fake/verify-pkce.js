import crypto from 'node:crypto'

/**
 * @param {string} verifier
 * @param {string} challenge
 * @returns {boolean}
 */
export function verifyPkceS256(verifier, challenge) {
  const digest = crypto.createHash('sha256').update(verifier).digest()
  return Buffer.from(digest).toString('base64url') === challenge
}
