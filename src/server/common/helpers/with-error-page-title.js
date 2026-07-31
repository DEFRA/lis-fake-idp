/**
 * @param {string} title
 * @param {Record<string, string>} [errors]
 * @returns {string}
 */
export const withErrorPageTitle = (title, errors = {}) =>
  `${Object.keys(errors).length > 0 ? 'Error: ' : ''}${title}`
