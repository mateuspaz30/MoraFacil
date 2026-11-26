import { useEffect, useRef, useState } from 'react'
import { Check, Minus, Plus, X } from 'lucide-react'

const clampOffset = (offset, imageSize, frameSize) => Math.min(
  Math.max(offset, (frameSize - imageSize) / 2),
  (imageSize - frameSize) / 2,
)

export default function CompanyProfileImageCropDialog({ file, imageKind, onCancel, onApply }) {
  const frameRef = useRef(null)
  const dragRef = useRef(null)
  const [image, setImage] = useState(null)
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isMobileCrop, setIsMobileCrop] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const aspectRatio = imageKind === 'logo' ? 1 : isMobileCrop ? 1.7 : 4
  const baseScale = image && frameSize.width && frameSize.height
    ? Math.max(frameSize.width / image.naturalWidth, frameSize.height / image.naturalHeight)
    : 0
  const imageWidth = image ? image.naturalWidth * baseScale * zoom : 0
  const imageHeight = image ? image.naturalHeight * baseScale * zoom : 0
  const boundedOffset = {
    x: frameSize.width ? clampOffset(offset.x, imageWidth, frameSize.width) : 0,
    y: frameSize.height ? clampOffset(offset.y, imageHeight, frameSize.height) : 0,
  }
  const imageLeft = (frameSize.width - imageWidth) / 2 + boundedOffset.x
  const imageTop = (frameSize.height - imageHeight) / 2 + boundedOffset.y

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    const loadedImage = new Image()
    loadedImage.onload = () => setImage(loadedImage)
    loadedImage.onerror = () => setError('Não foi possível abrir esta imagem. Escolha outro arquivo.')
    loadedImage.src = objectUrl
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 760px)')
    const updateCropRatio = (event) => setIsMobileCrop(event.matches)
    mediaQuery.addEventListener('change', updateCropRatio)
    return () => mediaQuery.removeEventListener('change', updateCropRatio)
  }, [])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined

    const updateSize = () => {
      const { width, height } = frame.getBoundingClientRect()
      setFrameSize({ width, height })
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, saving])

  const changeZoom = (value) => {
    const nextZoom = Math.min(3, Math.max(1, value))
    const nextWidth = image ? image.naturalWidth * baseScale * nextZoom : 0
    const nextHeight = image ? image.naturalHeight * baseScale * nextZoom : 0
    setZoom(nextZoom)
    setOffset({
      x: frameSize.width ? clampOffset(offset.x, nextWidth, frameSize.width) : 0,
      y: frameSize.height ? clampOffset(offset.y, nextHeight, frameSize.height) : 0,
    })
  }

  const startDrag = (event) => {
    if (!image || saving) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: boundedOffset.x,
      offsetY: boundedOffset.y,
    }
  }

  const moveDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset({
      x: clampOffset(drag.offsetX + event.clientX - drag.x, imageWidth, frameSize.width),
      y: clampOffset(drag.offsetY + event.clientY - drag.y, imageHeight, frameSize.height),
    })
  }

  const finishDrag = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  const applyCrop = () => {
    if (!image || !frameSize.width || !frameSize.height || saving) return
    setSaving(true)
    setError('')
    const sourceX = Math.max(0, -imageLeft / (baseScale * zoom))
    const sourceY = Math.max(0, -imageTop / (baseScale * zoom))
    const sourceWidth = frameSize.width / (baseScale * zoom)
    const sourceHeight = frameSize.height / (baseScale * zoom)
    const outputWidth = imageKind === 'logo' ? 800 : 1800
    const outputHeight = Math.round(outputWidth / aspectRatio)
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext('2d')
    if (!context) {
      setSaving(false)
      setError('Não foi possível preparar a imagem. Tente novamente.')
      return
    }
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight)
    canvas.toBlob((blob) => {
      if (!blob) {
        setSaving(false)
        setError('Não foi possível gerar a imagem ajustada. Tente novamente.')
        return
      }
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
      const croppedFile = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-ajustada.${extension}`, {
        type: file.type,
        lastModified: Date.now(),
      })
      onApply(croppedFile)
    }, file.type, 0.92)
  }

  return (
    <div className="company-image-crop-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onCancel()
    }}>
      <section className="company-image-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="company-image-crop-title">
        <header className="company-image-crop-header">
          <div>
            <h2 id="company-image-crop-title">Ajustar {imageKind === 'logo' ? 'logo' : 'capa'}</h2>
            <p>Arraste para reposicionar e use o zoom para enquadrar.</p>
          </div>
          <button type="button" className="company-image-crop-close" aria-label="Cancelar ajuste" onClick={onCancel} disabled={saving}><X size={20} /></button>
        </header>
        <div
          ref={frameRef}
          className={`company-image-crop-frame${imageKind === 'logo' ? ' logo' : ' cover'}`}
          style={{ aspectRatio }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          aria-label={`Pré-visualização do enquadramento da ${imageKind === 'logo' ? 'logo' : 'capa'}`}
        >
          {image
            ? <img
                src={image.src}
                alt=""
                draggable="false"
                style={{ width: imageWidth, height: imageHeight, left: imageLeft, top: imageTop }}
              />
            : <span role="status">Carregando imagem…</span>}
        </div>
        <label className="company-image-crop-zoom">
          <span>Zoom</span>
          <button type="button" aria-label="Diminuir zoom" onClick={() => changeZoom(zoom - 0.1)} disabled={zoom <= 1 || saving}><Minus size={17} /></button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            aria-label="Nível de zoom da imagem"
            onChange={(event) => changeZoom(Number(event.target.value))}
            disabled={!image || saving}
          />
          <button type="button" aria-label="Aumentar zoom" onClick={() => changeZoom(zoom + 0.1)} disabled={zoom >= 3 || saving}><Plus size={17} /></button>
        </label>
        {error && <p className="company-image-crop-error" role="alert">{error}</p>}
        <footer className="company-image-crop-actions">
          <button type="button" className="company-image-crop-cancel" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="button" className="company-image-crop-apply" onClick={applyCrop} disabled={!image || saving}>
            <Check size={17} aria-hidden="true" />{saving ? 'Aplicando…' : 'Aplicar enquadramento'}
          </button>
        </footer>
      </section>
    </div>
  )
}
