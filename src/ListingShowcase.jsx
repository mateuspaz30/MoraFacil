import { useEffect, useMemo, useRef, useState } from 'react'
import './ListingShowcase.css'

export const PORTAL_CITY = 'Ipuã-SP'

const typeLabels = {
  venda: 'Venda',
  aluguel: 'Aluguel',
  terreno: 'Terreno',
  ponto_comercial: 'Ponto Comercial',
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

export function ListingShowcase({ listings, city }) {
  const heading = city ? `Imóveis disponíveis em ${city}` : 'Imóveis disponíveis'

  return (
    <section className="property-showcase" aria-labelledby="property-showcase-title">
      <div className="property-showcase-heading">
        <h2 id="property-showcase-title">{heading}</h2>
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
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const touchStartX = useRef(null)
  const city = getCityLabel(listing.city)
  const neighborhood = listing.neighborhood || ''
  const streetLine = [listing.street, listing.number].filter(Boolean).join(', ')
  const fullAddress = streetLine || listing.address || getListingLocation(listing)
  const addressQuery = [fullAddress, neighborhood, city, listing.cep].filter(Boolean).join(', ')
  const price = formatPrice(listing.price, listing.type)
  const galleryImages = useMemo(() => [...new Set([
    ...(Array.isArray(listing.images) ? listing.images : []),
    listing.image,
  ].filter(Boolean))], [listing.images, listing.image])
  const image = galleryImages[activeImageIndex] || ''
  const description = listing.description || 'Descrição não informada.'
  const purpose = listing.purpose || (listing.type === 'aluguel' ? 'aluguel' : 'venda')
  const purposeLabel = purpose === 'aluguel' ? 'Aluguel' : 'Venda'
  const propertyType = listing.property_category || (['terreno', 'ponto_comercial'].includes(listing.type) ? listing.type : '')
  const propertyTypeLabel = typeLabels[propertyType] || 'Imóvel'
  const title = `${listing.title} em ${getCityLabel(listing.city)} | Mora Fácil`
  const url = window.location.href
  const bedrooms = Number(listing.bedrooms) || 0
  const bathrooms = Number(listing.bathrooms) || 0
  const parking = Number(listing.parking_spaces || listing.garages) || 0
  const area = Number.parseInt(listing.area, 10) || 0
  const phoneDigits = String(listing.phone || '').replace(/\D/g, '')
  const whatsappDigits = phoneDigits ? (phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`) : ''
  const publishedDate = listing.created_at && !Number.isNaN(new Date(listing.created_at).getTime())
    ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(listing.created_at))
    : 'Data não informada'
  const visibleThumbnails = galleryImages.slice(1, 4)

  const changeImage = (direction) => {
    setActiveImageIndex((current) => (current + direction + galleryImages.length) % galleryImages.length)
  }

  const handleGalleryTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleGalleryTouchEnd = (event) => {
    if (touchStartX.current === null || galleryImages.length < 2) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 45) changeImage(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

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
    ogImage.element.content = listing.image || galleryImages[0] || ''

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
  }, [description, galleryImages, listing.image, title, url])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description,
    image: galleryImages,
    url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: fullAddress,
      addressLocality: neighborhood || city,
      addressRegion: city,
      postalCode: listing.cep || undefined,
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
        <nav className="listing-detail-breadcrumb" aria-label="Navegação estrutural">
          <a href={import.meta.env.BASE_URL}>Início</a><span>›</span><a href={`${import.meta.env.BASE_URL}#imoveis-disponiveis`}>Imóveis</a><span>›</span><span aria-current="page">{listing.title}</span>
        </nav>
        <div className="listing-detail-titlebar">
          <div>
            <h1>{listing.title}</h1>
            <div className="listing-detail-address-line"><span aria-hidden="true">⌖</span><span>{fullAddress}{neighborhood ? ` - ${neighborhood}` : ''}, {city}</span>{listing.cep && <small>CEP {listing.cep}</small>}</div>
          </div>
          <a className="listing-back-link" href={`${import.meta.env.BASE_URL}#imoveis-disponiveis`}>← Voltar aos imóveis</a>
        </div>
      </header>
      <article className="listing-detail-layout">
        <section className={`listing-detail-gallery${galleryImages.length < 2 ? ' single-image' : ''}`} aria-label={`Fotos de ${listing.title}`}>
          <div className="listing-detail-gallery-main" onTouchStart={handleGalleryTouchStart} onTouchEnd={handleGalleryTouchEnd}>
            {image ? <img src={image} srcSet={getResponsiveImageSet(image)} sizes="(max-width: 760px) 100vw, 72vw" alt={`${listing.title}, foto ${activeImageIndex + 1}`} fetchPriority="high" /> : <div className="listing-gallery-empty">Fotos não informadas</div>}
            <span className={`showcase-type-badge type-${purpose}`} translate="no">{purposeLabel}</span>
            {galleryImages.length > 1 && <>
              <button type="button" className="listing-gallery-arrow previous" aria-label="Foto anterior" onClick={() => changeImage(-1)}>‹</button>
              <button type="button" className="listing-gallery-arrow next" aria-label="Próxima foto" onClick={() => changeImage(1)}>›</button>
            </>}
            <span className="listing-gallery-count"><span aria-hidden="true">▣</span> {galleryImages.length ? activeImageIndex + 1 : 0}/{galleryImages.length}</span>
          </div>
          {galleryImages.length > 1 && <div className="listing-detail-thumbnails">
            {visibleThumbnails.map((photo, index) => {
              const photoIndex = index + 1
              const isLast = index === visibleThumbnails.length - 1
              const remaining = Math.max(galleryImages.length - 4, 0)
              return (
                <button type="button" className="listing-detail-thumbnail" key={`${photo}-${photoIndex}`} onClick={() => isLast && galleryImages.length > 4 ? setGalleryOpen(true) : setActiveImageIndex(photoIndex)} aria-label={isLast ? 'Ver todas as fotos' : `Ver foto ${photoIndex + 1}`}>
                  <img src={photo} alt={`Foto ${photoIndex + 1} de ${listing.title}`} />
                  {isLast && <span className="listing-thumbnail-overlay">{remaining > 0 && <strong>+{remaining}</strong>}<small>Ver todas as fotos</small></span>}
                </button>
              )
            })}
          </div>}
        </section>

        <aside className="listing-detail-price-card">
          <span className="listing-detail-eyebrow">Valor do imóvel</span>
          <strong className="listing-detail-price">{price}</strong>
          {whatsappDigits ? <a className="listing-contact-button whatsapp" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.58 7.45L4 20l1.08-3.23A8.5 8.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 8.5c.5 2.3 2.2 4 4.5 4.5l1-1.2 2 .8c-.1 1.5-1.2 2.3-2.6 2.2-3.8-.4-6.3-2.9-6.7-6.7-.1-1.4.7-2.5 2.2-2.6l.8 2L9 8.5Z" fill="currentColor"/></svg>Conversar no WhatsApp</a> : <button type="button" className="listing-contact-button whatsapp" disabled>WhatsApp indisponível</button>}
          {phoneDigits ? <a className="listing-contact-button outline" href={`tel:${phoneDigits}`}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-7-7l3-2-2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>Entrar em contato</a> : <button type="button" className="listing-contact-button outline" disabled>Contato indisponível</button>}
        </aside>

        <aside className="listing-detail-advertiser-card">
          <h2>Anunciante</h2>
          <div className="listing-detail-advertiser"><span>{String(listing.advertiser || 'M').trim().charAt(0).toLocaleUpperCase('pt-BR')}</span><div><strong>{listing.advertiser || 'Anunciante particular'}</strong><small>♢ Anunciante particular</small></div></div>
        </aside>

        <section className="listing-detail-highlights" aria-label="Características do imóvel">
          <div><span aria-hidden="true">🛏</span><strong>{bedrooms}</strong><small>{bedrooms === 1 ? 'Quarto' : 'Quartos'}</small></div>
          <div><span aria-hidden="true">🚿</span><strong>{bathrooms}</strong><small>{bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</small></div>
          <div><span aria-hidden="true">🚗</span><strong>{parking}</strong><small>{parking === 1 ? 'Vaga' : 'Vagas'}</small></div>
          <div><span aria-hidden="true">📐</span><strong>{area ? `${area} m²` : '—'}</strong><small>Área construída</small></div>
        </section>

        <section className="listing-detail-description listing-detail-card">
          <h2><span aria-hidden="true">▤</span>Sobre este imóvel</h2>
          <p>{description}</p>
        </section>

        <section className="listing-detail-address-card listing-detail-card">
          <div className="listing-detail-address-copy"><h2><span aria-hidden="true">⌖</span>Endereço</h2>
            <p>{fullAddress}</p>
            {neighborhood && <p>{neighborhood}</p>}
            <p>{city}</p>
            {listing.cep && <p>CEP: {listing.cep}</p>}
          </div>
          <div className="listing-detail-map">
            <iframe title={`Mapa do endereço de ${listing.title}`} src={`https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`} target="_blank" rel="noreferrer">Ver no Google Maps ↗</a>
          </div>
        </section>

        <aside className="listing-detail-information-card listing-detail-card">
          <h2><span aria-hidden="true">▤</span>Informações do imóvel</h2>
          <dl>
            <div><dt><span aria-hidden="true">↗</span>Finalidade</dt><dd>{purposeLabel}</dd></div>
            <div><dt><span aria-hidden="true">⌂</span>Tipo do imóvel</dt><dd>{propertyTypeLabel}</dd></div>
            <div><dt><span aria-hidden="true">📐</span>Área construída</dt><dd>{area ? `${area} m²` : '—'}</dd></div>
            <div><dt><span aria-hidden="true">🛏</span>Quartos</dt><dd>{bedrooms}</dd></div>
            <div><dt><span aria-hidden="true">🚿</span>Banheiros</dt><dd>{bathrooms}</dd></div>
            <div><dt><span aria-hidden="true">🚗</span>Vagas</dt><dd>{parking}</dd></div>
          </dl>
        </aside>

        <aside className="listing-detail-published-card listing-detail-card">
          <span aria-hidden="true">▦</span><div><strong>Publicado em</strong><small>{publishedDate}</small></div>
        </aside>
      </article>

      {galleryOpen && <div className="listing-gallery-lightbox" role="dialog" aria-modal="true" aria-label="Galeria de fotos" onClick={(event) => { if (event.target === event.currentTarget) setGalleryOpen(false) }}>
        <button type="button" className="listing-gallery-lightbox-close" aria-label="Fechar galeria" onClick={() => setGalleryOpen(false)}>×</button>
        <button type="button" className="listing-gallery-arrow previous" aria-label="Foto anterior" onClick={() => changeImage(-1)}>‹</button>
        <img src={image} alt={`${listing.title}, foto ${activeImageIndex + 1} de ${galleryImages.length}`} />
        <button type="button" className="listing-gallery-arrow next" aria-label="Próxima foto" onClick={() => changeImage(1)}>›</button>
        <span>{activeImageIndex + 1} / {galleryImages.length}</span>
      </div>}
    </main>
  )
}