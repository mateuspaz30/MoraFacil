export const purposeColors = {
  venda: '#087cf0',
  aluguel: '#078c59',
}

export const INDIVIDUAL_LISTING_VALIDITY_DAYS = 30

const millisecondsPerDay = 24 * 60 * 60 * 1000

export const getIndividualListingDaysRemaining = (listing, now = Date.now()) => {
  const validityStartedAt = Date.parse(String(listing?.individual_validity_started_at || ''))
  if (!Number.isFinite(validityStartedAt)) return null

  const expiresAt = validityStartedAt + INDIVIDUAL_LISTING_VALIDITY_DAYS * millisecondsPerDay
  return Math.max(0, Math.ceil((expiresAt - now) / millisecondsPerDay))
}

export const isIndividualListingExpired = (listing, now = Date.now()) => (
  getIndividualListingDaysRemaining(listing, now) === 0
)

export const isListingPubliclyAvailable = (listing, now = Date.now()) => {
  const status = String(listing?.status || '').trim().toLocaleLowerCase('pt-BR')
  const isApproved = ['aprovado', 'disponível', 'disponivel', 'ativo'].includes(status)
  return isApproved && !isIndividualListingExpired(listing, now)
}

const propertyTypes = {
  casa: { label: 'Casa', icon: '🏠' },
  apartamento: { label: 'Apartamento', icon: '🏢' },
  chacara: { label: 'Chácara', icon: '🏡' },
  terreno: { label: 'Terreno', icon: '🌱' },
  ponto_comercial: { label: 'Ponto Comercial', icon: '🏬' },
}

export const getListingPurpose = (listing) => {
  const purpose = String(listing?.purpose || '').trim().toLocaleLowerCase('pt-BR')
  const type = String(listing?.type || '').trim().toLocaleLowerCase('pt-BR')
  if (purpose === 'venda' || purpose === 'aluguel') return purpose
  return type === 'aluguel' || /\/\s*m[eê]s\b/i.test(String(listing?.price || ''))
    ? 'aluguel'
    : 'venda'
}

export const getListingPurposeLabel = (listing) => getListingPurpose(listing) === 'aluguel' ? 'Aluguel' : 'Venda'

export const getListingImages = (listing) => [...new Set([
  ...(Array.isArray(listing?.images) ? listing.images : []),
  listing?.image,
].filter((image) => typeof image === 'string' && image.trim()))]

export const getListingPropertyType = (listing) => {
  const category = String(listing?.property_category || '').trim().toLocaleLowerCase('pt-BR')
  const legacyType = String(listing?.type || '').trim().toLocaleLowerCase('pt-BR')
  const key = propertyTypes[category] ? category : propertyTypes[legacyType] ? legacyType : 'casa'
  return { key, ...propertyTypes[key] }
}
