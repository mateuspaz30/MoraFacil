import { useState } from 'react'
import { ChevronLeft, ChevronRight, House } from 'lucide-react'
import { getListingPurposeLabel } from './listingPresentation.js'

export default function StandardListingGallery({ listing, purpose }) {
  const images = [...new Set([
    ...(Array.isArray(listing.images) ? listing.images : []),
    listing.image,
  ].filter(Boolean))]
  const [imageIndex, setImageIndex] = useState(0)
  const activeImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0))

  const changeImage = (direction) => {
    if (images.length < 2) return
    setImageIndex((current) => (current + direction + images.length) % images.length)
  }

  return (
    <div className="standard-listing-gallery">
      <div className="standard-listing-gallery-main">
        {images[activeImageIndex]
          ? <img src={images[activeImageIndex]} alt={`${listing.title}, foto ${activeImageIndex + 1}`} />
          : <span className="standard-listing-image-placeholder" aria-hidden="true"><House size={38} strokeWidth={2.2} /></span>}
        <span className={`account-status-badge purpose-badge purpose-${purpose}`}>{getListingPurposeLabel(listing).toLocaleUpperCase('pt-BR')}</span>
        {images.length > 1 && (
          <>
            <button type="button" className="standard-listing-gallery-arrow previous" aria-label="Foto anterior" onClick={() => changeImage(-1)}><ChevronLeft size={22} aria-hidden="true" /></button>
            <button type="button" className="standard-listing-gallery-arrow next" aria-label="Próxima foto" onClick={() => changeImage(1)}><ChevronRight size={22} aria-hidden="true" /></button>
            <span className="standard-listing-gallery-count">{activeImageIndex + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="standard-listing-gallery-thumbnails" aria-label="Fotos do imóvel">
          {images.slice(0, 6).map((image, index) => (
            <button
              type="button"
              key={image}
              className={index === activeImageIndex ? 'active' : ''}
              aria-label={`Exibir foto ${index + 1}`}
              aria-pressed={index === activeImageIndex}
              onClick={() => setImageIndex(index)}
            >
              <img src={image} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
