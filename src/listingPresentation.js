export const purposeColors = {
  venda: '#087cf0',
  aluguel: '#078c59',
}

const propertyTypes = {
  casa: { label: 'Casa', icon: '🏠' },
  apartamento: { label: 'Apartamento', icon: '🏢' },
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

export const getListingPropertyType = (listing) => {
  const category = String(listing?.property_category || '').trim().toLocaleLowerCase('pt-BR')
  const legacyType = String(listing?.type || '').trim().toLocaleLowerCase('pt-BR')
  const key = propertyTypes[category] ? category : propertyTypes[legacyType] ? legacyType : 'casa'
  return { key, ...propertyTypes[key] }
}
