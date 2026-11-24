import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bath, BedDouble, Building2, CalendarDays, Camera, Car, Heart, House, KeyRound, LandPlot, MapPin, Ruler, Store, Tag } from 'lucide-react'
import './ListingShowcase.css'
import { getListingImages, getListingPropertyType, getListingPurpose, getListingPurposeLabel } from './listingPresentation.js'
import ListingImagePlaceholder from './ListingImagePlaceholder.jsx'
import ListingPhotoCount from './ListingPhotoCount.jsx'
import useSwipeNavigation from './useSwipeNavigation.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'
import logo from './assets/logo.png'

export const PORTAL_CITY = 'Ipuã-SP'

const propertyTypeIcons = {
  casa: House,
  apartamento: Building2,
  chacara: House,
  terreno: LandPlot,
  ponto_comercial: Store,
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

export const getListingDetailUrl = (listing, companyOrigin = null) => {
  const search = new URLSearchParams({ id: String(listing.id) })
  if (companyOrigin?.slug) {
    search.set('origem', 'imobiliaria')
    search.set('slug', companyOrigin.slug)
    if (companyOrigin.name) search.set('nome', companyOrigin.name)
    if (companyOrigin.editing) search.set('edit', '1')
    if (companyOrigin.preview) search.set('preview', '1')
    if (companyOrigin.tab && companyOrigin.tab !== 'showcase') search.set('aba', companyOrigin.tab)
  }
  return `${import.meta.env.BASE_URL}imovel/${encodeURIComponent(getListingSlug(listing))}/?${search.toString()}`
}

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

export function SiteFooter() {
  return (
    <footer className="site-footer brand-curve-surface brand-curve-top">
      <div className="site-footer-container">
        <div className="site-footer-content">
          <div className="site-footer-brand">
            <img src={logo} alt="Logo Mora Fácil" />
            <span>Mora <strong>Fácil</strong></span>
          </div>
          <p className="site-footer-tagline">Seu próximo imóvel está aqui.</p>
          <div className="site-footer-contacts">
            <a href="mailto:morafacil@gmail.com">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              morafacil@gmail.com
            </a>
            <span className="site-footer-divider" aria-hidden="true" />
            <a href="tel:+5516996635535">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 16.5v3a1.5 1.5 0 0 1-1.65 1.5A18.9 18.9 0 0 1 11.1 18a18.6 18.6 0 0 1-5.7-5.7 18.9 18.9 0 0 1-3-8.3A1.5 1.5 0 0 1 3.9 2.3h3a1.5 1.5 0 0 1 1.5 1.3c.1 1 .4 2 .7 2.9a1.5 1.5 0 0 1-.3 1.6L7.5 9.4a15 15 0 0 0 5.7 5.7l1.3-1.3a1.5 1.5 0 0 1 1.6-.3c.9.3 1.9.6 2.9.7a1.5 1.5 0 0 1 1.3 1.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              (16) 99663-5535
            </a>
          </div>
        </div>
        <div className="site-footer-copyright">© 2026 Mora Fácil. Todos os direitos reservados.</div>
      </div>
    </footer>
  )
}

function LocationPinIcon({ className = '' }) {
  return (
    <svg className={`location-icon ${className}`.trim()} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6zm0 8.5A2.5 2.5 0 1 1 12 5.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
}

const formatArea = (area) => `${Number.parseInt(area, 10) || 0} m²`

const formatPublishedDate = (date) => {
  if (!date || Number.isNaN(new Date(date).getTime())) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function FavoriteButton({ listing, isFavorite = false, isBusy = false, onToggle }) {
  return (
    <button
      type="button"
      className={`favorite-toggle${isFavorite ? ' active' : ''}`}
      aria-label={isFavorite ? `Remover ${listing.title} dos favoritos` : `Adicionar ${listing.title} aos favoritos`}
      aria-pressed={isFavorite}
      disabled={isBusy}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle?.(listing)
      }}
    >
      <Heart size={22} strokeWidth={2.2} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

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

const openTrackedContact = async (event, onTrack) => {
  event.preventDefault()
  const { href, target } = event.currentTarget
  const newWindow = target === '_blank' ? window.open('about:blank', '_blank') : null

  try {
    await onTrack?.()
  } finally {
    if (target === '_blank' && newWindow) {
      newWindow.opener = null
      newWindow.location.href = href
    } else {
      window.location.href = href
    }
  }
}

function ShowcasePropertyImage({ listing, purpose, purposeLabel, url, isFavorite, isBusy, onToggleFavorite }) {
  const images = getListingImages(listing)
  const [imageIndex, setImageIndex] = useState(0)
  const suppressClickRef = useRef(false)

  const changeImage = (event, direction) => {
    event.preventDefault()
    event.stopPropagation()
    if (images.length < 2) return
    setImageIndex((current) => (current + direction + images.length) % images.length)
  }
  const swipe = useSwipeNavigation((direction) => {
    if (images.length < 2) return
    setImageIndex((current) => (current + direction + images.length) % images.length)
  })
  const handleTouchEnd = (event) => {
    if (swipe.onTouchEnd(event)) {
      suppressClickRef.current = true
      event.preventDefault()
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 500)
    }
  }
  const handleClickCapture = (event) => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      className="showcase-property-image account-card-image-wrap"
      onTouchStart={(event) => {
        suppressClickRef.current = false
        swipe.onTouchStart(event)
      }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={swipe.onTouchCancel}
      onClickCapture={handleClickCapture}
    >
      <a className="showcase-property-image-link" href={url} aria-label={`Ver ${listing.title} em ${getListingLocation(listing)}`}>
        {images[imageIndex] ? (
          <img
            src={images[imageIndex]}
            srcSet={getResponsiveImageSet(images[imageIndex])}
            sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 36px), (max-width: 1400px) calc(33vw - 30px), 430px"
            alt={`${listing.title}, foto ${imageIndex + 1}`}
            className="account-card-image"
            loading="lazy"
            decoding="async"
          />
        ) : <ListingImagePlaceholder />}
        <span className={`showcase-type-badge account-status-badge purpose-badge purpose-${purpose}`} translate="no">{purposeLabel.toLocaleUpperCase('pt-BR')}</span>
        <ListingPhotoCount listing={listing} />
      </a>
      <FavoriteButton listing={listing} isFavorite={isFavorite} isBusy={isBusy} onToggle={onToggleFavorite} />
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

export function ListingShowcase({
  listings,
  city,
  companyOrigin,
  heading: customHeading,
  headingId = 'property-showcase-title',
  showHeading = true,
  emptyMessage,
  favoriteListingIds = [],
  favoriteActionId = null,
  favoriteMessage = '',
  onToggleFavorite,
}) {
  const heading = customHeading || (city ? `Imóveis disponíveis em ${city}` : 'Imóveis disponíveis')

  return (
    <section
      className="property-showcase"
      aria-labelledby={showHeading ? headingId : undefined}
      aria-label={showHeading ? undefined : heading}
    >
      {showHeading && <div className="property-showcase-heading">
        <h2 id={headingId}>{heading}</h2>
      </div>}
      {favoriteMessage && <p className="favorite-feedback" role="alert">{favoriteMessage}</p>}
      {listings.length === 0
        ? emptyMessage && <p className="favorite-empty">{emptyMessage}</p>
        : <div className="property-showcase-grid" id="imoveis-disponiveis">
        {listings.map((listing) => {
          const url = getListingDetailUrl(listing, companyOrigin)
          const purpose = getListingPurpose(listing)
          const purposeLabel = getListingPurposeLabel(listing)
          const propertyType = getListingPropertyType(listing)
          const createdAt = formatPublishedDate(listing.created_at)
          const isFavorite = favoriteListingIds.some((id) => String(id) === String(listing.id))
          const bedrooms = Number(listing.bedrooms) || 0
          const bathrooms = Number(listing.bathrooms) || 0
          const parking = Number(listing.parking_spaces || listing.garages) || 0
          const logListingOpen = () => {
            console.log('Card:', listing.id, listing.title)
            console.log('Abrindo:', listing.id)
          }

          return (
            <article className="showcase-property-card account-dashboard-card standard-listing-card" key={listing.id}>
              <ShowcasePropertyImage
                listing={listing}
                purpose={purpose}
                purposeLabel={purposeLabel}
                url={url}
                isFavorite={isFavorite}
                isBusy={favoriteActionId !== null}
                onToggleFavorite={onToggleFavorite}
              />
              <a className="showcase-property-link" href={url} aria-label={`Ver ${listing.title} em ${getListingLocation(listing)}`}>
                <div className="showcase-property-body standard-listing-card-body">
                  <h3>{listing.title}</h3>
                  <p className="showcase-property-location standard-listing-location"><MapPin size={16} strokeWidth={2.2} aria-hidden="true" />{getListingLocation(listing)}</p>
                  <strong className={`showcase-property-price account-card-price purpose-price purpose-${purpose}`}>{formatPrice(listing.price, purpose)}</strong>
                  <div className="showcase-property-features standard-listing-features" aria-label="Características do imóvel">
                    {bedrooms > 0 && <span><BedDouble size={17} strokeWidth={2} aria-hidden="true" />{bedrooms} {bedrooms === 1 ? 'quarto' : 'quartos'}</span>}
                    {bathrooms > 0 && <span><Bath size={17} strokeWidth={2} aria-hidden="true" />{bathrooms} {bathrooms === 1 ? 'banheiro' : 'banheiros'}</span>}
                    {parking > 0 && <span><Car size={17} strokeWidth={2} aria-hidden="true" />{parking} {parking === 1 ? 'vaga' : 'vagas'}</span>}
                    <span><Ruler size={17} strokeWidth={2} aria-hidden="true" />{formatArea(listing.area)}</span>
                    {propertyType.key === 'terreno' && listing.description?.toLowerCase().includes('pronto para construir') && (
                      <span className="showcase-land-note">✅ Pronto para construir</span>
                    )}
                  </div>
                  <p className="showcase-property-date standard-listing-date"><CalendarDays size={17} strokeWidth={2} aria-hidden="true" />Publicado em {createdAt}</p>
                </div>
              </a>
              <a className="showcase-property-cta" href={url} onClick={logListingOpen}>Saiba Mais <span aria-hidden="true">→</span></a>
            </article>
          )
        })}
      </div>}
    </section>
  )
}

export function ListingDetailPage({ listing, origin, onView, onContactClick, isFavorite, favoriteBusy, favoriteMessage, onToggleFavorite }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const shareCloseButtonRef = useRef(null)
  const galleryCloseButtonRef = useRef(null)
  const recordedListingIdRef = useRef(null)
  const city = getCityLabel(listing.city)
  const neighborhood = listing.neighborhood || ''
  const streetLine = [listing.street, listing.number].filter(Boolean).join(', ')
  const fullAddress = streetLine || listing.address || getListingLocation(listing)
  const addressQuery = [fullAddress, neighborhood, city, listing.cep].filter(Boolean).join(', ')
  const galleryImages = useMemo(() => getListingImages(listing), [listing])
  const image = galleryImages[activeImageIndex] || ''
  const thumbnailIndices = galleryImages.length <= 4
    ? galleryImages.map((_, index) => index)
    : [...new Set([0, 1, 2, activeImageIndex >= 3 && activeImageIndex < galleryImages.length - 1 ? activeImageIndex : galleryImages.length - 1])]
  const description = listing.description || 'Descrição não informada.'
  const purpose = getListingPurpose(listing)
  const purposeLabel = getListingPurposeLabel(listing)
  const price = formatPrice(listing.price, purpose)
  const propertyType = getListingPropertyType(listing)
  const PropertyTypeIcon = propertyTypeIcons[propertyType.key] || House
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
  const shareText = `Confira este imóvel no Mora Fácil:\n\n${listing.title}\n${url}`
  const contactMessage = `Olá! Tenho interesse no imóvel "${listing.title}" que encontrei no Mora Fácil.\n\nLink: ${url}`
  const emailShareUrl = `mailto:?subject=${encodeURIComponent('Confira este imóvel no Mora Fácil')}&body=${encodeURIComponent(`${listing.title}\n${url}`)}`
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(listing.title)}`
  const originProfileUrl = origin ? (() => {
    const returnParams = new URLSearchParams()
    if (origin.editing) returnParams.set('edit', '1')
    if (origin.preview) returnParams.set('preview', '1')
    if (origin.tab && origin.tab !== 'showcase') returnParams.set('aba', origin.tab)
    const returnQuery = returnParams.toString()
    return `${import.meta.env.BASE_URL}imobiliaria/${encodeURIComponent(origin.slug)}${returnQuery ? `?${returnQuery}` : ''}`
  })() : ''

  useEffect(() => {
    if (!listing.user_id || recordedListingIdRef.current === listing.id) return
    recordedListingIdRef.current = listing.id
    onView?.(listing)
  }, [listing, onView])

  const changeImage = useCallback((direction) => {
    if (galleryImages.length < 2) return
    setActiveImageIndex((current) => (current + direction + galleryImages.length) % galleryImages.length)
  }, [galleryImages.length])
  const gallerySwipe = useSwipeNavigation(changeImage)
  const lightboxSwipe = useSwipeNavigation(changeImage)

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

  useEffect(() => {
    if (!galleryOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    galleryCloseButtonRef.current?.focus()
    const handleGalleryKeydown = (event) => {
      if (event.key === 'Escape') setGalleryOpen(false)
      if (event.key === 'ArrowLeft') changeImage(-1)
      if (event.key === 'ArrowRight') changeImage(1)
    }
    window.addEventListener('keydown', handleGalleryKeydown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleGalleryKeydown)
    }
  }, [galleryOpen, changeImage])

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
    <>
    <main className="listing-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="listing-detail-header">
        <nav className="listing-detail-breadcrumb" aria-label="Navegação estrutural">
          <a href={import.meta.env.BASE_URL}>Início</a><span>›</span>
          {origin
            ? <><a href={originProfileUrl}>{origin.name}</a><span>›</span></>
            : <><a href={`${import.meta.env.BASE_URL}#imoveis-disponiveis`}>Imóveis</a><span>›</span></>}
          <span aria-current="page">{listing.title}</span>
        </nav>
        <div className="listing-detail-titlebar">
          <div>
            <h1>{listing.title}</h1>
            <div className="listing-detail-address-line"><LocationPinIcon /><span>{fullAddress}{neighborhood ? ` - ${neighborhood}` : ''}, {city}</span>{listing.cep && <small>CEP {listing.cep}</small>}</div>
          </div>
          <a className="listing-back-link" href={origin ? originProfileUrl : `${import.meta.env.BASE_URL}#imoveis-disponiveis`}>
            {origin ? `← Voltar para ${origin.name}` : '← Voltar aos imóveis'}
          </a>
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
            <div className="listing-detail-gallery-main" onTouchStart={gallerySwipe.onTouchStart} onTouchEnd={gallerySwipe.onTouchEnd} onTouchCancel={gallerySwipe.onTouchCancel}>
              {image ? <img src={image} srcSet={getResponsiveImageSet(image)} sizes="(max-width: 760px) 100vw, 72vw" alt={`${listing.title}, foto ${activeImageIndex + 1}`} fetchPriority="high" /> : <ListingImagePlaceholder />}
              <span className={`showcase-type-badge purpose-badge purpose-${purpose}`} translate="no">{purposeLabel.toLocaleUpperCase('pt-BR')}</span>
              <FavoriteButton listing={listing} isFavorite={isFavorite} isBusy={favoriteBusy} onToggle={onToggleFavorite} />
              {galleryImages.length > 1 && <>
                <button type="button" className="listing-gallery-arrow previous" aria-label="Foto anterior" onClick={() => changeImage(-1)}>‹</button>
                <button type="button" className="listing-gallery-arrow next" aria-label="Próxima foto" onClick={() => changeImage(1)}>›</button>
              </>}
              {galleryImages.length > 0 && <button
                type="button"
                className="listing-gallery-count"
                aria-label={`Ver fotos em tela cheia, foto ${galleryImages.length ? activeImageIndex + 1 : 0} de ${galleryImages.length}`}
                onClick={() => setGalleryOpen(true)}
              >
                <Camera size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>{galleryImages.length ? activeImageIndex + 1 : 0}/{galleryImages.length}</span>
                <span className="listing-gallery-count-hint">Ver fotos</span>
              </button>}
            </div>
            {galleryImages.length > 1 && <div className="listing-detail-thumbnails" aria-label="Miniaturas das fotos do imóvel">
              {thumbnailIndices.map((photoIndex) => {
                const photo = galleryImages[photoIndex]
                const hasPhotoCountBadge = photoIndex === galleryImages.length - 1 && galleryImages.length > 4
                return (
                  <button
                    type="button"
                    className={`listing-detail-thumbnail${activeImageIndex === photoIndex ? ' active' : ''}`}
                    key={`${photo}-${photoIndex}`}
                    onClick={() => setActiveImageIndex(photoIndex)}
                    aria-label={`Exibir foto ${photoIndex + 1} de ${galleryImages.length}`}
                    aria-pressed={activeImageIndex === photoIndex}
                  >
                    <img src={photo} alt={`Foto ${photoIndex + 1} de ${listing.title}`} />
                    {hasPhotoCountBadge && (
                      <span className="listing-thumbnail-count">
                        <ListingPhotoCount
                          listing={listing}
                          className="listing-thumbnail-photo-count"
                        />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>}
          </section>
          {favoriteMessage && <p className="favorite-feedback listing-favorite-feedback" role="alert">{favoriteMessage}</p>}

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
            {whatsappDigits ? <a className="listing-contact-button whatsapp" href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(contactMessage)}`} target="_blank" rel="noreferrer" onClick={(event) => openTrackedContact(event, () => onContactClick?.(listing))}><WhatsAppIcon size={24} />Conversar no WhatsApp</a> : <button type="button" className="listing-contact-button whatsapp" disabled>WhatsApp indisponível</button>}
            {phoneDigits ? <a className="listing-contact-button outline" href={`tel:${phoneDigits}`} onClick={(event) => openTrackedContact(event, () => onContactClick?.(listing))}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-7-7l3-2-2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>Entrar em contato</a> : <button type="button" className="listing-contact-button outline" disabled>Contato indisponível</button>}
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
              <li><span aria-hidden="true">{purpose === 'aluguel' ? <KeyRound size={17} strokeWidth={2} /> : <Tag size={17} strokeWidth={2} />}</span><div><strong>{purposeLabel}</strong><small>Finalidade</small></div></li>
              <li><span aria-hidden="true"><PropertyTypeIcon size={17} strokeWidth={2} /></span><div><strong>{propertyTypeLabel}</strong><small>Tipo do imóvel</small></div></li>
              <li><span aria-hidden="true"><Ruler size={17} strokeWidth={2} /></span><div><strong>{area ? `${area} m²` : '—'}</strong><small>Área construída</small></div></li>
              <li><span aria-hidden="true"><BedDouble size={17} strokeWidth={2} /></span><div><strong>{bedrooms} {bedrooms === 1 ? 'Quarto' : 'Quartos'}</strong><small>Dormitórios</small></div></li>
              <li><span aria-hidden="true"><Bath size={17} strokeWidth={2} /></span><div><strong>{bathrooms} {bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</strong><small>Banheiros</small></div></li>
              <li><span aria-hidden="true"><Car size={17} strokeWidth={2} /></span><div><strong>{parking} {parking === 1 ? 'Vaga' : 'Vagas'}</strong><small>Garagem</small></div></li>
              <li className="info-wide"><span aria-hidden="true"><CalendarDays size={17} strokeWidth={2} /></span><div><strong>{publishedDate}</strong><small>Publicado em</small></div></li>
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
                <span className="listing-share-action-icon" aria-hidden="true"><WhatsAppIcon size={24} /></span>
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
        <button ref={galleryCloseButtonRef} type="button" className="listing-gallery-lightbox-close" onClick={() => setGalleryOpen(false)}>× Fechar</button>
        <span className="listing-gallery-lightbox-count">{activeImageIndex + 1}/{galleryImages.length}</span>
        {galleryImages.length > 1 && <button type="button" className="listing-gallery-arrow previous" aria-label="Foto anterior" onClick={() => changeImage(-1)}>‹</button>}
        <img src={image} alt={`${listing.title}, foto ${activeImageIndex + 1} de ${galleryImages.length}`} onTouchStart={lightboxSwipe.onTouchStart} onTouchEnd={lightboxSwipe.onTouchEnd} onTouchCancel={lightboxSwipe.onTouchCancel} />
        {galleryImages.length > 1 && <button type="button" className="listing-gallery-arrow next" aria-label="Próxima foto" onClick={() => changeImage(1)}>›</button>}
      </div>}
    </main>
    <SiteFooter />
    </>
  )
}