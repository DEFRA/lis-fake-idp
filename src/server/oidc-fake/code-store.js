const SECONDS_PER_MINUTE = 60
const MS_PER_SECOND = 1000
// Authorization codes are single-use and short-lived by design, no
// persistence needed across restarts.
const CODE_TTL_MINUTES = 10
const CODE_TTL_MS = CODE_TTL_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND

/**
 * In-memory authorization code store with TTL/single-use semantics.
 *
 * @returns {{ storeCode: Function, redeemCode: Function }}
 */
export function createCodeStore() {
  const pendingCodes = new Map()

  return {
    storeCode(code, data) {
      pendingCodes.set(code, { ...data, expiresAt: Date.now() + CODE_TTL_MS })
    },
    redeemCode(code) {
      const entry = pendingCodes.get(code)
      pendingCodes.delete(code)
      if (!entry || Date.now() > entry.expiresAt) {
        return null
      }
      return entry
    }
  }
}
