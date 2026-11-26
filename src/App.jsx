import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { ArrowLeft, Bath, BedDouble, Building2, CalendarDays, Camera, Car, ChartNoAxesColumn, Check, ChevronRight, CircleCheck, Clock3, Eye, ExternalLink, Globe2, Heart, Home, House, Info, LandPlot, Leaf, Lightbulb, MapPin, MoreHorizontal, Pencil, Phone, Plus, Ruler, Search, Settings2, Share2, Shield, Store, Tag, Trash2, User } from 'lucide-react'
import '@fontsource/inter/400.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { getIndividualListingDaysRemaining, getListingImages, getListingPropertyType, getListingPurpose, getListingPurposeLabel, INDIVIDUAL_LISTING_VALIDITY_DAYS, isIndividualListingExpired, isListingPubliclyAvailable, purposeColors } from './listingPresentation.js'
import AdminPanel from './AdminPanel.jsx'
import CompanyProfileImageCropDialog from './CompanyProfileImageCropDialog.jsx'
import ListingImagePlaceholder from './ListingImagePlaceholder.jsx'
import ListingPhotoCount from './ListingPhotoCount.jsx'
import StandardListingGallery from './StandardListingGallery.jsx'
import useSwipeNavigation from './useSwipeNavigation.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'
import logo from './assets/logo.png'
import heroIllustration from './assets/hero-house.png'
import { FavoriteButton, getListingDetailUrl, getListingLocation, getListingSlug, getListingSlugFromPath, isPortalCityListing, ListingDetailPage, ListingShowcase, SiteFooter } from './ListingShowcase.jsx'

const sampleListings = [
  {
    id: 1,
    title: 'Residência perto da praça',
    type: 'venda',
    price: 'R$ 320.000',
    location: 'Centro de Ipuã-SP',
    address: 'Rua 15 de Novembro, Centro, Ipuã-SP',
    coordinates: [-20.4388, -48.0124],
    bedrooms: 3,
    area: '120 m²',
    description: 'Casa confortável próxima à praça, com ambientes bem iluminados, cozinha planejada e espaço para a família.',
    neighborhood: 'Centro',
    status: 'Disponível',
    advertiser: 'Maria Silva',
    phone: '(16) 99999-1234',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 2,
    title: 'Casa com área de lazer',
    type: 'venda',
    price: 'R$ 420.000',
    location: 'Jardim das Flores, Ipuã',
    address: 'Rua das Acácias, Jardim das Flores, Ipuã-SP',
    coordinates: [-20.4354, -48.0079],
    bedrooms: 4,
    area: '180 m²',
    description: 'Casa ampla com área de lazer, quintal e espaços ideais para receber a família nos fins de semana.',
    neighborhood: 'Jardim das Flores',
    status: 'Disponível',
    advertiser: 'João Oliveira',
    phone: '(16) 98888-4567',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 3,
    title: 'Apartamento para alugar',
    type: 'aluguel',
    price: 'R$ 1.800/mês',
    location: 'Vila Nova, Ipuã',
    address: 'Avenida Carlos Roberto, Vila Nova, Ipuã-SP',
    coordinates: [-20.4421, -48.0172],
    bedrooms: 2,
    area: '85 m²',
    description: 'Apartamento prático, bem localizado e próximo aos principais serviços e comércios de Ipuã.',
    neighborhood: 'Vila Nova',
    status: 'Disponível',
    advertiser: 'Ana Costa',
    phone: '(16) 97777-8910',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 4,
    title: 'Terreno pronto para construir',
    type: 'terreno',
    price: 'R$ 180.000',
    location: 'Zona Norte de Ipuã',
    address: 'Rua Projetada 4, Zona Norte, Ipuã-SP',
    coordinates: [-20.4307, -48.0161],
    bedrooms: 0,
    area: '600 m²',
    description: 'Terreno pronto para construir, com acesso fácil e espaço para um novo projeto residencial.',
    neighborhood: 'Zona Norte',
    status: 'Disponível',
    advertiser: 'Carlos Mendes',
    phone: '(16) 96666-2345',
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 5,
    title: 'Casa térrea com garagem',
    type: 'venda',
    price: 'R$ 285.000',
    location: 'Jardim Primavera, Ipuã',
    address: 'Rua das Palmeiras, Jardim Primavera, Ipuã-SP',
    coordinates: [-20.4412, -48.0096],
    bedrooms: 2,
    area: '96 m²',
    description: 'Casa térrea com garagem, dois quartos e quintal, pronta para receber uma nova família.',
    neighborhood: 'Jardim Primavera',
    status: 'Disponível',
    advertiser: 'Marcos Lima',
    phone: '(16) 95555-3456',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 6,
    title: 'Apartamento central mobiliado',
    type: 'aluguel',
    price: 'R$ 1.450/mês',
    location: 'Centro de Ipuã-SP',
    address: 'Rua Sete de Setembro, Centro, Ipuã-SP',
    coordinates: [-20.4371, -48.0148],
    bedrooms: 1,
    area: '58 m²',
    description: 'Apartamento mobiliado no centro, com fácil acesso a mercados, farmácias e serviços.',
    neighborhood: 'Centro',
    status: 'Disponível',
    advertiser: 'Fernanda Alves',
    phone: '(16) 94444-7890',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 7,
    title: 'Lote residencial plano',
    type: 'terreno',
    price: 'R$ 95.000',
    location: 'Residencial Santana, Ipuã',
    address: 'Rua Um, Residencial Santana, Ipuã-SP',
    coordinates: [-20.4462, -48.0117],
    bedrooms: 0,
    area: '250 m²',
    description: 'Lote plano em bairro residencial, ideal para construir a casa própria.',
    neighborhood: 'Residencial Santana',
    status: 'Disponível',
    advertiser: 'Paulo Ribeiro',
    phone: '(16) 93333-1234',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 8,
    title: 'Casa nova com varanda',
    type: 'venda',
    price: 'R$ 365.000',
    location: 'Vila Nova, Ipuã',
    address: 'Rua das Flores, Vila Nova, Ipuã-SP',
    coordinates: [-20.4445, -48.0205],
    bedrooms: 3,
    area: '132 m²',
    description: 'Casa nova com varanda, acabamento moderno e ambientes integrados.',
    neighborhood: 'Vila Nova',
    status: 'Disponível',
    advertiser: 'Juliana Martins',
    phone: '(16) 92222-5678',
    image: 'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=85',
  },
]

const companyPeriodOptions = [
  ['today', 'Hoje'],
  ['last7', 'Últimos 7 dias'],
  ['last30', 'Últimos 30 dias'],
  ['thisMonth', 'Este mês'],
  ['lastMonth', 'Mês passado'],
  ['thisYear', 'Este ano'],
  ['custom', 'Personalizado'],
]

const formatLocalDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCompanyPeriodRange = (period, now = new Date()) => {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(end)

  if (period === 'today') {
    return { start: formatLocalDateInput(start), end: formatLocalDateInput(end) }
  }
  if (period === 'last7') start.setDate(start.getDate() - 6)
  if (period === 'last30') start.setDate(start.getDate() - 29)
  if (period === 'thisMonth') start.setDate(1)
  if (period === 'lastMonth') {
    start.setDate(1)
    start.setMonth(start.getMonth() - 1)
    end.setDate(0)
  }
  if (period === 'thisYear') {
    start.setMonth(0, 1)
  }

  return { start: formatLocalDateInput(start), end: formatLocalDateInput(end) }
}

const propertyTypeIcons = {
  casa: Home,
  apartamento: Building2,
  chacara: Home,
  terreno: LandPlot,
  ponto_comercial: Store,
}

const approvedSampleListings = sampleListings.map((listing) => ({ ...listing, status: 'aprovado' }))
const defaultNeighborhoods = [...new Set(sampleListings.map((listing) => listing.neighborhood))]
  .sort((first, second) => first.localeCompare(second, 'pt-BR'))
  .map((name) => ({ name, active: true }))
