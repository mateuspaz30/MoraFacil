import { Camera } from 'lucide-react'

export default function ListingImagePlaceholder({ className = '' }) {
  return (
    <div className={`listing-image-placeholder${className ? ` ${className}` : ''}`} role="img" aria-label="Anúncio sem foto. Este imóvel ainda não possui fotos cadastradas.">
      <Camera size={38} strokeWidth={1.8} aria-hidden="true" />
      <strong>ANÚNCIO SEM FOTO</strong>
      <span>Este imóvel ainda não possui fotos cadastradas.</span>
    </div>
  )
}
