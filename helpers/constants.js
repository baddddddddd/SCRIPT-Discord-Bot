export const EXECUTIVE_IDS = [
  "1006563738851221631"
]

export function isExecutive(discordId) {
  return EXECUTIVE_IDS.includes(discordId)
}