const normalizeNeighborhoodName = (name) => String(name || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('pt-BR')
const isApprovedListing = (listing) => ['aprovado', 'disponível', 'disponivel', 'ativo'].includes(String(listing.status || '').trim().toLocaleLowerCase('pt-BR'))

const formatArea = (area) => `${Number.parseInt(area, 10) || 0} m²`
const getAppBasePath = () => {
  const basePath = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return basePath
}
const getRelativeAppPath = (pathname) => {
  const basePath = getAppBasePath()
  return pathname.startsWith(basePath)
    ? pathname.slice(basePath.length).replace(/^\/+|\/+$/g, '')
    : pathname.replace(/^\/+|\/+$/g, '')
}
const getAccountSectionFromPath = (pathname) => {
  const [route, section] = decodeURIComponent(getRelativeAppPath(pathname))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .split('/')
  if (route !== 'minha-area') return null
  if (section === 'meus-imoveis' || section === 'imoveis') return 'listings'
  if (section === 'favoritos') return 'favorites'
  if (section === 'minha-conta' || section === 'conta') return 'account'
  if (section === 'administracao' || section === 'admin') return 'admin'
  if (section === 'dashboard') return 'dashboard'
  if (section === 'estatisticas') return 'statistics'
  if (section === 'perfil-publico') return 'public-profile'
  return 'overview'
}
const getAccountSectionPath = (section) => {
  const sectionPaths = {
    overview: '',
    listings: 'meus-imoveis',
    favorites: 'favoritos',
    account: 'minha-conta',
    admin: 'administração',
    dashboard: 'dashboard',
    statistics: 'estatisticas',
    'public-profile': 'perfil-publico',
  }
  const sectionPath = sectionPaths[section]
  const encodedPath = sectionPath?.split('/').map(encodeURIComponent).join('/')
  return `${getAppBasePath()}minha-area${encodedPath ? `/${encodedPath}` : ''}`
}
const getPublicProfessionalSlugFromPath = (pathname) => {
  const [route, slug] = getRelativeAppPath(pathname).split('/')
  return ['imobiliaria', 'profissionais'].includes(route) ? decodeURIComponent(slug || '') : ''
}
const getCompanyPublicProfilePath = (slug) => `${getAppBasePath()}imobiliaria/${encodeURIComponent(slug)}`
const getPublicProfessionalProfilePath = (slug) => `${getAppBasePath()}profissionais/${encodeURIComponent(slug)}`
const getProfessionalDirectoryReturnPath = () => {
  const historyReturnPath = window.history.state?.returnTo
  const queryReturnPath = new URLSearchParams(window.location.search).get('retorno')
  return [historyReturnPath, queryReturnPath].find((returnPath) => (
    typeof returnPath === 'string'
    && returnPath.startsWith(getAppBasePath())
    && getRelativeAppPath(returnPath) === 'profissionais'
  )) || ''
}
const getAccountTypeLabel = (userType) => ({
  pessoa_fisica: 'Pessoa Física',
  corretor: 'Corretor',
  imobiliaria: 'Imobiliária',
})[userType] || 'Conta'
const emptyAuthForm = {
  userType: '',
  name: '',
  cpf: '',
  creci: '',
  phone: '',
  email: '',
  password: '',
  companyName: '',
  cnpj: '',
  responsibleName: '',
}
const onlyDigits = (value) => value.replace(/\D/g, '')
const formatCpf = (value) => {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
const formatCnpj = (value) => {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}
const formatPhone = (value) => {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}${digits.length === 2 ? ')' : ''}` : ''
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, (_, area, first, last) => (
    `(${area}) ${first}${last ? `-${last}` : ''}`
  ))
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})$/, (_, area, first, last) => (
    `(${area}) ${first}${last ? `-${last}` : ''}`
  ))
}
const getSafeExternalUrl = (value) => {
  const link = String(value || '').trim()
  if (!link) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}
const hasValidCpf = (value) => {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const checkDigit = (length) => {
    const sum = cpf.slice(0, length).split('').reduce((total, digit, index) => (
      total + Number(digit) * (length + 1 - index)
    ), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10])
}
const hasValidCnpj = (value) => {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const checkDigit = (length) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = cnpj.slice(0, length).split('').reduce((total, digit, index) => (
      total + Number(digit) * weights[index]
    ), 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  return checkDigit(12) === Number(cnpj[12]) && checkDigit(13) === Number(cnpj[13])
}
const hasValidCreci = (value) => /^(?:\d{6}(?:-[a-z])?|CRECI\/[a-z]{2}\s+\d{6})$/i.test(value.trim())

function FilterIcon({ name }) {
  if (name === 'pin') return <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6zm0 8.5A2.5 2.5 0 1 1 12 5.5a2.5 2.5 0 0 1 0 5z" /></svg>
  if (name === 'home') return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
  if (name === 'bed') return <BedDouble strokeWidth={2} aria-hidden="true" />
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.3" stroke="currentColor" strokeWidth="2" /><path d="m16.2 16.2 4.3 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function FilterSelect({ id, label, value, options, onChange, emphasized = false, icon, fieldClassName = '' }) {
  const purposeFilterClass = id === 'search-type' && ['Venda', 'Aluguel'].includes(value)
    ? ` purpose-filter-${value === 'Aluguel' ? 'aluguel' : 'venda'}`
    : ''

  return (
    <div className={`field${emphasized ? ' filter-search' : ''}${fieldClassName ? ` ${fieldClassName}` : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className={`filter-select-control${emphasized ? ' emphasized' : ''}${purposeFilterClass}`} translate="no">
        {icon && <span className="filter-select-icon"><FilterIcon name={icon} /></span>}
        <span className="filter-select-value" aria-hidden="true">{value}</span>
        <span className="filter-select-chevron" aria-hidden="true" />
        <select
          id={id}
          className="filter-select-native"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        >
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    </div>
  )
}

const mapCenter = [-20.438, -48.012]

const neighborhoodCoordinates = {
  Centro: [-20.4388, -48.0124],
  'Jardim das Flores': [-20.4354, -48.0079],
  'Vila Nova': [-20.4421, -48.0172],
  'Zona Norte': [-20.4307, -48.0161],
  'Jardim Primavera': [-20.4412, -48.0096],
  'Residencial Santana': [-20.4462, -48.0117],
}

const cityCoordinates = {
  'Ipuã-SP': [-20.438, -48.012],
  'Guaíra-SP': [-20.319, -48.312],
}

const emptyAnnouncement = {
  title: '',
  type: 'venda',
  status: 'em_analise',
  price: '',
  bedrooms: '0',
  bathrooms: '1',
  parking_spaces: '',
  area: '',
  city: 'Ipuã-SP',
  cep: '',
  number: '',
  street: '',
  neighborhood: 'Centro',
  address: '',
  description: '',
  image: '',
  advertiser: '',
  phone: '',
}

const MAX_LISTING_PHOTOS = 10

const compressListingPhoto = async (file) => {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = sourceUrl
    await image.decode()
    const scale = Math.min(1, 1400 / image.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('O navegador não conseguiu preparar esta imagem.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const toBlob = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, 0.8))
    let blob = await toBlob('image/webp')
    if (blob?.type !== 'image/webp') blob = await toBlob('image/jpeg')
    if (!blob || !['image/webp', 'image/jpeg'].includes(blob.type)) {
      throw new Error('O navegador não conseguiu comprimir esta imagem.')
    }

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
    const name = file.name.replace(/\.[^.]+$/, '') || 'foto-imovel'
    return new File([blob], `${name}.${extension}`, { type: blob.type, lastModified: file.lastModified })
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

const createMarkerIcon = (color) => L.divIcon({
  className: 'property-marker-wrapper',
  html: `<span class="property-marker" style="--marker-color: ${color}"><span></span></span>`,
  iconSize: [24, 32],
  iconAnchor: [12, 30],
  popupAnchor: [0, -28],
})

function AnnouncementMapClick({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

function MapResizeObserver({ fullscreen }) {
  const map = useMap()

  useEffect(() => {
    const invalidateSize = () => map.invalidateSize({ pan: false })
    const frame = window.requestAnimationFrame(invalidateSize)
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(invalidateSize)
    observer?.observe(map.getContainer())

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [fullscreen, map])

  return null
}

function MapLayerSelector() {
  const map = useMap()
  const [selectedLayer, setSelectedLayer] = useState('satellite-streets')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    map.attributionControl.setPosition('bottomleft')
    const labelsPane = map.getPane('mapLabels') || map.createPane('mapLabels')
    labelsPane.style.zIndex = '350'
    labelsPane.style.pointerEvents = 'none'

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Sources: &copy; Esri, Garmin, USGS, NPS', maxNativeZoom: 18, maxZoom: 18 },
    )
    const streetNames = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxNativeZoom: 18,
        maxZoom: 18,
        pane: 'mapLabels',
        opacity: 0.4,
        className: 'map-street-label-overlay',
      },
    )
    const streetMap = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>', maxNativeZoom: 18, maxZoom: 18 },
    )

    if (selectedLayer === 'street') {
      map.addLayer(streetMap)
    } else {
      map.addLayer(satellite)
      if (selectedLayer === 'satellite-streets') {
        map.addLayer(streetNames)
      }
    }

    return () => {
      map.removeLayer(satellite)
      map.removeLayer(streetNames)
      map.removeLayer(streetMap)
    }
  }, [map, selectedLayer])

  const layerOptions = [
    { id: 'satellite-streets', label: 'Satélite + Ruas' },
    { id: 'satellite', label: 'Satélite' },
    { id: 'street', label: 'Mapa' },
  ]

  return (
    <div
      className="map-layer-selector leaflet-control"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setIsOpen(false)
      }}
    >
      <button
        type="button"
        className="map-layer-trigger"
        aria-expanded={isOpen}
        aria-controls="map-layer-options"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
        <span>Camadas</span>
      </button>
      {isOpen && (
        <div className="map-layer-options" id="map-layer-options" role="group" aria-label="Camadas do mapa">
          {layerOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={selectedLayer === option.id ? 'active' : ''}
              aria-pressed={selectedLayer === option.id}
              onClick={() => {
                setSelectedLayer(option.id)
                setIsOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AnnouncementMapFocus({ focus }) {
  const map = useMap()

  useEffect(() => {
    if (focus) map.flyTo(focus.coordinates, focus.zoom, { animate: true, duration: 0.8 })
  }, [focus, map])

  return null
}

function MapListingCard({ listing, onClose }) {
  const images = getListingImages(listing)
  const [imageIndex, setImageIndex] = useState(0)
  const bedrooms = Number(listing.bedrooms) || 0
  const bathrooms = Number(listing.bathrooms) || 0
  const parking = Number(listing.parking_spaces || listing.garages) || 0
  const detailUrl = getListingDetailUrl(listing)
  const purpose = getListingPurpose(listing)
  const purposeLabel = getListingPurposeLabel(listing)
  const propertyType = getListingPropertyType(listing)
  const PropertyTypeIcon = propertyTypeIcons[propertyType.key]

  const changeImage = (direction) => {
    if (images.length < 2) return
    setImageIndex((current) => (current + direction + images.length) % images.length)
  }
  const gallerySwipe = useSwipeNavigation(changeImage, 40)

  return (
    <article className="map-detail-card">
      <div className="map-detail-image-wrap" onTouchStart={gallerySwipe.onTouchStart} onTouchEnd={gallerySwipe.onTouchEnd} onTouchCancel={gallerySwipe.onTouchCancel}>
        {images.length > 0
          ? <img className="map-detail-image" src={images[imageIndex]} alt={listing.title} />
          : <ListingImagePlaceholder />}
        <span className={`map-detail-type-badge purpose-badge purpose-${purpose}`}>{purposeLabel.toLocaleUpperCase('pt-BR')}</span>
        <button type="button" className="map-detail-close" aria-label="Fechar detalhes do imóvel" onClick={onClose}>×</button>
        {images.length > 1 && (
          <>
            <button type="button" className="map-detail-gallery-arrow previous" aria-label="Foto anterior" onClick={() => changeImage(-1)}>‹</button>
            <button type="button" className="map-detail-gallery-arrow next" aria-label="Próxima foto" onClick={() => changeImage(1)}>›</button>
          </>
        )}
        <ListingPhotoCount listing={listing} />
      </div>
      <div className="map-detail-content">
        <h3>{listing.title}</h3>
        <p className="map-detail-location"><MapPin size={16} strokeWidth={2} aria-hidden="true" /><span>{getListingLocation(listing)}</span></p>
        <p className="map-detail-property-type"><PropertyTypeIcon size={16} strokeWidth={2} aria-hidden="true" />{propertyType.label}</p>
        <p className={`detail-price purpose-price purpose-${purpose}`}>{listing.price}</p>
        <div className="map-detail-features">
          <div><BedDouble size={16} strokeWidth={2} aria-hidden="true" /><strong>{bedrooms}</strong><small>{bedrooms === 1 ? 'Quarto' : 'Quartos'}</small></div>
          <div><Bath size={16} strokeWidth={2} aria-hidden="true" /><strong>{bathrooms}</strong><small>{bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</small></div>
          <div><Car size={16} strokeWidth={2} aria-hidden="true" /><strong>{parking}</strong><small>{parking === 1 ? 'Vaga' : 'Vagas'}</small></div>
          <div><Ruler size={16} strokeWidth={2} aria-hidden="true" /><strong>{formatArea(listing.area)}</strong><small>Área</small></div>
        </div>
        <a className="detail-button" href={detailUrl}>Saiba mais <span aria-hidden="true">→</span></a>
      </div>
    </article>
  )
}

function MapListingOverlay({ listing, target, onClose }) {
  useMapEvents({ click: onClose })

  if (!listing || !target) return null

  return createPortal(
    <div className="map-listing-overlay">
      <MapListingCard key={listing.id} listing={listing} onClose={onClose} />
    </div>,
    target,
  )
}

const MenuSearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const MenuPlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)

const MenuLogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const MenuArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const InstagramIcon = ({ className }) => (
  <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
)

const FacebookIcon = ({ className }) => (
  <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 8h3V4.2c-.52-.08-1.7-.2-3.2-.2-3.17 0-5.34 1.93-5.34 5.48V12H5v4h3.46v8h4.24v-8h3.53l.56-4H12.7V9.92c0-1.16.31-1.92 1.3-1.92Z" />
  </svg>
)

const sortListingsByOrder = (items, order) => [...items].sort((first, second) => {
  if (order === 'price-asc' || order === 'price-desc') {
    const parsePrice = (listing) => {
      const value = String(listing.price || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
      if (!/\d/.test(value)) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    const firstPrice = parsePrice(first)
    const secondPrice = parsePrice(second)
    const missingPrice = order === 'price-asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
    const left = firstPrice ?? missingPrice
    const right = secondPrice ?? missingPrice
    return order === 'price-asc' ? left - right : right - left
  }
  const firstCreated = Date.parse(first.created_at || '') || 0
  const secondCreated = Date.parse(second.created_at || '') || 0
  return secondCreated - firstCreated
})

function App() {
  const [selectedListing, setSelectedListing] = useState(null)
  const [selectedMapListing, setSelectedMapListing] = useState(null)
  const [mapFullscreenOpen, setMapFullscreenOpen] = useState(false)
  const [announcementMapFullscreenOpen, setAnnouncementMapFullscreenOpen] = useState(false)
  const [mapPanelElement, setMapPanelElement] = useState(null)
  const [userListings, setUserListings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('morafacil-user-listings') || '[]')
    } catch {
      return []
    }
  })
  const [publishedListings, setPublishedListings] = useState([])
  const [adminReviewListings, setAdminReviewListings] = useState([])
  const [adminReviewLoading, setAdminReviewLoading] = useState(false)
  const [adminReviewError, setAdminReviewError] = useState('')
  const [adminListingsError, setAdminListingsError] = useState('')
  const [adminSection, setAdminSection] = useState('overview')
  const [adminUsers, setAdminUsers] = useState([])
  const [adminUsersLoading, setAdminUsersLoading] = useState(false)
  const [adminUsersError, setAdminUsersError] = useState('')
  const [adminUsersMessage, setAdminUsersMessage] = useState('')
  const [adminUserActionId, setAdminUserActionId] = useState(null)
  const [featuredListings, setFeaturedListings] = useState([])
  const [featuredListingsStatus, setFeaturedListingsStatus] = useState(isSupabaseConfigured ? 'loading' : 'loaded')
  const [neighborhoods, setNeighborhoods] = useState(() => isSupabaseConfigured ? [] : defaultNeighborhoods)
  const [neighborhoodsStatus, setNeighborhoodsStatus] = useState(isSupabaseConfigured ? 'loading' : 'loaded')
  const [neighborhoodsError, setNeighborhoodsError] = useState('')
  const [neighborhoodDraft, setNeighborhoodDraft] = useState('')
  const [editingNeighborhoodName, setEditingNeighborhoodName] = useState(null)
  const [neighborhoodSaving, setNeighborhoodSaving] = useState(false)
  const [neighborhoodActionName, setNeighborhoodActionName] = useState(null)
  const [neighborhoodManagerError, setNeighborhoodManagerError] = useState('')
  const [neighborhoodManagerMessage, setNeighborhoodManagerMessage] = useState('')
  const [announcement, setAnnouncement] = useState(emptyAnnouncement)
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [announcementPhotos, setAnnouncementPhotos] = useState([])
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false)
  const [announcementError, setAnnouncementError] = useState('')
  const [announcementCategory, setAnnouncementCategory] = useState('Casa')
  const [announcementSuccess, setAnnouncementSuccess] = useState(false)
  const [editingListingId, setEditingListingId] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [favoriteData, setFavoriteData] = useState({ userId: null, ids: [] })
  const [receivedFavoriteCount, setReceivedFavoriteCount] = useState(null)
  const [receivedFavoriteCountError, setReceivedFavoriteCountError] = useState('')
  const [companyPeriodPreset, setCompanyPeriodPreset] = useState('last30')
  const [companyPeriodStart, setCompanyPeriodStart] = useState(() => getCompanyPeriodRange('last30').start)
  const [companyPeriodEnd, setCompanyPeriodEnd] = useState(() => getCompanyPeriodRange('last30').end)
  const [appliedCompanyPeriod, setAppliedCompanyPeriod] = useState(() => ({
    preset: 'last30',
    ...getCompanyPeriodRange('last30'),
  }))
  const [companyPeriodMetrics, setCompanyPeriodMetrics] = useState({ userId: null, range: '', counts: {}, status: 'idle' })
  const [companyPeriodMetricsError, setCompanyPeriodMetricsError] = useState('')
  const [companyPeriodValidationError, setCompanyPeriodValidationError] = useState('')
  const [statisticsSearch, setStatisticsSearch] = useState('')
  const [statisticsSort, setStatisticsSort] = useState({ key: 'visualizacoes', direction: 'desc' })
  const [favoriteActionId, setFavoriteActionId] = useState(null)
  const [favoriteMessage, setFavoriteMessage] = useState('')
  const pendingFavoriteListingRef = useRef(null)
  const [favoriteReturnPath, setFavoriteReturnPath] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [userProfileError, setUserProfileError] = useState('')
  const [listingValidityNow, setListingValidityNow] = useState(() => Date.now())
  const [listingValidityMessage, setListingValidityMessage] = useState({ text: '', error: false })
  const [professionalDirectory, setProfessionalDirectory] = useState({
    status: supabase ? 'idle' : 'error',
    profiles: [],
    error: supabase ? '' : 'A busca de perfis profissionais precisa estar conectada ao Supabase.',
  })
  const [professionalSearchInput, setProfessionalSearchInput] = useState('')
  const [professionalSearch, setProfessionalSearch] = useState('')
  const [professionalCategory, setProfessionalCategory] = useState('all')
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileEditForm, setProfileEditForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirmation: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ text: '', error: false })
  const [publicCompanyProfile, setPublicCompanyProfile] = useState({ slug: '', status: 'idle', data: null, error: '' })
  const [publicProfileShareMessage, setPublicProfileShareMessage] = useState('')
  const [companyPublicEditMode, setCompanyPublicEditMode] = useState(() => new URLSearchParams(window.location.search).get('edit') === '1')
  const [companyPublicPreviewMode, setCompanyPublicPreviewMode] = useState(() => new URLSearchParams(window.location.search).get('preview') === '1')
  const [companyPublicTab, setCompanyPublicTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('aba')
    return ['showcase', 'about', 'contacts'].includes(tab) ? tab : 'showcase'
  })
  const [companyPublicDraft, setCompanyPublicDraft] = useState({})
  const [companyPublicLogoFile, setCompanyPublicLogoFile] = useState(null)
  const [companyPublicCoverFile, setCompanyPublicCoverFile] = useState(null)
  const [companyPublicLogoPreview, setCompanyPublicLogoPreview] = useState('')
  const [companyPublicCoverPreview, setCompanyPublicCoverPreview] = useState('')
  const [companyPublicImageCrop, setCompanyPublicImageCrop] = useState(null)
  const companyPublicLogoPreviewRef = useRef('')
  const companyPublicCoverPreviewRef = useRef('')
  const [companyPublicActiveField, setCompanyPublicActiveField] = useState('')
  const [companyPublicSaving, setCompanyPublicSaving] = useState(false)
  const [companyPublicSaveError, setCompanyPublicSaveError] = useState('')
  const [companyPublicSaveMessage, setCompanyPublicSaveMessage] = useState('')
  const [companyPublicImageError, setCompanyPublicImageError] = useState('')
  const [companyListingFilters, setCompanyListingFilters] = useState({ search: '', purpose: 'all', category: 'all', neighborhood: 'all' })
  const [appliedCompanyListingFilters, setAppliedCompanyListingFilters] = useState({ search: '', purpose: 'all', category: 'all', neighborhood: 'all' })
  const [companySortOrder, setCompanySortOrder] = useState('recent')
  const [isAdmin, setIsAdmin] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [accountSection, setAccountSection] = useState(() => getAccountSectionFromPath(window.location.pathname) || 'overview')
  const [recentListingsExpanded, setRecentListingsExpanded] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const previousInternalPathRef = useRef('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [authSignupStep, setAuthSignupStep] = useState('profile')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressMessage, setAddressMessage] = useState('')
  const [announcementCoordinates, setAnnouncementCoordinates] = useState(mapCenter)
  const [announcementMapFocus, setAnnouncementMapFocus] = useState(null)
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageMessage, setImageMessage] = useState('')
  const [draftFilters, setDraftFilters] = useState({
    search: 'Ipuã-SP',
    type: 'Todos os imóveis',
    bedrooms: 'Qualquer',
    price: 'Qualquer faixa',
    neighborhood: 'Qualquer bairro',
  })
  const [appliedFilters, setAppliedFilters] = useState(draftFilters)
  const [homeSortOrder, setHomeSortOrder] = useState('recent')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)
  const [accountFilter, setAccountFilter] = useState('all')
  const [listingPurposeFilter, setListingPurposeFilter] = useState('all')
  const [openListingActionId, setOpenListingActionId] = useState(null)
  const [rejectionListingId, setRejectionListingId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [moderationMessage, setModerationMessage] = useState('')
  const [moderationError, setModerationError] = useState('')
  const [statusSavingId, setStatusSavingId] = useState(null)
  const [featuredDrafts, setFeaturedDrafts] = useState({})
  const [featuredSavingId, setFeaturedSavingId] = useState(null)

  function discardCompanyPublicImageCrop() {
    setCompanyPublicImageCrop(null)
  }

  function clearCompanyPublicImagePreviews() {
    if (companyPublicLogoPreviewRef.current) URL.revokeObjectURL(companyPublicLogoPreviewRef.current)
    if (companyPublicCoverPreviewRef.current) URL.revokeObjectURL(companyPublicCoverPreviewRef.current)
    discardCompanyPublicImageCrop()
    companyPublicLogoPreviewRef.current = ''
    companyPublicCoverPreviewRef.current = ''
    setCompanyPublicLogoPreview('')
    setCompanyPublicCoverPreview('')
  }

  useEffect(() => {
    const resetHomePropertyType = (event) => {
      if (!event.persisted) return

      setDraftFilters((current) => ({ ...current, type: 'Todos os imóveis' }))
      setAppliedFilters((current) => ({ ...current, type: 'Todos os imóveis' }))
    }

    window.addEventListener('pageshow', resetHomePropertyType)
    return () => window.removeEventListener('pageshow', resetHomePropertyType)
  }, [])

  useEffect(() => {
    const updateCurrentPath = () => {
      setCurrentPath(window.location.pathname)
      setCompanySortOrder('recent')
      setCompanyPublicEditMode(new URLSearchParams(window.location.search).get('edit') === '1')
      setCompanyPublicPreviewMode(new URLSearchParams(window.location.search).get('preview') === '1')
      const tab = new URLSearchParams(window.location.search).get('aba')
      setCompanyPublicTab(['showcase', 'about', 'contacts'].includes(tab) ? tab : 'showcase')
      const section = getAccountSectionFromPath(window.location.pathname)
      if (section) setAccountSection(section)
    }
    window.addEventListener('popstate', updateCurrentPath)
    return () => window.removeEventListener('popstate', updateCurrentPath)
  }, [])

  const navigateToPath = (path, historyState) => {
    const currentRouteSegments = getRelativeAppPath(window.location.pathname).split('/')
    const shouldPreserveProfessionalReturn = currentRouteSegments[0] === 'profissionais'
      && currentRouteSegments[1]
      && getProfessionalDirectoryReturnPath()
    const nextHistoryState = historyState ?? (shouldPreserveProfessionalReturn ? window.history.state : {})
    previousInternalPathRef.current = window.location.pathname
    window.history.pushState(nextHistoryState, '', path)
    setCurrentPath(window.location.pathname)
    setCompanySortOrder('recent')
    const searchParams = new URLSearchParams(window.location.search)
    setCompanyPublicEditMode(searchParams.get('edit') === '1')
    setCompanyPublicPreviewMode(searchParams.get('preview') === '1')
    const tab = searchParams.get('aba')
    setCompanyPublicTab(['showcase', 'about', 'contacts'].includes(tab) ? tab : 'showcase')
    const section = getAccountSectionFromPath(window.location.pathname)
    if (section) setAccountSection(section)
  }
  const navigateBackToInternalPage = () => {
    if (previousInternalPathRef.current) {
      window.history.back()
      return
    }
    navigateToPath(getAppBasePath())
  }
  const openMyArea = (section = 'overview') => navigateToPath(getAccountSectionPath(section))
  const closeAuthModal = () => {
    setAuthOpen(false)
    pendingFavoriteListingRef.current = null
    setFavoriteReturnPath('')
  }
  const isMyAreaRoute = getRelativeAppPath(currentPath).split('/')[0] === 'minha-area'

  useEffect(() => {
    if (!mapFullscreenOpen && !announcementMapFullscreenOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [announcementMapFullscreenOpen, mapFullscreenOpen])

  const publicPublishedListings = publishedListings.filter((item) => isListingPubliclyAvailable(item))
  const listings = isSupabaseConfigured
    ? (publishedListings.length > 0 ? publicPublishedListings : approvedSampleListings)
    : [...approvedSampleListings, ...userListings.filter((item) => isListingPubliclyAvailable(item))]
  const activeNeighborhoodNames = neighborhoods
    .filter((neighborhood) => neighborhood.active)
    .map((neighborhood) => neighborhood.name)
  const announcementNeighborhoodOptions = [
    ...activeNeighborhoodNames,
    ...(editingListingId && announcement.neighborhood && !activeNeighborhoodNames.includes(announcement.neighborhood)
      ? [announcement.neighborhood]
      : []),
  ]
  const updateNeighborhoodList = useCallback((nextNeighborhoods, renamedNeighborhood = null) => {
    const availableNeighborhoods = new Set(nextNeighborhoods
      .filter((neighborhood) => neighborhood.active)
      .map((neighborhood) => neighborhood.name))
    const preserveAvailableFilter = (filters) => {
      let neighborhood = filters.neighborhood
      if (renamedNeighborhood && neighborhood === renamedNeighborhood.from) {
        neighborhood = renamedNeighborhood.to
      }
      return neighborhood === 'Qualquer bairro' || availableNeighborhoods.has(neighborhood)
        ? { ...filters, neighborhood }
        : { ...filters, neighborhood: 'Qualquer bairro' }
    }
    setNeighborhoods(nextNeighborhoods)
    setDraftFilters(preserveAvailableFilter)
    setAppliedFilters(preserveAvailableFilter)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('morafacil-user-listings', JSON.stringify(userListings))
    }
  }, [userListings])

  useEffect(() => {
    if (!supabase) return undefined

    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setAuthUser(session?.user || null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setModerationMessage('')
        setFeaturedDrafts({})
        setUserProfile(null)
        setUserProfileError('')
        setIsAdmin(false)
        setAdminReviewListings([])
        setAdminReviewError('')
        setAdminReviewLoading(false)
        setAdminListingsError('')
        setAdminUsers([])
        setAdminUsersError('')
        setAdminUsersMessage('')
        setFavoriteMessage('')
        setProfileEditing(false)
      }
      if (event === 'SIGNED_OUT') setAccountFilter('all')
      setAuthUser(session?.user || null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authUser) return undefined

    let mounted = true
    const loadUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id, tipo_usuario, nome_completo, cpf, creci, telefone, nome_imobiliaria, cnpj, nome_responsavel, public_slug, public_city, public_description, public_logo_url, public_cover_url, public_display_name, public_slogan, public_phone, public_whatsapp, public_instagram, public_facebook, public_website, public_business_hours')
          .eq('user_id', authUser.id)
          .maybeSingle()
        if (error) throw error
        if (mounted) setUserProfile(data)
      } catch (error) {
        console.error('Falha ao carregar os dados da conta:', error)
        if (mounted) setUserProfileError(`Não foi possível carregar os dados do perfil. Confira as migrações de perfil público e execute supabase/migrations/20261129_enable_broker_public_profile_editing.sql. ${error.message}`)
      }
    }
    loadUserProfile()
    return () => { mounted = false }
  }, [authUser])

  useEffect(() => {
    const slug = getPublicProfessionalSlugFromPath(currentPath)
    if (!slug || !supabase) return undefined

    let active = true
    const loadPublicProfessionalProfile = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_company_profile', {
          target_slug: slug,
        })
        if (error) throw error
        if (!active) return
        const profile = Array.isArray(data) ? data[0] : data
        setPublicCompanyProfile({
          slug,
          status: profile ? 'loaded' : 'not-found',
          data: profile || null,
          error: '',
        })
        if (profile) {
          clearCompanyPublicImagePreviews()
          setCompanyPublicDraft({
            display_name: profile.company_name || '',
            slogan: profile.slogan || '',
            city: profile.city || '',
            description: profile.description || '',
            phone: profile.phone || '',
            whatsapp: profile.whatsapp || '',
            instagram: profile.instagram || '',
            facebook: profile.facebook || '',
            website: profile.website || '',
            business_hours: profile.business_hours || '',
            logo_url: profile.logo_url || '',
            cover_url: profile.cover_url || '',
          })
          setCompanyPublicLogoFile(null)
          setCompanyPublicCoverFile(null)
          setCompanyPublicActiveField('')
        }
      } catch (error) {
        console.error('Falha ao carregar o perfil público profissional:', error)
        if (active) {
          setPublicCompanyProfile({
            slug,
            status: 'error',
            data: null,
            error: `Não foi possível carregar este perfil público. Execute supabase/migrations/20261127_public_professional_directory.sql no Supabase. ${error.message}`,
          })
        }
      }
    }

    loadPublicProfessionalProfile()
    return () => { active = false }
  }, [currentPath])

  useEffect(() => {
    if (!supabase || getRelativeAppPath(currentPath) !== 'profissionais') return undefined

    let active = true
    const loadProfessionalDirectory = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_professional_directory')
        if (error) throw error
        if (!active) return
        setProfessionalDirectory({ status: 'loaded', profiles: data || [], error: '' })
      } catch (error) {
        console.error('Falha ao carregar os perfis públicos profissionais:', error)
        if (active) {
          setProfessionalDirectory({
            status: 'error',
            profiles: [],
            error: `Não foi possível carregar os perfis profissionais. Execute supabase/migrations/20261127_public_professional_directory.sql no Supabase. ${error.message}`,
          })
        }
      }
    }

    loadProfessionalDirectory()
    return () => { active = false }
  }, [currentPath])

  useEffect(() => () => {
    if (companyPublicLogoPreviewRef.current) URL.revokeObjectURL(companyPublicLogoPreviewRef.current)
    if (companyPublicCoverPreviewRef.current) URL.revokeObjectURL(companyPublicCoverPreviewRef.current)
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    let mounted = true
    const loadNeighborhoods = async () => {
      setNeighborhoodsStatus('loading')
      setNeighborhoodsError('')
      try {
        const { data, error } = await supabase
          .from('neighborhoods')
          .select('name, active')
          .order('name', { ascending: true })

        if (error) throw error
        if (!mounted) return
        updateNeighborhoodList((data || []).map((item) => ({ name: item.name, active: item.active })))
        setNeighborhoodsStatus('loaded')
      } catch (error) {
        console.error('Falha ao carregar os bairros cadastrados:', error)
        if (!mounted) return
        setNeighborhoodsError(`Não foi possível carregar os bairros. Execute supabase/migrations/20261010_create_managed_neighborhoods.sql no Supabase. Detalhe: ${error.message}`)
        setNeighborhoodsStatus('error')
      }
    }

    loadNeighborhoods()
    return () => {
      mounted = false
    }
  }, [isAdmin, updateNeighborhoodList])

  useEffect(() => {
    if (!supabase) return undefined

    let mounted = true
    const loadFeaturedListings = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'aprovado')
          .eq('destaque_home', true)
          .order('ordem_destaque', { ascending: true })

        if (error) throw error
        if (!mounted) return

        setFeaturedListings((data || []).filter((item) => isListingPubliclyAvailable(item)).map((item) => ({
          ...item,
          coordinates: [item.latitude, item.longitude],
          location: `${item.neighborhood}, ${item.city || 'Ipuã-SP'}`,
          area: formatArea(item.area),
          parking_spaces: Number(item.parking_spaces ?? item.garages) || 0,
        })))
        setFeaturedListingsStatus('loaded')
      } catch (error) {
        console.error('Falha ao carregar os anúncios em destaque da Home:', error)
        if (mounted) setFeaturedListingsStatus('error')
      }
    }

    loadFeaturedListings()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!supabase || !authUser) return

    let active = true
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Falha ao verificar permissões administrativas:', error)
        setIsAdmin(false)
        setAdminReviewListings([])
        setAdminReviewError('')
        setAdminReviewLoading(false)
        return
      }
      const isAdminUser = Boolean(data)
      setIsAdmin(isAdminUser)
      if (!isAdminUser) {
        setAdminReviewListings([])
        setAdminReviewError('')
        setAdminReviewLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [authUser])

  useEffect(() => {
    if (!supabase || !authUser || !isAdmin) return undefined

    let active = true
    const loadAdminReviewListings = async () => {
      setAdminReviewLoading(true)
      setAdminReviewError('')
      const rows = []
      const pageSize = 1000
      let from = 0

      try {
        while (active) {
          const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('status', 'em_analise')
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(from, from + pageSize - 1)

          if (error) throw error
          if (!active) return

          rows.push(...(data || []))
          if ((data || []).length < pageSize) break
          from += pageSize
        }

        if (!active) return
        setAdminReviewListings(rows.map((item) => ({
          ...item,
          coordinates: [item.latitude, item.longitude],
          location: `${item.neighborhood}, ${item.city || 'Ipuã-SP'}`,
          area: formatArea(item.area),
          parking_spaces: Number(item.parking_spaces ?? item.garages) || 0,
          owner: item.user_id === authUser.id,
        })))
      } catch (error) {
        console.error('Falha ao carregar anúncios pendentes para revisão:', error)
        if (active) setAdminReviewError(`Não foi possível carregar os anúncios pendentes. ${error.message}`)
      } finally {
        if (active) setAdminReviewLoading(false)
      }
    }

    loadAdminReviewListings()
    return () => {
      active = false
    }
  }, [authUser, isAdmin])

  useEffect(() => {
    if (!supabase || !authUser || !isAdmin || accountSection !== 'admin') return undefined

    let active = true
    const loadAdminUsers = async () => {
      setAdminUsersLoading(true)
      setAdminUsersError('')
      try {
        const { data, error } = await supabase.functions.invoke('admin-management', {
          body: { action: 'list-users' },
        })
        if (error) throw error
        if (!active) return
        setAdminUsers((data?.users || []).map((user) => ({
          ...user,
          typeLabel: getAccountTypeLabel(user.userType) || 'Não informado',
        })))
      } catch (error) {
        console.error('Falha ao carregar usuários para administração:', error)
        if (active) setAdminUsersError(`Não foi possível carregar os usuários. Confirme se a Edge Function admin-management foi implantada. ${error.message}`)
      } finally {
        if (active) setAdminUsersLoading(false)
      }
    }

    loadAdminUsers()
    return () => { active = false }
  }, [authUser, isAdmin, accountSection])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadUserListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Falha ao carregar os anúncios para a área administrativa:', error)
        if (isAdmin) setAdminListingsError(`Não foi possível carregar todos os anúncios. ${error.message}`)
        return
      }

      setAdminListingsError('')
      const normalizedListings = (data || []).map((item) => ({
        ...item,
        id: item.id,
        coordinates: [item.latitude, item.longitude],
        location: `${item.neighborhood}, ${item.city || 'Ipuã-SP'}`,
        area: formatArea(item.area),
        parking_spaces: Number(item.parking_spaces ?? item.garages) || 0,
        owner: item.user_id === authUser?.id,
      }))
      setPublishedListings(normalizedListings)
      setUserListings(authUser
        ? normalizedListings.filter((item) => item.user_id === authUser.id)
        : [])
    }

    loadUserListings()
  }, [authUser, isAdmin])

  useEffect(() => {
    const millisecondsPerDay = 24 * 60 * 60 * 1000
    const nextValidityChangeDelay = [...publishedListings, ...featuredListings]
      .reduce((nearestDelay, item) => {
        const daysRemaining = getIndividualListingDaysRemaining(item, listingValidityNow)
        if (daysRemaining === null || daysRemaining === 0) return nearestDelay
        const validityStartedAt = Date.parse(item.individual_validity_started_at)
        const expiresAt = validityStartedAt + INDIVIDUAL_LISTING_VALIDITY_DAYS * millisecondsPerDay
        const nextChangeAt = expiresAt - (daysRemaining - 1) * millisecondsPerDay
        return Math.min(nearestDelay, Math.max(1, nextChangeAt - listingValidityNow + 1))
      }, Number.POSITIVE_INFINITY)
    if (!Number.isFinite(nextValidityChangeDelay)) return undefined

    const timeoutId = window.setTimeout(() => setListingValidityNow(Date.now()), nextValidityChangeDelay)
    return () => window.clearTimeout(timeoutId)
  }, [featuredListings, listingValidityNow, publishedListings])

  useEffect(() => {
    if (!authUser) return undefined

    let mounted = true
    const loadFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        if (mounted) {
          setFavoriteData({ userId: authUser.id, ids: (data || []).map((favorite) => favorite.listing_id) })
          setFavoriteMessage('')
        }
      } catch (error) {
        console.error('Falha ao carregar os imóveis favoritos:', error)
        if (mounted) {
          setFavoriteData({ userId: authUser.id, ids: [] })
          setFavoriteMessage(`Não foi possível carregar seus favoritos. Execute supabase/migrations/20261120_create_favorites.sql no Supabase. ${error.message}`)
        }
      }
    }

    loadFavorites()
    return () => { mounted = false }
  }, [authUser])

  useEffect(() => {
    if (!authUser || !supabase) return undefined

    let mounted = true
    const loadReceivedFavoriteCount = async () => {
      setReceivedFavoriteCount(null)
      setReceivedFavoriteCountError('')
      try {
        const { data, error } = await supabase.rpc('count_my_listing_favorites')
        if (error) throw error
        if (mounted) setReceivedFavoriteCount(Number(data) || 0)
      } catch (error) {
        console.error('Falha ao carregar os favoritos recebidos nos anúncios:', error)
        if (mounted) {
          setReceivedFavoriteCountError(`Não foi possível carregar os favoritos recebidos. Execute supabase/migrations/20261121_count_listing_favorites.sql no Supabase. ${error.message}`)
        }
      }
    }

    loadReceivedFavoriteCount()
    return () => { mounted = false }
  }, [authUser])

  useEffect(() => {
    const userType = userProfile && userProfile.user_id === authUser?.id
      ? userProfile.tipo_usuario
      : authUser?.user_metadata?.tipo_usuario
    if (!authUser || !supabase || userType !== 'imobiliaria') return undefined

    let mounted = true
    const rangeKey = `${appliedCompanyPeriod.start}:${appliedCompanyPeriod.end}`
    const loadCompanyPeriodMetrics = async () => {
      setCompanyPeriodMetrics({ userId: authUser.id, range: rangeKey, counts: {}, status: 'loading' })
      setCompanyPeriodMetricsError('')
      try {
        const { data, error } = await supabase.rpc('get_company_listing_metrics_by_period', {
          period_start: appliedCompanyPeriod.start,
          period_end: appliedCompanyPeriod.end,
        })
        if (error) throw error
        if (mounted) {
          setCompanyPeriodMetrics({
            userId: authUser.id,
            range: rangeKey,
            counts: Object.fromEntries((data || []).map((item) => [String(item.listing_id), {
              visualizacoes: Number(item.visualizacoes) || 0,
              whatsapp_clicks: Number(item.whatsapp_clicks) || 0,
              favoritos: Number(item.favoritos) || 0,
            }])),
            status: 'loaded',
          })
        }
      } catch (error) {
        console.error('Falha ao carregar as métricas por período da imobiliária:', error)
        if (mounted) {
          setCompanyPeriodMetrics({ userId: authUser.id, range: rangeKey, counts: {}, status: 'error' })
          setCompanyPeriodMetricsError(`Não foi possível carregar as métricas do período. Execute supabase/migrations/20261124_company_metric_history.sql no Supabase. ${error.message}`)
        }
      }
    }

    loadCompanyPeriodMetrics()
    return () => { mounted = false }
  }, [authUser, userProfile, appliedCompanyPeriod])

  const selectedCity = appliedFilters.search.trim()
  const selectedCityKey = selectedCity.toLocaleLowerCase('pt-BR').replace(/-sp$/i, '')
  const cityListings = listings.filter((item) => {
    if (!selectedCity) return true
    if (selectedCityKey === 'ipuã') return isPortalCityListing(item)
    const sourceCity = String(item.city || item.location || item.address || '').toLocaleLowerCase('pt-BR')
    return sourceCity.includes(selectedCityKey)
  })

  const filteredListings = cityListings.filter((item) => {
    const typeMatches = appliedFilters.type === 'Todos os imóveis'
      || (appliedFilters.type === 'Terrenos' && (item.property_category === 'terreno' || item.type === 'terreno'))
      || (appliedFilters.type === 'Chácaras' && item.property_category === 'chacara')
      || (appliedFilters.type === 'Venda' && getListingPurpose(item) === 'venda')
      || (appliedFilters.type === 'Aluguel' && getListingPurpose(item) === 'aluguel')
      || (appliedFilters.type === 'Ponto Comercial' && (item.property_category === 'ponto_comercial' || item.type === 'ponto_comercial'))
    const bedroomsMatches = appliedFilters.bedrooms === 'Qualquer'
      || item.bedrooms >= Number.parseInt(appliedFilters.bedrooms, 10)
    const numericPrice = Number(String(item.price || '').replace(/\D/g, '')) || 0
    const priceMatches = appliedFilters.price === 'Qualquer faixa'
      || (appliedFilters.price === 'Até R$ 200 mil' && numericPrice <= 200000)
      || (appliedFilters.price === 'Até R$ 500 mil' && numericPrice <= 500000)
      || (appliedFilters.price === 'Acima de R$ 500 mil' && numericPrice > 500000)
    const neighborhoodMatches = appliedFilters.neighborhood === 'Qualquer bairro'
      || item.neighborhood === appliedFilters.neighborhood

    return typeMatches && bedroomsMatches && priceMatches && neighborhoodMatches
  })
  const sortedFilteredListings = sortListingsByOrder(filteredListings, homeSortOrder)
  const resultsLabel = `${filteredListings.length} ${filteredListings.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`

  const heroCarouselListings = (isSupabaseConfigured ? featuredListings : listings)
    .filter((item) => isListingPubliclyAvailable(item, listingValidityNow) && item.destaque_home === true)
    .sort((first, second) => {
      const firstOrder = Number.parseInt(first.ordem_destaque, 10) || Number.MAX_SAFE_INTEGER
      const secondOrder = Number.parseInt(second.ordem_destaque, 10) || Number.MAX_SAFE_INTEGER
      return firstOrder - secondOrder || String(first.id).localeCompare(String(second.id))
    })
  const activeHeroListing = heroCarouselListings[heroSlideIndex % Math.max(heroCarouselListings.length, 1)]
  const heroSwipe = useSwipeNavigation((direction) => {
    if (heroCarouselListings.length < 2) return
    setHeroSlideIndex((current) => (current + direction + heroCarouselListings.length) % heroCarouselListings.length)
  })

  useEffect(() => {
    if (heroCarouselListings.length < 2) return undefined

    const timer = setInterval(() => {
      setHeroSlideIndex((current) => (current + 1) % heroCarouselListings.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [heroCarouselListings.length])

  const summaryCards = [
    {
      label: 'Apartamentos',
      value: filteredListings.filter((item) => getListingPurpose(item) === 'aluguel' && item.bedrooms > 0).length,
      details: 'Disponíveis',
    },
    {
      label: 'Casas',
      value: filteredListings.filter((item) => getListingPurpose(item) === 'venda' && item.bedrooms > 0).length,
      details: 'Disponíveis',
    },
    {
      label: 'Aluguel',
      value: filteredListings.filter((item) => getListingPurpose(item) === 'aluguel').length,
      details: 'Ativos',
    },
    {
      label: 'Terrenos',
      value: filteredListings.filter((item) => item.type === 'terreno').length,
      details: 'Prontos',
    },
  ]

  const closeDetails = () => setSelectedListing(null)

  const openAnnouncementForm = (listing = null) => {
    if (isSupabaseConfigured && !authUser) {
      setAuthMessage('Entre ou crie sua conta para publicar e acompanhar seus anúncios.')
      setAuthOpen(true)
      return
    }

    setEditingListingId(listing?.id || null)
    setAnnouncement(listing ? {
      ...emptyAnnouncement,
      ...listing,
      bedrooms: String(listing.bedrooms || 0),
      bathrooms: String(listing.bathrooms || 1),
      parking_spaces: String(listing.parking_spaces ?? listing.garages ?? ''),
      price: String(listing.price || '').replace(/\D/g, ''),
      area: String(listing.area || '').replace(/\D/g, ''),
    } : {
      ...emptyAnnouncement,
      neighborhood: activeNeighborhoodNames[0] || '',
    })
    const listingPhotos = listing?.images?.length
      ? listing.images.map((url, index) => ({ url, name: `Foto ${index + 1}` }))
      : listing?.image ? [{ url: listing.image, name: 'Foto principal' }] : []
    setAnnouncementPhotos(listingPhotos)
    setAnnouncementSubmitting(false)
    setAnnouncementError('')
    setAnnouncementSuccess(false)
    setAnnouncementCategory(listing?.property_category === 'apartamento' ? 'Apartamento' : listing?.property_category === 'chacara' ? 'Chácara' : listing?.property_category === 'terreno' || listing?.type === 'terreno' ? 'Terreno' : listing?.property_category === 'ponto_comercial' || listing?.type === 'ponto_comercial' ? 'Ponto Comercial' : 'Casa')
    setAnnouncementCoordinates(listing?.coordinates || cityCoordinates[listing?.city] || mapCenter)
    setAnnouncementMapFocus(null)
    setLocationConfirmed(Boolean(listing?.coordinates))
    setAnnouncementOpen(true)
  }

  const closeAnnouncementForm = (preservePhotos = false) => {
    if (!preservePhotos) {
      announcementPhotos.forEach((photo) => {
        if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url)
      })
    }
    setAnnouncementOpen(false)
    setEditingListingId(null)
    setAnnouncement(emptyAnnouncement)
    setAnnouncementPhotos([])
    setAnnouncementSubmitting(false)
    setAnnouncementError('')
    setAddressMessage('')
    setAnnouncementMapFocus(null)
    setLocationConfirmed(false)
    setImageMessage('')
  }

  const handleImageChange = async (event) => {
    const files = Array.from(event.dataTransfer?.files || event.target?.files || [])
    if (event.target?.tagName === 'INPUT') event.target.value = ''
    if (!files.length) return

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const availableSlots = Math.max(0, MAX_LISTING_PHOTOS - announcementPhotos.length)
    const selectedFiles = files.slice(0, availableSlots)
    if (files.length > availableSlots) setImageMessage(`O limite é de ${MAX_LISTING_PHOTOS} fotos por anúncio.`)
    if (!selectedFiles.length) return

    const validFiles = selectedFiles.filter((file) => acceptedTypes.includes(file.type) && file.size <= 8 * 1024 * 1024)
    if (validFiles.length !== selectedFiles.length) {
      setImageMessage('Use fotos JPG, PNG ou WEBP de até 8 MB cada.')
    }
    if (!validFiles.length) return

    setImageLoading(true)
    setImageMessage('Preparando fotos...')
    const uploadedPhotos = []
    const failedPhotos = []
    for (const file of validFiles) {
      try {
        const compressedFile = await compressListingPhoto(file)
        if (!isSupabaseConfigured || !authUser) {
          uploadedPhotos.push({ url: URL.createObjectURL(compressedFile), name: file.name })
          continue
        }
        const path = `${authUser.id}/${crypto.randomUUID()}.${compressedFile.name.split('.').pop()}`
        const { error } = await supabase.storage.from('property-images').upload(path, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: compressedFile.type,
        })
        if (error) throw error
        const { data } = supabase.storage.from('property-images').getPublicUrl(path)
        uploadedPhotos.push({ url: data.publicUrl, name: file.name })
      } catch (error) {
        console.error(`Falha ao preparar ou enviar a foto ${file.name}:`, error)
        failedPhotos.push({ name: file.name, message: error.message || 'erro desconhecido' })
      }
    }

    const nextPhotos = [...announcementPhotos, ...uploadedPhotos].slice(0, MAX_LISTING_PHOTOS)
    setAnnouncementPhotos(nextPhotos)
    setAnnouncement((value) => ({ ...value, image: nextPhotos[0]?.url || '' }))
    setImageMessage(uploadedPhotos.length
      ? `${uploadedPhotos.length} foto${uploadedPhotos.length === 1 ? '' : 's'} adicionada${uploadedPhotos.length === 1 ? '' : 's'}.${failedPhotos.length ? ` Não foi possível enviar ${failedPhotos.map((photo) => photo.name).join(', ')}.` : ' Arraste para ordenar.'}`
      : failedPhotos.length
        ? `Não foi possível preparar ou enviar as fotos. ${failedPhotos[0].message}`
        : 'Nenhuma foto pôde ser adicionada.')
    setImageLoading(false)
  }

  const removeAnnouncementPhoto = (index) => {
    const removed = announcementPhotos[index]
    if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url)
    const nextPhotos = announcementPhotos.filter((_, photoIndex) => photoIndex !== index)
    setAnnouncementPhotos(nextPhotos)
    setAnnouncement((value) => ({ ...value, image: nextPhotos[0]?.url || '' }))
  }

  const moveAnnouncementPhoto = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= announcementPhotos.length) return
    const nextPhotos = [...announcementPhotos]
    const [photo] = nextPhotos.splice(fromIndex, 1)
    nextPhotos.splice(toIndex, 0, photo)
    setAnnouncementPhotos(nextPhotos)
    setAnnouncement((value) => ({ ...value, image: nextPhotos[0]?.url || '' }))
  }

  const updateAnnouncementAddressField = (field, value) => {
    setAnnouncement((current) => ({ ...current, [field]: value, address: '' }))
    setLocationConfirmed(false)
    setAddressMessage('')
  }

  const lookupCep = async () => {
    const cep = announcement.cep.replace(/\D/g, '')
    if (cep.length !== 8) return

    setAddressLoading(true)
    setAddressMessage('Consultando CEP...')
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (data.erro) {
        setAddressMessage('CEP não encontrado. Confira os números.')
        return
      }
      const city = data.localidade === 'Guaíra' ? 'Guaíra-SP' : 'Ipuã-SP'
      const cepNeighborhood = activeNeighborhoodNames.find((name) => (
        normalizeNeighborhoodName(name) === normalizeNeighborhoodName(data.bairro)
      ))
      setAnnouncement((current) => ({
        ...current,
        city,
        street: data.logradouro || current.street,
        neighborhood: cepNeighborhood || current.neighborhood,
      }))
      setAddressMessage(data.bairro && !cepNeighborhood
        ? `O CEP retornou “${data.bairro}”, que não está cadastrado como bairro ativo. Selecione um bairro da lista.`
        : 'Endereço encontrado. Confira o número da casa.')
    } catch {
      setAddressMessage('Não foi possível consultar o CEP agora.')
    } finally {
      setAddressLoading(false)
    }
  }

  const locateAnnouncement = async () => {
    const street = announcement.street.trim()
    const number = announcement.number.trim()
    const city = announcement.city.replace(/-SP$/i, '').trim()
    const postalCode = announcement.cep.replace(/\D/g, '')

    if (!street || !number || !city) {
      setAddressMessage('Informe a cidade, a rua e o número antes de localizar.')
      return null
    }

    setAddressLoading(true)
    setAddressMessage('Localizando endereço no mapa...')
    try {
      const params = new URLSearchParams({
        street: `${number} ${street}`,
        city,
        state: 'São Paulo',
        country: 'Brasil',
        format: 'jsonv2',
        addressdetails: '1',
        limit: '1',
        countrycodes: 'br',
      })
      if (postalCode) params.set('postalcode', postalCode)

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
      if (!response.ok) throw new Error(`Serviço de localização indisponível (HTTP ${response.status}).`)
      const results = await response.json()
      const result = Array.isArray(results) ? results[0] : null
      const latitude = Number(result?.lat)
      const longitude = Number(result?.lon)
      if (!result || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setAddressMessage('⚠️ Endereço não encontrado. Verifique os dados informados.')
        return null
      }
      const coordinates = [latitude, longitude]
      setAnnouncementCoordinates(coordinates)
      setAnnouncementMapFocus({ coordinates, zoom: 18 })
      setAnnouncement((current) => ({ ...current, address: result.display_name }))
      setLocationConfirmed(true)
      setAddressMessage('Local encontrado. Você pode ajustar o marcador.')
      return { coordinates, address: result.display_name }
    } catch (error) {
      console.error('Falha ao consultar o serviço de geolocalização:', error)
      setAddressMessage('Não foi possível consultar o serviço de localização. Tente novamente.')
      return null
    } finally {
      setAddressLoading(false)
    }
  }

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault()
    if (announcementSubmitting) return
    setAnnouncementError('')
    const selectedNeighborhood = neighborhoods.find((item) => item.name === announcement.neighborhood)
    if (!selectedNeighborhood || (!selectedNeighborhood.active && !editingListingId)) {
      setAnnouncementError('Selecione um bairro cadastrado e ativo antes de continuar.')
      return
    }
    setAnnouncementSubmitting(true)
    const cityCenter = cityCoordinates[announcement.city] || neighborhoodCoordinates[announcement.neighborhood] || mapCenter
    let coordinates = announcementCoordinates || cityCenter

    if (!locationConfirmed) {
      const located = await locateAnnouncement()
      if (located) {
        coordinates = located.coordinates
      } else {
        setAnnouncementSubmitting(false)
        return
      }
    }

    const listing = {
      ...announcement,
      id: editingListingId || `user-${Date.now()}`,
      price: announcement.type === 'aluguel' ? `R$ ${announcement.price}/mês` : `R$ ${announcement.price}`,
      location: `${announcement.neighborhood}, ${announcement.city}`,
      bedrooms: Number.parseInt(announcement.bedrooms, 10) || 0,
      parking_spaces: Number.parseInt(announcement.parking_spaces, 10) || 0,
      area: formatArea(announcement.area),
      property_category: announcementCategory === 'Chácara' ? 'chacara' : announcementCategory.toLocaleLowerCase('pt-BR').replaceAll(' ', '_'),
      purpose: announcement.type === 'aluguel' ? 'aluguel' : 'venda',
      status: editingListingId && isAdmin ? announcement.status : 'em_analise',
      motivo_reprovacao: editingListingId && isAdmin ? announcement.motivo_reprovacao || null : null,
      coordinates,
      address: announcement.address || `${announcement.street}, ${announcement.number}`,
      image: announcement.image || sampleListings[0].image,
      images: announcementPhotos.map((photo) => photo.url),
      owner: true,
    }

    if (isSupabaseConfigured && authUser) {
      const databaseListing = {
        user_id: editingListingId && listing.user_id ? listing.user_id : authUser.id,
        city: listing.city,
        cep: listing.cep,
        number: listing.number,
        street: listing.street,
        title: listing.title,
        type: listing.type,
        property_category: listing.property_category,
        purpose: listing.purpose,
        status: listing.status,
        motivo_reprovacao: listing.motivo_reprovacao,
        price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: Number.parseInt(announcement.bathrooms, 10) || 0,
        parking_spaces: Number.parseInt(announcement.parking_spaces, 10) || 0,
        area: Number.parseInt(announcement.area, 10) || 0,
        neighborhood: listing.neighborhood,
        address: listing.address,
        description: listing.description,
        image: listing.image,
        images: listing.images,
        advertiser: listing.advertiser,
        phone: listing.phone,
        latitude: coordinates[0],
        longitude: coordinates[1],
      }
      const query = editingListingId
        ? supabase.from('listings').update(databaseListing).eq('id', editingListingId)
        : supabase.from('listings').insert(databaseListing)
      let error
      try {
        ({ error } = await query)
      } catch (requestError) {
        setAnnouncementError(`Falha de conexão ao salvar o imóvel: ${requestError.message || 'verifique sua conexão e tente novamente.'}`)
        setAnnouncementSubmitting(false)
        return
      }
      if (error) {
        const missingFormColumns = /(images|property_category|purpose)/i.test(error.message)
          && /(column|schema cache|does not exist|could not find)/i.test(error.message)
        setAnnouncementError(missingFormColumns
          ? `O banco ainda não tem as colunas do novo formulário. Execute supabase/migrations/20261001_add_listing_image_gallery.sql no SQL Editor do Supabase. Detalhe: ${error.message}`
          : `Não foi possível cadastrar o imóvel. ${error.message}`)
        setAnnouncementSubmitting(false)
        return
      }
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
      const normalizedListings = (data || []).map((item) => ({ ...item, coordinates: [item.latitude, item.longitude], location: `${item.neighborhood}, ${item.city || 'Ipuã-SP'}`, area: formatArea(item.area), parking_spaces: Number(item.parking_spaces ?? item.garages) || 0, owner: item.user_id === authUser.id }))
      setPublishedListings(normalizedListings)
      setUserListings(normalizedListings.filter((item) => item.user_id === authUser.id))
    } else {
      setUserListings((current) => editingListingId
        ? current.map((item) => item.id === editingListingId ? listing : item)
        : [...current, listing])
    }
    closeAnnouncementForm(true)
    setAnnouncementSuccess(true)
  }

  const saveNeighborhood = async (event) => {
    event.preventDefault()
    const name = neighborhoodDraft.trim().replace(/\s+/g, ' ')
    if (!name) {
      setNeighborhoodManagerError('Informe o nome do bairro.')
      return
    }
    if (neighborhoods.some((item) => (
      item.name !== editingNeighborhoodName
      && normalizeNeighborhoodName(item.name) === normalizeNeighborhoodName(name)
    ))) {
      setNeighborhoodManagerError('Já existe um bairro com esse nome.')
      return
    }

    setNeighborhoodSaving(true)
    setNeighborhoodManagerError('')
    setNeighborhoodManagerMessage('')
    try {
      const query = editingNeighborhoodName
        ? supabase.from('neighborhoods').update({ name }).eq('name', editingNeighborhoodName)
        : supabase.from('neighborhoods').insert({ name, active: true })
      const { data, error } = await query.select('name, active').single()
      if (error) throw error

      const nextNeighborhoods = [...neighborhoods.filter((item) => item.name !== editingNeighborhoodName), data]
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
      updateNeighborhoodList(nextNeighborhoods, editingNeighborhoodName ? {
        from: editingNeighborhoodName,
        to: data.name,
      } : null)
      if (editingNeighborhoodName) {
        const previousName = editingNeighborhoodName
        setAnnouncement((current) => current.neighborhood === previousName ? { ...current, neighborhood: data.name } : current)
      }
      setNeighborhoodDraft('')
      setEditingNeighborhoodName(null)
      setNeighborhoodManagerMessage(`Bairro “${data.name}” salvo.`)
    } catch (error) {
      console.error('Falha ao salvar bairro:', error)
      setNeighborhoodManagerError(`Não foi possível salvar o bairro. ${error.message}`)
    } finally {
      setNeighborhoodSaving(false)
    }
  }

  const toggleNeighborhood = async (neighborhood) => {
    setNeighborhoodActionName(neighborhood.name)
    setNeighborhoodManagerError('')
    setNeighborhoodManagerMessage('')
    try {
      const { data, error } = await supabase
        .from('neighborhoods')
        .update({ active: !neighborhood.active })
        .eq('name', neighborhood.name)
        .select('name, active')
        .single()
      if (error) throw error
      updateNeighborhoodList(neighborhoods.map((item) => item.name === data.name ? data : item))
      if (!data.active && announcement.neighborhood === data.name && !editingListingId) {
        setAnnouncement((current) => ({
          ...current,
          neighborhood: activeNeighborhoodNames.find((name) => name !== data.name) || '',
        }))
      }
      setNeighborhoodManagerMessage(`Bairro “${data.name}” ${data.active ? 'ativado' : 'desativado'}.`)
    } catch (error) {
      console.error('Falha ao alterar status do bairro:', error)
      setNeighborhoodManagerError(`Não foi possível alterar o status do bairro. ${error.message}`)
    } finally {
      setNeighborhoodActionName(null)
    }
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    if (authMode === 'signup') {
      if (!authForm.userType) {
        setAuthMessage('Selecione seu perfil para continuar.')
        return
      }
      if (['pessoa_fisica', 'corretor'].includes(authForm.userType) && !hasValidCpf(authForm.cpf)) {
        setAuthMessage('Informe um CPF válido.')
        return
      }
      if (authForm.userType === 'corretor' && !hasValidCreci(authForm.creci)) {
        setAuthMessage('Informe um CRECI válido.')
        return
      }
      if (authForm.userType === 'imobiliaria' && !hasValidCnpj(authForm.cnpj)) {
        setAuthMessage('Informe um CNPJ válido.')
        return
      }
    }
    if (!supabase) {
      setAuthMessage('O acesso à conta estará disponível assim que o serviço for configurado.')
      return
    }
    setAuthLoading(true)
    setAuthMessage('')
    let result
    try {
      result = authMode === 'login'
        ? await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password })
        : await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: { data: {
            full_name: authForm.name || authForm.responsibleName,
            tipo_usuario: authForm.userType,
            cpf: authForm.cpf ? onlyDigits(authForm.cpf) : null,
            creci: authForm.creci.trim().toUpperCase() || null,
            telefone: onlyDigits(authForm.phone),
            nome_imobiliaria: authForm.companyName.trim() || null,
            cnpj: authForm.cnpj ? onlyDigits(authForm.cnpj) : null,
            nome_responsavel: authForm.responsibleName.trim() || null,
          } },
        })
    } catch (error) {
      setAuthMessage(`Não foi possível conectar ao Supabase. Confira a URL do projeto e tente novamente. (${error.message})`)
      setAuthLoading(false)
      return
    }

    if (result.error) {
      const errorText = result.error.message.toLowerCase()
      if (result.error.code === '23505' || errorText.includes('duplicate key')) {
        setAuthMessage(errorText.includes('cnpj')
          ? 'Este CNPJ já possui uma conta cadastrada.'
          : errorText.includes('creci')
            ? 'Este CRECI já possui uma conta cadastrada.'
            : errorText.includes('cpf')
              ? 'Este CPF já possui uma conta cadastrada.'
              : `Não foi possível concluir o cadastro. ${result.error.message}`)
      } else if (errorText.includes('informe um cpf válido')) {
        setAuthMessage('Informe um CPF válido.')
      } else if (errorText.includes('informe um creci válido')) {
        setAuthMessage('Informe um CRECI válido.')
      } else if (errorText.includes('informe um cnpj válido')) {
        setAuthMessage('Informe um CNPJ válido.')
      } else {
        setAuthMessage(`Supabase: ${result.error.message}`)
      }
    } else if (authMode === 'signup' && !result.data.session) {
      setAuthMessage('Conta criada. Confira seu e-mail para confirmar o cadastro.')
    } else {
      setAuthOpen(false)
      setAuthForm(emptyAuthForm)
      setAuthSignupStep('profile')
      if (favoriteReturnPath) {
        navigateToPath(favoriteReturnPath)
        setFavoriteReturnPath('')
      }
    }
    setAuthLoading(false)
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!supabase || !authUser) {
      setProfileMessage('É necessário entrar na conta para editar os dados.')
      return
    }

    const updates = { telefone: onlyDigits(profileEditForm.phone || '') }
    if (['pessoa_fisica', 'corretor'].includes(accountUserType)) {
      updates.nome_completo = profileEditForm.name.trim()
    }
    if (accountUserType === 'imobiliaria') {
      updates.nome_responsavel = profileEditForm.responsibleName.trim()
    }

    setProfileSaving(true)
    setProfileMessage('')
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', authUser.id)
        .select('user_id, tipo_usuario, nome_completo, cpf, creci, telefone, nome_imobiliaria, cnpj, nome_responsavel, public_slug, public_city, public_description, public_logo_url, public_cover_url, public_display_name, public_slogan, public_phone, public_whatsapp, public_instagram, public_facebook, public_website, public_business_hours')
        .maybeSingle()
      if (error) throw error
      if (!data) {
        throw new Error('Nenhum perfil foi atualizado. O perfil desta conta não foi encontrado ou a política de atualização do Supabase não está aplicada. Confira a migração supabase/migrations/20261119_make_account_identifiers_immutable.sql.')
      }
      setUserProfile(data)
      setProfileEditing(false)
      setProfileMessage('Dados atualizados com sucesso.')
    } catch (error) {
      console.error('Falha ao atualizar os dados da conta:', error)
      const message = String(error.message || '').toLowerCase()
      setProfileMessage(message.includes('cpf') || message.includes('user_profiles_cpf')
        ? 'Este CPF já possui uma conta cadastrada.'
        : message.includes('cnpj') || message.includes('user_profiles_cnpj')
          ? 'Este CNPJ já possui uma conta cadastrada.'
          : message.includes('creci') || message.includes('user_profiles_creci')
            ? 'Este CRECI já possui uma conta cadastrada.'
            : `Não foi possível atualizar seus dados. ${error.message}`)
    } finally {
      setProfileSaving(false)
    }
  }

  const startProfileEditing = () => {
    setProfileEditForm({
      name: accountProfile.name,
      phone: formatPhone(accountProfile.phone),
      responsibleName: accountProfile.responsibleName,
    })
    setProfileEditing(true)
    setProfileMessage('')
  }

  const selectCompanyPublicImage = (event, imageKind) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setCompanyPublicImageError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCompanyPublicImageError('Escolha uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setCompanyPublicImageError('A imagem deve ter no máximo 8 MB.')
      return
    }
    discardCompanyPublicImageCrop()
    setCompanyPublicImageCrop({ file, imageKind })
    setCompanyPublicSaveError('')
    setCompanyPublicSaveMessage('')
  }

  const applyCompanyPublicImageCrop = (file) => {
    const crop = companyPublicImageCrop
    if (!crop) return
    const previewUrl = URL.createObjectURL(file)
    if (crop.imageKind === 'logo') {
      if (companyPublicLogoPreviewRef.current) URL.revokeObjectURL(companyPublicLogoPreviewRef.current)
      companyPublicLogoPreviewRef.current = previewUrl
      setCompanyPublicLogoPreview(previewUrl)
      setCompanyPublicLogoFile(file)
    } else {
      if (companyPublicCoverPreviewRef.current) URL.revokeObjectURL(companyPublicCoverPreviewRef.current)
      companyPublicCoverPreviewRef.current = previewUrl
      setCompanyPublicCoverPreview(previewUrl)
      setCompanyPublicCoverFile(file)
    }
    discardCompanyPublicImageCrop()
    setCompanyPublicImageError('')
    setCompanyPublicSaveError('')
    setCompanyPublicSaveMessage('')
  }

  const saveCompanyPublicProfile = async () => {
    if (!supabase
      || !authUser
      || !['corretor', 'imobiliaria'].includes(accountUserType)
      || !publicCompanyProfile.data
      || publicCompanyProfile.data.user_id !== authUser.id
      || publicCompanyProfile.data.account_type !== accountUserType) {
      setCompanyPublicSaveError('Somente o proprietário autenticado pode editar este perfil.')
      return
    }
    setCompanyPublicSaving(true)
    setCompanyPublicSaveError('')
    setCompanyPublicSaveMessage('')

    try {
      const updates = {
        public_display_name: companyPublicDraft.display_name.trim() || null,
        public_slogan: companyPublicDraft.slogan.trim() || null,
        public_city: companyPublicDraft.city.trim() || null,
        public_description: companyPublicDraft.description.trim() || null,
        public_phone: onlyDigits(companyPublicDraft.phone || '') || null,
        public_whatsapp: onlyDigits(companyPublicDraft.whatsapp || '') || null,
        public_instagram: companyPublicDraft.instagram.trim() || null,
        public_facebook: companyPublicDraft.facebook.trim() || null,
        public_website: companyPublicDraft.website.trim() || null,
        public_business_hours: companyPublicDraft.business_hours.trim() || null,
      }

      const uploadCompanyImage = async (file, imageKind) => {
        if (!file) return null
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
        const path = `${authUser.id}/company-profile/${imageKind}-${crypto.randomUUID()}.${extension}`
        const { error } = await supabase.storage
          .from('property-images')
          .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false })
        if (error) throw error
        const { data } = supabase.storage.from('property-images').getPublicUrl(path)
        if (!data?.publicUrl) throw new Error('O Storage não retornou o endereço público da imagem.')
        return data.publicUrl
      }

      const [logoUrl, coverUrl] = await Promise.all([
        uploadCompanyImage(companyPublicLogoFile, 'logo'),
        uploadCompanyImage(companyPublicCoverFile, 'cover'),
      ])
      if (logoUrl) updates.public_logo_url = logoUrl
      if (coverUrl) updates.public_cover_url = coverUrl

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', authUser.id)
        .select('public_display_name, public_slogan, public_city, public_description, public_phone, public_whatsapp, public_instagram, public_facebook, public_website, public_business_hours, public_logo_url, public_cover_url')
        .maybeSingle()
      if (error) throw error
      if (!data) {
        throw new Error('Nenhum perfil foi atualizado. Confira as permissões e execute supabase/migrations/20261129_enable_broker_public_profile_editing.sql no Supabase.')
      }

      const currentCompany = publicCompanyProfile.data
      const updatedCompany = {
        ...currentCompany,
        company_name: data.public_display_name?.trim() || accountProfile.companyName || accountProfile.name,
        slogan: data.public_slogan || '',
        city: data.public_city || '',
        description: data.public_description || '',
        phone: data.public_phone || accountProfile.phone || '',
        whatsapp: data.public_whatsapp || data.public_phone || accountProfile.phone || '',
        instagram: data.public_instagram || '',
        facebook: data.public_facebook || '',
        website: data.public_website || '',
        business_hours: data.public_business_hours || '',
        logo_url: data.public_logo_url || '',
        cover_url: data.public_cover_url || '',
      }
      setPublicCompanyProfile((current) => ({ ...current, data: updatedCompany }))
      setCompanyPublicDraft({
        display_name: updatedCompany.company_name,
        slogan: updatedCompany.slogan,
        city: updatedCompany.city,
        description: updatedCompany.description,
        phone: updatedCompany.phone,
        whatsapp: updatedCompany.whatsapp,
        instagram: updatedCompany.instagram,
        facebook: updatedCompany.facebook,
        website: updatedCompany.website,
        business_hours: updatedCompany.business_hours,
        logo_url: updatedCompany.logo_url,
        cover_url: updatedCompany.cover_url,
      })
      clearCompanyPublicImagePreviews()
      setCompanyPublicLogoFile(null)
      setCompanyPublicCoverFile(null)
      setCompanyPublicActiveField('')
      setCompanyPublicSaveMessage('Perfil público atualizado com sucesso.')
    } catch (error) {
      console.error('Falha ao salvar o perfil público profissional:', error)
      const errorDetail = String(error.message || 'Erro desconhecido.')
      const migrationHint = /permission denied|42501|row-level security/i.test(errorDetail)
        ? ' Confira se supabase/migrations/20261129_enable_broker_public_profile_editing.sql foi executada no Supabase.'
        : /public_cover_url|schema cache|column .* does not exist/i.test(errorDetail)
        ? ' Confira se supabase/migrations/20261126_company_public_profile_editor.sql foi executada no Supabase.'
        : ''
      setCompanyPublicSaveError(`Não foi possível salvar as alterações. ${errorDetail}${migrationHint}`)
    } finally {
      setCompanyPublicSaving(false)
    }
  }

  const updateAccountPassword = async (event) => {
    event.preventDefault()
    setPasswordMessage({ text: '', error: false })

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirmation) {
      setPasswordMessage({ text: 'Preencha todos os campos de senha.', error: true })
      return
    }
    if (passwordForm.next !== passwordForm.confirmation) {
      setPasswordMessage({ text: 'As senhas não coincidem.', error: true })
      return
    }
    if (passwordForm.next.length < 8) {
      setPasswordMessage({ text: 'A nova senha deve ter no mínimo 8 caracteres.', error: true })
      return
    }
    if (!supabase || !authUser?.email) {
      setPasswordMessage({ text: 'Não foi possível atualizar a senha.', error: true })
      return
    }

    setPasswordSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: passwordForm.current,
      })
      if (signInError) throw signInError

      const { error } = await supabase.auth.updateUser({ password: passwordForm.next })
      if (error) throw error

      setPasswordForm({ current: '', next: '', confirmation: '' })
      setPasswordMessage({ text: 'Senha atualizada com sucesso.', error: false })
    } catch (error) {
      console.error('Falha ao atualizar a senha da conta:', error)
      setPasswordMessage({ text: 'Não foi possível atualizar a senha.', error: true })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    setIsAdmin(false)
    setAdminReviewListings([])
    setAdminReviewError('')
    setAdminReviewLoading(false)
    setUserListings([])
    setModerationMessage('')
    setFeaturedDrafts({})
  }

  const removeUserListing = async (id) => {
    if (!window.confirm('Excluir este anúncio? Esta ação não pode ser desfeita.')) return false

    try {
      if (isSupabaseConfigured && authUser) {
        const deleteQuery = supabase.from('listings').delete().eq('id', id)
        if (!isAdmin) deleteQuery.eq('user_id', authUser.id)
        const { error } = await deleteQuery
        if (error) throw error
      }
      setPublishedListings((current) => current.filter((item) => item.id !== id))
      setAdminReviewListings((current) => current.filter((item) => item.id !== id))
      setFeaturedListings((current) => current.filter((item) => item.id !== id))
      setUserListings((current) => current.filter((item) => item.id !== id))
      if (selectedListing?.id === id) closeDetails()
      return true
    } catch (error) {
      console.error('Falha ao excluir anúncio:', error)
      setModerationMessage(`Não foi possível excluir o anúncio: ${error.message}`)
      return false
    }
  }

  const changeListingStatus = async (listing, status, motivoReprovacao = null) => {
    setModerationError('')
    if (!supabase || !authUser) {
      const message = 'Não foi possível atualizar o anúncio: conexão com o Supabase ou sessão indisponível.'
      setModerationError(message)
      setModerationMessage(message)
      return false
    }

    const updates = { status, motivo_reprovacao: motivoReprovacao }
    let updatedListing
    setStatusSavingId(listing.id)

    try {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', listing.id)
        .select('*')
        .single()
      if (error) throw error
      if (data.status !== status) {
        throw new Error(`O banco manteve o status “${data.status || 'vazio'}” em vez de “${status}”.`)
      }
      const { data: verifiedData, error: verificationError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listing.id)
        .single()
      if (verificationError) throw verificationError
      if (verifiedData.status !== status) {
        throw new Error(`A atualização foi aceita, mas o banco retornou “${verifiedData.status || 'vazio'}” ao confirmar.`)
      }
      updatedListing = {
        ...verifiedData,
        coordinates: [verifiedData.latitude, verifiedData.longitude],
        location: `${verifiedData.neighborhood}, ${verifiedData.city || 'Ipuã-SP'}`,
        area: formatArea(verifiedData.area),
        parking_spaces: Number(verifiedData.parking_spaces ?? verifiedData.garages) || 0,
        owner: verifiedData.user_id === authUser.id,
      }
    } catch (error) {
      console.error('Falha ao atualizar status do anúncio:', error)
      const message = `Não foi possível atualizar o anúncio: ${error.message}`
      setModerationError(message)
      setModerationMessage(message)
      setStatusSavingId(null)
      return false
    }

    setUserListings((current) => current.map((item) => item.id === listing.id ? updatedListing : item))
    setPublishedListings((current) => current.map((item) => item.id === listing.id ? updatedListing : item))
    setAdminReviewListings((current) => current.filter((item) => item.id !== listing.id))
    setFeaturedListings((current) => {
      const remaining = current.filter((item) => item.id !== listing.id)
      return isApprovedListing(updatedListing) && updatedListing.destaque_home === true
        ? [...remaining, updatedListing]
        : remaining
    })
    setStatusSavingId(null)
    return true
  }

  const pauseListing = async (listing) => {
    if (await changeListingStatus(listing, 'pausado')) {
      setModerationMessage(`“${listing.title}” foi pausado.`)
      return true
    }
    return false
  }

  const reactivateListing = async (listing) => {
    if (listing.individual_validity_started_at) {
      if (!supabase || !authUser) {
        setListingValidityMessage({ text: 'Não foi possível reativar o anúncio: conexão com o Supabase ou sessão indisponível.', error: true })
        return false
      }

      setStatusSavingId(listing.id)
      setListingValidityMessage({ text: '', error: false })
      try {
        const { error } = await supabase.rpc('reactivate_individual_listing', {
          target_listing_id: listing.id,
        })
        if (error) throw error

        const { data, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listing.id)
          .eq('user_id', listing.user_id)
          .single()
        if (listingError) throw listingError
        if (data.status !== 'aprovado' || !data.individual_validity_started_at) {
          throw new Error('O anúncio não foi confirmado como reativado pelo banco.')
        }

        const updatedListing = {
          ...data,
          coordinates: [data.latitude, data.longitude],
          location: `${data.neighborhood}, ${data.city || 'Ipuã-SP'}`,
          area: formatArea(data.area),
          parking_spaces: Number(data.parking_spaces ?? data.garages) || 0,
          owner: true,
        }
        setUserListings((current) => current.map((item) => item.id === listing.id ? updatedListing : item))
        setPublishedListings((current) => current.map((item) => item.id === listing.id ? updatedListing : item))
        setFeaturedListings((current) => {
          const remaining = current.filter((item) => item.id !== listing.id)
          return isListingPubliclyAvailable(updatedListing) && updatedListing.destaque_home === true
            ? [...remaining, updatedListing]
            : remaining
        })
        setListingValidityNow(Date.now())
        setListingValidityMessage({ text: `“${listing.title}” foi reativado por mais 30 dias.`, error: false })
        if (isAdmin) setModerationMessage(`“${listing.title}” foi reativado por mais 30 dias.`)
        return true
      } catch (error) {
        console.error('Falha ao reativar anúncio de pessoa física:', error)
        const migrationHint = /(reactivate_individual_listing|schema cache|function .* does not exist)/i.test(error.message || '')
          ? ' Execute, nesta ordem, supabase/migrations/20261202_individual_listing_validity.sql e supabase/migrations/20261203_allow_admin_individual_listing_reactivation.sql no Supabase.'
          : ''
        setListingValidityMessage({
          text: `Não foi possível reativar o anúncio. ${error.message}${migrationHint}`,
          error: true,
        })
        if (isAdmin) setModerationMessage(`Não foi possível reativar o anúncio. ${error.message}${migrationHint}`)
        return false
      } finally {
        setStatusSavingId(null)
      }
    }

    if (await changeListingStatus(listing, 'aprovado')) {
      setModerationMessage(`“${listing.title}” foi reativado e está publicado.`)
      return true
    }
    return false
  }

  const saveFeaturedListing = async (event, listing, draft) => {
    event?.preventDefault()
    if (!isAdmin) return
    if (!supabase || !authUser) {
      setModerationMessage('Não foi possível salvar o destaque. Verifique a conexão com sua conta.')
      return
    }

    const order = Number(draft.ordemDestaque)
    if (draft.destaqueHome && (!Number.isInteger(order) || order < 1)) {
      setModerationMessage('Informe uma ordem de destaque inteira maior que zero.')
      return
    }

    setFeaturedSavingId(listing.id)
    setModerationMessage('')
    try {
      const updates = {
        destaque_home: draft.destaqueHome,
        ordem_destaque: draft.destaqueHome ? order : null,
      }
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', listing.id)
        .select('*')
        .single()
      if (error) throw error

      const updatedListing = {
        ...data,
        coordinates: [data.latitude, data.longitude],
        location: `${data.neighborhood}, ${data.city || 'Ipuã-SP'}`,
        area: formatArea(data.area),
        parking_spaces: Number(data.parking_spaces ?? data.garages) || 0,
        owner: data.user_id === authUser.id,
      }
      setUserListings((current) => current.map((item) => item.id === listing.id ? updatedListing : item))
      setPublishedListings((current) => current.map((item) => item.id === listing.id ? updatedListing : item))
      setFeaturedListings((current) => {
        const remaining = current.filter((item) => item.id !== listing.id)
        return isApprovedListing(updatedListing) && updatedListing.destaque_home === true
          ? [...remaining, updatedListing]
          : remaining
      })
      setFeaturedDrafts((current) => {
        const next = { ...current }
        delete next[listing.id]
        return next
      })
    } catch (error) {
      const missingFeaturedColumns = /(destaque_home|ordem_destaque)/i.test(error.message || '')
      setModerationMessage(missingFeaturedColumns
        ? `O banco ainda não tem os campos de destaque. Execute supabase/migrations/20261003_add_home_featured_listings.sql no SQL Editor do Supabase. Detalhe: ${error.message}`
        : `Não foi possível salvar o destaque: ${error.message}`)
    } finally {
      setFeaturedSavingId(null)
    }
  }

  const toggleAdminFeatured = (listing) => {
    const nextFeatured = !listing.destaque_home
    const nextOrder = nextFeatured
      ? publishedListings.reduce((highest, candidate) => (
        candidate.destaque_home
          ? Math.max(highest, Number(candidate.ordem_destaque) || 0)
          : highest
      ), 0) + 1
      : ''
    return saveFeaturedListing(null, listing, {
      destaqueHome: nextFeatured,
      ordemDestaque: nextOrder,
    })
  }

  const moveAdminFeatured = async (listing, adjacentListing) => {
    if (!isAdmin || !supabase || !adjacentListing || listing.id === adjacentListing.id) return
    const originalOrder = Number(listing.ordem_destaque)
    const adjacentOrder = Number(adjacentListing.ordem_destaque)
    if (!Number.isInteger(originalOrder) || !Number.isInteger(adjacentOrder)) {
      setModerationMessage('Não foi possível reorganizar os destaques: confira a ordem cadastrada.')
      return
    }

    setFeaturedSavingId(listing.id)
    setModerationMessage('')
    try {
      const { error: firstError } = await supabase
        .from('listings')
        .update({ ordem_destaque: adjacentOrder })
        .eq('id', listing.id)
      if (firstError) throw firstError

      const { error: secondError } = await supabase
        .from('listings')
        .update({ ordem_destaque: originalOrder })
        .eq('id', adjacentListing.id)
      if (secondError) {
        const { error: rollbackError } = await supabase
          .from('listings')
          .update({ ordem_destaque: originalOrder })
          .eq('id', listing.id)
        throw new Error(rollbackError
          ? `${secondError.message} A restauração da ordem anterior também falhou: ${rollbackError.message}`
          : secondError.message)
      }

      setPublishedListings((current) => current.map((item) => (
        item.id === listing.id ? { ...item, ordem_destaque: adjacentOrder }
          : item.id === adjacentListing.id ? { ...item, ordem_destaque: originalOrder }
            : item
      )))
      setUserListings((current) => current.map((item) => (
        item.id === listing.id ? { ...item, ordem_destaque: adjacentOrder }
          : item.id === adjacentListing.id ? { ...item, ordem_destaque: originalOrder }
            : item
      )))
      setFeaturedListings((current) => current.map((item) => (
        item.id === listing.id ? { ...item, ordem_destaque: adjacentOrder }
          : item.id === adjacentListing.id ? { ...item, ordem_destaque: originalOrder }
            : item
      )))
    } catch (error) {
      console.error('Falha ao reorganizar os destaques da Home:', error)
      setModerationMessage(`Não foi possível reorganizar os destaques. ${error.message}`)
    } finally {
      setFeaturedSavingId(null)
    }
  }

  const approveListing = async (listing) => {
    if (await changeListingStatus(listing, 'aprovado')) {
      setModerationMessage(`“${listing.title}” foi aprovado e já está publicado.`)
      return true
    }
    return false
  }

  const rejectListing = async (listing, submittedReason = rejectionReason) => {
    const reason = submittedReason.trim()
    if (!reason) {
      setModerationMessage('Informe o motivo da reprovação para continuar.')
      return false
    }
    if (await changeListingStatus(listing, 'reprovado', reason)) {
      setRejectionListingId(null)
      setRejectionReason('')
      setModerationMessage(`“${listing.title}” foi reprovado.`)
      return true
    }
    return false
  }

  const toggleAdminPermission = async (user) => {
    if (!supabase || !isAdmin || user.id === authUser?.id) return
    setAdminUserActionId(user.id)
    setAdminUsersError('')
    setAdminUsersMessage('')
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: user.isAdmin ? 'remove-admin' : 'promote-admin',
          targetUserId: user.id,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setAdminUsers((current) => current.map((currentUser) => (
        currentUser.id === user.id ? { ...currentUser, isAdmin: !user.isAdmin } : currentUser
      )))
      setAdminUsersMessage(user.isAdmin
        ? `A permissão administrativa de ${user.name || user.email} foi removida.`
        : `${user.name || user.email} agora é administrador.`)
    } catch (error) {
      console.error('Falha ao alterar permissão administrativa:', error)
      setAdminUsersError(`Não foi possível alterar a permissão administrativa. ${error.message}`)
    } finally {
      setAdminUserActionId(null)
    }
  }

  const completeListing = async (listing) => {
    if (await changeListingStatus(listing, 'concluido')) {
      setModerationMessage(`“${listing.title}” foi marcado como concluído.`)
      return true
    }
    return false
  }
  
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeDetails()
        setMapFullscreenOpen(false)
        setAnnouncementMapFullscreenOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const userFirstName = (() => {
    const metadata = authUser?.user_metadata || {}
    const profile = userProfile?.user_id === authUser?.id ? userProfile : null
    const userType = profile?.tipo_usuario || metadata.tipo_usuario
    const displayName = userType === 'imobiliaria'
      ? profile?.nome_imobiliaria || metadata.nome_imobiliaria
      : profile?.nome_completo || metadata.full_name
    const source = displayName || authUser?.email?.split('@')[0] || 'visitante'
    const first = source.trim().split(' ')[0]
    return first.charAt(0).toUpperCase() + first.slice(1)
  })()
  const accountUserProfile = userProfile?.user_id === authUser?.id ? userProfile : null
  const accountUserType = accountUserProfile?.tipo_usuario || authUser?.user_metadata?.tipo_usuario || ''
  const isStandardAccount = ['pessoa_fisica', 'corretor'].includes(accountUserType)
  const isCompanyAccount = accountUserType === 'imobiliaria'
  const isPublicProfessionalAccount = ['corretor', 'imobiliaria'].includes(accountUserType)
  const visibleAccountSection = isStandardAccount
    && !['account', 'favorites'].includes(accountSection)
    && !(accountUserType === 'corretor' && accountSection === 'public-profile')
    && !(isAdmin && accountSection === 'admin')
    ? 'listings'
    : isCompanyAccount && accountSection === 'overview'
      ? 'dashboard'
      : accountSection
  const isCompanyDashboard = isCompanyAccount && visibleAccountSection === 'dashboard'
  const accountDisplayName = accountUserType === 'imobiliaria'
    ? accountUserProfile?.nome_imobiliaria || authUser?.user_metadata?.nome_imobiliaria || 'Imobiliária'
    : accountUserProfile?.nome_completo || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Usuário'
  const accountProfile = {
    name: accountUserProfile?.nome_completo || authUser?.user_metadata?.full_name || '',
    cpf: accountUserProfile?.cpf || authUser?.user_metadata?.cpf || '',
    creci: accountUserProfile?.creci || authUser?.user_metadata?.creci || '',
    phone: accountUserProfile?.telefone || authUser?.user_metadata?.telefone || '',
    companyName: accountUserProfile?.nome_imobiliaria || authUser?.user_metadata?.nome_imobiliaria || '',
    publicSlug: accountUserProfile?.public_slug || '',
    publicCity: accountUserProfile?.public_city || '',
    publicDescription: accountUserProfile?.public_description || '',
    publicLogoUrl: accountUserProfile?.public_logo_url || '',
    publicCoverUrl: accountUserProfile?.public_cover_url || '',
    publicDisplayName: accountUserProfile?.public_display_name || '',
    publicSlogan: accountUserProfile?.public_slogan || '',
    publicPhone: accountUserProfile?.public_phone || '',
    publicWhatsapp: accountUserProfile?.public_whatsapp || '',
    publicInstagram: accountUserProfile?.public_instagram || '',
    publicFacebook: accountUserProfile?.public_facebook || '',
    publicWebsite: accountUserProfile?.public_website || '',
    publicBusinessHours: accountUserProfile?.public_business_hours || '',
    cnpj: accountUserProfile?.cnpj || authUser?.user_metadata?.cnpj || '',
    responsibleName: accountUserProfile?.nome_responsavel || authUser?.user_metadata?.nome_responsavel || '',
    email: authUser?.email || '',
  }

  const getListingStatusKey = (item) => {
    const status = String(item.status || '').trim().toLocaleLowerCase('pt-BR')
    if (['aprovado', 'disponível', 'disponivel', 'ativo', 'pausado'].includes(status)
      && isIndividualListingExpired(item, listingValidityNow)) return 'expired'
    if (status === 'em_analise' || status === 'em análise') return 'pending'
    if (status === 'reprovado') return 'rejected'
    if (status === 'pausado') return 'paused'
    if (status === 'concluido' || status.includes('conclu') || status.includes('vend') || status.includes('expir')) return 'completed'
    return 'published'
  }
  const getListingStatusLabel = (item) => ({
    pending: 'Em análise',
    published: 'Publicado',
    expired: 'Expirado',
    rejected: 'Reprovado',
    paused: 'Pausado',
    completed: 'Concluído',
  })[getListingStatusKey(item)]
  const pendingListings = userListings.filter((item) => getListingStatusKey(item) === 'pending')
  const adminPendingListings = isAdmin ? adminReviewListings : []
  const activeListings = userListings.filter((item) => getListingStatusKey(item) === 'published')
  const expiredListings = userListings.filter((item) => getListingStatusKey(item) === 'expired')
  const pausedListings = userListings.filter((item) => getListingStatusKey(item) === 'paused')
  const rejectedListings = userListings.filter((item) => getListingStatusKey(item) === 'rejected')
  const completedListings = userListings.filter((item) => getListingStatusKey(item) === 'completed')
  const visibleAccountListings = accountFilter === 'manage' && isAdmin
    ? publishedListings
    : accountFilter === 'review' && isAdmin
      ? adminPendingListings
    : accountFilter === 'pending' ? pendingListings
    : accountFilter === 'published' ? activeListings
      : accountFilter === 'expired' ? expiredListings
      : accountFilter === 'paused' ? pausedListings
      : accountFilter === 'rejected' ? rejectedListings
        : accountFilter === 'completed' ? completedListings : userListings
  const standardAccountListings = visibleAccountListings.filter((item) => (
    listingPurposeFilter === 'all' || getListingPurpose(item) === listingPurposeFilter
  ))
  const ownFeaturedListings = authUser
    ? userListings
      .filter((item) => item.user_id === authUser.id && item.destaque_home === true && isListingPubliclyAvailable(item, listingValidityNow))
      .sort((first, second) => Number(first.ordem_destaque) - Number(second.ordem_destaque))
    : []
  const totalListingViews = userListings.reduce((total, item) => total + (Number(item.visualizacoes) || 0), 0)
  const totalWhatsAppClicks = userListings.reduce((total, item) => total + (Number(item.whatsapp_clicks) || 0), 0)
  const companyPeriodRangeKey = `${appliedCompanyPeriod.start}:${appliedCompanyPeriod.end}`
  const companyPeriodMetricsReady = companyPeriodMetrics.userId === authUser?.id
    && companyPeriodMetrics.range === companyPeriodRangeKey
    && companyPeriodMetrics.status === 'loaded'
  const companyPeriodListings = userListings.map((item) => {
    const counts = companyPeriodMetricsReady ? companyPeriodMetrics.counts[String(item.id)] : null
    return {
      ...item,
      visualizacoes: counts?.visualizacoes ?? 0,
      whatsapp_clicks: counts?.whatsapp_clicks ?? 0,
      favoritos: counts?.favoritos ?? 0,
    }
  })
  const companyPeriodTotalViews = companyPeriodListings.reduce((total, item) => total + item.visualizacoes, 0)
  const companyPeriodTotalWhatsAppClicks = companyPeriodListings.reduce((total, item) => total + item.whatsapp_clicks, 0)
  const companyPeriodTotalFavorites = companyPeriodListings.reduce((total, item) => total + item.favoritos, 0)
  const companyAverageInterestRate = companyPeriodTotalViews > 0
    ? (companyPeriodTotalWhatsAppClicks / companyPeriodTotalViews) * 100
    : 0
  const mostViewedListing = [...companyPeriodListings]
    .sort((first, second) => (Number(second.visualizacoes) || 0) - (Number(first.visualizacoes) || 0))[0] || null
  const mostWhatsAppClickedListing = [...companyPeriodListings]
    .sort((first, second) => (Number(second.whatsapp_clicks) || 0) - (Number(first.whatsapp_clicks) || 0))[0] || null
  const calculateInterestRate = (viewsValue, clicksValue) => {
    const views = Number(viewsValue) || 0
    const clicks = Number(clicksValue) || 0
    return views > 0 ? (clicks / views) * 100 : 0
  }
  const interestRate = (item) => calculateInterestRate(item?.visualizacoes, item?.whatsapp_clicks)
  const formatPercentage = (rate) => `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rate)}%`
  const formatInterestRate = (item) => formatPercentage(interestRate(item))
  const highestInterestListing = [...companyPeriodListings]
    .filter((item) => (Number(item.visualizacoes) || 0) > 0)
    .sort((first, second) => (
      interestRate(second) - interestRate(first)
      || (Number(second.whatsapp_clicks) || 0) - (Number(first.whatsapp_clicks) || 0)
      || String(first.title || '').localeCompare(String(second.title || ''), 'pt-BR')
    ))[0] || null
  const rankedStatisticsListings = [...companyPeriodListings]
    .sort((first, second) => (
      (Number(second.visualizacoes) || 0) - (Number(first.visualizacoes) || 0)
      || (Number(second.whatsapp_clicks) || 0) - (Number(first.whatsapp_clicks) || 0)
      || String(first.title || '').localeCompare(String(second.title || ''), 'pt-BR')
    ))
  const statisticsSearchTerm = statisticsSearch.trim().toLocaleLowerCase('pt-BR')
  const filteredStatisticsListings = rankedStatisticsListings.filter((item) => (
    !statisticsSearchTerm
    || String(item.title || '').toLocaleLowerCase('pt-BR').includes(statisticsSearchTerm)
    || String(item.neighborhood || getListingLocation(item) || '').toLocaleLowerCase('pt-BR').includes(statisticsSearchTerm)
  ))
  const statisticsListings = [...filteredStatisticsListings].sort((first, second) => {
    const firstValue = statisticsSort.key === 'taxa'
      ? interestRate(first)
      : Number(first[statisticsSort.key]) || 0
    const secondValue = statisticsSort.key === 'taxa'
      ? interestRate(second)
      : Number(second[statisticsSort.key]) || 0
    const comparison = firstValue - secondValue
    return (statisticsSort.direction === 'desc' ? -comparison : comparison)
      || String(first.title || '').localeCompare(String(second.title || ''), 'pt-BR')
  })
  const toggleStatisticsSort = (key) => setStatisticsSort((current) => ({
    key,
    direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
  }))
  const highViewsNoClicksListings = companyPeriodListings.filter((item) => (
    (Number(item.visualizacoes) || 0) >= 50 && (Number(item.whatsapp_clicks) || 0) === 0
  ))
  const zeroViewListings = companyPeriodListings.filter((item) => (Number(item.visualizacoes) || 0) === 0)
  const dashboardChartListings = rankedStatisticsListings.slice(0, 6)
  const dashboardChartMaxViews = Math.max(0, ...dashboardChartListings.map((item) => Number(item.visualizacoes) || 0))
  const dashboardWhatsAppListings = [...companyPeriodListings]
    .sort((first, second) => (
      (Number(second.whatsapp_clicks) || 0) - (Number(first.whatsapp_clicks) || 0)
      || String(first.title || '').localeCompare(String(second.title || ''), 'pt-BR')
    ))
    .slice(0, 4)
  const dashboardMaxWhatsAppClicks = Math.max(0, ...dashboardWhatsAppListings.map((item) => Number(item.whatsapp_clicks) || 0))
  const periodActiveListings = companyPeriodListings.filter((item) => getListingStatusKey(item) === 'published')
  const boroughPerformance = [...periodActiveListings.reduce((boroughs, item) => {
    const name = String(item.neighborhood || '').trim().replace(/\s+/g, ' ') || 'Bairro não informado'
    const key = normalizeNeighborhoodName(name)
    const borough = boroughs.get(key) || {
      name,
      listingCount: 0,
      visualizacoes: 0,
      whatsapp_clicks: 0,
      favoritos: companyPeriodMetricsReady ? 0 : null,
    }
    borough.listingCount += 1
    borough.visualizacoes += Number(item.visualizacoes) || 0
    borough.whatsapp_clicks += Number(item.whatsapp_clicks) || 0
    if (borough.favoritos !== null) borough.favoritos += item.favoritos
    boroughs.set(key, borough)
    return boroughs
  }, new Map()).values()]
    .sort((first, second) => (
      second.visualizacoes - first.visualizacoes
      || second.whatsapp_clicks - first.whatsapp_clicks
      || second.listingCount - first.listingCount
      || first.name.localeCompare(second.name, 'pt-BR')
    ))
  const topBoroughs = boroughPerformance.slice(0, 5)
  const highestVolumeBorough = boroughPerformance.find((borough) => borough.visualizacoes > 0) || null
  const highestInterestBorough = [...boroughPerformance]
    .filter((borough) => borough.visualizacoes > 0)
    .sort((first, second) => (
      calculateInterestRate(second.visualizacoes, second.whatsapp_clicks)
      - calculateInterestRate(first.visualizacoes, first.whatsapp_clicks)
      || second.whatsapp_clicks - first.whatsapp_clicks
      || first.name.localeCompare(second.name, 'pt-BR')
    ))[0] || null
  const latestUserListings = [...userListings]
    .sort((first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime())
  const visibleRecentListings = recentListingsExpanded ? latestUserListings : latestUserListings.slice(0, 3)
  const favoriteListingIds = favoriteData.userId === authUser?.id ? favoriteData.ids : []
  const favoriteListingsLoading = Boolean(authUser && favoriteData.userId !== authUser.id)
  const favoriteListings = favoriteListingIds
    .map((id) => publicPublishedListings.find((item) => String(item.id) === String(id)))
    .filter(Boolean)
  const professionalDirectoryRoute = getRelativeAppPath(currentPath) === 'profissionais'
  const companyPublicRouteSlug = getPublicProfessionalSlugFromPath(currentPath)
  const activePublicCompanyProfile = publicCompanyProfile.slug === companyPublicRouteSlug
    ? publicCompanyProfile
    : {
      slug: companyPublicRouteSlug,
      status: companyPublicRouteSlug ? (supabase ? 'loading' : 'error') : 'idle',
      data: null,
      error: 'O perfil público profissional precisa estar conectado ao Supabase.',
    }
  const normalizedProfessionalSearch = normalizeNeighborhoodName(professionalSearch)
  const filteredProfessionalProfiles = professionalDirectory.profiles.filter((profile) => {
    const categoryMatches = professionalCategory === 'all' || profile.professional_type === professionalCategory
    const searchableText = normalizeNeighborhoodName([
      profile.professional_name,
      profile.city,
    ].filter(Boolean).join(' '))
    return categoryMatches && (!normalizedProfessionalSearch || searchableText.includes(normalizedProfessionalSearch))
  })
  const professionalCategoryCounts = {
    all: professionalDirectory.profiles.length,
    imobiliaria: professionalDirectory.profiles.filter((profile) => profile.professional_type === 'imobiliaria').length,
    corretor: professionalDirectory.profiles.filter((profile) => profile.professional_type === 'corretor').length,
  }
  const visibleProfessionalProfiles = [...filteredProfessionalProfiles]
    .sort((first, second) => first.professional_name.localeCompare(second.professional_name, 'pt-BR'))
  const companyPublicListings = activePublicCompanyProfile.data
    ? publicPublishedListings
      .filter((item) => item.user_id === activePublicCompanyProfile.data.user_id)
      .sort((first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime())
    : []
  const companyPublicNeighborhoods = [...new Set(companyPublicListings
    .map((item) => String(item.neighborhood || '').trim())
    .filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, 'pt-BR'))
  const companyPublicCategories = [...new Map(companyPublicListings.map((item) => {
    const category = getListingPropertyType(item)
    return [category.key, category.label]
  })).entries()]
    .sort((first, second) => first[1].localeCompare(second[1], 'pt-BR'))
  const companyPublicPurposes = new Set(companyPublicListings.map(getListingPurpose))
  const filteredCompanyPublicListings = companyPublicListings.filter((item) => {
    const query = normalizeNeighborhoodName(appliedCompanyListingFilters.search)
    const searchableText = normalizeNeighborhoodName([
      item.title,
      item.neighborhood,
      item.city,
      item.address,
      item.description,
    ].filter(Boolean).join(' '))
    return (!query || searchableText.includes(query))
      && (appliedCompanyListingFilters.purpose === 'all' || getListingPurpose(item) === appliedCompanyListingFilters.purpose)
      && (appliedCompanyListingFilters.category === 'all' || getListingPropertyType(item).key === appliedCompanyListingFilters.category)
      && (appliedCompanyListingFilters.neighborhood === 'all' || item.neighborhood === appliedCompanyListingFilters.neighborhood)
  })
  const sortedCompanyPublicListings = sortListingsByOrder(filteredCompanyPublicListings, companySortOrder)
  const selectCompanyPeriod = (preset) => {
    setCompanyPeriodPreset(preset)
    setCompanyPeriodValidationError('')
    if (preset === 'custom') return

    const range = getCompanyPeriodRange(preset)
    setCompanyPeriodStart(range.start)
    setCompanyPeriodEnd(range.end)
    setAppliedCompanyPeriod({ preset, ...range })
  }
  const applyCustomCompanyPeriod = () => {
    if (!companyPeriodStart || !companyPeriodEnd) {
      setCompanyPeriodValidationError('Informe a data inicial e a data final.')
      return
    }
    if (companyPeriodStart > companyPeriodEnd) {
      setCompanyPeriodValidationError('A data inicial deve ser anterior ou igual à data final.')
      return
    }
    setCompanyPeriodValidationError('')
    setAppliedCompanyPeriod({
      preset: 'custom',
      start: companyPeriodStart,
      end: companyPeriodEnd,
    })
  }
  const shareCompanyPublicProfile = async () => {
    setPublicProfileShareMessage('')
    try {
      if (navigator.share) {
        await navigator.share({
          title: activePublicCompanyProfile.data?.company_name || 'Perfil da imobiliária',
          url: window.location.href,
        })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href)
        setPublicProfileShareMessage('Link copiado.')
      } else {
        throw new Error('O compartilhamento não está disponível neste navegador.')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Falha ao compartilhar o perfil público da imobiliária:', error)
        setPublicProfileShareMessage('Não foi possível compartilhar o perfil agora.')
      }
    }
  }

  const handleToggleFavorite = useCallback(async (listing) => {
    if (!authUser) {
      pendingFavoriteListingRef.current = listing
      setAuthMode('login')
      setAuthMessage('Entre na sua conta para salvar imóveis nos favoritos.')
      setAuthOpen(true)
      if (getRelativeAppPath(window.location.pathname).startsWith('imovel/')) {
        setFavoriteReturnPath(window.location.pathname)
        navigateToPath(getAppBasePath())
      }
      return
    }
    if (favoriteActionId !== null) return
    if (favoriteData.userId !== authUser.id) return
    if (!supabase) {
      setFavoriteMessage('Não foi possível acessar o serviço de favoritos. Tente novamente mais tarde.')
      return
    }
    if (!listing.user_id) {
      setFavoriteMessage('Este anúncio de demonstração não pode ser salvo nos favoritos.')
      return
    }

    setFavoriteActionId(listing.id)
    setFavoriteMessage('')
    const isFavorite = favoriteData.ids.some((id) => String(id) === String(listing.id))
    try {
      const { error } = isFavorite
        ? await supabase
          .from('favorites')
          .delete()
          .eq('user_id', authUser.id)
          .eq('listing_id', listing.id)
        : await supabase
          .from('favorites')
          .insert({ user_id: authUser.id, listing_id: listing.id })
      if (error) throw error

      setFavoriteData((current) => {
        const currentIds = current.userId === authUser.id ? current.ids : []
        return {
          userId: authUser.id,
          ids: isFavorite
            ? currentIds.filter((id) => String(id) !== String(listing.id))
            : [listing.id, ...currentIds],
        }
      })
    } catch (error) {
      console.error('Falha ao atualizar os imóveis favoritos:', error)
      setFavoriteMessage(`Não foi possível atualizar seus favoritos. ${error.message}`)
    } finally {
      setFavoriteActionId(null)
    }
  }, [authUser, favoriteActionId, favoriteData])

  useEffect(() => {
    if (!authUser || favoriteListingsLoading || !pendingFavoriteListingRef.current) return
    const listing = pendingFavoriteListingRef.current
    pendingFavoriteListingRef.current = null
    handleToggleFavorite(listing)
  }, [authUser, favoriteListingsLoading, handleToggleFavorite])

  const recordListingView = useCallback(async (listing) => {
    if (!supabase || !listing.user_id || authUser?.id === listing.user_id) return

    try {
      const { data, error } = await supabase.rpc('increment_listing_views', {
        target_listing_id: listing.id,
      })
      if (error) throw error
      if (data === null) return

      const visualizacoes = Number(data) || 0
      setPublishedListings((current) => current.map((item) => (
        item.id === listing.id
          ? { ...item, visualizacoes: Math.max(Number(item.visualizacoes) || 0, visualizacoes) }
          : item
      )))
      setUserListings((current) => current.map((item) => (
        item.id === listing.id
          ? { ...item, visualizacoes: Math.max(Number(item.visualizacoes) || 0, visualizacoes) }
          : item
      )))
    } catch (error) {
      console.error('Falha ao registrar visualização do imóvel:', error)
    }
  }, [authUser?.id])
  const recordWhatsAppClick = useCallback(async (listing) => {
    if (!supabase || !listing.user_id) return

    try {
      const { data, error } = await supabase.rpc('increment_listing_whatsapp_clicks', {
        target_listing_id: listing.id,
      })
      if (error) throw error
      if (data === null) return

      const whatsappClicks = Number(data) || 0
      setPublishedListings((current) => current.map((item) => (
        item.id === listing.id
          ? { ...item, whatsapp_clicks: Math.max(Number(item.whatsapp_clicks) || 0, whatsappClicks) }
          : item
      )))
      setUserListings((current) => current.map((item) => (
        item.id === listing.id
          ? { ...item, whatsapp_clicks: Math.max(Number(item.whatsapp_clicks) || 0, whatsappClicks) }
          : item
      )))
    } catch (error) {
      console.error('Falha ao registrar clique no WhatsApp do imóvel:', error)
    }
  }, [])
  const loadPublicListingAdvertiser = useCallback(async (userId) => {
    if (!supabase || !userId) return null
    const { data, error } = await supabase.rpc('get_public_listing_advertiser', {
      target_user_id: userId,
    })
    if (error) throw error
    return Array.isArray(data) ? data[0] || null : data || null
  }, [])

  const routeSlug = getListingSlugFromPath()
  if (routeSlug) {
    const detailSearchParams = new URLSearchParams(window.location.search)
    const routeListingId = detailSearchParams.get('id')
    const originType = detailSearchParams.get('origem')
    const originSlug = ['imobiliaria', 'profissional'].includes(originType)
      ? detailSearchParams.get('slug') || ''
      : ''
    const returnToProfessionalDirectory = detailSearchParams.get('retorno') === `${getAppBasePath()}profissionais/`
    const originTab = detailSearchParams.get('aba')
    const detailOrigin = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(originSlug)
      ? {
        type: originType === 'profissional' ? 'professional' : 'company',
        slug: originSlug,
        name: detailSearchParams.get('nome')?.trim() || (originType === 'profissional' ? 'Profissional' : 'Imobiliária'),
        returnToDirectory: returnToProfessionalDirectory,
        editing: detailSearchParams.get('edit') === '1',
        preview: detailSearchParams.get('preview') === '1',
        tab: ['showcase', 'about', 'contacts'].includes(originTab) ? originTab : 'showcase',
      }
      : null
    const routeListing = routeListingId
      ? listings.find((item) => String(item.id) === routeListingId && getListingSlug(item) === routeSlug)
      : listings.find((item) => getListingSlug(item) === routeSlug)
    if (routeListing) return (
      <ListingDetailPage
        listing={routeListing}
        origin={detailOrigin}
        onLoadAdvertiser={loadPublicListingAdvertiser}
        onView={recordListingView}
        onContactClick={recordWhatsAppClick}
        isFavorite={favoriteListingIds.some((id) => String(id) === String(routeListing.id))}
        favoriteBusy={favoriteActionId !== null || favoriteListingsLoading}
        favoriteMessage={favoriteMessage}
        onToggleFavorite={handleToggleFavorite}
      />
    )
  }

  if (professionalDirectoryRoute) {
    return (
      <div className="company-public-page professional-directory-page">
        <header className="company-public-header">
          <button type="button" className="company-public-brand" onClick={() => navigateToPath(getAppBasePath())}>
            <img src={logo} alt="" />
            <strong>Mora <span>Fácil</span></strong>
          </button>
          <button type="button" className="professional-directory-back portal-back-button" onClick={() => navigateToPath(getAppBasePath())}>
            <ArrowLeft size={18} aria-hidden="true" /> Voltar
          </button>
        </header>
        <main className="professional-directory-main">
          <header className="professional-directory-heading">
            <span>PROFISSIONAIS DO MORA FÁCIL</span>
            <h1>Encontre seu parceiro imobiliário</h1>
            <p>Conheça imobiliárias e corretores e explore seus imóveis.</p>
          </header>
          <form className="professional-directory-search-form" aria-label="Buscar profissionais" onSubmit={(event) => {
            event.preventDefault()
            setProfessionalSearch(professionalSearchInput)
          }}>
            <label className="professional-directory-search">
              <Search size={21} aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar por nome ou cidade"
                value={professionalSearchInput}
                onChange={(event) => setProfessionalSearchInput(event.target.value)}
                placeholder="Buscar por nome ou cidade"
              />
            </label>
            <button type="submit" className="professional-directory-search-button">Buscar</button>
          </form>
          <section className="professional-directory-results-controls" aria-label="Categorias dos profissionais">
            <div className="professional-directory-category-tabs" role="group" aria-label="Filtrar por categoria">
              {[
                ['all', 'Todos'],
                ['imobiliaria', 'Imobiliárias'],
                ['corretor', 'Corretores'],
              ].map(([category, label]) => (
                <button
                  type="button"
                  key={category}
                  aria-pressed={professionalCategory === category}
                  className={professionalCategory === category ? 'active' : ''}
                  onClick={() => setProfessionalCategory(category)}
                >{label} ({professionalCategoryCounts[category]})</button>
              ))}
            </div>
          </section>
          <p className="professional-directory-count" aria-live="polite">
            {professionalDirectory.status === 'loaded'
              ? `${visibleProfessionalProfiles.length} ${visibleProfessionalProfiles.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}`
              : ' '}
          </p>
          {['idle', 'loading'].includes(professionalDirectory.status) ? (
            <p className="professional-directory-feedback" role="status">Carregando perfis profissionais…</p>
          ) : professionalDirectory.status === 'error' ? (
            <p className="professional-directory-feedback error" role="alert">{professionalDirectory.error}</p>
          ) : visibleProfessionalProfiles.length === 0 ? (
            <p className="professional-directory-feedback" role="status">
              {professionalDirectory.profiles.length
                ? 'Nenhum perfil corresponde à busca. Tente outro nome ou cidade.'
                : 'Ainda não há perfis públicos de corretores ou imobiliárias disponíveis.'}
            </p>
          ) : (
            <div className="professional-directory-grid">
              {visibleProfessionalProfiles.map((profile) => {
                const profileName = profile.professional_name || (profile.professional_type === 'imobiliaria' ? 'Imobiliária' : 'Corretor')
                const profileLogo = getSafeExternalUrl(profile.logo_url)
                const profileCover = getSafeExternalUrl(profile.cover_url)
                const profileCity = String(profile.city || '').trim()
                  .replace(/[-,]\s*SP$/i, ' · SP') || 'Atendimento regional'
                const activeListingCount = Number(profile.active_listing_count) || 0
                return (
                  <article className="professional-directory-card" key={profile.slug}>
                    <div className="professional-directory-cover">
                      {profileCover ? (
                        <img src={profileCover} alt="" loading="lazy" />
                      ) : (
                        <svg className="professional-directory-cover-art" viewBox="0 0 360 112" fill="none" aria-hidden="true">
                          <path d="M0 94 72 70l67 22 71-32 75 29 75-19v42H0V94Z" fill="#E8F1F8" />
                          <path d="M34 88V59l32-21 32 21v29M44 88V63h44v25M60 88V71h14v17M122 88V48l41-24 41 24v40M134 88V52h58v36M151 88V65h18v23M226 88V44l43-22 43 22v44M239 88V49h60v39M258 88V65h20v23" stroke="#9BB3C8" strokeWidth="2" strokeLinejoin="round" />
                          <path d="M20 88c2-13 9-21 18-21s16 8 18 21M297 89c2-13 9-21 18-21s16 8 18 21M300 67c2-13 8-20 15-24 8 5 13 12 15 24" stroke="#A9C3B5" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div className="professional-directory-card-content">
                      <div className="professional-directory-card-heading">
                        {profileLogo ? (
                          <img src={profileLogo} alt="" loading="lazy" />
                        ) : (
                          <span className="professional-directory-avatar" aria-hidden="true">
                            {profile.professional_type === 'imobiliaria' ? <Building2 size={26} /> : <User size={26} />}
                          </span>
                        )}
                        <div>
                          <span className="professional-directory-type">{profile.professional_type === 'imobiliaria' ? 'IMOBILIÁRIA' : 'CORRETOR'}</span>
                          <h2>{profileName}</h2>
                        </div>
                      </div>
                      {profileCity && <p className="professional-directory-city"><MapPin size={16} aria-hidden="true" />{profileCity}</p>}
                      <div className="professional-directory-card-footer">
                        <span><House size={18} aria-hidden="true" />{activeListingCount > 0 ? `${activeListingCount} ${activeListingCount === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}` : 'Nenhum imóvel publicado'}</span>
                        <button
                          type="button"
                          className={activeListingCount > 0 ? 'has-listings' : ''}
                          onClick={() => navigateToPath(getPublicProfessionalProfilePath(profile.slug), { returnTo: window.location.pathname })}
                        >
                          Ver perfil <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
        <footer className="site-footer professional-directory-footer">
          <div className="site-footer-container">
            <p className="site-footer-copyright">
              © 2026 <strong>Mora <b>Fácil</b></strong>. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  if (companyPublicRouteSlug) {
    const company = activePublicCompanyProfile.data
    const isPublicProfessionalOwner = Boolean(
      authUser
      && company?.user_id === authUser.id
      && ['corretor', 'imobiliaria'].includes(accountUserType)
      && company?.account_type === accountUserType,
    )
    const publicProfessionalRole = company?.account_type === 'corretor' ? 'Corretor' : 'Imobiliária'
    const publicProfessionalArticle = publicProfessionalRole === 'Corretor' ? 'o corretor' : 'a imobiliária'
    const isCompanyPublicEditSession = isPublicProfessionalOwner && companyPublicEditMode
    const isCompanyPublicEditing = isCompanyPublicEditSession && !companyPublicPreviewMode
    const companyPublicOriginalDraft = {
      display_name: company?.company_name || '',
      slogan: company?.slogan || '',
      city: company?.city || '',
      description: company?.description || '',
      phone: company?.phone || '',
      whatsapp: company?.whatsapp || '',
      instagram: company?.instagram || '',
      facebook: company?.facebook || '',
      website: company?.website || '',
      business_hours: company?.business_hours || '',
      logo_url: company?.logo_url || '',
      cover_url: company?.cover_url || '',
    }
    const companyPublicDisplay = company ? {
      ...company,
      company_name: companyPublicDraft.display_name ?? company.company_name,
      slogan: companyPublicDraft.slogan ?? company.slogan,
      city: companyPublicDraft.city ?? company.city,
      description: companyPublicDraft.description ?? company.description,
      phone: companyPublicDraft.phone ?? company.phone,
      whatsapp: companyPublicDraft.whatsapp ?? company.whatsapp,
      instagram: companyPublicDraft.instagram ?? company.instagram,
      facebook: companyPublicDraft.facebook ?? company.facebook,
      website: companyPublicDraft.website ?? company.website,
      business_hours: companyPublicDraft.business_hours ?? company.business_hours,
      logo_url: companyPublicDraft.logo_url ?? company.logo_url,
      cover_url: companyPublicDraft.cover_url ?? company.cover_url,
    } : null
    const visibleCompanyName = companyPublicDisplay?.company_name?.trim()
      || company?.company_name
      || (company?.account_type === 'corretor' ? 'Corretor' : 'Imobiliária')
    const isProfessionalDirectoryProfile = getRelativeAppPath(currentPath).split('/')[0] === 'profissionais'
    const professionalDirectoryReturnPath = getProfessionalDirectoryReturnPath()
    const companyListingOrigin = {
      type: isProfessionalDirectoryProfile ? 'professional' : 'company',
      slug: companyPublicRouteSlug,
      name: visibleCompanyName,
      returnToDirectory: Boolean(professionalDirectoryReturnPath),
      editing: isCompanyPublicEditSession,
      preview: companyPublicPreviewMode,
      tab: companyPublicTab,
    }
    const companyInitials = String(visibleCompanyName).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
    const hasCompanyPublicChanges = isCompanyPublicEditSession && (
      Boolean(companyPublicLogoFile || companyPublicCoverFile)
      || Object.entries(companyPublicOriginalDraft).some(([field, value]) => (companyPublicDraft[field] ?? '') !== value)
    )
    const cancelCompanyPublicEditing = () => {
      setCompanyPublicDraft(companyPublicOriginalDraft)
      setCompanyPublicLogoFile(null)
      setCompanyPublicCoverFile(null)
      clearCompanyPublicImagePreviews()
      setCompanyPublicActiveField('')
      setCompanyPublicSaveError('')
      setCompanyPublicSaveMessage('')
      setCompanyPublicEditMode(false)
      setCompanyPublicPreviewMode(false)
      navigateToPath(isProfessionalDirectoryProfile
        ? getPublicProfessionalProfilePath(companyPublicRouteSlug)
        : getCompanyPublicProfilePath(companyPublicRouteSlug))
    }
    const renderCompanyPublicField = (field, label, options = {}) => {
      const { multiline = false, type = 'text', placeholder = `Adicionar ${label.toLocaleLowerCase('pt-BR')}`, maxLength = 300, className = '', id, dashed = false } = options
      const fieldValue = companyPublicDraft[field] ?? ''
      const displayValue = field === 'phone' || field === 'whatsapp' ? formatPhone(fieldValue) : fieldValue || placeholder
      return (
        <div id={id} className={`company-public-inline-editor ${className}${multiline ? ' multiline' : ''}${dashed ? ' dashed' : ''}`}>
          {isCompanyPublicEditing && companyPublicActiveField === field ? (
            multiline ? (
              <textarea
                autoFocus
                value={companyPublicDraft[field] || ''}
                placeholder={placeholder}
                maxLength={maxLength}
                  onChange={(event) => {
                    setCompanyPublicDraft((draft) => ({ ...draft, [field]: event.target.value }))
                    setCompanyPublicSaveError('')
                    setCompanyPublicSaveMessage('')
                  }}
              />
            ) : (
              <input
                autoFocus
                type={type}
                value={type === 'tel' ? formatPhone(companyPublicDraft[field] || '') : companyPublicDraft[field] || ''}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={(event) => {
                  setCompanyPublicDraft((draft) => ({ ...draft, [field]: event.target.value }))
                  setCompanyPublicSaveError('')
                  setCompanyPublicSaveMessage('')
                }}
              />
            )
          ) : (
            <button
              type="button"
              className="company-public-inline-value"
              disabled={!isCompanyPublicEditing}
              onClick={() => isCompanyPublicEditing && setCompanyPublicActiveField(field)}
              aria-label={isCompanyPublicEditing ? `Editar ${label}` : undefined}
            >{displayValue}</button>
          )}
        </div>
      )
    }
    const phoneDigits = String(companyPublicDisplay?.phone || '').replace(/\D/g, '')
    const whatsappDigits = String(companyPublicDisplay?.whatsapp || '').replace(/\D/g, '')
    const phoneContactNumber = phoneDigits
      ? phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`
      : ''
    const whatsappContactNumber = whatsappDigits
      ? whatsappDigits.startsWith('55') ? whatsappDigits : `55${whatsappDigits}`
      : ''
    const instagramUrl = getSafeExternalUrl(companyPublicDisplay?.instagram)
    const facebookUrl = getSafeExternalUrl(companyPublicDisplay?.facebook)
    const websiteUrl = getSafeExternalUrl(companyPublicDisplay?.website)
    const companyCity = companyPublicDisplay?.city
      || companyPublicListings[0]?.city
      || 'Cidade não informada'
    const companyCityLabel = String(companyCity).replace(/[-,]\s*SP$/i, ' · SP')

    return (
      <div className="company-public-page">
        <header className="company-public-header">
          <button type="button" className="company-public-brand" onClick={() => navigateToPath(getAppBasePath())}>
            <img src={logo} alt="" />
            <strong>Mora <span>Fácil</span></strong>
          </button>
          <button
            type="button"
            className="company-public-portal-link portal-back-button"
            onClick={() => {
              if (professionalDirectoryReturnPath) {
                if (window.history.state?.returnTo === professionalDirectoryReturnPath) {
                  window.history.back()
                } else {
                  navigateToPath(professionalDirectoryReturnPath)
                }
              } else if (isPublicProfessionalOwner) {
                navigateToPath(getAccountSectionPath('public-profile'))
              } else if (isProfessionalDirectoryProfile) {
                navigateToPath(getAppBasePath())
              } else {
                navigateBackToInternalPage()
              }
            }}
          >
            <ArrowLeft size={18} aria-hidden="true" /> Voltar
          </button>
        </header>
        {isCompanyPublicEditing && companyPublicImageCrop && (
          <CompanyProfileImageCropDialog
            file={companyPublicImageCrop.file}
            imageKind={companyPublicImageCrop.imageKind}
            onCancel={discardCompanyPublicImageCrop}
            onApply={applyCompanyPublicImageCrop}
          />
        )}
        <main className={`company-public-main${isCompanyPublicEditing ? ' edit-mode' : ''}`}>
          {isCompanyPublicEditSession && (
            <div className="company-public-edit-toolbar">
              <div className="company-public-edit-toolbar-title">
                <Pencil size={18} aria-hidden="true" />
                <strong>Modo de edição</strong>
              </div>
              <span className={`company-public-edit-status${hasCompanyPublicChanges ? ' pending' : ''}`}>
                {hasCompanyPublicChanges ? 'Alterações não publicadas' : 'Rascunho salvo'}
              </span>
              <div className="company-public-mode-toggle" role="tablist" aria-label="Modo de visualização do perfil">
                <button type="button" role="tab" aria-selected={!companyPublicPreviewMode} className={!companyPublicPreviewMode ? 'active' : ''} onClick={() => {
                  setCompanyPublicPreviewMode(false)
                  setCompanyPublicActiveField('')
                }}>Editar Perfil</button>
                <button type="button" role="tab" aria-selected={companyPublicPreviewMode} className={companyPublicPreviewMode ? 'active' : ''} onClick={() => {
                  setCompanyPublicPreviewMode(true)
                  setCompanyPublicActiveField('')
                }}>Pré-visualizar como cliente</button>
              </div>
              <div className="company-public-edit-toolbar-actions">
                <button type="button" disabled={companyPublicSaving} onClick={cancelCompanyPublicEditing}>Descartar</button>
                <button type="button" disabled={companyPublicSaving || !hasCompanyPublicChanges} onClick={saveCompanyPublicProfile}>
                  {companyPublicSaving ? 'Publicando…' : 'Publicar alterações'}
                </button>
              </div>
              {(companyPublicImageError || companyPublicSaveError) && <p className="company-public-save-error company-public-toolbar-feedback" role="alert">{companyPublicImageError || companyPublicSaveError}</p>}
              {companyPublicSaveMessage && <p className="company-public-save-message company-public-toolbar-feedback" role="status">{companyPublicSaveMessage}</p>}
            </div>
          )}
          {activePublicCompanyProfile.status === 'loading' ? (
            <p className="company-public-feedback" role="status">Carregando perfil profissional…</p>
          ) : activePublicCompanyProfile.status === 'error' ? (
            <p className="company-public-feedback error" role="alert">{activePublicCompanyProfile.error}</p>
          ) : activePublicCompanyProfile.status === 'not-found' ? (
            <p className="company-public-feedback" role="status">Este perfil público não foi encontrado ou ainda não está disponível.</p>
          ) : company && (
            <>
              {(companyPublicDisplay.cover_url || isCompanyPublicEditing) && (
                <section className={`company-public-cover${isCompanyPublicEditing ? ' editable' : ''}`} aria-label="Capa do perfil profissional">
                  {(companyPublicCoverPreview || companyPublicDisplay.cover_url) && <img src={companyPublicCoverPreview || companyPublicDisplay.cover_url} alt="" />}
                  {isCompanyPublicEditing && !companyPublicDisplay.cover_url && !companyPublicCoverPreview && (
                    <span className="company-public-cover-prompt">Adicione uma imagem de capa para apresentar seu perfil profissional.</span>
                  )}
                  {isCompanyPublicEditing && (
                    <label className="company-public-image-trigger cover-trigger">
                      <span><Camera size={16} aria-hidden="true" /> Alterar capa</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectCompanyPublicImage(event, 'cover')} />
                    </label>
                  )}
                </section>
              )}
              <section className={`company-public-identity${companyPublicDisplay.cover_url || isCompanyPublicEditing ? ' with-cover' : ''}`} aria-labelledby="company-public-name">
                <div className="company-public-logo-wrap">
                  {(companyPublicLogoPreview || companyPublicDisplay.logo_url) ? (
                    <img className="company-public-logo" src={companyPublicLogoPreview || companyPublicDisplay.logo_url} alt={`Logo de ${visibleCompanyName}`} />
                  ) : (
                    <span className="company-public-logo-placeholder" aria-label={`Logo de ${visibleCompanyName}`}>
                      <Leaf size={32} strokeWidth={2.2} aria-hidden="true" />
                      <strong>{companyInitials}</strong>
                    </span>
                  )}
                  {isCompanyPublicEditing && (
                    <label className="company-public-image-trigger logo-trigger" aria-label="Alterar logo" title="Alterar logo">
                      <span><Camera size={16} aria-hidden="true" /></span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectCompanyPublicImage(event, 'logo')} />
                    </label>
                  )}
                </div>
                <div className="company-public-copy">
                  <span className="company-public-eyebrow">{publicProfessionalRole}</span>
                  {isCompanyPublicEditSession
                    ? renderCompanyPublicField('display_name', 'nome público', { placeholder: company.company_name, maxLength: 120, className: 'company-public-name-editor', id: 'company-public-name' })
                    : <h1 id="company-public-name">{visibleCompanyName}</h1>}
                  <p className="company-public-city"><MapPin size={17} aria-hidden="true" />{isCompanyPublicEditSession ? renderCompanyPublicField('city', 'cidade', { placeholder: companyCityLabel, maxLength: 100, className: 'company-public-city' }) : companyCityLabel}</p>
                  {isCompanyPublicEditSession
                    ? renderCompanyPublicField('slogan', 'slogan', { placeholder: 'Seu próximo imóvel está aqui.', maxLength: 160, className: 'company-public-slogan-editor', dashed: isCompanyPublicEditing })
                    : companyPublicDisplay.slogan && <p className="company-public-slogan">{companyPublicDisplay.slogan}</p>}
                  <div className="company-public-actions">
                    {whatsappContactNumber
                      ? <a className="company-public-whatsapp" href={`https://wa.me/${whatsappContactNumber}`} target="_blank" rel="noreferrer"><WhatsAppIcon size={18} /> Conversar no WhatsApp</a>
                      : <span className="company-public-whatsapp disabled">WhatsApp não informado</span>}
                    {isCompanyPublicEditing && <button type="button" className="company-public-share" onClick={() => setCompanyPublicTab('contacts')}><Pencil size={16} aria-hidden="true" /> Editar contato</button>}
                    <button type="button" className="company-public-share" onClick={shareCompanyPublicProfile}><Share2 size={18} aria-hidden="true" /> Compartilhar perfil</button>
                  </div>
                  {publicProfileShareMessage && <span className="company-public-share-feedback" role="status">{publicProfileShareMessage}</span>}
                </div>
                <div className="company-public-profile-stats">
                  <div className="company-public-profile-stat">
                    <House size={27} aria-hidden="true" />
                    <span><strong>{companyPublicListings.length} imóveis</strong><small>disponíveis</small></span>
                  </div>
                  <div className="company-public-profile-stat">
                    <Tag size={27} aria-hidden="true" />
                    <strong>{companyPublicPurposes.has('venda') && companyPublicPurposes.has('aluguel') ? 'Venda • Aluguel' : companyPublicPurposes.has('venda') ? 'Venda' : companyPublicPurposes.has('aluguel') ? 'Aluguel' : 'Consulte opções'}</strong>
                  </div>
                </div>
              </section>
              <nav className="company-public-tabs" aria-label="Seções do perfil público">
                {[
                  ['showcase', 'Vitrine e Imóveis'],
                  ['about', 'Sobre'],
                  ['contacts', 'Contatos e Redes'],
                ].map(([tab, title]) => (
                  <button type="button" key={tab} className={companyPublicTab === tab ? 'active' : ''} aria-current={companyPublicTab === tab ? 'page' : undefined} onClick={() => setCompanyPublicTab(tab)}>{title}</button>
                ))}
              </nav>
              {companyPublicTab === 'showcase' && <section className="company-public-showcase-content">
              <section className="company-public-search" aria-labelledby="company-public-search-title">
                <div className="company-public-section-heading">
                  <span className="company-public-section-eyebrow">Encontre o que procura</span>
                  <h2 id="company-public-search-title">Encontre seu imóvel</h2>
                </div>
                <form className="company-public-search-form" onSubmit={(event) => {
                  event.preventDefault()
                  setAppliedCompanyListingFilters(companyListingFilters)
                }}>
                  <label className="company-public-search-query">
                    <span className="sr-only">Buscar por título, bairro ou endereço</span>
                    <Search size={19} aria-hidden="true" />
                    <input
                      type="search"
                      value={companyListingFilters.search}
                      placeholder="Buscar por título ou bairro"
                      onChange={(event) => setCompanyListingFilters((filters) => ({ ...filters, search: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span className="sr-only">Finalidade</span>
                    <select value={companyListingFilters.purpose} onChange={(event) => setCompanyListingFilters((filters) => ({ ...filters, purpose: event.target.value }))}>
                      <option value="all">Venda e aluguel</option>
                      {companyPublicPurposes.has('venda') && <option value="venda">Venda</option>}
                      {companyPublicPurposes.has('aluguel') && <option value="aluguel">Aluguel</option>}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Tipo de imóvel</span>
                    <select value={companyListingFilters.category} onChange={(event) => setCompanyListingFilters((filters) => ({ ...filters, category: event.target.value }))}>
                      <option value="all">Tipo de imóvel</option>
                      {companyPublicCategories.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Bairro</span>
                    <select value={companyListingFilters.neighborhood} onChange={(event) => setCompanyListingFilters((filters) => ({ ...filters, neighborhood: event.target.value }))}>
                      <option value="all">Todos os bairros</option>
                      {companyPublicNeighborhoods.map((neighborhood) => <option value={neighborhood} key={neighborhood}>{neighborhood}</option>)}
                    </select>
                  </label>
                  <button type="submit"><Search size={18} aria-hidden="true" /> Buscar</button>
                </form>
              </section>
              <ListingShowcase
                listings={sortedCompanyPublicListings}
                companyOrigin={companyListingOrigin}
                heading="Todos os imóveis disponíveis"
                headingId="company-public-listings-title"
                showSortControl
                sortValue={companySortOrder}
                onSortChange={setCompanySortOrder}
                emptyMessage="Esta imobiliária ainda não possui imóveis publicados."
                favoriteListingIds={favoriteListingIds}
                favoriteActionId={favoriteActionId}
                favoriteMessage={favoriteMessage}
                onToggleFavorite={handleToggleFavorite}
              />
              <section className="company-public-contact-cta" aria-label={`Fale com ${publicProfessionalArticle}`}>
                <div className="company-public-contact-icon"><House size={24} aria-hidden="true" /></div>
                <div>
                  <h2>Não encontrou o imóvel ideal?</h2>
                  <p>Converse com {visibleCompanyName} para encontrar o imóvel que procura.</p>
                </div>
                {whatsappContactNumber ? (
                  <a className="company-public-whatsapp" href={`https://wa.me/${whatsappContactNumber}`} target="_blank" rel="noreferrer">
                    <WhatsAppIcon size={20} /> Conversar com {publicProfessionalRole}
                  </a>
                ) : (
                  <span className="company-public-whatsapp disabled">WhatsApp não informado</span>
                )}
              </section>
              </section>}
              {companyPublicTab === 'about' && (
                <section id="company-public-about" className="company-public-tab-panel" aria-labelledby="company-public-about-title">
                  <div className="company-public-tab-heading">
                    <div><span>Conheça nosso trabalho</span><h2 id="company-public-about-title">Sobre {visibleCompanyName}</h2></div>
                    {isCompanyPublicEditing && <span className="company-public-edit-hint">Clique no texto para editar</span>}
                  </div>
                  {isCompanyPublicEditSession
                    ? renderCompanyPublicField('description', 'Sobre', { multiline: true, placeholder: 'Conte brevemente sobre sua atuação profissional.', maxLength: 1000, className: 'company-public-about-editor' })
                    : companyPublicDisplay.description
                      ? <p className="company-public-about-description">{companyPublicDisplay.description}</p>
                      : <p className="company-public-about-empty">{publicProfessionalRole === 'Corretor' ? 'Este corretor ainda não adicionou uma apresentação.' : 'A imobiliária ainda não adicionou uma apresentação.'}</p>}
                </section>
              )}
              {companyPublicTab === 'contacts' && (
                <section className="company-public-tab-panel" aria-labelledby="company-public-contacts-title">
                  <div className="company-public-tab-heading">
                    <div><span>Estamos aqui para ajudar</span><h2 id="company-public-contacts-title">Contatos e Redes</h2></div>
                    {isCompanyPublicEditing && <span className="company-public-edit-hint">Clique em um contato para editar</span>}
                  </div>
                  <div className={`company-public-contact-details${isCompanyPublicEditing ? ' edit-mode' : ''}`}>
                    {(phoneContactNumber || isCompanyPublicEditing) && (
                      isCompanyPublicEditing
                        ? <div><Phone size={18} aria-hidden="true" /><div className="company-public-contact-value"><strong>Telefone</strong>{renderCompanyPublicField('phone', 'telefone', { type: 'tel', placeholder: 'Adicionar telefone', maxLength: 18 })}</div></div>
                        : (
                      <a href={`tel:+${phoneContactNumber}`}>
                        <Phone size={18} aria-hidden="true" /><span><strong>Telefone</strong>{formatPhone(companyPublicDisplay.phone)}</span>
                      </a>
                        )
                    )}
                    {(whatsappContactNumber || isCompanyPublicEditing) && (
                      isCompanyPublicEditing
                        ? <div><WhatsAppIcon size={18} /><div className="company-public-contact-value"><strong>WhatsApp</strong>{renderCompanyPublicField('whatsapp', 'WhatsApp', { type: 'tel', placeholder: 'Adicionar WhatsApp', maxLength: 18 })}</div></div>
                        : (
                      <a href={`https://wa.me/${whatsappContactNumber}`} target="_blank" rel="noreferrer">
                        <WhatsAppIcon size={18} /><span><strong>WhatsApp</strong>{formatPhone(companyPublicDisplay.whatsapp)}</span>
                      </a>
                        )
                    )}
                    {(instagramUrl || isCompanyPublicEditing) && (
                      isCompanyPublicEditing
                        ? <div><InstagramIcon className="public-social-icon" /><div className="company-public-contact-value"><strong>Instagram</strong>{renderCompanyPublicField('instagram', 'Instagram', { placeholder: 'Adicionar Instagram' })}</div></div>
                        : (
                      <a href={instagramUrl} target="_blank" rel="noreferrer">
                        <InstagramIcon className="public-social-icon" /><span><strong>Instagram</strong>{companyPublicDisplay.instagram}</span>
                      </a>
                        )
                    )}
                    {(facebookUrl || isCompanyPublicEditing) && (
                      isCompanyPublicEditing
                        ? <div><FacebookIcon className="public-social-icon" /><div className="company-public-contact-value"><strong>Facebook</strong>{renderCompanyPublicField('facebook', 'Facebook', { placeholder: 'Adicionar Facebook' })}</div></div>
                        : (
                      <a href={facebookUrl} target="_blank" rel="noreferrer">
                        <FacebookIcon className="public-social-icon" /><span><strong>Facebook</strong>{companyPublicDisplay.facebook}</span>
                      </a>
                        )
                    )}
                    {(websiteUrl || isCompanyPublicEditing) && (
                      isCompanyPublicEditing
                        ? <div><Globe2 size={18} aria-hidden="true" /><div className="company-public-contact-value"><strong>Site</strong>{renderCompanyPublicField('website', 'site', { placeholder: 'Adicionar site' })}</div></div>
                        : (
                      <a href={websiteUrl} target="_blank" rel="noreferrer">
                        <Globe2 size={18} aria-hidden="true" /><span><strong>Site</strong>{companyPublicDisplay.website}</span>
                      </a>
                        )
                    )}
                    {(companyPublicDisplay.business_hours || isCompanyPublicEditing) && (
                      isCompanyPublicEditing
                        ? <div><Clock3 size={18} aria-hidden="true" /><div className="company-public-contact-value"><strong>Horário de atendimento</strong>{renderCompanyPublicField('business_hours', 'horário de atendimento', { placeholder: 'Adicionar horário de atendimento' })}</div></div>
                        : (
                      <div>
                        <Clock3 size={18} aria-hidden="true" /><span><strong>Horário de atendimento</strong>{companyPublicDisplay.business_hours}</span>
                      </div>
                        )
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
        <footer className="company-public-signature">
          Anúncios verificados na plataforma <a href={getAppBasePath()}>Mora Fácil</a> • © 2026
        </footer>
      </div>
    )
  }

  return (
    <div className="real-estate-shell">
      <header className="top-header hero-header">
        <div className="desktop-nav-brand">
          <img src={logo} alt="" />
          <span>Mora <b>Fácil</b></span>
        </div>
        <div className="brand-group">
          <div className="brand-mark" aria-hidden="true">
            <img src={logo} alt="" className="brand-mark-img" />
          </div>
          <div className="brand-copy">
            <h1>Mora <span className="brand-highlight">Fácil</span></h1>
            <strong>Encontre seu próximo lar.</strong>
            <small>Imóveis do seu jeito, perto de você.</small>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="announce-btn" onClick={() => openAnnouncementForm()}>
            <span className="announce-plus">+</span> Anunciar imóvel
          </button>
          <span className="header-divider" aria-hidden="true" />
          <span className="header-avatar" role="img" aria-label={`Avatar de ${userFirstName}`}>{userFirstName.charAt(0)}</span>
          <button type="button" className="menu-toggle" aria-label="Abrir menu lateral" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}>
            <svg className="menu-toggle-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          {isSupabaseConfigured && !authUser && <button type="button" className="account-btn" onClick={() => setAuthOpen(true)}>Entrar</button>}
        </div>

        {isMyAreaRoute && (
          <section className="account-popover account-page" aria-label="Minha Área">
            {authUser ? (
            <>
            <div className={`my-area-layout${isStandardAccount ? ' standard-account' : ''}${isCompanyAccount ? ' company-account' : ''}`}>
              <aside className="my-area-sidebar" aria-label="Navegação da Minha Área">
                <button type="button" className="my-area-brand" onClick={() => navigateToPath(getAppBasePath())}>
                  <img src={logo} alt="" />
                  <strong>Mora <span>Fácil</span></strong>
                </button>
                <div className="my-area-user">
                  <span className="my-area-avatar">{userFirstName.charAt(0)}</span>
                  <div><strong>{accountDisplayName}</strong></div>
                </div>
                <nav className={`my-area-nav${isStandardAccount ? ' standard-account' : ''}${isCompanyAccount ? ' company-account' : ''}${isAdmin ? ' with-admin' : ''}`}>
                  {[
                    ...(isStandardAccount ? [
                    ['listings', Building2, 'Meus Imóveis'],
                    ['favorites', Heart, 'Favoritos'],
                    ...(accountUserType === 'corretor' ? [['public-profile', Globe2, 'Perfil Público']] : []),
                    ['account', User, 'Minha Conta'],
                  ] : isCompanyAccount ? [
                    ['dashboard', House, 'Dashboard'],
                    ['listings', Building2, 'Meus Imóveis'],
                    ['statistics', ChartNoAxesColumn, 'Estatísticas'],
                    ['public-profile', Globe2, 'Perfil Público'],
                    ['account', User, 'Minha Conta'],
                  ] : [
                    ['overview', House, 'Visão Geral'],
                    ['listings', Building2, 'Meus Imóveis'],
                    ['favorites', Heart, 'Favoritos'],
                    ['account', User, 'Minha Conta'],
                    ]),
                    ...(isAdmin ? [['admin', Shield, 'Administração']] : []),
                  ].map(([section, Icon, label]) => (
                    <button
                      key={section}
                      type="button"
                      className={visibleAccountSection === section ? 'active' : ''}
                      aria-current={visibleAccountSection === section ? 'page' : undefined}
                      onClick={() => { openMyArea(section); setProfileMessage(''); setFavoriteMessage('') }}
                    >
                      <span className="my-area-nav-icon" aria-hidden="true">
                        <Icon size={28} strokeWidth={2.2} />
                      </span>
                      <span className="my-area-nav-label">{label}</span>
                      <ChevronRight className="my-area-nav-chevron" size={20} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                  ))}
                </nav>
                <div className="my-area-sidebar-footer">
                  <button type="button" className="my-area-sidebar-action my-area-home-link portal-back-button" onClick={() => navigateToPath(getAppBasePath())}><ArrowLeft size={18} aria-hidden="true" />Voltar</button>
                </div>
              </aside>
              <main className="my-area-main">
              <header className={`my-area-topbar${(visibleAccountSection === 'overview' || isCompanyDashboard) ? ' overview' : ''}${isStandardAccount && visibleAccountSection === 'listings' ? ' listings-page' : ''}`}>
                  <div className="my-area-heading-copy">
                  {!(isStandardAccount && visibleAccountSection === 'listings') && <span>{visibleAccountSection === 'admin' ? 'Área administrativa' : isCompanyAccount ? 'Área da imobiliária' : visibleAccountSection === 'public-profile' && isPublicProfessionalAccount ? 'Perfil profissional' : visibleAccountSection === 'overview' || isStandardAccount ? 'Minha Área' : 'Área do usuário'}</span>}
                  <h1>{visibleAccountSection === 'admin' ? 'Administração' : isCompanyDashboard ? 'Dashboard' : visibleAccountSection === 'overview' ? 'Visão Geral' : visibleAccountSection === 'listings' ? 'Meus Imóveis' : visibleAccountSection === 'favorites' ? 'Favoritos' : visibleAccountSection === 'statistics' ? 'Estatísticas' : visibleAccountSection === 'public-profile' ? 'Perfil Público' : 'Minha Conta'}</h1>
                  {(visibleAccountSection === 'overview' || isCompanyDashboard) && <p>{isCompanyDashboard ? 'Acompanhe o desempenho dos seus imóveis.' : `Olá, ${accountDisplayName}. Acompanhe seus imóveis em um só lugar.`}</p>}
                  {isCompanyAccount && visibleAccountSection === 'statistics' && <p>Desempenho dos imóveis com base nos dados registrados.</p>}
                  </div>
                  {visibleAccountSection === 'overview' && (
                    <div className="my-area-topbar-actions">
                      <button type="button" className="my-area-create-listing" onClick={() => openAnnouncementForm()}><Plus size={isStandardAccount ? 24 : 28} strokeWidth={2.2} aria-hidden="true" /> Cadastrar Imóvel</button>
                    </div>
                  )}
                </header>
                {isCompanyDashboard && (
                  <nav className="company-dashboard-quick-links" aria-label="Atalhos rápidos do Dashboard">
                    <button type="button" onClick={() => openMyArea('listings')}><Building2 size={16} aria-hidden="true" />Gerenciar imóveis</button>
                    <button type="button" onClick={() => openMyArea('public-profile')}><Pencil size={16} aria-hidden="true" />Editar perfil público</button>
                    <button type="button" onClick={() => openMyArea('statistics')}><ChartNoAxesColumn size={16} aria-hidden="true" />Ver estatísticas completas</button>
                  </nav>
                )}
                {isCompanyAccount && (isCompanyDashboard || visibleAccountSection === 'statistics') && (
                  <section className="company-period-filter" aria-label="Filtro de período das métricas">
                    <label className="company-period-select">
                      <span>Período</span>
                      <select value={companyPeriodPreset} onChange={(event) => selectCompanyPeriod(event.target.value)}>
                        {companyPeriodOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    {companyPeriodPreset === 'custom' && (
                      <div className="company-period-custom">
                        <label>
                          <span>Data inicial</span>
                          <input type="date" value={companyPeriodStart} onChange={(event) => setCompanyPeriodStart(event.target.value)} />
                        </label>
                        <label>
                          <span>Data final</span>
                          <input type="date" value={companyPeriodEnd} onChange={(event) => setCompanyPeriodEnd(event.target.value)} />
                        </label>
                        <button type="button" onClick={applyCustomCompanyPeriod}>Aplicar</button>
                      </div>
                    )}
                    {receivedFavoriteCountError && <p className="company-period-feedback error" role="alert">{receivedFavoriteCountError}</p>}
                    {companyPeriodValidationError && <p className="company-period-feedback error" role="alert">{companyPeriodValidationError}</p>}
                    {companyPeriodMetricsError && <p className="company-period-feedback error" role="alert">{companyPeriodMetricsError}</p>}
                  </section>
                )}
              {(visibleAccountSection === 'overview' || isCompanyDashboard) && (
                  <>
                  {isCompanyAccount ? (
                    <>
                      <section className="my-area-stats-grid company-dashboard-stats company-statistics-stats" aria-label="Indicadores básicos dos imóveis">
                        <article className="my-area-stat-card">
                          <span className="my-area-stat-icon views" aria-hidden="true"><Eye size={28} strokeWidth={2.2} /></span>
                          <div><small>Visualizações</small><strong>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(companyPeriodTotalViews) : '—'}</strong></div>
                        </article>
                        <article className="my-area-stat-card">
                          <span className="whatsapp-icon-card" aria-hidden="true"><WhatsAppIcon size={32} /></span>
                          <div>
                            <small>Cliques WhatsApp</small>
                            <strong className="company-statistics-kpi-value">
                              <span>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(companyPeriodTotalWhatsAppClicks) : '—'}</span>
                              <small className="company-statistics-kpi-note">
                                {companyPeriodMetricsReady && companyPeriodTotalViews > 0 ? `${formatPercentage(companyAverageInterestRate)} conv.` : '— conv.'}
                              </small>
                            </strong>
                          </div>
                        </article>
                        <article className="my-area-stat-card">
                          <span className="my-area-stat-icon company-favorites" aria-hidden="true"><Heart size={28} strokeWidth={2.2} /></span>
                          <div><small>Favoritos</small><strong>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(companyPeriodTotalFavorites) : '—'}</strong></div>
                        </article>
                        <article className="my-area-stat-card">
                          <span className="my-area-stat-icon company-active" aria-hidden="true"><House size={28} strokeWidth={2.2} /></span>
                          <div><small>Imóveis ativos</small><strong>{new Intl.NumberFormat('pt-BR').format(activeListings.length)}</strong></div>
                        </article>
                      </section>
                      <div className="company-dashboard-overview-grid">
                        <section className="company-dashboard-panel company-dashboard-chart" aria-labelledby="company-dashboard-chart-title">
                          <header className="company-dashboard-panel-heading">
                            <div>
                              <h2 id="company-dashboard-chart-title">Desempenho no período</h2>
                              <p>Visualizações por imóvel no período selecionado</p>
                            </div>
                            <span className="company-dashboard-chart-legend"><i aria-hidden="true" /> Visualizações</span>
                          </header>
                          {!companyPeriodMetricsReady ? (
                            <p className="company-dashboard-empty">Aguardando métricas do período.</p>
                          ) : dashboardChartListings.length ? (
                            <div className="company-dashboard-chart-list" role="img" aria-label="Comparação de visualizações por imóvel no período selecionado">
                              {dashboardChartListings.map((item) => {
                                const views = Number(item.visualizacoes) || 0
                                const proportion = dashboardChartMaxViews > 0 ? (views / dashboardChartMaxViews) * 100 : 0
                                return (
                                  <div className="company-dashboard-chart-column" key={item.id} title={`${item.title}: ${new Intl.NumberFormat('pt-BR').format(views)} visualizações`}>
                                    <strong>{new Intl.NumberFormat('pt-BR').format(views)}</strong>
                                    <div className="company-dashboard-chart-bar-track"><span style={{ '--bar-size': `${proportion}%` }} /></div>
                                    <small title={item.title}>{item.title}</small>
                                  </div>
                                )
                              })}
                            </div>
                          ) : <p className="company-dashboard-empty">Cadastre imóveis para acompanhar as visualizações.</p>}
                          <p className="company-dashboard-chart-note">Exibindo eventos registrados dentro do período selecionado.</p>
                        </section>
                        <section className="company-dashboard-panel company-dashboard-whatsapp-ranking" aria-labelledby="company-dashboard-ranking-title">
                          <header className="company-dashboard-panel-heading">
                            <div><h2 id="company-dashboard-ranking-title">Mais cliques no WhatsApp</h2><p>Imóveis com mais cliques no período selecionado</p></div>
                          </header>
                          {!companyPeriodMetricsReady ? (
                            <p className="company-dashboard-empty">Aguardando métricas do período.</p>
                          ) : dashboardWhatsAppListings.length ? (
                            <ol>
                              {dashboardWhatsAppListings.map((item, index) => {
                                const clicks = Number(item.whatsapp_clicks) || 0
                                const width = dashboardMaxWhatsAppClicks > 0 ? (clicks / dashboardMaxWhatsAppClicks) * 100 : 0
                                return (
                                  <li key={item.id}>
                                    <div className="company-dashboard-ranking-label"><span>{index + 1}</span><strong title={item.title}>{item.title}</strong><b>{new Intl.NumberFormat('pt-BR').format(clicks)}</b></div>
                                    <div className="company-dashboard-ranking-track"><span style={{ width: `${width}%` }} /></div>
                                  </li>
                                )
                              })}
                            </ol>
                          ) : <p className="company-dashboard-empty">Seus imóveis aparecerão aqui.</p>}
                        </section>
                      </div>
                      <div className="company-dashboard-performance-grid">
                        <section className="company-dashboard-panel company-dashboard-listings-panel" aria-labelledby="company-dashboard-listings-title">
                          <header className="company-dashboard-panel-heading">
                            <div><h2 id="company-dashboard-listings-title">Desempenho dos imóveis</h2><p>Resumo dos anúncios no período selecionado</p></div>
                            <button type="button" onClick={() => openMyArea('listings')}>Ver todos <ExternalLink size={15} aria-hidden="true" /></button>
                          </header>
                          <p className="company-dashboard-table-scroll-hint">Deslize a tabela para ver todas as colunas, incluindo Editar →</p>
                          <div className="company-dashboard-table-scroll">
                            <table className="company-dashboard-table">
                              <thead><tr><th scope="col">Imóvel</th><th scope="col">Status</th><th scope="col">Visualizações</th><th scope="col">WhatsApp</th><th scope="col">Taxa de interesse</th><th scope="col">Ação</th></tr></thead>
                              <tbody>
                                {rankedStatisticsListings.slice(0, 7).map((item) => (
                                  <tr key={item.id}>
                                    <td>
                                      <div className="company-dashboard-table-property">
                                        {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span><House size={20} aria-hidden="true" /></span>}
                                        <div><strong>{item.title}</strong><small>{item.location || getListingLocation(item)}</small></div>
                                      </div>
                                    </td>
                                    <td><span className={`company-dashboard-status ${getListingStatusKey(item)}`}>{getListingStatusLabel(item)}</span></td>
                                    <td>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(Number(item.visualizacoes) || 0) : '—'}</td>
                                    <td>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(Number(item.whatsapp_clicks) || 0) : '—'}</td>
                                    <td>{companyPeriodMetricsReady ? formatInterestRate(item) : '—'}</td>
                                    <td><button className="company-dashboard-edit-button" type="button" onClick={() => openAnnouncementForm(item)} aria-label={`Editar ${item.title}`}><Pencil size={16} aria-hidden="true" /> Editar</button></td>
                                  </tr>
                                ))}
                                {!rankedStatisticsListings.length && <tr><td className="company-dashboard-table-empty" colSpan="6">Você ainda não cadastrou imóveis.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </section>
                        <aside className="company-dashboard-aside">
                          <section className="company-dashboard-panel company-dashboard-attention" aria-labelledby="company-dashboard-attention-title">
                            <header className="company-dashboard-panel-heading">
                              <div><h2 id="company-dashboard-attention-title">Pontos de atenção</h2><p>Anúncios que podem precisar de revisão</p></div>
                              <ChartNoAxesColumn size={20} aria-hidden="true" />
                            </header>
                            {!companyPeriodMetricsReady ? (
                              <p className="company-dashboard-empty">Aguardando métricas do período.</p>
                            ) : (
                              <div className="company-dashboard-attention-groups">
                                <section>
                                  <h3>Sem visualizações</h3>
                                  {zeroViewListings.length ? (
                                    <ul>{zeroViewListings.slice(0, 3).map((item) => (
                                      <li key={item.id}>
                                        <span>{item.title}</span>
                                        <button className="company-dashboard-edit-button" type="button" onClick={() => openAnnouncementForm(item)} aria-label={`Editar anúncio: ${item.title}`}><Pencil size={14} aria-hidden="true" />Editar anúncio</button>
                                      </li>
                                    ))}</ul>
                                  ) : <p className="company-dashboard-empty">Todos os imóveis tiveram visualizações.</p>}
                                </section>
                                <section>
                                  <h3>Muitas visualizações, sem cliques</h3>
                                  {highViewsNoClicksListings.length ? (
                                    <ul>{highViewsNoClicksListings.slice(0, 3).map((item) => (
                                      <li key={item.id}>
                                        <span>{item.title}<small>{new Intl.NumberFormat('pt-BR').format(item.visualizacoes)} visualizações</small></span>
                                        <button className="company-dashboard-edit-button" type="button" onClick={() => openAnnouncementForm(item)} aria-label={`Editar anúncio: ${item.title}`}><Pencil size={14} aria-hidden="true" />Editar anúncio</button>
                                      </li>
                                    ))}</ul>
                                  ) : <p className="company-dashboard-empty">Nenhum imóvel com 50 ou mais visualizações e zero cliques.</p>}
                                </section>
                              </div>
                            )}
                          </section>
                          <section className="company-dashboard-panel company-dashboard-most-viewed" aria-labelledby="company-dashboard-most-viewed-title">
                            <header className="company-dashboard-panel-heading"><div><h2 id="company-dashboard-most-viewed-title">Mais visualizado</h2></div><Eye size={20} aria-hidden="true" /></header>
                            {!companyPeriodMetricsReady ? (
                              <p className="company-dashboard-empty">Aguardando métricas do período.</p>
                            ) : mostViewedListing ? (
                              <div className="company-dashboard-most-viewed-property">
                                {mostViewedListing.image ? <img src={mostViewedListing.image} alt="" loading="lazy" /> : <span><House size={23} aria-hidden="true" /></span>}
                                <div><strong>{mostViewedListing.title}</strong><small>{mostViewedListing.location || getListingLocation(mostViewedListing)}</small><b>{new Intl.NumberFormat('pt-BR').format(Number(mostViewedListing.visualizacoes) || 0)} visualizações</b></div>
                              </div>
                            ) : <p className="company-dashboard-empty">Cadastre um imóvel para ver os destaques.</p>}
                          </section>
                        </aside>
                      </div>
                      <p className="my-area-metric-note"><span className="my-area-metric-note-content"><Info size={16} aria-hidden="true" />Cliques no WhatsApp não confirmam conversas iniciadas.</span></p>
                    </>
                  ) : (
                    <>
                    <section className="my-area-stats-grid" aria-label="Resumo dos imóveis">
                      <article className="my-area-stat-card">
                        <span className="my-area-stat-icon" aria-hidden="true"><House size={28} strokeWidth={2.2} /></span>
                        <div><small>Imóveis Cadastrados</small><strong>{userListings.length}</strong></div>
                      </article>
                      <article className="my-area-stat-card">
                        <span className="my-area-stat-icon views" aria-hidden="true"><Eye size={28} strokeWidth={2.2} /></span>
                        <div><small>Visualizações Totais</small><strong>{totalListingViews}</strong></div>
                      </article>
                      <article className="my-area-stat-card">
                        <span className="whatsapp-icon-card" aria-hidden="true"><WhatsAppIcon size={32} /></span>
                        <div><small>Cliques WhatsApp</small><strong>{totalWhatsAppClicks}</strong></div>
                      </article>
                    </section>
                    <section className="my-area-recent-listings" aria-labelledby="my-area-recent-title">
                      <header className="my-area-recent-heading">
                        <h2 id="my-area-recent-title">{recentListingsExpanded ? 'Todos os imóveis' : 'Últimos imóveis cadastrados'}</h2>
                        {latestUserListings.length > 3 && (
                          <button
                            type="button"
                            aria-expanded={recentListingsExpanded}
                            onClick={() => setRecentListingsExpanded((expanded) => !expanded)}
                          >
                            {recentListingsExpanded ? 'Ver menos' : `Ver todos os ${latestUserListings.length} imóveis`}
                            <span aria-hidden="true">{recentListingsExpanded ? '↑' : '→'}</span>
                          </button>
                        )}
                      </header>
                      {visibleRecentListings.length ? (
                        <>
                          <div className="my-area-table-scroll">
                            <table className="my-area-listings-table">
                              <colgroup>
                                <col className="my-area-column-property" />
                                <col className="my-area-column-price" />
                                <col className="my-area-column-status" />
                                <col className="my-area-column-views" />
                                <col className="my-area-column-whatsapp" />
                                <col className="my-area-column-actions" />
                              </colgroup>
                              <thead>
                                <tr>
                                  <th scope="col">Imóvel</th>
                                  <th scope="col">Preço</th>
                                  <th scope="col">Status</th>
                                  <th scope="col">Visualizações</th>
                                  <th scope="col">WhatsApp</th>
                                  <th scope="col">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visibleRecentListings.map((item) => {
                                  const statusKey = getListingStatusKey(item)
                                  const statusLabel = statusKey === 'published' ? 'Aprovado' : statusKey === 'expired' ? 'Expirado' : statusKey === 'pending' ? 'Pendente' : statusKey === 'paused' ? 'Pausado' : 'Inativo'
                                  return (
                                    <tr key={item.id}>
                                      <td>
                                        <div className="my-area-table-property">
                                          {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="my-area-table-image-placeholder" aria-hidden="true"><Home size={28} strokeWidth={2.2} /></span>}
                                          <div><strong>{item.title}</strong><small>{item.location || getListingLocation(item)} · {getListingPurposeLabel(item)}</small></div>
                                        </div>
                                      </td>
                                      <td className="my-area-table-price">{item.price}</td>
                                      <td><span className={`my-area-listing-status ${statusKey}`}><i aria-hidden="true" />{statusLabel}</span></td>
                                      <td className="my-area-table-metric"><Eye size={28} strokeWidth={2.2} aria-hidden="true" />{Number(item.visualizacoes) || 0}</td>
                                      <td className="my-area-table-metric whatsapp"><span className="whatsapp-icon-card compact" aria-hidden="true"><WhatsAppIcon size={22} /></span>{Number(item.whatsapp_clicks) || 0}</td>
                                      <td><button type="button" className="my-area-manage-listing" onClick={() => openAnnouncementForm(item)}><Settings2 size={28} strokeWidth={2.2} aria-hidden="true" />Gerenciar</button></td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          <footer className="my-area-table-footer">Exibindo {visibleRecentListings.length} de {userListings.length} imóveis</footer>
                        </>
                      ) : (
                        <p className="my-area-recent-empty">Você ainda não cadastrou imóveis.</p>
                      )}
                    </section>
                    <p className="my-area-metric-note"><span className="my-area-metric-note-content"><Info size={16} aria-hidden="true" />Cliques no WhatsApp não confirmam conversas iniciadas.</span></p>
                      </>
                    )}
                  </>
                )}
                {visibleAccountSection === 'statistics' && isCompanyAccount && (
                  <div className="company-statistics-page">
                    <section className="my-area-stats-grid company-dashboard-stats company-statistics-stats" aria-label="Indicadores de desempenho">
                      <article className="my-area-stat-card">
                        <span className="my-area-stat-icon views" aria-hidden="true"><Eye size={28} strokeWidth={2.2} /></span>
                        <div><small>Visualizações</small><strong>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(companyPeriodTotalViews) : '—'}</strong></div>
                      </article>
                      <article className="my-area-stat-card">
                        <span className="whatsapp-icon-card" aria-hidden="true"><WhatsAppIcon size={28} /></span>
                        <div>
                          <small>Cliques WhatsApp</small>
                          <strong className="company-statistics-kpi-value">
                            <span>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(companyPeriodTotalWhatsAppClicks) : '—'}</span>
                            <small className="company-statistics-kpi-note">
                              {companyPeriodMetricsReady && companyPeriodTotalViews > 0 ? `${formatPercentage(companyAverageInterestRate)} conv.` : '— conv.'}
                            </small>
                          </strong>
                        </div>
                      </article>
                      <article className="my-area-stat-card">
                        <span className="my-area-stat-icon company-favorites" aria-hidden="true"><Heart size={28} strokeWidth={2.2} /></span>
                        <div><small>Favoritos</small><strong>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(companyPeriodTotalFavorites) : '—'}</strong></div>
                      </article>
                      <article className="my-area-stat-card">
                        <span className="my-area-stat-icon company-active" aria-hidden="true"><House size={28} strokeWidth={2.2} /></span>
                        <div><small>Imóveis ativos</small><strong>{new Intl.NumberFormat('pt-BR').format(activeListings.length)}</strong></div>
                      </article>
                    </section>
                    <section className="company-statistics-table-card" aria-labelledby="company-statistics-table-title">
                      <header>
                        <div><h2 id="company-statistics-table-title">Desempenho dos imóveis</h2><p>Indicadores registrados no período selecionado.</p></div>
                        <label className="company-statistics-search">
                          <Search size={16} aria-hidden="true" />
                          <input
                            type="search"
                            aria-label="Buscar por título ou bairro"
                            value={statisticsSearch}
                            onChange={(event) => setStatisticsSearch(event.target.value)}
                            placeholder="Buscar título ou bairro"
                          />
                        </label>
                      </header>
                      {rankedStatisticsListings.length ? (
                        <div className="company-statistics-table-scroll">
                          <table className="company-statistics-table">
                            <thead>
                              <tr>
                                <th scope="col">Imóvel</th>
                                <th scope="col" aria-sort={statisticsSort.key === 'visualizacoes' ? (statisticsSort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                                  <button type="button" className="company-statistics-sort-button" onClick={() => toggleStatisticsSort('visualizacoes')}>Visualizações{statisticsSort.key === 'visualizacoes' && <span aria-hidden="true">{statisticsSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>}</button>
                                </th>
                                <th scope="col" aria-sort={statisticsSort.key === 'whatsapp_clicks' ? (statisticsSort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                                  <button type="button" className="company-statistics-sort-button" onClick={() => toggleStatisticsSort('whatsapp_clicks')}>WhatsApp{statisticsSort.key === 'whatsapp_clicks' && <span aria-hidden="true">{statisticsSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>}</button>
                                </th>
                                <th scope="col" aria-sort={statisticsSort.key === 'favoritos' ? (statisticsSort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                                  <button type="button" className="company-statistics-sort-button" onClick={() => toggleStatisticsSort('favoritos')}>Favoritos{statisticsSort.key === 'favoritos' && <span aria-hidden="true">{statisticsSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>}</button>
                                </th>
                                <th scope="col" aria-sort={statisticsSort.key === 'taxa' ? (statisticsSort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                                  <button type="button" className="company-statistics-sort-button" onClick={() => toggleStatisticsSort('taxa')}>Taxa de Interesse{statisticsSort.key === 'taxa' && <span aria-hidden="true">{statisticsSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>}</button>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {statisticsListings.length ? statisticsListings.map((item) => (
                                <tr key={item.id}>
                                  <td>
                                    <div className="company-statistics-property">
                                      {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span aria-hidden="true"><House size={22} /></span>}
                                      <div><strong>{item.title}</strong><small>{item.location || getListingLocation(item)}</small></div>
                                    </div>
                                  </td>
                                  <td>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(Number(item.visualizacoes) || 0) : '—'}</td>
                                  <td>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(Number(item.whatsapp_clicks) || 0) : '—'}</td>
                                  <td>{companyPeriodMetricsReady ? new Intl.NumberFormat('pt-BR').format(Number(item.favoritos) || 0) : '—'}</td>
                                  <td>{companyPeriodMetricsReady ? formatInterestRate(item) : '—'}</td>
                                </tr>
                              )) : <tr><td className="company-statistics-no-results" colSpan="5">Nenhum imóvel corresponde à busca.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      ) : <p className="company-statistics-empty">Você ainda não cadastrou imóveis.</p>}
                    </section>
                    <section className="company-borough-section" aria-labelledby="company-borough-title">
                      <header className="company-borough-section-heading">
                        <div>
                          <span className="company-borough-heading-icon" aria-hidden="true"><MapPin size={22} /></span>
                          <div>
                            <h2 id="company-borough-title">Bairros mais procurados</h2>
                            <p>Demanda registrada no período selecionado; imóveis ativos são o total atual.</p>
                          </div>
                        </div>
                      </header>
                      {!companyPeriodMetricsReady ? (
                        <p className="company-statistics-empty company-borough-empty">Aguardando métricas do período.</p>
                      ) : topBoroughs.length ? (
                        <>
                          <div className="company-borough-cards">
                            {topBoroughs.map((borough, index) => (
                              <article className="company-borough-card" key={normalizeNeighborhoodName(borough.name)}>
                                <header>
                                  <span className="company-borough-medal" aria-hidden="true">{['🥇', '🥈', '🥉'][index] || `${index + 1}.`}</span>
                                  <h3>{borough.name}</h3>
                                </header>
                                <strong className="company-borough-views">{new Intl.NumberFormat('pt-BR').format(borough.visualizacoes)} <span>visualizações</span></strong>
                                <div className="company-borough-card-metrics">
                                  <span><WhatsAppIcon size={17} />{new Intl.NumberFormat('pt-BR').format(borough.whatsapp_clicks)} cliques WhatsApp</span>
                                  <span><Building2 size={17} aria-hidden="true" />{new Intl.NumberFormat('pt-BR').format(borough.listingCount)} {borough.listingCount === 1 ? 'imóvel' : 'imóveis'}</span>
                                  <span><Heart size={17} aria-hidden="true" />                                                                    {borough.favoritos === null
                                    ? companyPeriodMetrics.status === 'loading' ? 'Carregando favoritos' : 'Favoritos indisponíveis'
                                    : `${new Intl.NumberFormat('pt-BR').format(borough.favoritos)} favoritos`}</span>
                                </div>
                              </article>
                            ))}
                          </div>
                          <section className="company-statistics-table-card company-borough-table-card" aria-labelledby="company-borough-table-title">
                            <header>
                              <div><h2 id="company-borough-table-title">Desempenho por bairro</h2><p>Bairros ordenados por visualizações dos imóveis ativos.</p></div>
                            </header>
                            <div className="company-statistics-table-scroll">
                              <table className="company-statistics-table company-borough-table">
                                <thead>
                                  <tr><th scope="col">Bairro</th><th scope="col">Imóveis</th><th scope="col">Visualizações</th><th scope="col">WhatsApp</th><th scope="col">Favoritos</th><th scope="col">Taxa de Interesse</th></tr>
                                </thead>
                                <tbody>
                                  {boroughPerformance.map((borough) => (
                                    <tr
                                      key={normalizeNeighborhoodName(borough.name)}
                                      className={highestInterestBorough?.name === borough.name ? 'company-borough-best-conversion' : ''}
                                    >
                                      <td><strong className="company-borough-table-name"><MapPin size={16} aria-hidden="true" />{borough.name}</strong></td>
                                      <td>{new Intl.NumberFormat('pt-BR').format(borough.listingCount)}</td>
                                      <td>{new Intl.NumberFormat('pt-BR').format(borough.visualizacoes)}</td>
                                      <td>{new Intl.NumberFormat('pt-BR').format(borough.whatsapp_clicks)}</td>
                                      <td>{borough.favoritos === null
                                        ? companyPeriodMetrics.status === 'loading' ? '…' : '—'
                                        : new Intl.NumberFormat('pt-BR').format(borough.favoritos)}</td>
                                      <td>{formatPercentage(calculateInterestRate(borough.visualizacoes, borough.whatsapp_clicks))}{highestInterestBorough?.name === borough.name && <span className="company-borough-best-label">Maior conversão</span>}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </section>
                        </>
                      ) : (
                        <p className="company-statistics-empty company-borough-empty">Não há imóveis ativos para apresentar dados por bairro.</p>
                      )}
                    </section>
                    <section className="company-statistics-actions" aria-labelledby="company-statistics-actions-title">
                      <header className="company-statistics-actions-heading">
                        <div><h2 id="company-statistics-actions-title">Alertas e ações recomendadas</h2><p>Leitura rápida dos resultados e próximos passos para seus anúncios.</p></div>
                      </header>
                      {!companyPeriodMetricsReady ? (
                        <p className="company-statistics-empty">Aguardando métricas do período.</p>
                      ) : (
                        <div className="company-statistics-actions-grid">
                          <article className="company-statistics-action-card">
                            <h3><Eye size={19} aria-hidden="true" />Destaques do período</h3>
                            <div className="company-statistics-highlights-list">
                              <div>
                                <span>Imóvel líder em visualizações</span>
                                <strong>{mostViewedListing && Number(mostViewedListing.visualizacoes) > 0 ? mostViewedListing.title : 'Sem visualizações no período'}</strong>
                                <small>{mostViewedListing && Number(mostViewedListing.visualizacoes) > 0 ? `${new Intl.NumberFormat('pt-BR').format(mostViewedListing.visualizacoes)} visualizações` : 'Os anúncios ainda não receberam acessos.'}</small>
                              </div>
                              <div>
                                <span>Imóvel líder em contatos WhatsApp</span>
                                <strong>{mostWhatsAppClickedListing && Number(mostWhatsAppClickedListing.whatsapp_clicks) > 0 ? mostWhatsAppClickedListing.title : 'Sem cliques no WhatsApp'}</strong>
                                <small>{mostWhatsAppClickedListing && Number(mostWhatsAppClickedListing.whatsapp_clicks) > 0 ? `${new Intl.NumberFormat('pt-BR').format(mostWhatsAppClickedListing.whatsapp_clicks)} cliques` : 'Nenhum clique foi registrado neste período.'}</small>
                              </div>
                              <div>
                                <span>Maior Taxa de Interesse</span>
                                <strong>{highestInterestListing ? highestInterestListing.title : 'Sem base para calcular'}</strong>
                                <small>{highestInterestListing ? `${formatInterestRate(highestInterestListing)} · ${new Intl.NumberFormat('pt-BR').format(highestInterestListing.visualizacoes)} visualizações` : 'A taxa depende de ao menos uma visualização.'}</small>
                              </div>
                              <div>
                                <span>Bairro com mais visualizações</span>
                                <strong>{highestVolumeBorough?.name || 'Sem dados por bairro'}</strong>
                                <small>{highestVolumeBorough ? `${new Intl.NumberFormat('pt-BR').format(highestVolumeBorough.visualizacoes)} visualizações` : 'Nenhuma visualização nos imóveis ativos.'}</small>
                              </div>
                              <div>
                                <span>Bairro com melhor conversão</span>
                                <strong>{highestInterestBorough?.name || 'Sem base para calcular'}</strong>
                                <small>{highestInterestBorough ? `${formatPercentage(calculateInterestRate(highestInterestBorough.visualizacoes, highestInterestBorough.whatsapp_clicks))} de interesse` : 'A taxa depende de ao menos uma visualização.'}</small>
                              </div>
                            </div>
                          </article>
                          <article className="company-statistics-action-card opportunities">
                            <h3><Lightbulb size={19} aria-hidden="true" />Oportunidades de melhoria</h3>
                            <section className="company-statistics-opportunity-group">
                              <h4>Boa visibilidade, nenhum contato</h4>
                              <p>Imóveis com 50 ou mais visualizações e nenhum clique no WhatsApp. Considere revisar preço, fotos e descrição.</p>
                              {highViewsNoClicksListings.length ? (
                                <ul>{highViewsNoClicksListings.map((item) => (
                                  <li key={item.id}>
                                    <div><strong>{item.title}</strong><small>{new Intl.NumberFormat('pt-BR').format(item.visualizacoes)} visualizações · 0 cliques</small></div>
                                    <button type="button" onClick={() => openAnnouncementForm(item)} aria-label={`Editar anúncio: ${item.title}`}><Pencil size={14} aria-hidden="true" />Editar anúncio</button>
                                  </li>
                                ))}</ul>
                              ) : <p className="company-statistics-opportunity-empty">Nenhum imóvel atingiu esse critério no período.</p>}
                            </section>
                            <section className="company-statistics-opportunity-group">
                              <h4>Sem visualizações no período</h4>
                              <p>Revise a apresentação ou divulgue estes anúncios para ampliar o alcance.</p>
                              {zeroViewListings.length ? (
                                <ul>{zeroViewListings.map((item) => (
                                  <li key={item.id}>
                                    <div><strong>{item.title}</strong><small>{item.location || getListingLocation(item)}</small></div>
                                    <button type="button" onClick={() => openAnnouncementForm(item)} aria-label={`Editar anúncio: ${item.title}`}><Pencil size={14} aria-hidden="true" />Editar anúncio</button>
                                  </li>
                                ))}</ul>
                              ) : <p className="company-statistics-opportunity-empty">Todos os imóveis tiveram ao menos uma visualização.</p>}
                            </section>
                          </article>
                        </div>
                      )}
                    </section>
                    <p className="my-area-metric-note"><span className="my-area-metric-note-content"><Info size={16} aria-hidden="true" />Cliques no WhatsApp não confirmam conversas iniciadas.</span></p>
                  </div>
                )}
                {visibleAccountSection === 'public-profile' && isPublicProfessionalAccount && (
                  <section className="my-area-panel company-profile-settings" aria-labelledby="company-profile-settings-title">
                    <div className="my-area-panel-heading">
                      <div><h2 id="company-profile-settings-title">Seu perfil público</h2><p>Veja como seu perfil profissional aparece para os visitantes.</p></div>
                    </div>
                    {accountProfile.publicSlug ? (
                      <div className="company-profile-actions">
                        <button type="button" className="company-profile-open-button" onClick={() => {
                          setCompanyPublicEditMode(false)
                          navigateToPath(accountUserType === 'corretor'
                            ? getPublicProfessionalProfilePath(accountProfile.publicSlug)
                            : getCompanyPublicProfilePath(accountProfile.publicSlug))
                        }}>
                          Abrir perfil público <ExternalLink size={17} aria-hidden="true" />
                        </button>
                        <button type="button" className="company-profile-edit-button" onClick={() => {
                          setCompanyPublicEditMode(true)
                          setCompanyPublicPreviewMode(false)
                          setCompanyPublicTab('showcase')
                          navigateToPath(`${accountUserType === 'corretor'
                            ? getPublicProfessionalProfilePath(accountProfile.publicSlug)
                            : getCompanyPublicProfilePath(accountProfile.publicSlug)}?edit=1`)
                        }}>
                          <Pencil size={17} aria-hidden="true" /> Editar perfil público
                        </button>
                      </div>
                    ) : (
                      <p className="my-area-feedback error" role="alert">O link público ainda não está disponível. Execute as migrations de perfil público no Supabase.</p>
                    )}
                  </section>
                )}
                {visibleAccountSection === 'admin' && isAdmin && (
                  <AdminPanel
                    section={adminSection}
                    onSectionChange={setAdminSection}
                    listings={publishedListings}
                    validityNow={listingValidityNow}
                    listingsError={adminListingsError}
                    neighborhoods={neighborhoods}
                    users={adminUsers}
                    currentUserId={authUser.id}
                    usersLoading={adminUsersLoading}
                    usersError={adminUsersError}
                    usersMessage={adminUsersMessage}
                    onToggleAdmin={toggleAdminPermission}
                    usersActionId={adminUserActionId}
                    onApprove={approveListing}
                    onReject={rejectListing}
                    onPause={pauseListing}
                    onReactivate={reactivateListing}
                    onComplete={completeListing}
                    onDelete={(listing) => removeUserListing(listing.id)}
                    onEdit={openAnnouncementForm}
                    onToggleFeatured={toggleAdminFeatured}
                    onMoveFeatured={moveAdminFeatured}
                    featuredSavingId={featuredSavingId}
                    statusSavingId={statusSavingId}
                    neighborhoodDraft={neighborhoodDraft}
                    editingNeighborhoodName={editingNeighborhoodName}
                    neighborhoodSaving={neighborhoodSaving}
                    neighborhoodActionName={neighborhoodActionName}
                    neighborhoodError={neighborhoodManagerError}
                    neighborhoodMessage={neighborhoodManagerMessage}
                    neighborhoodsError={neighborhoodsError}
                    neighborhoodsStatus={neighborhoodsStatus}
                    moderationMessage={moderationMessage}
                    moderationError={moderationError}
                    onNeighborhoodDraftChange={setNeighborhoodDraft}
                    onNewNeighborhood={() => {
                      setEditingNeighborhoodName(null)
                      setNeighborhoodDraft('')
                      setNeighborhoodManagerError('')
                      setNeighborhoodManagerMessage('')
                    }}
                    onEditNeighborhood={(neighborhood) => {
                      setEditingNeighborhoodName(neighborhood.name)
                      setNeighborhoodDraft(neighborhood.name)
                      setNeighborhoodManagerError('')
                      setNeighborhoodManagerMessage('')
                    }}
                    onSaveNeighborhood={saveNeighborhood}
                    onToggleNeighborhood={toggleNeighborhood}
                  />
                )}
                {visibleAccountSection === 'account' && (
                  <>
                  <section className="my-area-panel" aria-labelledby="my-area-account-title">
                    <div className="my-area-panel-heading">
                      <div><h2 id="my-area-account-title">Dados da conta</h2><p>Confira os dados cadastrados no seu perfil.</p></div>
                      {!profileEditing && <button type="button" className="my-area-edit-button" onClick={startProfileEditing}>Editar Dados</button>}
                    </div>
                    {userProfileError && <p className="my-area-feedback error" role="alert">{userProfileError}</p>}
                    {profileMessage && <p className="my-area-feedback" role="status">{profileMessage}</p>}
                    {profileEditing ? (
                      <form className="my-area-profile-grid" onSubmit={saveProfile}>
                        {accountUserType === 'imobiliaria' ? (
                          <>
                            <label className="form-group my-area-readonly-field">Nome da Imobiliária 🔒<input value={accountProfile.companyName} readOnly aria-readonly="true" /></label>
                            <label className="form-group my-area-readonly-field">CNPJ 🔒<input value={formatCnpj(accountProfile.cnpj)} readOnly aria-readonly="true" /></label>
                            <label className="form-group">Responsável<input value={profileEditForm.responsibleName || ''} onChange={(event) => setProfileEditForm((current) => ({ ...current, responsibleName: event.target.value }))} required /></label>
                          </>
                        ) : (
                          <>
                            <label className="form-group">Nome<input value={profileEditForm.name || ''} onChange={(event) => setProfileEditForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                            <label className="form-group my-area-readonly-field">CPF 🔒<input value={formatCpf(accountProfile.cpf)} readOnly aria-readonly="true" /></label>
                            {accountUserType === 'corretor' && <label className="form-group my-area-readonly-field">CRECI 🔒<input value={accountProfile.creci} readOnly aria-readonly="true" /></label>}
                          </>
                        )}
                        <label className="form-group">Telefone<input type="tel" inputMode="tel" value={profileEditForm.phone || ''} onChange={(event) => setProfileEditForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))} maxLength="15" required /></label>
                        <label className="form-group my-area-readonly-field">E-mail 🔒<input type="email" value={accountProfile.email} readOnly aria-readonly="true" /></label>
                        <div className="my-area-profile-actions">
                          <button type="button" className="cancel-form-btn" onClick={() => { setProfileEditing(false); setProfileMessage('') }}>Cancelar</button>
                          <button type="submit" className="submit-form-btn" disabled={profileSaving}>{profileSaving ? 'Salvando…' : 'Salvar Dados'}</button>
                        </div>
                      </form>
                    ) : (
                      <dl className="my-area-profile-grid">
                        {accountUserType === 'imobiliaria' ? (
                          <>
                            <div><dt>Nome da Imobiliária</dt><dd>{accountProfile.companyName || 'Não informado'}</dd></div>
                            <div><dt>CNPJ 🔒</dt><dd>{formatCnpj(accountProfile.cnpj) || 'Não informado'}</dd></div>
                            <div><dt>Responsável</dt><dd>{accountProfile.responsibleName || 'Não informado'}</dd></div>
                          </>
                        ) : (
                          <>
                            <div><dt>Nome</dt><dd>{accountProfile.name || 'Não informado'}</dd></div>
                            <div><dt>CPF 🔒</dt><dd>{formatCpf(accountProfile.cpf) || 'Não informado'}</dd></div>
                            {accountUserType === 'corretor' && <div><dt>CRECI 🔒</dt><dd>{accountProfile.creci || 'Não informado'}</dd></div>}
                          </>
                        )}
                        <div><dt>Telefone</dt><dd>{formatPhone(accountProfile.phone) || 'Não informado'}</dd></div>
                        <div><dt>Tipo de Conta</dt><dd>{getAccountTypeLabel(accountUserType)}</dd></div>
                        <div><dt>E-mail 🔒</dt><dd>{accountProfile.email}</dd></div>
                      </dl>
                    )}
                  </section>
                  <section className="my-area-panel account-security-panel" aria-labelledby="account-security-title">
                    <div className="my-area-panel-heading">
                      <div><h2 id="account-security-title">Segurança da Conta</h2><p>Altere sua senha de acesso.</p></div>
                    </div>
                    {passwordMessage.text && <p className={`my-area-feedback${passwordMessage.error ? ' error' : ''}`} role={passwordMessage.error ? 'alert' : 'status'}>{passwordMessage.text}</p>}
                    <form className="account-security-form" onSubmit={updateAccountPassword}>
                      <label className="form-group">
                        Senha Atual
                        <input
                          type="password"
                          autoComplete="current-password"
                          value={passwordForm.current}
                          onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))}
                          required
                        />
                      </label>
                      <label className="form-group">
                        Nova Senha
                        <input
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          value={passwordForm.next}
                          onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))}
                          required
                        />
                      </label>
                      <label className="form-group">
                        Confirmar Nova Senha
                        <input
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          value={passwordForm.confirmation}
                          onChange={(event) => setPasswordForm((current) => ({ ...current, confirmation: event.target.value }))}
                          required
                        />
                      </label>
                      <div className="account-security-actions">
                        <button type="submit" className="submit-form-btn" disabled={passwordSaving}>
                          {passwordSaving ? 'Atualizando…' : 'Atualizar Senha'}
                        </button>
                      </div>
                    </form>
                  </section>
                  </>
                )}
                {visibleAccountSection === 'favorites' && (
                  <section className="my-area-favorites" aria-label="Imóveis favoritos">
                    {favoriteMessage && <p className="my-area-feedback error" role="alert">{favoriteMessage}</p>}
                    {favoriteListingsLoading
                      ? <div className="account-empty" role="status">Carregando seus favoritos...</div>
                      : (
                        <ListingShowcase
                          listings={favoriteListings}
                          heading="Imóveis salvos"
                          showHeading={false}
                          emptyMessage={favoriteMessage ? undefined : 'Você ainda não adicionou imóveis aos favoritos.'}
                          favoriteListingIds={favoriteListingIds}
                          favoriteActionId={favoriteActionId}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      )}
                  </section>
                )}
                {visibleAccountSection === 'listings' && (
                  <>
                    {!isStandardAccount && (
                      <div className="account-dashboard-heading">
                        <h2>Meus Imóveis</h2>
                        <p>Gerencie seus anúncios e acompanhe o status de cada imóvel.</p>
                      </div>
                    )}
            {(!isStandardAccount || (isAdmin && ['review', 'neighborhoods'].includes(accountFilter))) && ownFeaturedListings.map((item) => (
              <p className="moderation-message" role="status" key={item.id}>
                Seu anúncio “{item.title}” está destacado na posição {item.ordem_destaque} da Home.
              </p>
            ))}
            {(!isStandardAccount || (isAdmin && ['review', 'neighborhoods'].includes(accountFilter))) && moderationMessage && <p className="moderation-message" role="status">{moderationMessage}</p>}
            {(!isStandardAccount || (isAdmin && ['review', 'neighborhoods'].includes(accountFilter))) && <div className="account-dashboard-toolbar">
              <div className="account-filter-tabs" role="tablist" aria-label="Filtrar imóveis">
                <button type="button" className={accountFilter === 'all' ? 'active' : ''} onClick={() => setAccountFilter('all')}>Todos os status ({userListings.length})</button>
                <button type="button" className={accountFilter === 'published' ? 'active' : ''} onClick={() => setAccountFilter('published')}>Aprovados ({activeListings.length})</button>
                <button type="button" className={accountFilter === 'pending' ? 'active' : ''} onClick={() => setAccountFilter('pending')}>Em análise ({pendingListings.length})</button>
                <button type="button" className={accountFilter === 'paused' ? 'active' : ''} onClick={() => setAccountFilter('paused')}>Pausados ({pausedListings.length})</button>
                <button type="button" className={accountFilter === 'rejected' ? 'active' : ''} onClick={() => setAccountFilter('rejected')}>Reprovados ({rejectedListings.length})</button>
                <button type="button" className={accountFilter === 'completed' ? 'active' : ''} onClick={() => setAccountFilter('completed')}>Concluídos ({completedListings.length})</button>
              </div>
            </div>}
            {(isStandardAccount || isCompanyAccount) && !(isAdmin && ['review', 'neighborhoods'].includes(accountFilter)) ? (
              <div className={`standard-account-dashboard${accountFilter === 'manage' ? ' admin-manage-all' : ''}`}>
                <div className="standard-account-content">
                  {isAdmin && ownFeaturedListings.map((item) => (
                    <p className="moderation-message" role="status" key={item.id}>
                      Seu anúncio “{item.title}” está destacado na posição {item.ordem_destaque} da Home.
                    </p>
                  ))}
                  {isAdmin && moderationMessage && <p className="moderation-message" role="status">{moderationMessage}</p>}
                  <div className="my-area-listings-filters" aria-label="Filtros de imóveis">
                    <label>
                      <span className="sr-only">Filtrar por status</span>
                      <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
                        <option value="all">Todos os status</option>
                        <option value="published">Aprovados</option>
                        {(expiredListings.length > 0 || accountFilter === 'expired') && <option value="expired">Expirados</option>}
                        <option value="pending">Em análise</option>
                        <option value="paused">Pausados</option>
                        <option value="rejected">Reprovados</option>
                        <option value="completed">Concluídos</option>
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">Filtrar por finalidade</span>
                      <select value={listingPurposeFilter} onChange={(event) => setListingPurposeFilter(event.target.value)}>
                        <option value="all">Venda e aluguel</option>
                        <option value="venda">Venda</option>
                        <option value="aluguel">Aluguel</option>
                      </select>
                    </label>
                  </div>
                  {listingValidityMessage.text && (
                    <p className={`my-area-feedback${listingValidityMessage.error ? ' error' : ''}`} role={listingValidityMessage.error ? 'alert' : 'status'}>
                      {listingValidityMessage.text}
                    </p>
                  )}
                  {standardAccountListings.length === 0 ? (
                    <div className="account-empty">{accountFilter === 'manage' ? 'Não há anúncios cadastrados para gerenciar.' : userListings.length ? 'Nenhum imóvel corresponde aos filtros selecionados.' : 'Você ainda não cadastrou imóveis.'}</div>
                  ) : (
                    <div className="standard-listing-grid">
                      {standardAccountListings.map((item) => {
                        const statusKey = getListingStatusKey(item)
                        const purpose = getListingPurpose(item)
                        const propertyType = getListingPropertyType(item)
                        const featuredDraft = featuredDrafts[item.id] || {
                          destaqueHome: item.destaque_home === true,
                          ordemDestaque: item.ordem_destaque == null ? '' : String(item.ordem_destaque),
                        }
                        const updateFeaturedDraft = (updates) => {
                          setFeaturedDrafts((current) => ({
                            ...current,
                            [item.id]: { ...featuredDraft, ...updates },
                          }))
                        }
                        const createdAt = item.created_at && !Number.isNaN(new Date(item.created_at).getTime())
                          ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(item.created_at))
                          : 'Data não informada'
                        const statusLabel = statusKey === 'published' ? 'Aprovado' : statusKey === 'expired' ? 'Expirado' : statusKey === 'pending' ? 'Em análise' : statusKey === 'rejected' ? 'Reprovado' : statusKey === 'paused' ? 'Pausado' : 'Concluído'
                        const daysRemaining = getIndividualListingDaysRemaining(item, listingValidityNow)
                        const canRenewIndividualListing = Boolean(item.individual_validity_started_at)
                          && ['published', 'expired', 'paused'].includes(statusKey)
                        return (
                          <article key={item.id} className="account-dashboard-card standard-listing-card">
                            <StandardListingGallery listing={item} purpose={purpose} />
                            <div className="standard-listing-card-body">
                              <h3>{item.title}</h3>
                              <p className="standard-listing-location"><MapPin size={16} strokeWidth={2.2} aria-hidden="true" />{item.location || getListingLocation(item)}</p>
                              <strong className={`account-card-price purpose-price purpose-${purpose}`}>{item.price}</strong>
                              <div className="standard-listing-features">
                                {Number(item.bedrooms) > 0 && <span><BedDouble size={17} strokeWidth={2} aria-hidden="true" />{item.bedrooms} {Number(item.bedrooms) === 1 ? 'quarto' : 'quartos'}</span>}
                                {Number(item.bathrooms) > 0 && <span><Bath size={17} strokeWidth={2} aria-hidden="true" />{item.bathrooms} {Number(item.bathrooms) === 1 ? 'banheiro' : 'banheiros'}</span>}
                                {Number(item.parking_spaces || item.garages) > 0 && <span><Car size={17} strokeWidth={2} aria-hidden="true" />{item.parking_spaces || item.garages} {Number(item.parking_spaces || item.garages) === 1 ? 'vaga' : 'vagas'}</span>}
                                <span><Ruler size={17} strokeWidth={2} aria-hidden="true" />{propertyType.key === 'terreno' ? `Área total: ${formatArea(item.area)}` : formatArea(item.area)}</span>
                              </div>
                              <span className={`standard-listing-status ${statusKey}`}><i aria-hidden="true" /><CircleCheck size={15} strokeWidth={2.4} aria-hidden="true" />{statusLabel}</span>
                              <p className={`standard-listing-date${daysRemaining !== null && statusKey === 'published' ? ' has-validity' : ''}`}>
                                <CalendarDays size={17} strokeWidth={2} aria-hidden="true" />
                                <span>Publicado em {createdAt}</span>
                                {daysRemaining !== null && statusKey === 'published' && (
                                  <span className="standard-listing-validity">· Expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</span>
                                )}
                              </p>
                              <div className="standard-listing-engagement" aria-label="Métricas deste imóvel">
                                <div className="standard-listing-engagement-item">
                                  <Eye size={23} strokeWidth={2.2} aria-hidden="true" />
                                  <div><strong>{Number(item.visualizacoes) || 0}</strong><span>visualizações</span></div>
                                </div>
                                <div className="standard-listing-engagement-item whatsapp">
                                  <WhatsAppIcon size={25} />
                                  <div><strong>{Number(item.whatsapp_clicks) || 0}</strong><span>cliques no WhatsApp</span></div>
                                </div>
                              </div>
                            </div>
                            <div className="standard-listing-actions">
                              {isAdmin && (
                                <form className="admin-featured-controls" onSubmit={(event) => saveFeaturedListing(event, item, featuredDraft)}>
                                  <label className="admin-featured-toggle" htmlFor={`featured-home-${item.id}`}>
                                    <input
                                      id={`featured-home-${item.id}`}
                                      type="checkbox"
                                      checked={featuredDraft.destaqueHome}
                                      onChange={(event) => {
                                        const isFeatured = event.target.checked
                                        const nextOrder = publishedListings.reduce((highest, candidate) => (
                                          candidate.destaque_home === true
                                            ? Math.max(highest, Number(candidate.ordem_destaque) || 0)
                                            : highest
                                        ), 0) + 1
                                        updateFeaturedDraft({
                                          destaqueHome: isFeatured,
                                          ordemDestaque: isFeatured
                                            ? featuredDraft.ordemDestaque || String(nextOrder)
                                            : '',
                                        })
                                      }}
                                    />
                                    <span>⭐ Destacar na página inicial</span>
                                  </label>
                                  {featuredDraft.destaqueHome && (
                                    <label className="admin-featured-order" htmlFor={`featured-order-${item.id}`}>
                                      Ordem do destaque
                                      <input
                                        id={`featured-order-${item.id}`}
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={featuredDraft.ordemDestaque}
                                        onChange={(event) => updateFeaturedDraft({ ordemDestaque: event.target.value })}
                                        required
                                      />
                                    </label>
                                  )}
                                  <button type="submit" disabled={featuredSavingId === item.id}>
                                    {featuredSavingId === item.id ? 'Salvando…' : 'Salvar destaque'}
                                  </button>
                                </form>
                              )}
                              {statusKey === 'published' && <button type="button" className="standard-listing-view" onClick={() => navigateToPath(getListingDetailUrl(item))}><ExternalLink size={16} strokeWidth={2.2} aria-hidden="true" />Ver anúncio</button>}
                              <button type="button" className="standard-listing-edit" onClick={() => openAnnouncementForm(item)}><Pencil size={17} strokeWidth={2.2} aria-hidden="true" />Editar imóvel</button>
                              <div className="standard-listing-menu-wrap">
                                <button type="button" className="standard-listing-menu-trigger" aria-label={`Mais ações para ${item.title}`} aria-expanded={openListingActionId === item.id} onClick={() => setOpenListingActionId((current) => current === item.id ? null : item.id)}><MoreHorizontal size={22} aria-hidden="true" /></button>
                                {openListingActionId === item.id && (
                                  <div className="standard-listing-menu">
                                    {statusKey === 'published' && <button type="button" onClick={() => { setOpenListingActionId(null); completeListing(item) }}>Marcar concluído</button>}
                                    {canRenewIndividualListing && <button type="button" disabled={statusSavingId === item.id} onClick={() => { setOpenListingActionId(null); reactivateListing(item) }}>{statusSavingId === item.id ? 'Reativando…' : 'Reativar anúncio'}</button>}
                                    <button type="button" className="delete" onClick={() => { setOpenListingActionId(null); removeUserListing(item.id) }}><Trash2 size={16} aria-hidden="true" />Excluir imóvel</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
                {accountFilter !== 'manage' && <aside className="standard-account-insights" aria-label="Resumo da sua conta">
                  <section className="standard-account-insight-card">
                    <h2>Resumo Geral</h2>
                    <div><House size={22} aria-hidden="true" /><span>Imóveis cadastrados</span><strong>{userListings.length}</strong></div>
                    <div><Eye size={22} aria-hidden="true" /><span>Visualizações totais</span><strong>{totalListingViews}</strong></div>
                    <div><WhatsAppIcon size={22} /><span>Contatos recebidos</span><strong>{totalWhatsAppClicks}</strong></div>
                    <div className="favorites-summary"><Heart size={22} aria-hidden="true" /><span>Favoritos recebidos</span><strong>{receivedFavoriteCount ?? '—'}</strong></div>
                    {receivedFavoriteCountError && <p className="my-area-feedback error" role="alert">{receivedFavoriteCountError}</p>}
                  </section>
                  <section className="standard-account-insight-card standard-account-status-card">
                    <h2>Situação dos anúncios</h2>
                    <div className="published"><i aria-hidden="true" /><span>Aprovados</span><strong>{activeListings.length}</strong></div>
                    <div className="expired"><i aria-hidden="true" /><span>Expirados</span><strong>{expiredListings.length}</strong></div>
                    <div className="pending"><i aria-hidden="true" /><span>Em análise</span><strong>{pendingListings.length}</strong></div>
                    <div className="rejected"><i aria-hidden="true" /><span>Reprovados</span><strong>{rejectedListings.length}</strong></div>
                  </section>
                  <section className="standard-account-insight-card standard-account-tips-card">
                    <h2><Lightbulb size={23} strokeWidth={2.1} aria-hidden="true" />Dicas para mais resultados</h2>
                    <p><Check size={18} aria-hidden="true" />Adicione mais fotos</p>
                    <p><Check size={18} aria-hidden="true" />Complete a descrição</p>
                    <p><Check size={18} aria-hidden="true" />Atualize informações do imóvel</p>
                  </section>
                </aside>}
              </div>
            ) : isAdmin && accountFilter === 'neighborhoods' ? (
              <section className="neighborhood-manager" aria-label="Gerenciar bairros">
                <div className="neighborhood-manager-heading">
                  <div><h3>Gerenciar bairros</h3><p>Os bairros ativos ficam disponíveis nos filtros e no cadastro de imóveis.</p></div>
                </div>
                <form className="neighborhood-manager-form" onSubmit={saveNeighborhood}>
                  <label htmlFor="neighborhood-name">{editingNeighborhoodName ? 'Editar bairro' : 'Novo bairro'}</label>
                  <div>
                    <input id="neighborhood-name" value={neighborhoodDraft} onChange={(event) => setNeighborhoodDraft(event.target.value)} placeholder="Nome do bairro" maxLength={100} required />
                    <button type="submit" disabled={neighborhoodSaving || neighborhoodsStatus !== 'loaded'}>{neighborhoodSaving ? 'Salvando…' : editingNeighborhoodName ? 'Salvar alterações' : 'Adicionar bairro'}</button>
                    {editingNeighborhoodName && <button type="button" className="neighborhood-cancel" onClick={() => { setEditingNeighborhoodName(null); setNeighborhoodDraft('') }}>Cancelar</button>}
                  </div>
                </form>
                {neighborhoodManagerError && <p className="neighborhood-manager-feedback error" role="alert">{neighborhoodManagerError}</p>}
                {neighborhoodManagerMessage && <p className="neighborhood-manager-feedback" role="status">{neighborhoodManagerMessage}</p>}
                {neighborhoodsError && <p className="neighborhood-manager-feedback error" role="alert">{neighborhoodsError}</p>}
                {neighborhoodsStatus === 'loading' ? <p className="account-empty">Carregando bairros…</p> : neighborhoodsStatus === 'error' ? null : neighborhoods.length === 0 ? <p className="account-empty">Nenhum bairro cadastrado.</p> : (
                  <div className="neighborhood-manager-list">
                    {neighborhoods.map((neighborhood) => (
                      <article className={`neighborhood-manager-item${neighborhood.active ? '' : ' inactive'}`} key={neighborhood.name}>
                        <div><strong>{neighborhood.name}</strong><span>{neighborhood.active ? 'Ativo' : 'Inativo'}</span></div>
                        <div className="neighborhood-manager-actions">
                          <button type="button" onClick={() => { setEditingNeighborhoodName(neighborhood.name); setNeighborhoodDraft(neighborhood.name); setNeighborhoodManagerError(''); setNeighborhoodManagerMessage('') }}>Editar</button>
                          <button type="button" disabled={neighborhoodActionName === neighborhood.name} onClick={() => toggleNeighborhood(neighborhood)}>{neighborhoodActionName === neighborhood.name ? 'Aguarde…' : neighborhood.active ? 'Desativar' : 'Ativar'}</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : isAdmin && accountFilter === 'review' && adminReviewLoading ? (
              <div className="account-empty">Carregando anúncios pendentes...</div>
            ) : isAdmin && accountFilter === 'review' && adminReviewError ? (
              <div className="account-empty" role="alert">{adminReviewError}</div>
            ) : visibleAccountListings.length === 0 ? (
              <div className="account-empty">{accountFilter === 'manage' ? 'Não há anúncios cadastrados para gerenciar.' : accountFilter === 'review' ? 'Não há anúncios aguardando análise.' : accountFilter === 'pending' ? 'Você não tem anúncios em análise.' : accountFilter === 'published' ? 'Você ainda não tem anúncios publicados.' : accountFilter === 'rejected' ? 'Você não tem anúncios reprovados.' : accountFilter === 'completed' ? 'Você não tem imóveis concluídos.' : 'Você ainda não cadastrou imóveis.'}</div>
            ) : isStandardAccount && isAdmin && accountFilter === 'review' ? (
              <div className="standard-account-dashboard admin-standard-review">
                <div className="standard-account-content">
                  <div className="standard-listing-grid">
                    {visibleAccountListings.map((item) => {
                      const purpose = getListingPurpose(item)
                      const propertyType = getListingPropertyType(item)
                      const featuredDraft = featuredDrafts[item.id] || {
                        destaqueHome: item.destaque_home === true,
                        ordemDestaque: item.ordem_destaque == null ? '' : String(item.ordem_destaque),
                      }
                      const updateFeaturedDraft = (updates) => {
                        setFeaturedDrafts((current) => ({
                          ...current,
                          [item.id]: { ...featuredDraft, ...updates },
                        }))
                      }
                      const submittedAt = item.created_at && !Number.isNaN(new Date(item.created_at).getTime())
                        ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(item.created_at))
                        : 'Data não informada'

                      return (
                        <article key={item.id} className="account-dashboard-card standard-listing-card">
                          <StandardListingGallery listing={item} purpose={purpose} />
                          <div className="standard-listing-card-body">
                            <h3>{item.title}</h3>
                            <p className="standard-listing-location"><MapPin size={16} strokeWidth={2.2} aria-hidden="true" />{item.location || getListingLocation(item)}</p>
                            <strong className={`account-card-price purpose-price purpose-${purpose}`}>{item.price}</strong>
                            <div className="standard-listing-features">
                              {Number(item.bedrooms) > 0 && <span><BedDouble size={17} strokeWidth={2} aria-hidden="true" />{item.bedrooms} {Number(item.bedrooms) === 1 ? 'quarto' : 'quartos'}</span>}
                              {Number(item.bathrooms) > 0 && <span><Bath size={17} strokeWidth={2} aria-hidden="true" />{item.bathrooms} {Number(item.bathrooms) === 1 ? 'banheiro' : 'banheiros'}</span>}
                              {Number(item.parking_spaces || item.garages) > 0 && <span><Car size={17} strokeWidth={2} aria-hidden="true" />{item.parking_spaces || item.garages} {Number(item.parking_spaces || item.garages) === 1 ? 'vaga' : 'vagas'}</span>}
                              <span><Ruler size={17} strokeWidth={2} aria-hidden="true" />{propertyType.key === 'terreno' ? `Área total: ${formatArea(item.area)}` : formatArea(item.area)}</span>
                            </div>
                            <span className="standard-listing-status pending"><i aria-hidden="true" />Em análise</span>
                            <p className="standard-listing-date"><CalendarDays size={17} strokeWidth={2} aria-hidden="true" />Enviado em {submittedAt}</p>
                          </div>
                          <div className="standard-listing-actions">
                            <form className="admin-featured-controls" onSubmit={(event) => saveFeaturedListing(event, item, featuredDraft)}>
                              <label className="admin-featured-toggle" htmlFor={`featured-home-${item.id}`}>
                                <input
                                  id={`featured-home-${item.id}`}
                                  type="checkbox"
                                  checked={featuredDraft.destaqueHome}
                                  onChange={(event) => {
                                    const isFeatured = event.target.checked
                                    const nextOrder = publishedListings.reduce((highest, candidate) => (
                                      candidate.destaque_home === true
                                        ? Math.max(highest, Number(candidate.ordem_destaque) || 0)
                                        : highest
                                    ), 0) + 1
                                    updateFeaturedDraft({
                                      destaqueHome: isFeatured,
                                      ordemDestaque: isFeatured
                                        ? featuredDraft.ordemDestaque || String(nextOrder)
                                        : '',
                                    })
                                  }}
                                />
                                <span>⭐ Destacar na página inicial</span>
                              </label>
                              {featuredDraft.destaqueHome && (
                                <label className="admin-featured-order" htmlFor={`featured-order-${item.id}`}>
                                  Ordem do destaque
                                  <input
                                    id={`featured-order-${item.id}`}
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={featuredDraft.ordemDestaque}
                                    onChange={(event) => updateFeaturedDraft({ ordemDestaque: event.target.value })}
                                    required
                                  />
                                </label>
                              )}
                              <button type="submit" disabled={featuredSavingId === item.id}>
                                {featuredSavingId === item.id ? 'Salvando…' : 'Salvar destaque'}
                              </button>
                            </form>
                            <div className="admin-review-actions">
                              <button type="button" className="approve-listing-button" onClick={() => approveListing(item)}>✓ Aprovar</button>
                              {rejectionListingId === item.id ? (
                                <div className="admin-rejection-form">
                                  <label htmlFor={`rejection-${item.id}`}>Motivo da reprovação *</label>
                                  <textarea id={`rejection-${item.id}`} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Ex.: Fotos insuficientes ou endereço incompleto" required />
                                  <button type="button" className="reject-listing-button" onClick={() => rejectListing(item)}>Confirmar reprovação</button>
                                  <button type="button" onClick={() => { setRejectionListingId(null); setRejectionReason('') }}>Cancelar</button>
                                </div>
                              ) : <button type="button" className="reject-listing-button" onClick={() => { setRejectionListingId(item.id); setRejectionReason(''); setModerationMessage('') }}>✕ Reprovar</button>}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="account-dashboard-grid">
                {visibleAccountListings.map((item) => {
                  const statusKey = getListingStatusKey(item)
                  const reviewable = isAdmin && accountFilter === 'review' && statusKey === 'pending'
                  const purpose = getListingPurpose(item)
                  const propertyType = getListingPropertyType(item)
                  const featuredDraft = featuredDrafts[item.id] || {
                    destaqueHome: item.destaque_home === true,
                    ordemDestaque: item.ordem_destaque == null ? '' : String(item.ordem_destaque),
                  }
                  const updateFeaturedDraft = (updates) => {
                    setFeaturedDrafts((current) => ({
                      ...current,
                      [item.id]: { ...featuredDraft, ...updates },
                    }))
                  }
                  return (
                    <article key={item.id} className={`account-dashboard-card${isAdmin ? ' admin-manageable' : ''}`}>
                      <div className="account-card-image-wrap">
                        {getListingImages(item)[0]
                          ? <img src={getListingImages(item)[0]} alt={item.title} className="account-card-image" />
                          : <ListingImagePlaceholder className="account-card-image" />}
                        <span className={`account-status-badge purpose-badge purpose-${purpose}`}>{getListingPurposeLabel(item).toLocaleUpperCase('pt-BR')}</span>
                      </div>
                      <div className="account-card-body">
                        <h3>{item.title}</h3>
                        <p className="account-card-location"><FilterIcon name="pin" />{item.location}</p>
                        <p className="account-card-type"><span aria-hidden="true">{propertyType.icon}</span> {propertyType.label}</p>
                        <p className="account-status-text">Status: {getListingStatusLabel(item)}</p>
                        {accountFilter === 'review' && <p className="account-card-submitted">Enviado em {item.created_at ? new Intl.DateTimeFormat('pt-BR').format(new Date(item.created_at)) : 'data indisponível'}</p>}
                        <strong className={`account-card-price purpose-price purpose-${purpose}`}>{item.price}</strong>
                        <div className="account-card-meta">
                          <span><i aria-hidden="true">🛏</i><b>{item.bedrooms || 0}</b><small>Quartos</small></span>
                          <span><i aria-hidden="true">🚿</i><b>{item.bathrooms || 1}</b><small>Banheiros</small></span>
                          <span><i aria-hidden="true">🚗</i><b>{item.parking_spaces || item.garages || 0}</b><small>Vagas</small></span>
                          <span><i aria-hidden="true">📐</i><b>{formatArea(item.area)}</b><small>Área</small></span>
                        </div>
                        <p className="account-card-views"><span aria-hidden="true">◉</span> Visualizações <strong>{Number(item.visualizacoes) || 0}</strong></p>
                        <p className="account-card-whatsapp"><span className="whatsapp-icon-card compact" aria-hidden="true"><WhatsAppIcon size={20} /></span> Cliques WhatsApp <strong>{Number(item.whatsapp_clicks) || 0}</strong></p>
                        {statusKey === 'rejected' && <div className="account-rejection-reason"><strong>Motivo da reprovação</strong><p>{item.motivo_reprovacao || 'O administrador solicitou ajustes no anúncio.'}</p></div>}
                      </div>
                      <div className="account-card-actions">
                        {isAdmin && (
                          <form className="admin-featured-controls" onSubmit={(event) => saveFeaturedListing(event, item, featuredDraft)}>
                            <label className="admin-featured-toggle" htmlFor={`featured-home-${item.id}`}>
                              <input
                                id={`featured-home-${item.id}`}
                                type="checkbox"
                                checked={featuredDraft.destaqueHome}
                                onChange={(event) => {
                                  const isFeatured = event.target.checked
                                  const nextOrder = publishedListings.reduce((highest, candidate) => (
                                    candidate.destaque_home === true
                                      ? Math.max(highest, Number(candidate.ordem_destaque) || 0)
                                      : highest
                                  ), 0) + 1
                                  updateFeaturedDraft({
                                    destaqueHome: isFeatured,
                                    ordemDestaque: isFeatured
                                      ? featuredDraft.ordemDestaque || String(nextOrder)
                                      : '',
                                  })
                                }}
                              />
                              <span>⭐ Destacar na página inicial</span>
                            </label>
                            {featuredDraft.destaqueHome && (
                              <label className="admin-featured-order" htmlFor={`featured-order-${item.id}`}>
                                Ordem do destaque
                                <input
                                  id={`featured-order-${item.id}`}
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={featuredDraft.ordemDestaque}
                                  onChange={(event) => updateFeaturedDraft({ ordemDestaque: event.target.value })}
                                  required
                                />
                              </label>
                            )}
                            <button type="submit" disabled={featuredSavingId === item.id}>
                              {featuredSavingId === item.id ? 'Salvando…' : 'Salvar destaque'}
                            </button>
                          </form>
                        )}
                        {reviewable ? (
                          <div className="admin-review-actions">
                            <button type="button" className="approve-listing-button" onClick={() => approveListing(item)}>✓ Aprovar</button>
                            {rejectionListingId === item.id ? (
                              <div className="admin-rejection-form">
                                <label htmlFor={`rejection-${item.id}`}>Motivo da reprovação *</label>
                                <textarea id={`rejection-${item.id}`} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Ex.: Fotos insuficientes ou endereço incompleto" required />
                                <button type="button" className="reject-listing-button" onClick={() => rejectListing(item)}>Confirmar reprovação</button>
                                <button type="button" onClick={() => { setRejectionListingId(null); setRejectionReason('') }}>Cancelar</button>
                              </div>
                            ) : <button type="button" className="reject-listing-button" onClick={() => { setRejectionListingId(item.id); setRejectionReason(''); setModerationMessage('') }}>✕ Reprovar</button>}
                          </div>
                        ) : (
                          <>
                            {statusKey === 'rejected' && <button type="button" className="correct-listing-button" onClick={() => openAnnouncementForm(item)}>Corrigir anúncio</button>}
                            {statusKey === 'published' && <button type="button" onClick={() => completeListing(item)}>Marcar concluído</button>}
                            {statusKey !== 'completed' && statusKey !== 'rejected' && <button type="button" onClick={() => openAnnouncementForm(item)}>Editar anúncio</button>}
                            <button type="button" className="delete" onClick={() => removeUserListing(item.id)}>Excluir</button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
                  </>
                )}
              </main>
            </div>
            </>
            ) : (
              <div className="my-area-guest">
                <img src={logo} alt="" />
                <h1>Entre para acessar sua área</h1>
                <p>Faça login ou crie sua conta para gerenciar seus imóveis e dados cadastrais.</p>
                <button type="button" className="submit-form-btn" onClick={() => { setAuthMode('login'); setAuthMessage(''); setAuthOpen(true) }}>Entrar na conta</button>
                <button type="button" className="my-area-guest-home portal-back-button" onClick={() => navigateToPath(getAppBasePath())}><ArrowLeft size={18} aria-hidden="true" />Voltar</button>
              </div>
            )}
          </section>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMobileMenuOpen(false)
        }}>
          <aside className="mobile-menu" aria-label="Menu principal">
            <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
            <div className="mobile-menu-brand">
              <img src={logo} alt="" />
              <strong>Mora <span>Fácil</span></strong>
            </div>
            <div className="mobile-menu-header-divider" />
            <div className="mobile-menu-greeting">
              <span className="mobile-menu-avatar">{userFirstName.charAt(0)}</span>
              <div>
                <strong>{authUser ? `Olá, ${userFirstName}!` : 'Olá, visitante!'}</strong>
                <span>O que deseja fazer?</span>
              </div>
            </div>
            {authUser ? (
              <button type="button" className={`mobile-menu-primary mobile-menu-account-area${isMyAreaRoute ? ' active' : ''}`} aria-current={isMyAreaRoute ? 'page' : undefined} onClick={() => { setMobileMenuOpen(false); openMyArea() }}>
                <span className="mobile-menu-action-icon"><MenuSearchIcon /></span>
                <span className="mobile-menu-action-label">Minha Área</span>
                <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
              </button>
            ) : (
              <>
                <button type="button" className="mobile-menu-secondary" onClick={() => { setMobileMenuOpen(false); setAuthMode('login'); setAuthMessage(''); setAuthOpen(true) }}>
                  <span className="mobile-menu-action-icon"><MenuSearchIcon /></span>
                  <span className="mobile-menu-action-label">Entrar na conta</span>
                  <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
                </button>
                <button type="button" className="mobile-menu-secondary" onClick={() => { setMobileMenuOpen(false); setAuthForm(emptyAuthForm); setAuthSignupStep('profile'); setAuthMode('signup'); setAuthMessage(''); setAuthOpen(true) }}>
                  <span className="mobile-menu-action-icon"><MenuPlusIcon /></span>
                  <span className="mobile-menu-action-label">Criar conta</span>
                  <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
                </button>
              </>
            )}
            <button
              type="button"
              className="mobile-menu-secondary"
              onClick={() => { setMobileMenuOpen(false); openAnnouncementForm() }}
            >
              <span className="mobile-menu-action-icon"><MenuPlusIcon /></span>
              <span className="mobile-menu-action-label">Anunciar imóvel</span>
              <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
            </button>
            <button
              type="button"
              className="mobile-menu-secondary"
              onClick={() => { setMobileMenuOpen(false); navigateToPath(`${getAppBasePath()}profissionais`) }}
            >
              <span className="mobile-menu-action-icon"><MenuSearchIcon /></span>
              <span className="mobile-menu-action-label">Perfis Profissionais</span>
              <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
            </button>
            {authUser && <div className="mobile-menu-divider" />}
            {authUser && <button type="button" className="mobile-menu-logout" onClick={() => { setMobileMenuOpen(false); handleLogout() }}>
              <span className="mobile-menu-action-icon"><MenuLogoutIcon /></span>
              <span className="mobile-menu-action-label">Sair da conta</span>
              <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
            </button>}
            <div className="mobile-menu-social">
              <div className="mobile-menu-social-divider" />
              <div className="mobile-menu-social-heading">
                <strong>Siga o Mora Fácil</strong>
                <span>Fique por dentro das novidades!</span>
              </div>
              <div className="mobile-menu-social-actions">
                <button type="button" className="mobile-menu-social-button instagram-button">
                  <InstagramIcon />
                  <span>Instagram</span>
                </button>
                <button type="button" className="mobile-menu-social-button facebook-button">
                  <FacebookIcon />
                  <span>Facebook</span>
                </button>
              </div>
              <div className="mobile-menu-social-footer">Mora Fácil • Conectando pessoas a novos lares.</div>
            </div>
          </aside>
        </div>
      )}

      <section className="hero-content brand-curve-surface brand-curve-bottom" aria-label="Encontre seu próximo lar">
        <div className="hero-copy">
          <h2>Encontre seu<br /><span>próximo lar.</span></h2>
          <p>Imóveis do seu jeito, perto de você.</p>
        </div>
        <img className="hero-illustration" src={heroIllustration} alt="" aria-hidden="true" />
      </section>

      <section className="home-search-grid">
        {heroCarouselListings.length > 0 ? (
          <article className="hero-listing-card" onTouchStart={heroSwipe.onTouchStart} onTouchEnd={heroSwipe.onTouchEnd} onTouchCancel={heroSwipe.onTouchCancel}>
            {heroCarouselListings.map((item, index) => {
              const image = getListingImages(item)[0]
              return image
                ? <img
                    key={item.id}
                    src={image}
                    alt={item.title}
                    className={index === heroSlideIndex % heroCarouselListings.length ? 'active' : ''}
                  />
                : <ListingImagePlaceholder
                    key={item.id}
                    className={index === heroSlideIndex % heroCarouselListings.length ? 'active' : ''}
                  />
            })}
            <span className={`property-badge property-badge--${getListingPurpose(activeHeroListing) === 'aluguel' ? 'rent' : 'sale'}`} translate="no">
              <svg className="property-badge__icon" viewBox="0 0 12 12" aria-hidden="true">
                <path fill="currentColor" fillRule="evenodd" d="M11.32 5.14 6.86.68A2.3 2.3 0 0 0 5.23 0H1.2C.54 0 0 .54 0 1.2v4.03c0 .61.24 1.2.67 1.63l4.46 4.46a1.64 1.64 0 0 0 2.32 0l3.87-3.87a1.64 1.64 0 0 0 0-2.31ZM3.3 1.4a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
              </svg>
              {getListingPurposeLabel(activeHeroListing).toLocaleUpperCase('pt-BR')}
            </span>
            <FavoriteButton
              listing={activeHeroListing}
              isFavorite={favoriteListingIds.some((id) => String(id) === String(activeHeroListing.id))}
              isBusy={favoriteActionId !== null || favoriteListingsLoading}
              onToggle={handleToggleFavorite}
            />
            {heroCarouselListings.length > 1 && (
              <>
                <button
                  type="button"
                  className="hero-carousel-arrow hero-carousel-arrow-left"
                  aria-label="Anúncio anterior"
                  onClick={() => setHeroSlideIndex((current) => (current - 1 + heroCarouselListings.length) % heroCarouselListings.length)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 6 9 12l6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="hero-carousel-arrow hero-carousel-arrow-right"
                  aria-label="Próximo anúncio"
                  onClick={() => setHeroSlideIndex((current) => (current + 1) % heroCarouselListings.length)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </>
            )}
            <div className="hero-listing-info">
              <h2>{activeHeroListing.title}</h2>
              <p className="hero-listing-location"><FilterIcon name="pin" />{getListingLocation(activeHeroListing)}</p>
              <strong className="hero-listing-price">{activeHeroListing.price}</strong>
              <div className="hero-listing-features">
                <span><BedDouble size={16} strokeWidth={2} aria-hidden="true" />{Number(activeHeroListing.bedrooms) || 0} quartos</span>
                <span><Bath size={16} strokeWidth={2} aria-hidden="true" />{Number(activeHeroListing.bathrooms) || 0} banheiros</span>
                <span><Car size={16} strokeWidth={2} aria-hidden="true" />{Number(activeHeroListing.parking_spaces || activeHeroListing.garages) || 0} vagas</span>
                <span><Ruler size={16} strokeWidth={2} aria-hidden="true" />{formatArea(activeHeroListing.area)}</span>
              </div>
            </div>
            <a
              href={getListingDetailUrl(activeHeroListing)}
              className="hero-listing-cta"
            >
              <span className="hero-cta-desktop">Saiba mais</span>
              <span className="hero-cta-mobile">Ver detalhes</span>
              <b aria-hidden="true">›</b>
            </a>
            {heroCarouselListings.length > 1 && (
              <div className="hero-listing-dots">
                {heroCarouselListings.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={index === heroSlideIndex % heroCarouselListings.length ? 'active' : ''}
                    aria-label={`Ver imóvel ${index + 1}`}
                    onClick={() => setHeroSlideIndex(index)}
                  />
                ))}
              </div>
            )}
          </article>
        ) : featuredListingsStatus === 'loading' ? (
          <article className="hero-listing-card hero-listing-card-loading" aria-busy="true" aria-label="Carregando anúncios em destaque">
            <div className="hero-listing-loading-shimmer" />
          </article>
        ) : featuredListingsStatus === 'loaded' ? (
          <article className="hero-listing-card hero-listing-card-empty" aria-live="polite">
            <div>
              <strong>Nenhum anúncio em destaque</strong>
              <span>Os imóveis selecionados pela administração aparecerão aqui.</span>
            </div>
          </article>
        ) : featuredListingsStatus === 'error' ? (
          <article className="hero-listing-card hero-listing-card-error" role="status">
            <div>
              <strong>Não foi possível carregar os destaques.</strong>
              <span>Tente atualizar a página novamente.</span>
            </div>
          </article>
        ) : null}

        <section className="filters-bar search-panel">
        <FilterSelect
          id="search-location"
          label="Cidade"
          value={draftFilters.search}
          options={['Ipuã-SP', 'Guaíra-SP']}
          emphasized
          icon="pin"
          onChange={(search) => setDraftFilters({ ...draftFilters, search })}
        />
        <FilterSelect
          id="search-type"
          label="Tipo"
          value={draftFilters.type}
          options={['Todos os imóveis', 'Venda', 'Aluguel', 'Terrenos', 'Chácaras', 'Ponto Comercial']}
          icon="home"
          onChange={(type) => setDraftFilters({ ...draftFilters, type })}
        />
        <FilterSelect
          id="search-neighborhood"
          label="Bairro"
          value={draftFilters.neighborhood}
          options={['Qualquer bairro', ...activeNeighborhoodNames]}
          icon="pin"
          onChange={(neighborhood) => setDraftFilters({ ...draftFilters, neighborhood })}
        />
        <FilterSelect
          id="search-bedrooms"
          label="Quartos"
          value={draftFilters.bedrooms}
          options={['Qualquer', '1+', '2+', '3+']}
          icon="bed"
          fieldClassName="field-bedrooms"
          onChange={(bedrooms) => setDraftFilters({ ...draftFilters, bedrooms })}
        />

        <div className="results-counter" aria-live="polite">
          <span className="results-counter-check" aria-hidden="true">✓</span>
          {resultsLabel}
        </div>
        <button type="button" className="search-btn" onClick={() => setAppliedFilters(draftFilters)}><FilterIcon name="search" />Buscar</button>
        </section>
      </section>

      <div className="map-label-row">
        <span className="map-label">Mapa de Ipuã-SP</span>
      </div>

      <section
        ref={setMapPanelElement}
        className={`map-panel${mapFullscreenOpen ? ' map-panel-fullscreen' : ''}`}
        aria-label="Mapa com imóveis disponíveis"
        role={mapFullscreenOpen ? 'dialog' : undefined}
        aria-modal={mapFullscreenOpen ? 'true' : undefined}
      >
        <div className={`map-overlay-toolbar${mapFullscreenOpen ? ' map-fullscreen-toolbar' : ''}`}>
          {mapFullscreenOpen ? (
            <button type="button" className="map-close-button" onClick={() => setMapFullscreenOpen(false)}>✕ Fechar</button>
          ) : (
            <button type="button" className="map-expand-button" aria-label="Expandir mapa" title="Expandir mapa" onClick={() => setMapFullscreenOpen(true)}>⛶</button>
          )}
        </div>
        <MapContainer center={mapCenter} zoom={14} maxZoom={18} className="map-box map-box-main" scrollWheelZoom touchZoom dragging>
          <MapResizeObserver fullscreen={mapFullscreenOpen} />
          <MapLayerSelector />
          <MapListingOverlay
            listing={selectedMapListing}
            target={mapPanelElement}
            onClose={() => setSelectedMapListing(null)}
          />

          {filteredListings.map((item) => (
            <Marker
              key={item.id}
              position={item.coordinates}
              icon={createMarkerIcon(purposeColors[getListingPurpose(item)])}
              eventHandlers={{ click: () => setSelectedMapListing(item) }}
            />
          ))}
        </MapContainer>
      </section>

      <div className="summary-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.details}</small>
          </div>
        ))}
      </div>

      <ListingShowcase
        listings={sortedFilteredListings}
        city={appliedFilters.search.trim()}
        showSortControl
        sortValue={homeSortOrder}
        onSortChange={setHomeSortOrder}
        favoriteListingIds={favoriteListingIds}
        favoriteActionId={favoriteListingsLoading ? 'loading' : favoriteActionId}
        favoriteMessage={favoriteMessage}
        onToggleFavorite={handleToggleFavorite}
      />

      {announcementOpen && (
        <div className="property-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAnnouncementForm()
        }}>
          <section className="property-modal announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
            <div className="announcement-page-heading">
              <div>
                <button type="button" className="announcement-back portal-back-button" onClick={closeAnnouncementForm}><ArrowLeft size={18} aria-hidden="true" />Voltar</button>
                <h2 id="announcement-title">{editingListingId ? 'Editar imóvel' : 'Cadastrar imóvel'}</h2>
                <p>Preencha os dados para publicar seu anúncio.</p>
              </div>
              <aside className="announcement-trust">
                <span aria-hidden="true">✓</span>
                <div><strong>Anúncio seguro e confiável</strong><small>Seus dados estão protegidos e serão analisados pela nossa equipe.</small></div>
              </aside>
            </div>
            <div className="announcement-progress" aria-label="Formulário organizado em cinco etapas">
              {['Tipo do imóvel', 'Dados do imóvel', 'Endereço', 'Localização', 'Fotos'].map((step, index) => (
                <div className="announcement-progress-step" key={step}>
                  <span>{index + 1}</span><small>{step}</small>
                </div>
              ))}
            </div>
            <form className="announcement-form" onSubmit={handleAnnouncementSubmit} onInvalidCapture={() => setAnnouncementError('Confira os campos obrigatórios destacados e tente publicar novamente.')} onChange={() => { if (announcementError) setAnnouncementError('') }}>
              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>1</span><div><h3>Qual o tipo do imóvel? <i>*</i></h3><p>Selecione a categoria que melhor descreve seu imóvel.</p></div></div>
                <div className="announcement-category-grid">
                  {[
                    ['Casa', <svg key="casa" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7M5.5 9v11h13V9M9.5 20v-6h5v6" /></svg>],
                    ['Apartamento', <svg key="apartamento" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4h14v17M3 21h18M9 8h1m4 0h1M9 12h1m4 0h1M9 16h1m4 0h1m-3 5v-3" /></svg>],
                    ['Chácara', <Home key="chacara" size="1em" strokeWidth={1.7} />],
                    ['Terreno', <LandPlot key="terreno" size="1em" strokeWidth={2} />],
                    ['Ponto Comercial', <svg key="ponto-comercial" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h16v11H4zM3 10l2-6h14l2 6M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0M9 21v-6h4v6m4-7h.01" /></svg>],
                  ].map(([category, icon]) => (
                    <button type="button" key={category} className={`announcement-category${announcementCategory === category ? ' selected' : ''}`} aria-pressed={announcementCategory === category} onClick={() => {
                      setAnnouncementCategory(category)
                      if (category === 'Terreno') setAnnouncement((current) => ({ ...current, type: 'terreno' }))
                      if (category === 'Ponto Comercial') setAnnouncement((current) => ({ ...current, type: 'ponto_comercial' }))
                      if (category === 'Casa' || category === 'Apartamento' || category === 'Chácara') setAnnouncement((current) => ({ ...current, type: ['terreno', 'ponto_comercial'].includes(current.type) ? 'venda' : current.type }))
                    }}>
                      <span className="announcement-category-icon" aria-hidden="true">{icon}</span><strong>{category}</strong>{announcementCategory === category && <span className="announcement-category-check" aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              </section>

              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>2</span><div><h3>Dados do imóvel</h3><p>Informe as principais características do seu imóvel.</p></div></div>
                <div className="announcement-fields announcement-fields-property">
                  <div className="form-group field-title"><label htmlFor="title">Título do anúncio <i>*</i></label><input id="title" name="title" value={announcement.title} onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })} placeholder="Ex.: Casa térrea com garagem" required /></div>
                  <fieldset className="form-group field-purpose"><legend>Finalidade <i>*</i></legend><div className={`announcement-purpose-control purpose-${announcement.type === 'aluguel' ? 'aluguel' : 'venda'}`}>
                    <label className={announcement.type !== 'aluguel' ? 'active' : ''}><input type="radio" name="purpose" checked={announcement.type !== 'aluguel'} onChange={() => setAnnouncement((current) => ({ ...current, type: 'venda' }))} />Venda</label>
                    <label className={announcement.type === 'aluguel' ? 'active' : ''}><input type="radio" name="purpose" checked={announcement.type === 'aluguel'} onChange={() => setAnnouncement((current) => ({ ...current, type: 'aluguel' }))} />Aluguel</label>
                  </div></fieldset>
                  <div className="form-group field-price"><label htmlFor="price">Valor <i>*</i></label><input id="price" name="price" inputMode="numeric" value={announcement.price} onChange={(event) => setAnnouncement({ ...announcement, price: event.target.value.replace(/\D/g, '') })} placeholder="R$ 0,00" required /></div>
                  <div className="form-group field-area"><label htmlFor="area">Área construída (m²) <i>*</i></label><input id="area" name="area" type="number" min="1" step="1" inputMode="numeric" value={announcement.area} onChange={(event) => setAnnouncement({ ...announcement, area: event.target.value })} placeholder="Ex.: 96" required /></div>
                  <div className="form-group"><label htmlFor="bedrooms">Quartos <i>*</i></label><input id="bedrooms" name="bedrooms" type="number" min="0" value={announcement.bedrooms} onChange={(event) => setAnnouncement({ ...announcement, bedrooms: event.target.value })} required /></div>
                  <div className="form-group"><label htmlFor="bathrooms">Banheiros <i>*</i></label><input id="bathrooms" name="bathrooms" type="number" min="0" value={announcement.bathrooms} onChange={(event) => setAnnouncement({ ...announcement, bathrooms: event.target.value })} required /></div>
                  <div className="form-group"><label htmlFor="parking-spaces">Vagas <i>*</i></label><input id="parking-spaces" name="parking_spaces" type="number" min="0" step="1" inputMode="numeric" value={announcement.parking_spaces} onChange={(event) => setAnnouncement({ ...announcement, parking_spaces: event.target.value })} placeholder="0" required /></div>
                  <div className="form-group field-description"><label htmlFor="description">Descrição do imóvel <i>*</i></label><textarea id="description" name="description" value={announcement.description} onChange={(event) => setAnnouncement({ ...announcement, description: event.target.value })} placeholder="Conte os detalhes que tornam este imóvel especial" required /></div>
                  <div className="form-group"><label htmlFor="advertiser">Seu nome <i>*</i></label><input id="advertiser" name="advertiser" value={announcement.advertiser} onChange={(event) => setAnnouncement({ ...announcement, advertiser: event.target.value })} placeholder="Nome do anunciante" required /></div>
                  <div className="form-group"><label htmlFor="phone">Telefone ou WhatsApp <i>*</i></label><input id="phone" name="phone" type="tel" value={announcement.phone} onChange={(event) => setAnnouncement({ ...announcement, phone: event.target.value })} placeholder="(16) 99999-1234" required /></div>
                </div>
              </section>

              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>3</span><div><h3>Endereço</h3><p>Informe o endereço completo do imóvel.</p></div></div>
                <div className="announcement-fields announcement-fields-address">
                  <div className="form-group"><label htmlFor="city">Cidade <i>*</i></label><select id="city" name="city" value={announcement.city} onChange={(event) => { const city = event.target.value; updateAnnouncementAddressField('city', city); const coordinates = cityCoordinates[city] || mapCenter; setAnnouncementCoordinates(coordinates); setAnnouncementMapFocus({ coordinates, zoom: 14 }) }} required><option>Ipuã-SP</option><option>Guaíra-SP</option></select></div>
                  <div className="form-group"><label htmlFor="cep">CEP <i>*</i></label><input id="cep" name="cep" inputMode="numeric" value={announcement.cep} onChange={(event) => updateAnnouncementAddressField('cep', event.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={lookupCep} placeholder="Ex.: 14610-000" required /></div>
                  <div className="form-group field-street"><label htmlFor="street">Rua <i>*</i></label><input id="street" name="street" value={announcement.street} onChange={(event) => updateAnnouncementAddressField('street', event.target.value)} placeholder="Ex.: Rua das Flores" required /></div>
                  <div className="form-group"><label htmlFor="number">Número <i>*</i></label><input id="number" name="number" value={announcement.number} onChange={(event) => updateAnnouncementAddressField('number', event.target.value)} placeholder="Ex.: 123" required /></div>
                  <div className="form-group"><label htmlFor="neighborhood">Bairro <i>*</i></label><select id="neighborhood" name="neighborhood" value={announcement.neighborhood} onChange={(event) => setAnnouncement({ ...announcement, neighborhood: event.target.value })} required disabled={neighborhoodsStatus !== 'loaded' || (!editingListingId && activeNeighborhoodNames.length === 0)}><option value="" disabled>Selecione um bairro</option>{announcementNeighborhoodOptions.map((name) => <option key={name} value={name}>{name}{!activeNeighborhoodNames.includes(name) ? ' (inativo; anúncio existente)' : ''}</option>)}</select>{neighborhoodsStatus === 'loading' && <small className="announcement-field-message">Carregando bairros cadastrados...</small>}{neighborhoodsError && <small className="announcement-field-message">{neighborhoodsError}</small>}</div>
                </div>
                <small className="announcement-address-message" role="status">{addressLoading ? 'Consultando CEP...' : addressMessage || 'O endereço será preenchido quando disponível.'}</small>
              </section>

              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>4</span><div><h3>Localização <i>*</i></h3><p>Marque a localização exata do seu imóvel no mapa.</p></div></div>
                <div
                  className={`location-confirmation${announcementMapFullscreenOpen ? ' location-confirmation-fullscreen' : ''}`}
                  role={announcementMapFullscreenOpen ? 'dialog' : undefined}
                  aria-modal={announcementMapFullscreenOpen ? 'true' : undefined}
                  aria-label="Mapa para marcar a localização do imóvel"
                >
                  <div className="location-confirmation-header">
                    <div>
                      <strong><FilterIcon name="pin" /> &nbsp;Localizar no mapa</strong>
                      <small>{addressMessage || 'Clique no mapa ou arraste o marcador para definir a localização do imóvel.'}</small>
                    </div>
                    <div className="location-confirmation-actions">
                      <button type="button" className="locate-button" onClick={locateAnnouncement} disabled={addressLoading}>{addressLoading ? 'Localizando...' : 'Buscar endereço'}</button>
                      <button
                        type="button"
                        className="location-map-toggle-button"
                        onClick={() => setAnnouncementMapFullscreenOpen((current) => !current)}
                      >
                        {announcementMapFullscreenOpen ? '✕ Fechar' : '⛶ Expandir mapa'}
                      </button>
                    </div>
                  </div>
                  <MapContainer center={announcementCoordinates} zoom={16} maxZoom={18} className="announcement-map" scrollWheelZoom touchZoom dragging>
                    <MapResizeObserver fullscreen={announcementMapFullscreenOpen} />
                    <AnnouncementMapFocus focus={announcementMapFocus} />
                    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {announcementMapFullscreenOpen && <MapLayerSelector />}
                    <AnnouncementMapClick onSelect={(coordinates) => { setAnnouncementCoordinates(coordinates); setLocationConfirmed(true); setAddressMessage('Localização marcada. Você pode ajustar o marcador no mapa.') }} />
                    <Marker position={announcementCoordinates} draggable eventHandlers={{ dragend: (event) => { const position = event.target.getLatLng(); setAnnouncementCoordinates([position.lat, position.lng]); setLocationConfirmed(true); setAddressMessage('Ponto ajustado manualmente. Essa será a localização publicada.') } }} icon={createMarkerIcon(purposeColors[getListingPurpose(announcement)])} />
                  </MapContainer>
                  <small className={`announcement-map-status${locationConfirmed ? ' confirmed' : ''}`}>{locationConfirmed ? `Coordenadas: ${announcementCoordinates[0].toFixed(5)}, ${announcementCoordinates[1].toFixed(5)}` : 'Marque a localização exata do seu imóvel.'}</small>
                </div>
              </section>

              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>5</span><div><h3>Fotos do imóvel</h3><p>Adicione fotos de qualidade para destacar seu anúncio.</p></div></div>
                <div className="announcement-photo-layout">
                  <label className={`announcement-dropzone${imageLoading ? ' uploading' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleImageChange(event) }}>
                    <input id="image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleImageChange} disabled={imageLoading || announcementPhotos.length >= MAX_LISTING_PHOTOS} />
                    <span className="announcement-upload-icon" aria-hidden="true">▣</span><strong>{imageLoading ? 'Enviando fotos...' : 'Arraste as fotos aqui'}</strong><small>ou</small><span className="announcement-select-files">Selecionar imagens</span>
                  </label>
                  <div className="announcement-photo-gallery">
                    {announcementPhotos.map((photo, index) => (
                      <div className="announcement-photo-thumb" key={`${photo.url}-${index}`} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); moveAnnouncementPhoto(Number(event.dataTransfer.getData('text/plain')), index) }}>
                        <img src={photo.url} alt={`Foto ${index + 1} do imóvel`} loading="lazy" />
                        <button type="button" className="announcement-photo-remove" aria-label={`Remover foto ${index + 1}`} onClick={() => removeAnnouncementPhoto(index)}>×</button>
                        <div className="announcement-photo-order"><button type="button" aria-label="Mover foto para a esquerda" disabled={index === 0} onClick={() => moveAnnouncementPhoto(index, index - 1)}>‹</button><span>{index === 0 ? 'Principal' : index + 1}</span><button type="button" aria-label="Mover foto para a direita" disabled={index === announcementPhotos.length - 1} onClick={() => moveAnnouncementPhoto(index, index + 1)}>›</button></div>
                      </div>
                    ))}
                    {announcementPhotos.length < MAX_LISTING_PHOTOS && <label className="announcement-add-photo" htmlFor="image"><span>＋</span>Adicionar<br />mais fotos</label>}
                  </div>
                </div>
                <small className="announcement-photo-message">{imageLoading ? 'Enviando...' : imageMessage || `${announcementPhotos.length}/${MAX_LISTING_PHOTOS} fotos. JPG, PNG ou WEBP, até 8 MB cada.`}</small>
              </section>

              {announcementError && <p className="announcement-submit-error" role="alert">{announcementError}</p>}
              <div className="form-actions">
                <button type="button" className="cancel-form-btn" onClick={closeAnnouncementForm}>Cancelar</button>
                <button type="submit" className="submit-form-btn" disabled={announcementSubmitting || imageLoading}>{announcementSubmitting ? <><span className="announcement-spinner" />Publicando...</> : '➤  Publicar imóvel'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {announcementSuccess && (
        <div className="property-modal-backdrop announcement-success-backdrop" role="presentation">
          <section className="announcement-success-dialog" role="dialog" aria-modal="true" aria-labelledby="announcement-success-title">
            <span className="announcement-success-icon" aria-hidden="true">✓</span>
            <h2 id="announcement-success-title">🎉 Anúncio enviado com sucesso!</h2>
            <p>Seu imóvel foi recebido e agora passará por uma análise antes da publicação.</p>
            <p>Você poderá acompanhar o andamento em <strong>Meus Imóveis</strong>.</p>
            <div className="announcement-success-status"><span aria-hidden="true">●</span><div><small>Status atual</small><strong>Em análise</strong></div></div>
            <div className="announcement-success-actions">
              <button type="button" className="submit-form-btn" onClick={() => {
                setAnnouncementSuccess(false)
                if (authUser) {
                  setAccountFilter('all')
                  openMyArea('listings')
                } else {
                  setAuthMode('login')
                  setAuthOpen(true)
                }
              }}>Ir para Meus Imóveis</button>
              <button type="button" className="cancel-form-btn portal-back-button" onClick={() => setAnnouncementSuccess(false)}><ArrowLeft size={18} aria-hidden="true" />Voltar</button>
            </div>
          </section>
        </div>
      )}

      {authOpen && (
        <div className="property-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAuthModal()
        }}>
          <section className="property-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <div className="announcement-header">
              <h2 id="auth-title">{authMode === 'login' ? (authMessage.toLocaleLowerCase('pt-BR').includes('favoritos') ? 'Entre para salvar seus favoritos' : 'Entrar para anunciar') : 'Criar conta de anunciante'}</h2>
              <p>Você pode continuar navegando sem cadastro. Entre para salvar favoritos, publicar e acompanhar seus imóveis.</p>
            </div>
            <form className="announcement-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                authSignupStep === 'profile' ? (
                  <div className="auth-profile-step">
                    <fieldset className="auth-profile-options">
                      <legend>Qual é o seu perfil?</legend>
                      {[
                        ['pessoa_fisica', '🏠', 'Quero anunciar meu imóvel'],
                        ['corretor', '👨‍💼', 'Sou corretor de imóveis'],
                        ['imobiliaria', '🏢', 'Sou uma imobiliária'],
                      ].map(([value, icon, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`auth-profile-option${authForm.userType === value ? ' selected' : ''}`}
                          aria-pressed={authForm.userType === value}
                          onClick={() => { setAuthForm((current) => ({ ...current, userType: value })); setAuthMessage('') }}
                        >
                          <span aria-hidden="true">{icon}</span>{label}
                        </button>
                      ))}
                    </fieldset>
                    {authMessage && <p className="auth-message" role="alert">{authMessage}</p>}
                    <div className="form-actions">
                      <button type="button" className="cancel-form-btn" onClick={closeAuthModal}>Cancelar</button>
                      <button
                        type="button"
                        className="submit-form-btn"
                        disabled={!authForm.userType}
                        onClick={() => { setAuthSignupStep('details'); setAuthMessage('') }}
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button type="button" className="auth-back portal-back-button" onClick={() => { setAuthSignupStep('profile'); setAuthMessage('') }}><ArrowLeft size={18} aria-hidden="true" />Voltar</button>
                    {authForm.userType === 'imobiliaria' ? (
                      <>
                        <div className="form-group">
                          <label htmlFor="auth-company-name">Nome da Imobiliária</label>
                          <input id="auth-company-name" type="text" value={authForm.companyName} onChange={(event) => setAuthForm((current) => ({ ...current, companyName: event.target.value }))} autoComplete="organization" required />
                        </div>
                        <div className="form-group">
                          <label htmlFor="auth-cnpj">CNPJ</label>
                          <input id="auth-cnpj" type="text" inputMode="numeric" value={authForm.cnpj} onChange={(event) => setAuthForm((current) => ({ ...current, cnpj: formatCnpj(event.target.value) }))} placeholder="00.000.000/0000-00" maxLength="18" aria-required="true" />
                        </div>
                        <div className="form-group">
                          <label htmlFor="auth-responsible">Nome do Responsável</label>
                          <input id="auth-responsible" type="text" value={authForm.responsibleName} onChange={(event) => setAuthForm((current) => ({ ...current, responsibleName: event.target.value }))} autoComplete="name" required />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label htmlFor="auth-name">Nome Completo</label>
                          <input id="auth-name" type="text" value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required />
                        </div>
                        <div className="form-group">
                          <label htmlFor="auth-cpf">CPF</label>
                          <input id="auth-cpf" type="text" inputMode="numeric" value={authForm.cpf} onChange={(event) => setAuthForm((current) => ({ ...current, cpf: formatCpf(event.target.value) }))} placeholder="000.000.000-00" maxLength="14" aria-required="true" />
                        </div>
                        {authForm.userType === 'corretor' && (
                          <div className="form-group">
                            <label htmlFor="auth-creci">CRECI</label>
                            <input id="auth-creci" type="text" value={authForm.creci} onChange={(event) => setAuthForm((current) => ({ ...current, creci: event.target.value }))} placeholder="123456, 123456-F ou CRECI/SP 123456" aria-required="true" />
                          </div>
                        )}
                      </>
                    )}
                    <div className="form-group">
                      <label htmlFor="auth-phone">Telefone</label>
                      <input id="auth-phone" type="tel" inputMode="tel" value={authForm.phone} onChange={(event) => setAuthForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))} placeholder="(00) 00000-0000" maxLength="15" autoComplete="tel" required />
                    </div>
                  </>
                )
              )}
              {(authMode === 'login' || authSignupStep === 'details') && (
                <>
                  <div className="form-group">
                    <label htmlFor="auth-email">E-mail</label>
                    <input id="auth-email" type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} placeholder="voce@email.com" autoComplete="email" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="auth-password">Senha</label>
                    <input id="auth-password" type="password" minLength="6" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} placeholder="Mínimo de 6 caracteres" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required />
                  </div>
                </>
              )}
              {authMessage && <p className="auth-message" role="alert">{authMessage}</p>}
              {!isSupabaseConfigured && <p className="auth-message">A autenticação ainda precisa ser configurada no Supabase antes de ficar disponível.</p>}
              {(authMode === 'login' || authSignupStep === 'details') && (
                <div className="form-actions">
                  <button type="button" className="cancel-form-btn" onClick={closeAuthModal}>Cancelar</button>
                  <button type="submit" className="submit-form-btn" disabled={!isSupabaseConfigured || authLoading}>{authLoading ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}</button>
                </div>
              )}
              <button type="button" className="auth-switch" onClick={() => {
                if (authMode === 'login') {
                  setAuthForm(emptyAuthForm)
                  setAuthSignupStep('profile')
                }
                setAuthMode(authMode === 'login' ? 'signup' : 'login')
                setAuthMessage('')
              }}>
                {authMode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedListing && (
        <div className="property-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDetails()
        }}>
          <section className="property-modal" role="dialog" aria-modal="true" aria-labelledby="property-modal-title">
            <button type="button" className="modal-close" aria-label="Fechar detalhes" onClick={closeDetails}>×</button>
            <div className="modal-image-wrap">
              {getListingImages(selectedListing)[0]
                ? <img src={getListingImages(selectedListing)[0]} alt={selectedListing.title} className="modal-image" />
                : <ListingImagePlaceholder />}
            </div>
            <div className="modal-content">
              <div className="modal-badges">
                <span className="modal-badge available">{selectedListing.status}</span>
                <span className={`modal-badge purpose-badge purpose-${getListingPurpose(selectedListing)}`}>{getListingPurposeLabel(selectedListing)}</span>
              </div>
              <h2 id="property-modal-title">{selectedListing.title}</h2>
              <p className={`modal-price purpose-price purpose-${getListingPurpose(selectedListing)}`}>{selectedListing.price}</p>

              <div className="property-facts">
                <div><strong>{selectedListing.bedrooms || '-'}</strong><span>Quartos</span></div>
                <div><strong>{formatArea(selectedListing.area)}</strong><span>Área</span></div>
                <div><strong>{selectedListing.neighborhood}</strong><span>Bairro</span></div>
                <div><strong>{getListingPropertyType(selectedListing).icon} {getListingPropertyType(selectedListing).label}</strong><span>Tipo do imóvel</span></div>
              </div>

              <h3>Descrição</h3>
              <p className="modal-description">{selectedListing.description}</p>
              <div className="contact-box">
                <h3>Contato do anunciante</h3>
                <div className="contact-details">
                  <span>♙ {selectedListing.advertiser}</span>
                  <span>⌕ {selectedListing.phone}</span>
                </div>
                <a className="contact-button" href={`tel:${selectedListing.phone.replace(/\D/g, '')}`}>☎&nbsp; Entrar em contato</a>
              </div>
            </div>
          </section>
        </div>
      )}
      <SiteFooter />
    </div>
  )
}

export default App
