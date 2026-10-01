import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import logo from './assets/logo.png'
import heroIllustration from './assets/hero-house.png'
import { getListingSlug, getListingSlugFromPath, isPortalCityListing, ListingDetailPage, ListingShowcase } from './ListingShowcase.jsx'

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

const typeColors = {
  venda: '#22c55e',
  aluguel: '#16a34a',
  terreno: '#f59e0b',
  ponto_comercial: '#64748b',
}

const listingTypeLabels = {
  venda: 'Venda',
  aluguel: 'Aluguel',
  terreno: 'Terreno',
  ponto_comercial: 'Ponto Comercial',
}

const getListingTypeLabel = (type) => listingTypeLabels[String(type || '').trim().toLowerCase()] || 'Imóvel'
const formatArea = (area) => `${Number.parseInt(area, 10) || 0} m²`

function FilterSelect({ id, label, value, options, onChange, emphasized = false }) {
  return (
    <div className={`field${emphasized ? ' filter-search' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className={`filter-select-control${emphasized ? ' emphasized' : ''}`} translate="no">
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
  status: 'Disponível',
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

const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
)

const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 8h3V4.2c-.52-.08-1.7-.2-3.2-.2-3.17 0-5.34 1.93-5.34 5.48V12H5v4h3.46v8h4.24v-8h3.53l.56-4H12.7V9.92c0-1.16.31-1.92 1.3-1.92Z" />
  </svg>
)

function App() {
  const [selectedListing, setSelectedListing] = useState(null)
  const [userListings, setUserListings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('morafacil-user-listings') || '[]')
    } catch {
      return []
    }
  })
  const [publishedListings, setPublishedListings] = useState([])
  const [announcement, setAnnouncement] = useState(emptyAnnouncement)
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [announcementPhotos, setAnnouncementPhotos] = useState([])
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false)
  const [announcementCategory, setAnnouncementCategory] = useState('Casa')
  const [editingListingId, setEditingListingId] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckMessage, setAdminCheckMessage] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressMessage, setAddressMessage] = useState('')
  const [announcementCoordinates, setAnnouncementCoordinates] = useState(mapCenter)
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)
  const [accountFilter, setAccountFilter] = useState('all')

  const listings = isSupabaseConfigured
    ? (publishedListings.length > 0 ? publishedListings : sampleListings)
    : [...sampleListings, ...userListings]

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !authUser) return

    supabase.rpc('is_admin').then(({ data, error }) => {
      if (error) {
        setIsAdmin(false)
        setAdminCheckMessage('Execute a migração de administrador no Supabase para liberar a gestão de todos os anúncios.')
        return
      }
      setIsAdmin(Boolean(data))
      setAdminCheckMessage(data ? '' : 'Esta conta ainda não está registrada como administradora.')
    })
  }, [authUser])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadUserListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error) {
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
          ? (isAdmin ? normalizedListings : normalizedListings.filter((item) => item.user_id === authUser.id))
          : [])
      }
    }

    loadUserListings()
  }, [authUser, isAdmin])

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
      || (appliedFilters.type === 'Terrenos' && item.type === 'terreno')
      || (appliedFilters.type === 'Venda' && item.type === 'venda')
      || (appliedFilters.type === 'Aluguel' && item.type === 'aluguel')
      || (appliedFilters.type === 'Ponto Comercial' && item.type === 'ponto_comercial')
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

  const featuredListings = filteredListings.length > 0 ? filteredListings : cityListings
  const heroCarouselListings = (filteredListings.length > 0 ? filteredListings : sampleListings).slice(0, 3)

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
      value: filteredListings.filter((item) => item.type === 'aluguel' && item.bedrooms > 0).length,
      details: 'Disponíveis',
    },
    {
      label: 'Casas',
      value: filteredListings.filter((item) => item.type === 'venda' && item.bedrooms > 0).length,
      details: 'Disponíveis',
    },
    {
      label: 'Aluguel',
      value: filteredListings.filter((item) => item.type === 'aluguel').length,
      details: 'Ativos',
    },
    {
      label: 'Terrenos',
      value: filteredListings.filter((item) => item.type === 'terreno').length,
      details: 'Prontos',
    },
  ]

  const openDetails = (listing) => setSelectedListing(listing)
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
    } : emptyAnnouncement)
    const listingPhotos = listing?.images?.length
      ? listing.images.map((url, index) => ({ url, name: `Foto ${index + 1}` }))
      : listing?.image ? [{ url: listing.image, name: 'Foto principal' }] : []
    setAnnouncementPhotos(listingPhotos)
    setAnnouncementSubmitting(false)
    setAnnouncementCategory(listing?.property_category === 'apartamento' ? 'Apartamento' : listing?.property_category === 'terreno' || listing?.type === 'terreno' ? 'Terreno' : listing?.property_category === 'ponto_comercial' || listing?.type === 'ponto_comercial' ? 'Ponto Comercial' : 'Casa')
    setAnnouncementCoordinates(listing?.coordinates || cityCoordinates[listing?.city] || mapCenter)
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
    setAddressMessage('')
    setLocationConfirmed(false)
    setImageMessage('')
  }

  const handleImageChange = async (event) => {
    const files = Array.from(event.dataTransfer?.files || event.target?.files || [])
    if (event.target?.tagName === 'INPUT') event.target.value = ''
    if (!files.length) return

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const availableSlots = Math.max(0, 5 - announcementPhotos.length)
    const selectedFiles = files.slice(0, availableSlots)
    if (files.length > availableSlots) setImageMessage('O limite é de 5 fotos por anúncio.')
    if (!selectedFiles.length) return

    const validFiles = selectedFiles.filter((file) => acceptedTypes.includes(file.type) && file.size <= 8 * 1024 * 1024)
    if (validFiles.length !== selectedFiles.length) {
      setImageMessage('Use fotos JPG, PNG ou WEBP de até 8 MB cada.')
    }
    if (!validFiles.length) return

    setImageLoading(true)
    setImageMessage('Preparando fotos...')
    const uploadedPhotos = []
    for (const file of validFiles) {
      if (!isSupabaseConfigured || !authUser) {
        uploadedPhotos.push({ url: URL.createObjectURL(file), name: file.name })
        continue
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${authUser.id}/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from('property-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })
      if (error) {
        setImageMessage(`Não foi possível enviar ${file.name}: ${error.message}`)
        continue
      }
      const { data } = supabase.storage.from('property-images').getPublicUrl(path)
      uploadedPhotos.push({ url: data.publicUrl, name: file.name })
    }

    const nextPhotos = [...announcementPhotos, ...uploadedPhotos].slice(0, 5)
    setAnnouncementPhotos(nextPhotos)
    setAnnouncement((value) => ({ ...value, image: nextPhotos[0]?.url || '' }))
    setImageMessage(uploadedPhotos.length ? 'Fotos adicionadas. Arraste para ordenar.' : 'Nenhuma foto pôde ser adicionada.')
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
      setAnnouncement((current) => ({
        ...current,
        city,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
      }))
      setAddressMessage('Endereço encontrado. Confira o número da casa.')
    } catch {
      setAddressMessage('Não foi possível consultar o CEP agora.')
    } finally {
      setAddressLoading(false)
    }
  }

  const locateAnnouncement = async () => {
    if (!announcement.street || !announcement.number) {
      setAddressMessage('Informe a rua e o número antes de localizar.')
      return null
    }

    setAddressLoading(true)
    setAddressMessage('Localizando endereço no mapa...')
    try {
      const query = `${announcement.street}, ${announcement.number}, ${announcement.city}, São Paulo, Brasil`
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`)
      const results = await response.json()
      if (!results[0]) {
        setAddressMessage('Endereço não localizado. Arraste o marcador manualmente.')
        return null
      }
      const coordinates = [Number(results[0].lat), Number(results[0].lon)]
      setAnnouncementCoordinates(coordinates)
      setAnnouncement((current) => ({ ...current, address: results[0].display_name }))
      setLocationConfirmed(true)
      setAddressMessage('Local encontrado. Você pode ajustar o marcador no mapa.')
      return { coordinates, address: results[0].display_name }
    } catch {
      setAddressMessage('Não foi possível localizar. Ajuste o marcador manualmente.')
      return null
    } finally {
      setAddressLoading(false)
    }
  }

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault()
    if (announcementSubmitting) return
    setAnnouncementSubmitting(true)
    const cityCenter = cityCoordinates[announcement.city] || neighborhoodCoordinates[announcement.neighborhood] || mapCenter
    let coordinates = announcementCoordinates || cityCenter

    if (!locationConfirmed) {
      const located = await locateAnnouncement()
      if (located) {
        coordinates = located.coordinates
      } else {
        setAddressMessage('Confirme a localização no mapa antes de publicar.')
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
      property_category: announcementCategory.toLocaleLowerCase('pt-BR').replaceAll(' ', '_'),
      purpose: announcement.type === 'aluguel' ? 'aluguel' : 'venda',
      coordinates,
      address: announcement.address || `${announcement.street}, ${announcement.number}`,
      image: announcement.image || sampleListings[0].image,
      images: announcementPhotos.map((photo) => photo.url),
      status: announcement.status || 'Disponível',
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
      const { error } = await query
      if (error) {
        setAuthMessage(`Não foi possível salvar o anúncio: ${error.message}`)
        setAnnouncementSubmitting(false)
        return
      }
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
      const normalizedListings = (data || []).map((item) => ({ ...item, coordinates: [item.latitude, item.longitude], location: `${item.neighborhood}, ${item.city || 'Ipuã-SP'}`, area: formatArea(item.area), parking_spaces: Number(item.parking_spaces ?? item.garages) || 0, owner: item.user_id === authUser.id }))
      setPublishedListings(normalizedListings)
      setUserListings(isAdmin ? normalizedListings : normalizedListings.filter((item) => item.user_id === authUser.id))
    } else {
      setUserListings((current) => editingListingId
        ? current.map((item) => item.id === editingListingId ? listing : item)
        : [...current, listing])
    }
    closeAnnouncementForm(true)
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
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
          options: { data: { full_name: authForm.name } },
        })
    } catch (error) {
      setAuthMessage(`Não foi possível conectar ao Supabase. Confira a URL do projeto e tente novamente. (${error.message})`)
      setAuthLoading(false)
      return
    }

    if (result.error) {
      setAuthMessage(`Supabase: ${result.error.message}`)
    } else if (authMode === 'signup' && !result.data.session) {
      setAuthMessage('Conta criada. Confira seu e-mail para confirmar o cadastro.')
    } else {
      setAuthOpen(false)
      setAuthForm({ name: '', email: '', password: '' })
    }
    setAuthLoading(false)
  }

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    setIsAdmin(false)
    setUserListings([])
    setAccountOpen(false)
  }

  const removeUserListing = async (id) => {
    if (!window.confirm('Excluir este anúncio?')) return

    if (isSupabaseConfigured && authUser) {
      const deleteQuery = supabase.from('listings').delete().eq('id', id)
      if (!isAdmin) deleteQuery.eq('user_id', authUser.id)
      await deleteQuery
      setPublishedListings((current) => current.filter((item) => item.id !== id))
    }

    setUserListings((current) => current.filter((item) => item.id !== id))
    if (selectedListing?.id === id) closeDetails()
  }
  
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeDetails()
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const userFirstName = (() => {
    const source = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'visitante'
    const first = source.trim().split(' ')[0]
    return first.charAt(0).toUpperCase() + first.slice(1)
  })()

  const isCompletedListing = (item) => {
    const status = String(item.status || '').toLowerCase()
    return status.includes('conclu') || status.includes('vend') || status.includes('expir')
  }
  const activeListings = userListings.filter((item) => !isCompletedListing(item))
  const completedListings = userListings.filter(isCompletedListing)
  const visibleAccountListings = accountFilter === 'active'
    ? activeListings
    : accountFilter === 'completed' ? completedListings : userListings

  const routeSlug = getListingSlugFromPath()
  if (routeSlug) {
    const routeListing = listings.find((item) => getListingSlug(item) === routeSlug)
    if (routeListing) return <ListingDetailPage listing={routeListing} />
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
          <button type="button" className="header-avatar" aria-label={authUser ? `Abrir conta de ${userFirstName}` : 'Abrir acesso à conta'} onClick={() => authUser ? setAccountOpen(true) : setAuthOpen(true)}>{userFirstName.charAt(0)}</button>
          <button type="button" className="menu-toggle" aria-label="Abrir menu lateral" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}>
            <svg className="menu-toggle-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          {isSupabaseConfigured && !authUser && <button type="button" className="account-btn" onClick={() => setAuthOpen(true)}>Entrar</button>}
        </div>

        {accountOpen && authUser && (
          <section className="account-popover" aria-label="Minha conta">
            <button type="button" className="account-close" onClick={() => setAccountOpen(false)} aria-label="Fechar conta">×</button>
            <div className="account-dashboard-header">
              <div className="account-dashboard-brand">
                <img src={logo} alt="" />
                <strong>Mora <span>Fácil</span></strong>
              </div>
            </div>
            <div className="account-dashboard-heading">
              <h2>Meus Imóveis</h2>
              <p>Gerencie seus anúncios e acompanhe o status de cada imóvel.</p>
            </div>
            <div className="account-metrics" aria-label="Resumo dos anúncios">
              <article className="account-metric-card">
                <strong>{userListings.length}</strong>
                <span>Total</span>
              </article>
              <article className="account-metric-card active">
                <strong>{activeListings.length}</strong>
                <span>Ativos</span>
              </article>
              <article className="account-metric-card completed">
                <strong>{completedListings.length}</strong>
                <span>Concluídos</span>
              </article>
            </div>
            {adminCheckMessage && <p className="admin-check-message">{adminCheckMessage}</p>}
            <div className="account-dashboard-toolbar">
              <div className="account-filter-tabs" role="tablist" aria-label="Filtrar imóveis">
                <button type="button" className={accountFilter === 'all' ? 'active' : ''} onClick={() => setAccountFilter('all')}>Todos ({userListings.length})</button>
                <button type="button" className={accountFilter === 'active' ? 'active' : ''} onClick={() => setAccountFilter('active')}>Ativos ({activeListings.length})</button>
                <button type="button" className={accountFilter === 'completed' ? 'active' : ''} onClick={() => setAccountFilter('completed')}>Concluídos ({completedListings.length})</button>
              </div>
            </div>
            {visibleAccountListings.length === 0 ? (
              <div className="account-empty">Você ainda não cadastrou imóveis.</div>
            ) : (
              <div className="account-dashboard-grid">
                {visibleAccountListings.map((item) => {
                  const completed = isCompletedListing(item)
                  return (
                    <article key={item.id} className="account-dashboard-card">
                      <div className="account-card-image-wrap">
                        <img src={item.image} alt={item.title} className="account-card-image" />
                        <span className={`account-status ${completed ? 'completed' : 'active'}`}>{completed ? 'Concluído' : 'Ativo'}</span>
                      </div>
                      <div className="account-card-body">
                        <h3>{item.title}</h3>
                        <p className="account-card-location">{item.location}</p>
                        <strong className="account-card-price">{item.price}</strong>
                        <div className="account-card-meta">
                          <span><i aria-hidden="true">🛏</i><b>{item.bedrooms || 0}</b><small>Quartos</small></span>
                          <span><i aria-hidden="true">🚿</i><b>{item.bathrooms || 1}</b><small>Banheiros</small></span>
                          <span><i aria-hidden="true">🚗</i><b>{item.parking_spaces || item.garages || 0}</b><small>Vagas</small></span>
                          <span><i aria-hidden="true">📐</i><b>{formatArea(item.area)}</b><small>Área</small></span>
                        </div>
                      </div>
                      <div className="account-card-actions">
                        <button type="button" onClick={() => { openAnnouncementForm(item); setAccountOpen(false) }}>Editar anúncio</button>
                        <button type="button" className="delete" onClick={() => removeUserListing(item.id)}>Excluir</button>
                      </div>
                    </article>
                  )
                })}
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
              <button type="button" className="mobile-menu-primary" onClick={() => { setMobileMenuOpen(false); setAccountOpen(true) }}>
                <span className="mobile-menu-action-icon"><MenuSearchIcon /></span>
                <span className="mobile-menu-action-label">Ver imóveis cadastrados</span>
                <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
              </button>
            ) : (
              <>
                <button type="button" className="mobile-menu-primary" onClick={() => { setMobileMenuOpen(false); setAuthMode('login'); setAuthMessage(''); setAuthOpen(true) }}>
                  <span className="mobile-menu-action-icon"><MenuSearchIcon /></span>
                  <span className="mobile-menu-action-label">Entrar na conta</span>
                  <span className="mobile-menu-action-arrow"><MenuArrowIcon /></span>
                </button>
                <button type="button" className="mobile-menu-secondary" onClick={() => { setMobileMenuOpen(false); setAuthMode('signup'); setAuthMessage(''); setAuthOpen(true) }}>
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
            <div className="mobile-menu-divider" />
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

      <section className="hero-content" aria-label="Encontre seu próximo lar">
        <div className="hero-copy">
          <h2>Encontre seu<br /><span>próximo lar.</span></h2>
          <p>Imóveis do seu jeito, perto de você.</p>
        </div>
        <img className="hero-illustration" src={heroIllustration} alt="" aria-hidden="true" />
      </section>

      <section className="home-search-grid">
        <article className="hero-listing-card">
          {heroCarouselListings.map((item, index) => (
            <img
              key={item.id}
              src={item.image}
              alt={item.title}
              className={index === heroSlideIndex % heroCarouselListings.length ? 'active' : ''}
              onClick={() => openDetails(item)}
            />
          ))}
          <span className="hero-listing-badge" translate="no">
            {getListingTypeLabel(heroCarouselListings[heroSlideIndex % heroCarouselListings.length].type)}
          </span>
          {heroCarouselListings.length > 1 && (
            <>
              <button
                type="button"
                className="hero-carousel-arrow hero-carousel-arrow-left"
                aria-label="Anúncio anterior"
                onClick={() => setHeroSlideIndex((current) => (current - 1 + heroCarouselListings.length) % heroCarouselListings.length)}
              >‹</button>
              <button
                type="button"
                className="hero-carousel-arrow hero-carousel-arrow-right"
                aria-label="Próximo anúncio"
                onClick={() => setHeroSlideIndex((current) => (current + 1) % heroCarouselListings.length)}
              >›</button>
            </>
          )}
          <button
            type="button"
            className="hero-listing-cta"
            onClick={() => openDetails(heroCarouselListings[heroSlideIndex % heroCarouselListings.length])}
          >
            Ver detalhes <b>›</b>
          </button>
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

        <section className="filters-bar search-panel">
        <FilterSelect
          id="search-location"
          label="Onde você quer morar?"
          value={draftFilters.search}
          options={['Ipuã-SP', 'Guaíra-SP']}
          emphasized
          onChange={(search) => setDraftFilters({ ...draftFilters, search })}
        />
        <FilterSelect
          id="search-type"
          label="Tipo"
          value={draftFilters.type}
          options={['Todos os imóveis', 'Venda', 'Aluguel', 'Terrenos', 'Ponto Comercial']}
          onChange={(type) => setDraftFilters({ ...draftFilters, type })}
        />
        <FilterSelect
          id="search-neighborhood"
          label="Bairro"
          value={draftFilters.neighborhood}
          options={['Qualquer bairro', 'Centro', 'Jardim das Flores', 'Zona Norte', 'Jardim Primavera', 'Residencial Santana']}
          onChange={(neighborhood) => setDraftFilters({ ...draftFilters, neighborhood })}
        />
        <FilterSelect
          id="search-bedrooms"
          label="Quartos"
          value={draftFilters.bedrooms}
          options={['Qualquer', '1+', '2+', '3+']}
          onChange={(bedrooms) => setDraftFilters({ ...draftFilters, bedrooms })}
        />

        <button type="button" className="search-btn" onClick={() => setAppliedFilters(draftFilters)}>Buscar</button>
        </section>
      </section>

      <div className="map-label-row">
        <span className="map-label">Mapa de Ipuã-SP</span>
      </div>

      <section className="map-panel" aria-label="Mapa com imóveis disponíveis">
        <MapContainer center={mapCenter} zoom={14} className="map-box" scrollWheelZoom>
          <TileLayer
            attribution='&copy; Esri &copy; OpenStreetMap contributors'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}"
          />

          {filteredListings.map((item) => (
            <Marker key={item.id} position={item.coordinates} icon={createMarkerIcon(typeColors[item.type])}>
              <Popup>
                <div className="map-detail-card">
                  <h3>{item.title}</h3>
                  <p className="detail-price">{item.price}</p>
                  <p className="detail-meta">{item.address}</p>
                  <p className="detail-meta">
                    {item.bedrooms > 0 ? `${item.bedrooms} quartos` : 'Terreno'} · {formatArea(item.area)}
                  </p>
                  <button type="button" className="detail-button" onClick={() => openDetails(item)}>Saiba mais →</button>
                </div>
              </Popup>
            </Marker>
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

      <ListingShowcase listings={featuredListings} city={appliedFilters.search.trim()} />

      {announcementOpen && (
        <div className="property-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAnnouncementForm()
        }}>
          <section className="property-modal announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
            <div className="announcement-page-heading">
              <div>
                <button type="button" className="announcement-back" onClick={closeAnnouncementForm}>← Voltar</button>
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
                <div className={`announcement-progress-step${index === 0 ? ' current' : ''}`} key={step}>
                  <span>{index + 1}</span><small>{step}</small>
                </div>
              ))}
            </div>
            <form className="announcement-form" onSubmit={handleAnnouncementSubmit}>
              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>1</span><div><h3>Qual o tipo do imóvel? <i>*</i></h3><p>Selecione a categoria que melhor descreve seu imóvel.</p></div></div>
                <div className="announcement-category-grid">
                  {[['Casa', '⌂'], ['Apartamento', '▦'], ['Terreno', '♣'], ['Ponto Comercial', '▤']].map(([category, icon]) => (
                    <button type="button" key={category} className={`announcement-category${announcementCategory === category ? ' selected' : ''}`} aria-pressed={announcementCategory === category} onClick={() => {
                      setAnnouncementCategory(category)
                      if (category === 'Terreno') setAnnouncement((current) => ({ ...current, type: 'terreno' }))
                      if (category === 'Ponto Comercial') setAnnouncement((current) => ({ ...current, type: 'ponto_comercial' }))
                      if (category === 'Casa' || category === 'Apartamento') setAnnouncement((current) => ({ ...current, type: ['terreno', 'ponto_comercial'].includes(current.type) ? 'venda' : current.type }))
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
                  <fieldset className="form-group field-purpose"><legend>Finalidade <i>*</i></legend><div className="announcement-purpose-control">
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
                  <div className="form-group"><label htmlFor="city">Cidade <i>*</i></label><select id="city" name="city" value={announcement.city} onChange={(event) => { const city = event.target.value; setAnnouncement({ ...announcement, city }); setAnnouncementCoordinates(cityCoordinates[city] || mapCenter); setLocationConfirmed(false) }} required><option>Ipuã-SP</option><option>Guaíra-SP</option></select></div>
                  <div className="form-group"><label htmlFor="cep">CEP <i>*</i></label><input id="cep" name="cep" inputMode="numeric" value={announcement.cep} onChange={(event) => setAnnouncement({ ...announcement, cep: event.target.value.replace(/\D/g, '').slice(0, 8) })} onBlur={lookupCep} placeholder="Ex.: 14610-000" required /><small className="announcement-field-message">{addressLoading ? 'Consultando CEP...' : addressMessage || 'O endereço será preenchido quando disponível.'}</small></div>
                  <div className="form-group field-street"><label htmlFor="street">Rua <i>*</i></label><input id="street" name="street" value={announcement.street} onChange={(event) => setAnnouncement({ ...announcement, street: event.target.value })} placeholder="Ex.: Rua das Flores" required /></div>
                  <div className="form-group"><label htmlFor="number">Número <i>*</i></label><input id="number" name="number" value={announcement.number} onChange={(event) => setAnnouncement({ ...announcement, number: event.target.value })} placeholder="Ex.: 123" required /></div>
                  <div className="form-group"><label htmlFor="neighborhood">Bairro <i>*</i></label><input id="neighborhood" name="neighborhood" value={announcement.neighborhood} onChange={(event) => setAnnouncement({ ...announcement, neighborhood: event.target.value })} placeholder="Ex.: Centro" required /></div>
                </div>
              </section>

              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>4</span><div><h3>Localização <i>*</i></h3><p>Marque a localização exata do seu imóvel no mapa.</p></div></div>
                <div className="location-confirmation">
                  <div className="location-confirmation-header"><div><strong>⌖ &nbsp;Localizar no mapa</strong><small>{addressMessage || 'Clique no mapa ou arraste o marcador para definir a localização do imóvel.'}</small></div><button type="button" className="locate-button" onClick={locateAnnouncement} disabled={addressLoading}>{addressLoading ? 'Localizando...' : 'Buscar endereço'}</button></div>
                  <MapContainer center={announcementCoordinates} zoom={16} className="announcement-map" scrollWheelZoom>
                    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <AnnouncementMapClick onSelect={(coordinates) => { setAnnouncementCoordinates(coordinates); setLocationConfirmed(true); setAddressMessage('Localização marcada. Você pode ajustar o marcador no mapa.') }} />
                    <Marker position={announcementCoordinates} draggable eventHandlers={{ dragend: (event) => { const position = event.target.getLatLng(); setAnnouncementCoordinates([position.lat, position.lng]); setLocationConfirmed(true); setAddressMessage('Ponto ajustado manualmente. Essa será a localização publicada.') } }} icon={createMarkerIcon(typeColors[announcement.type])} />
                  </MapContainer>
                  <small className={`announcement-map-status${locationConfirmed ? ' confirmed' : ''}`}>{locationConfirmed ? `Coordenadas: ${announcementCoordinates[0].toFixed(5)}, ${announcementCoordinates[1].toFixed(5)}` : 'Marque a localização exata do seu imóvel.'}</small>
                </div>
              </section>

              <section className="announcement-step-panel">
                <div className="announcement-step-heading"><span>5</span><div><h3>Fotos do imóvel</h3><p>Adicione fotos de qualidade para destacar seu anúncio.</p></div></div>
                <div className="announcement-photo-layout">
                  <label className={`announcement-dropzone${imageLoading ? ' uploading' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleImageChange(event) }}>
                    <input id="image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleImageChange} disabled={imageLoading || announcementPhotos.length >= 5} />
                    <span className="announcement-upload-icon" aria-hidden="true">▣</span><strong>{imageLoading ? 'Enviando fotos...' : 'Arraste as fotos aqui'}</strong><small>ou</small><span className="announcement-select-files">Selecionar imagens</span>
                  </label>
                  <div className="announcement-photo-gallery">
                    {announcementPhotos.map((photo, index) => (
                      <div className="announcement-photo-thumb" key={`${photo.url}-${index}`} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); moveAnnouncementPhoto(Number(event.dataTransfer.getData('text/plain')), index) }}>
                        <img src={photo.url} alt={`Foto ${index + 1} do imóvel`} />
                        <button type="button" className="announcement-photo-remove" aria-label={`Remover foto ${index + 1}`} onClick={() => removeAnnouncementPhoto(index)}>×</button>
                        <div className="announcement-photo-order"><button type="button" aria-label="Mover foto para a esquerda" disabled={index === 0} onClick={() => moveAnnouncementPhoto(index, index - 1)}>‹</button><span>{index === 0 ? 'Principal' : index + 1}</span><button type="button" aria-label="Mover foto para a direita" disabled={index === announcementPhotos.length - 1} onClick={() => moveAnnouncementPhoto(index, index + 1)}>›</button></div>
                      </div>
                    ))}
                    {announcementPhotos.length < 5 && <label className="announcement-add-photo" htmlFor="image"><span>＋</span>Adicionar<br />mais fotos</label>}
                  </div>
                </div>
                <small className="announcement-photo-message">{imageLoading ? 'Enviando...' : imageMessage || `${announcementPhotos.length}/5 fotos. JPG, PNG ou WEBP, até 8 MB cada.`}</small>
              </section>

              <div className="form-actions">
                <button type="button" className="cancel-form-btn" onClick={closeAnnouncementForm}>Cancelar</button>
                <button type="submit" className="submit-form-btn" disabled={announcementSubmitting || imageLoading}>{announcementSubmitting ? <><span className="announcement-spinner" />Publicando...</> : '➤  Publicar imóvel'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {authOpen && (
        <div className="property-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAuthOpen(false)
        }}>
          <section className="property-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <div className="announcement-header">
              <h2 id="auth-title">{authMode === 'login' ? 'Entrar para anunciar' : 'Criar conta de anunciante'}</h2>
              <p>Você pode continuar navegando sem cadastro. A conta só é necessária para publicar e acompanhar seus imóveis.</p>
            </div>
            <form className="announcement-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="auth-name">Nome completo</label>
                  <input id="auth-name" type="text" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Seu nome" required />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="auth-email">E-mail</label>
                <input id="auth-email" type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="voce@email.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="auth-password">Senha</label>
                <input id="auth-password" type="password" minLength="6" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Mínimo de 6 caracteres" required />
              </div>
              {authMessage && <p className="auth-message" role="alert">{authMessage}</p>}
              {!isSupabaseConfigured && <p className="auth-message">A autenticação ainda precisa ser configurada no Supabase antes de ficar disponível.</p>}
              <div className="form-actions">
                <button type="button" className="cancel-form-btn" onClick={() => setAuthOpen(false)}>Cancelar</button>
                <button type="submit" className="submit-form-btn" disabled={!isSupabaseConfigured || authLoading}>{authLoading ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}</button>
              </div>
              <button type="button" className="auth-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMessage('') }}>
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
              <img src={selectedListing.image} alt={selectedListing.title} className="modal-image" />
            </div>
            <div className="modal-content">
              <div className="modal-badges">
                <span className="modal-badge available">{selectedListing.status}</span>
                <span className="modal-badge">{selectedListing.type}</span>
              </div>
              <h2 id="property-modal-title">{selectedListing.title}</h2>
              <p className="modal-price">{selectedListing.price}</p>

              <div className="property-facts">
                <div><strong>{selectedListing.bedrooms || '-'}</strong><span>Quartos</span></div>
                <div><strong>{formatArea(selectedListing.area)}</strong><span>Área</span></div>
                <div><strong>{selectedListing.neighborhood}</strong><span>Bairro</span></div>
                <div><strong>{selectedListing.type}</strong><span>Tipo</span></div>
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
    </div>
  )
}

export default App
