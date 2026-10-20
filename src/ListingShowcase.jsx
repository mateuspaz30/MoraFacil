import { useEffect, useMemo, useRef, useState } from 'react'
import './ListingShowcase.css'
import { getListingPropertyType, getListingPurpose, getListingPurposeLabel } from './listingPresentation.js'

export const PORTAL_CITY = 'Ipuã-SP'

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

function LocationPinIcon({ className = '' }) {
  return (
    <svg className={`location-icon ${className}`.trim()} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6zm0 8.5A2.5 2.5 0 1 1 12 5.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
}

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

function ShowcasePropertyImage({ listing, purpose, purposeLabel, url }) {
  const images = [...new Set([
    ...(Array.isArray(listing.images) ? listing.images : []),
    listing.image,
  ].filter(Boolean))]
  const [imageIndex, setImageIndex] = useState(0)

  const changeImage = (event, direction) => {
    event.preventDefault()
    event.stopPropagation()
    setImageIndex((current) => (current + direction + images.length) % images.length)
  }

  return (
    <div className="showcase-property-image">
      <a className="showcase-property-image-link" href={url} aria-label={`Ver ${listing.title} em ${getListingLocation(listing)}`}>
        {images[imageIndex] && (
          <img
            src={images[imageIndex]}
            srcSet={getResponsiveImageSet(images[imageIndex])}
            sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 36px), (max-width: 1400px) calc(33vw - 30px), 430px"
            alt={`${listing.title}, foto ${imageIndex + 1}`}
            loading="lazy"
            decoding="async"
          />
        )}
        <span className={`showcase-type-badge purpose-badge purpose-${purpose}`} translate="no">{purposeLabel.toLocaleUpperCase('pt-BR')}</span>
      </a>
      {images.length > 1 && (
        <>
          <button type="button" className="showcase-gallery-arrow previous" aria-label="Foto anterior" onClick={(event) => changeImage(event, -1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6" /></svg>
          </button>
          <button type="button" className="showcase-gallery-arrow next" aria-label="Próxima foto" onClick={(event) => changeImage(event, 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        </>
      )}
    </div>
  )
}

export function ListingShowcase({ listings, city }) {
  const heading = city ? `Imóveis disponíveis em ${city}` : 'Imóveis disponíveis'

  return (
    <section className="property-showcase" aria-labelledby="property-showcase-title">
      <div className="property-showcase-heading">
        <h2 id="property-showcase-title">{heading}</h2>
      </div>
      <div className="property-showcase-grid" id="imoveis-disponiveis">
        {listings.map((listing) => {
          const slug = getListingSlug(listing)
          const url = `${import.meta.env.BASE_URL}imovel/${encodeURIComponent(slug)}/`
          const purpose = getListingPurpose(listing)
          const purposeLabel = getListingPurposeLabel(listing)
          const propertyType = getListingPropertyType(listing)
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
              <ShowcasePropertyImage listing={listing} purpose={purpose} purposeLabel={purposeLabel} url={url} />
              <a className="showcase-property-link" href={url} aria-label={`Ver ${listing.title} em ${getListingLocation(listing)}`}>
                <div className="showcase-property-body">
                  <h3>{listing.title}</h3>
                  <p className="showcase-property-location"><LocationPinIcon />{getListingLocation(listing)}</p>
                  <p className="showcase-property-type"><span aria-hidden="true">{propertyType.icon}</span> {propertyType.label}</p>
                  <strong className={`showcase-property-price purpose-price purpose-${purpose}`}>{formatPrice(listing.price, purpose)}</strong>
                  <div className="showcase-property-features" aria-label="Características do imóvel">
                    {features.map((feature, index) => (
                      <span key={index} className={feature ? '' : 'empty'} aria-hidden={!feature}>
                        {feature || <span className="showcase-feature-placeholder" />}
                      </span>
                    ))}
                    {propertyType.key === 'terreno' && listing.description?.toLowerCase().includes('pronto para construir') && (
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
  const [shareOpen, setShareOpen] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const touchStartX = useRef(null)
  const shareCloseButtonRef = useRef(null)
  const city = getCityLabel(listing.city)
  const neighborhood = listing.neighborhood || ''
  const streetLine = [listing.street, listing.number].filter(Boolean).join(', ')
  const fullAddress = streetLine || listing.address || getListingLocation(listing)
  const addressQuery = [fullAddress, neighborhood, city, listing.cep].filter(Boolean).join(', ')
  const galleryImages = useMemo(() => [...new Set([
    ...(Array.isArray(listing.images) ? listing.images : []),
    listing.image,
  ].filter(Boolean))], [listing.images, listing.image])
  const image = galleryImages[activeImageIndex] || ''
  const description = listing.description || 'Descrição não informada.'
  const purpose = getListingPurpose(listing)
  const purposeLabel = getListingPurposeLabel(listing)
  const price = formatPrice(listing.price, purpose)
  const propertyType = getListingPropertyType(listing)
  const propertyTypeLabel = propertyType.label
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
  const shareText = `Confira este imóvel no Mora Fácil:\n\n${listing.title}\n${url}`
  const contactMessage = `Olá! Tenho interesse no imóvel "${listing.title}" que encontrei no Mora Fácil.\n\nLink: ${url}`
  const emailShareUrl = `mailto:?subject=${encodeURIComponent('Confira este imóvel no Mora Fácil')}&body=${encodeURIComponent(`${listing.title}\n${url}`)}`
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(listing.title)}`

  const changeImage = (direction) => {
    setActiveImageIndex((current) => (current + direction + galleryImages.length) % galleryImages.length)
  }

  const copyListingUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const input = document.createElement('textarea')
        input.value = url
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.append(input)
        input.select()
        const copied = document.execCommand('copy')
        input.remove()
        if (!copied) throw new Error('O navegador não permitiu copiar o link.')
      }
      setShareFeedback('Link copiado com sucesso')
    } catch (error) {
      console.error('Falha ao copiar o link do imóvel:', error)
      setShareFeedback('Não foi possível copiar o link. Tente novamente.')
    }
  }

  useEffect(() => {
    if (!shareOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    shareCloseButtonRef.current?.focus()
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShareOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [shareOpen])

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
            <div className="listing-detail-address-line"><LocationPinIcon /><span>{fullAddress}{neighborhood ? ` - ${neighborhood}` : ''}, {city}</span>{listing.cep && <small>CEP {listing.cep}</small>}</div>
          </div>
          <a className="listing-back-link" href={`${import.meta.env.BASE_URL}#imoveis-disponiveis`}>← Voltar aos imóveis</a>
        </div>
      </header>
      <article className="listing-detail-layout">
        <div className="listing-detail-primary-column">
          <div className="listing-share-toolbar">
            <button type="button" className="listing-share-trigger" onClick={() => { setShareFeedback(''); setShareOpen(true) }}>
              <svg className="share-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 7L12 3L16 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10H5C3.9 10 3 10.9 3 12V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V12C21 10.9 20.1 10 19 10H17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg> Compartilhar imóvel
            </button>
          </div>
          <section className={`listing-detail-gallery${galleryImages.length < 2 ? ' single-image' : ''}`} aria-label={`Fotos de ${listing.title}`}>
            <div className="listing-detail-gallery-main" onTouchStart={handleGalleryTouchStart} onTouchEnd={handleGalleryTouchEnd}>
              {image ? <img src={image} srcSet={getResponsiveImageSet(image)} sizes="(max-width: 760px) 100vw, 72vw" alt={`${listing.title}, foto ${activeImageIndex + 1}`} fetchPriority="high" /> : <div className="listing-gallery-empty">Fotos não informadas</div>}
              <span className={`showcase-type-badge purpose-badge purpose-${purpose}`} translate="no">{purposeLabel.toLocaleUpperCase('pt-BR')}</span>
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

          <section className="listing-detail-description listing-detail-card">
            <h2><svg className="section-title-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 13h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>Sobre este imóvel</h2>
            <p>{description}</p>
          </section>

          <section className="listing-detail-address-card listing-detail-card">
            <div className="listing-detail-address-copy"><h2>Endereço</h2>
              <p className="address-street"><LocationPinIcon /> {fullAddress}</p>
              {neighborhood && <p>{neighborhood}</p>}
              <p>{city}</p>
              {listing.cep && <p>CEP {listing.cep}</p>}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`} target="_blank" rel="noreferrer">Abrir no Google Maps ↗</a>
            </div>
          </section>
        </div>

        <aside className="listing-detail-sidebar">
          <section className="listing-detail-price-card">
            <span className="listing-detail-eyebrow">Valor do imóvel</span>
            <strong className={`listing-detail-price purpose-price purpose-${purpose}`}>{price}</strong>
            {whatsappDigits ? <a className="listing-contact-button whatsapp" href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(contactMessage)}`} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.58 7.45L4 20l1.08-3.23A8.5 8.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 8.5c.5 2.3 2.2 4 4.5 4.5l1-1.2 2 .8c-.1 1.5-1.2 2.3-2.6 2.2-3.8-.4-6.3-2.9-6.7-6.7-.1-1.4.7-2.5 2.2-2.6l.8 2L9 8.5Z" fill="currentColor"/></svg>Conversar no WhatsApp</a> : <button type="button" className="listing-contact-button whatsapp" disabled>WhatsApp indisponível</button>}
            {phoneDigits ? <a className="listing-contact-button outline" href={`tel:${phoneDigits}`}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-7-7l3-2-2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>Entrar em contato</a> : <button type="button" className="listing-contact-button outline" disabled>Contato indisponível</button>}
          </section>

          <section className="listing-detail-advertiser-card">
            <h2>Anunciante</h2>
            <div className="listing-detail-advertiser"><span>{String(listing.advertiser || 'A').trim().charAt(0).toLocaleUpperCase('pt-BR')}</span><div><strong>{listing.advertiser || 'Anunciante'}</strong></div></div>
          </section>

          <section className="listing-detail-information-card listing-detail-card">
            <h2><svg className="section-title-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 13h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>Informações do imóvel</h2>
            <ul className="listing-detail-info-grid">
              <li><span aria-hidden="true">{purpose === 'aluguel' ? '🔑' : '🛒'}</span><div><strong>{purposeLabel}</strong><small>Finalidade</small></div></li>
              <li><span aria-hidden="true">{propertyType.icon}</span><div><strong>{propertyTypeLabel}</strong><small>Tipo do imóvel</small></div></li>
              <li><span aria-hidden="true">📐</span><div><strong>{area ? `${area} m²` : '—'}</strong><small>Área construída</small></div></li>
              <li><span aria-hidden="true">🛏</span><div><strong>{bedrooms} {bedrooms === 1 ? 'Quarto' : 'Quartos'}</strong><small>Dormitórios</small></div></li>
              <li><span aria-hidden="true">🚿</span><div><strong>{bathrooms} {bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</strong><small>Banheiros</small></div></li>
              <li><span aria-hidden="true">🚗</span><div><strong>{parking} {parking === 1 ? 'Vaga' : 'Vagas'}</strong><small>Garagem</small></div></li>
              <li className="info-wide"><span aria-hidden="true">▦</span><div><strong>{publishedDate}</strong><small>Publicado em</small></div></li>
            </ul>
          </section>
        </aside>
      </article>

      {shareOpen && (
        <div
          className="listing-share-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShareOpen(false)
          }}
        >
          <section className="listing-share-dialog" role="dialog" aria-modal="true" aria-labelledby="listing-share-title" aria-describedby="listing-share-description">
            <button ref={shareCloseButtonRef} type="button" className="listing-share-close" aria-label="Fechar compartilhamento" onClick={() => setShareOpen(false)}>×</button>
            <header className="listing-share-header">
              <h2 id="listing-share-title">Compartilhar imóvel</h2>
              <p id="listing-share-description">Compartilhe este imóvel com quem você quiser.</p>
            </header>
            <article className="listing-share-summary">
              {listing.image || galleryImages[0]
                ? <img src={listing.image || galleryImages[0]} alt={listing.title} />
                : <div className="listing-share-image-empty">Foto não disponível</div>}
              <div className="listing-share-summary-content">
                <span className={`listing-share-purpose purpose-${purpose}`}>{purposeLabel.toLocaleUpperCase('pt-BR')}</span>
                <h3>{listing.title}</h3>
                <p className="listing-share-location"><LocationPinIcon />{getListingLocation(listing)}</p>
                <strong className={`listing-share-price purpose-price purpose-${purpose}`}>{price}</strong>
                <div className="listing-share-features" aria-label="Características do imóvel">
                  <span><i aria-hidden="true">🛏</i>{bedrooms}</span>
                  <span><i aria-hidden="true">🚿</i>{bathrooms}</span>
                  <span><i aria-hidden="true">🚗</i>{parking}</span>
                  <span><i aria-hidden="true">📐</i>{area} m²</span>
                </div>
              </div>
            </article>
            <div className="listing-share-actions" aria-label="Opções de compartilhamento">
              <button type="button" className="listing-share-action copy" onClick={copyListingUrl}>
                <span className="listing-share-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.72M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.72-1.72" /></svg></span>
                <span><strong>{shareFeedback === 'Link copiado com sucesso' ? 'Link copiado!' : 'Copiar link'}</strong><small>{shareFeedback === 'Link copiado com sucesso' ? 'Pronto para compartilhar.' : 'Copie o link deste imóvel.'}</small></span>
              </button>
              <a className="listing-share-action whatsapp" href={whatsappShareUrl} target="_blank" rel="noreferrer">
                <span className="listing-share-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L4 20l1-3.7a8.5 8.5 0 1 1 15.5-4.6Z" /><path d="M9 8.5c.5 2.3 2.2 4 4.5 4.5l1-1.2 2 .8c-.1 1.5-1.2 2.3-2.6 2.2-3.8-.4-6.3-2.9-6.7-6.7-.1-1.4.7-2.5 2.2-2.6l.8 2L9 8.5Z" /></svg></span>
                <span><strong>WhatsApp</strong><small>Compartilhe pelo WhatsApp.</small></span>
              </a>
              <a className="listing-share-action facebook" href={facebookShareUrl} target="_blank" rel="noreferrer">
                <span className="listing-share-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 8h3V4.2c-.5-.1-1.7-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.5V12H5v4h3.5v8h4.2v-8h3.5l.6-4h-4.1V9.9c0-1.2.3-1.9 1.3-1.9Z" /></svg></span>
                <span><strong>Facebook</strong><small>Compartilhe no Facebook.</small></span>
              </a>
              <a className="listing-share-action telegram" href={telegramShareUrl} target="_blank" rel="noreferrer">
                <span className="listing-share-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m22 3-3.4 18-6.8-5.2-3.7 3.5.6-6.7L19 5.2 7.2 14l-5.4-1.8L22 3Z" /></svg></span>
                <span><strong>Telegram</strong><small>Compartilhe no Telegram.</small></span>
              </a>
              <a className="listing-share-action email" href={emailShareUrl}>
                <span className="listing-share-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg></span>
                <span><strong>E-mail</strong><small>Envie por e-mail.</small></span>
              </a>
            </div>
            <p className={`listing-share-feedback${shareFeedback && !shareFeedback.startsWith('Link copiado') ? ' error' : ''}`} role="status" aria-live="polite">{shareFeedback || 'Divulgue boas oportunidades! Ajude alguém a encontrar o imóvel ideal.'}</p>
          </section>
        </div>
      )}

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