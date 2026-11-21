import { Camera } from 'lucide-react'
import { getListingImages } from './listingPresentation.js'

export default function ListingPhotoCount({ listing }) {
  const count = getListingImages(listing).length
  if (count === 0) return null

  return (
    <span className="listing-photo-count" aria-label={`${count} fotos`}>
      <Camera size={14} strokeWidth={2.2} aria-hidden="true" />
      <span aria-hidden="true">{count}</span>
    </span>
  )
}
