export const CLIENT_SERVICE_OPTIONS = [
  'Creative Packaging Workshop',
  'Dowry Wrapping Training',
  'Gift Wrapping Services',
  'Premium Gift Box Curation',
  'Custom Gift Box Production',
  'Branded Event Essentials',
  'Souvenirs and Corporate Gifts',
  'Packaging and Presentation Design',
  'Printing Services',
  'Branding Solutions',
  'Event and Ceremony Styling',
  'Creative Consulting',
] as const

const CLIENT_SERVICE_SET = new Set(CLIENT_SERVICE_OPTIONS)

export const normalizeClientServices = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized = value
    .map((service) => (typeof service === 'string' ? service.trim() : ''))
    .filter((service) => service.length > 0)

  return Array.from(new Set(normalized))
}

export const areValidClientServices = (services: string[]) => {
  return services.every((service) => CLIENT_SERVICE_SET.has(service as (typeof CLIENT_SERVICE_OPTIONS)[number]))
}
