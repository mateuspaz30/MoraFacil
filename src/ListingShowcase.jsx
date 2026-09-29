import { useEffect } from 'react'
import logo from './assets/logo.png'
import './ListingShowcase.css'

export const PORTAL_CITY = 'Ipuã-SP'

const typeLabels = {
  venda: 'Venda',
  aluguel: 'Aluguel',
  terreno: 'Terreno',
}

const slugify = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const getCityLabel = (city) => {
  const value = String(city || PORTAL_CITY).trim()
  if (slugify(value) === 'ipua') return PORTAL_CITY
  return /-sp$/i.test(value) ? value : `${value}-SP`
}

export const isPortalCityListing = (listing) => ['ipua', 'ipua-sp'].includes(slugify(listing.city || PORTAL_CITY))

export const getListingSlug = (listing) => slugify([
  listing.title,
  listing.neighborhood,
  getCityLabel(listing.city),
].filter(Boolean).join('-'))

export const getListingLocation = (listing) => {
  const city = getCityLabel(listing.city)
  const cityName = city.replace(/-SP$/i, '')
  const neighborhood = listing.neighborhood || String(listing.location || '')
    .split(',')[0]
    .trim()
    .replace(new RegExp(`\\s+(?:de\\s+)?${cityName}(?:-SP)?$`, 'i'), '')
    .trim()
  return `${neighborhood || 'Ipuã'}, ${city}`
}

const getTypeLabel = (type) => typeLabels[String(type || '').trim().toLowerCase()] || 'Imóvel'
const formatArea = (area) => `${Number.parseInt(area, 10) || 0} m²`

const formatPrice = (price, type) => {
  const numericPrice = Number(String(price || '').replace(/\D/g, '')) || 0
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(numericPrice)
  return type === 'aluguel' ? `${formattedPrice}/mês` : formattedPrice
}

const getResponsiveImageSet = (source) => {
  try {
    const sourceUrl = new URL(source)
    if (!sourceUrl.hostname.endsWith('images.unsplash.com')) return undefined

    return [480, 720, 960].map((width) => {
      const imageUrl = new URL(sourceUrl)
      imageUrl.searchParams.set('w', String(width))
      imageUrl.searchParams.set('q', '80')
      imageUrl.searchParams.set('auto', 'format')
      return `${imageUrl.href} ${width}w`
    }).join(', ')
  } catch {
    return undefined
  }
}

export const getListingSlugFromPath = () => {
  const basePath = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  const relativePath = window.location.pathname.startsWith(basePath)
    ? window.location.pathname.slice(basePath.length)
    : window.location.pathname.replace(/^\/+/, '')
  const [route, slug] = relativePath.split('/')
  return route === 'imovel' ? decodeURIComponent(slug || '') : ''
}

