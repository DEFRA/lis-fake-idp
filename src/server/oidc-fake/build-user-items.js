/**
 * @param {object} users fixture user map, keyed by email
 * @param {string} [selectedEmail]
 * @returns {Array<object>} GOV.UK radios items for the fixture user picker
 */
export function buildUserItems(users, selectedEmail) {
  return Object.keys(users).map((email, index) => ({
    value: email,
    text: `${users[email].name} (${email})`,
    hint: users[email].description
      ? { text: users[email].description }
      : undefined,
    checked: selectedEmail ? email === selectedEmail : index === 0
  }))
}