export function ListingShowcase({ listings }) {
  return (
    <section className="property-showcase" aria-labelledby="property-showcase-title">
      <div className="property-showcase-heading">
        <h2 id="property-showcase-title">Imóveis disponíveis em {PORTAL_CITY}</h2>
        <a href="#imoveis-disponiveis">Ver todos os imóveis <span aria-hidden="true">→</span></a>
      </div>
      <div className="property-showcase-grid" id="imoveis-disponiveis">
        {listings.map((listing) => {
          const image = listing.image || ''
          const slug = getListingSlug(listing)
          const url = `${import.meta.env.BASE_URL}imovel/${encodeURIComponent(slug)}/`
          const bedrooms = Number(listing.bedrooms) || 0
          const bathrooms = Number(listing.bathrooms) || 0
          const parking = Number(listing.parking_spaces || listing.garages) || 0
          const features = [
            bedrooms > 0 ? `🛏 ${bedrooms} ${bedrooms === 1 ? 'Quarto' : 'Quartos'}` : null,
            bathrooms > 0 ? `🚿 ${bathrooms} ${bathrooms === 1 ? 'Banheiro' : 'Banheiros'}` : null,
            parking > 0 ? `🚗 ${parking} ${parking === 1 ? 'Vaga' : 'Vagas'}` : null,
            `📐 ${formatArea(listing.area)}`,
          ]

          return (
            <article className="showcase-property-card" key={listing.id}>
              <a className="showcase-property-link" href={url} aria-label={`Ver ${listing.title} em ${getListingLocation(listing)}`}>
                <div className={`showcase-property-image type-${listing.type}`}>
                  {image && (
                    <img
                      src={image}
                      srcSet={getResponsiveImageSet(image)}
                      sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 36px), (max-width: 1400px) calc(33vw - 30px), 430px"
                      alt={`${listing.title} em ${getListingLocation(listing)}`}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <span className={`showcase-type-badge type-${listing.type}`} translate="no">{getTypeLabel(listing.type)}</span>
                </div>
                <div className="showcase-property-body">
                  <h3>{listing.title}</h3>
                  <p className="showcase-property-location">⌖ {getListingLocation(listing)}</p>
                  <strong className="showcase-property-price">{formatPrice(listing.price, listing.type)}</strong>
                  <div className="showcase-property-features" aria-label="Características do imóvel">
                    {features.map((feature, index) => (
                      <span key={index} className={feature ? '' : 'empty'} aria-hidden={!feature}>
                        {feature || <span className="showcase-feature-placeholder" />}
                      </span>
                    ))}
                    {listing.type === 'terreno' && listing.description?.toLowerCase().includes('pronto para construir') && (
                      <span className="showcase-land-note">✅ Pronto para construir</span>
                    )}
                  </div>
                </div>
              </a>
              <a className="showcase-property-cta" href={url}>Saiba mais <span aria-hidden="true">→</span></a>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function ListingDetailPage({ listing }) {
  const location = getListingLocation(listing)
  const price = formatPrice(listing.price, listing.type)
  const image = listing.image || ''
  const description = listing.description || `${listing.title} em ${location}. Consulte as características e entre em contato com o anunciante.`
  const title = `${listing.title} em ${getCityLabel(listing.city)} | Mora Fácil`
  const url = window.location.href
  const bedrooms = Number(listing.bedrooms) || 0
  const bathrooms = Number(listing.bathrooms) || 0
  const parking = Number(listing.parking_spaces || listing.garages) || 0

  useEffect(() => {
    const previousTitle = document.title
    const ensureMeta = (selector, createMeta) => {
      let element = document.head.querySelector(selector)
      const existed = Boolean(element)
      if (!element) {
        element = createMeta()
        document.head.append(element)
      }
      return { element, existed, previous: element.content || element.href || '' }
    }
    const descriptionMeta = ensureMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'description'
      return meta
    })
    const canonicalLink = ensureMeta('link[rel="canonical"]', () => {
      const link = document.createElement('link')
      link.rel = 'canonical'
      return link
    })
    const ogTitle = ensureMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      return meta
    })
    const ogDescription = ensureMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      return meta
    })
    const ogImage = ensureMeta('meta[property="og:image"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:image')
      return meta
    })

    document.title = title
    descriptionMeta.element.content = description
    canonicalLink.element.href = url
    ogTitle.element.content = title
    ogDescription.element.content = description
    ogImage.element.content = image

    return () => {
      document.title = previousTitle
      for (const meta of [descriptionMeta, canonicalLink, ogTitle, ogDescription, ogImage]) {
        if (meta.existed) {
          if ('content' in meta.element) meta.element.content = meta.previous
          else meta.element.href = meta.previous
        } else {
          meta.element.remove()
        }
      }
    }
  }, [description, image, title, url])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description,
    image,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.neighborhood || location,
      addressRegion: getCityLabel(listing.city),
      addressCountry: 'BR',
    },
    offers: {
      '@type': 'Offer',
      price: Number(String(listing.price || '').replace(/\D/g, '')) || 0,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <main className="listing-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="listing-detail-header">
        <a className="listing-detail-brand" href={import.meta.env.BASE_URL}>
          <img src={logo} alt="" />
          <strong>Mora <span>Fácil</span></strong>
        </a>
        <a className="listing-back-link" href={import.meta.env.BASE_URL}>← Voltar aos imóveis</a>
      </header>
      <article className="listing-detail-content">
        {image && (
          <div className="listing-detail-image-wrap">
            <img
              src={image}
              srcSet={getResponsiveImageSet(image)}
              sizes="(max-width: 760px) calc(100vw - 32px), 1120px"
              alt={`${listing.title} em ${location}`}
              fetchPriority="high"
            />
            <span className={`showcase-type-badge type-${listing.type}`} translate="no">{getTypeLabel(listing.type)}</span>
          </div>
        )}
        <div className="listing-detail-information">
          <div className="listing-detail-primary">
            <p className="listing-detail-location">⌖ {location}</p>
            <h1>{listing.title}</h1>
            <strong className="listing-detail-price">{price}</strong>
            <div className="listing-detail-facts">
              {bedrooms > 0 && <span>🛏 {bedrooms} {bedrooms === 1 ? 'quarto' : 'quartos'}</span>}
              {bathrooms > 0 && <span>🚿 {bathrooms} {bathrooms === 1 ? 'banheiro' : 'banheiros'}</span>}
              {parking > 0 && <span>🚗 {parking} {parking === 1 ? 'vaga' : 'vagas'}</span>}
              <span>📐 {formatArea(listing.area)}</span>
            </div>
            <section className="listing-detail-description">
              <h2>Sobre este imóvel</h2>
              <p>{description}</p>
            </section>
          </div>
          <aside className="listing-contact-panel">
            <span className="listing-contact-label">Valor do imóvel</span>
            <strong>{price}</strong>
            <p>{listing.advertiser || 'Anunciante Mora Fácil'}</p>
            {listing.phone ? (
              <a className="listing-contact-button" href={`tel:${listing.phone.replace(/\D/g, '')}`}>Entrar em contato</a>
            ) : (
              <button type="button" className="listing-contact-button" disabled>Contato indisponível</button>
            )}
          </aside>
        </div>
      </article>
    </main>
  )
}
EOF