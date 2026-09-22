import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import logo from './assets/logo.png'

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
  const [editingListingId, setEditingListingId] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckMessage, setAdminCheckMessage] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
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
  const [activeCategory] = useState('Todos os imóveis')
  const [showAllListings, setShowAllListings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)

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
          area: item.area ? `${item.area} m²` : '',
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

  const filteredListings = listings.filter((item) => {
    const typeMatches = appliedFilters.type === 'Todos os imóveis'
      || (appliedFilters.type === 'Terrenos' && item.type === 'terreno')
      || (appliedFilters.type === 'Venda' && item.type === 'venda')
      || (appliedFilters.type === 'Aluguel' && item.type === 'aluguel')
    const categoryMatches = activeCategory === 'Todos os imóveis'
      || (activeCategory === 'Casas' && item.bedrooms > 0 && item.type === 'venda')
      || (activeCategory === 'Apartamentos' && item.bedrooms > 0 && item.type === 'aluguel')
      || (activeCategory === 'Terrenos' && item.type === 'terreno')
    const bedroomsMatches = appliedFilters.bedrooms === 'Qualquer'
      || item.bedrooms >= Number.parseInt(appliedFilters.bedrooms, 10)
    const priceMatches = appliedFilters.price === 'Qualquer faixa'
      || (appliedFilters.price === 'Até R$ 200 mil' && Number.parseInt(item.price.replace(/\D/g, ''), 10) <= 200000)
      || (appliedFilters.price === 'Até R$ 500 mil' && Number.parseInt(item.price.replace(/\D/g, ''), 10) <= 500000)
      || (appliedFilters.price === 'Acima de R$ 500 mil' && Number.parseInt(item.price.replace(/\D/g, ''), 10) > 500000)
    const neighborhoodMatches = appliedFilters.neighborhood === 'Qualquer bairro'
      || item.neighborhood === appliedFilters.neighborhood
    const searchValue = appliedFilters.search.trim().toLowerCase()
    const searchMatches = !searchValue
      || `${item.title} ${item.location} ${item.address} ${item.neighborhood}`.toLowerCase().includes(searchValue)

    return typeMatches && categoryMatches && bedroomsMatches && priceMatches && neighborhoodMatches && searchMatches
  })

  const featuredListings = showAllListings ? filteredListings : filteredListings.slice(0, 4)
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
      price: String(listing.price || '').replace(/\D/g, ''),
      area: String(listing.area || '').replace(/\D/g, ''),
    } : emptyAnnouncement)
    setAnnouncementCoordinates(listing?.coordinates || cityCoordinates[listing?.city] || mapCenter)
    setLocationConfirmed(Boolean(listing?.coordinates))
    setAnnouncementOpen(true)
  }

  const closeAnnouncementForm = () => {
    setAnnouncementOpen(false)
    setEditingListingId(null)
    setAnnouncement(emptyAnnouncement)
    setAddressMessage('')
    setLocationConfirmed(false)
    setImageMessage('')
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImageMessage('Escolha um arquivo de imagem.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageMessage('A imagem deve ter no máximo 8 MB.')
      return
    }

    setImageLoading(true)
    setImageMessage('Enviando foto...')

    if (!isSupabaseConfigured || !authUser) {
      setAnnouncement((current) => ({ ...current, image: URL.createObjectURL(file) }))
      setImageMessage('Foto selecionada para este teste local.')
      setImageLoading(false)
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${authUser.id}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('property-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      setImageMessage(`Não foi possível enviar a foto: ${error.message}`)
    } else {
      const { data } = supabase.storage.from('property-images').getPublicUrl(path)
      setAnnouncement((current) => ({ ...current, image: data.publicUrl }))
      setImageMessage('Foto anexada com sucesso.')
    }
    setImageLoading(false)
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
    const cityCenter = cityCoordinates[announcement.city] || neighborhoodCoordinates[announcement.neighborhood] || mapCenter
    let coordinates = announcementCoordinates || cityCenter

    if (!locationConfirmed) {
      const located = await locateAnnouncement()
      if (located) {
        coordinates = located.coordinates
      } else {
        setAddressMessage('Confirme a localização no mapa antes de publicar.')
        return
      }
    }

    const listing = {
      ...announcement,
      id: editingListingId || `user-${Date.now()}`,
      price: announcement.type === 'aluguel' ? `R$ ${announcement.price}/mês` : `R$ ${announcement.price}`,
      location: `${announcement.neighborhood}, ${announcement.city}`,
      bedrooms: Number.parseInt(announcement.bedrooms, 10) || 0,
      area: `${announcement.area} m²`,
      coordinates,
      address: announcement.address || `${announcement.street}, ${announcement.number}`,
      image: announcement.image || sampleListings[0].image,
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
        status: listing.status,
        price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: Number.parseInt(announcement.bathrooms, 10) || 0,
        area: Number.parseInt(announcement.area, 10) || 0,
        neighborhood: listing.neighborhood,
        address: listing.address,
        description: listing.description,
        image: listing.image,
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
        return
      }
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
      const normalizedListings = (data || []).map((item) => ({ ...item, coordinates: [item.latitude, item.longitude], location: `${item.neighborhood}, ${item.city || 'Ipuã-SP'}`, area: item.area ? `${item.area} m²` : '', owner: item.user_id === authUser.id }))
      setPublishedListings(normalizedListings)
      setUserListings(isAdmin ? normalizedListings : normalizedListings.filter((item) => item.user_id === authUser.id))
    } else {
      setUserListings((current) => editingListingId
        ? current.map((item) => item.id === editingListingId ? listing : item)
        : [...current, listing])
    }
    closeAnnouncementForm()
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthMessage('')
    let result
    try {
      result = authMode === 'login'
        ? await supabase.auth.signInWithPassword(authForm)
        : await supabase.auth.signUp(authForm)
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
      setAuthForm({ email: '', password: '' })
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
            <h1>Mora Fácil</h1>
            <strong>Encontre seu próximo lar.</strong>
            <small>Imóveis do seu jeito, perto de você.</small>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="announce-btn" onClick={() => openAnnouncementForm()}>
            <span className="announce-plus">+</span> Anunciar imóvel
          </button>
          {isSupabaseConfigured && (authUser ? (
            <button type="button" className="account-btn account-trigger" onClick={() => setAccountOpen((current) => !current)} aria-expanded={accountOpen}>
              <span className="account-avatar">{authUser.email?.charAt(0).toUpperCase() || 'M'}</span>
              <span>Minha conta</span>
            </button>
          ) : (
            <button type="button" className="account-btn" onClick={() => setAuthOpen(true)}>Entrar</button>
          ))}
          <button type="button" className="menu-toggle" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}>☰</button>
        </div>

        {accountOpen && authUser && (
          <section className="account-popover" aria-label="Minha conta">
            <button type="button" className="account-close" onClick={() => setAccountOpen(false)} aria-label="Fechar conta">×</button>
            <div className="account-profile">
              <span className="account-profile-avatar">{authUser.email?.charAt(0).toUpperCase() || 'M'}</span>
              <div>
                <strong>Anunciante Mora Fácil</strong>
                <span>{authUser.email}</span>
              </div>
            </div>

            <div className="account-divider" />
            {adminCheckMessage && <p className="admin-check-message">{adminCheckMessage}</p>}
            <div className="account-section-title">{isAdmin ? 'Todos os imóveis' : 'Meus imóveis'}</div>
            {userListings.length === 0 ? (
              <div className="account-empty">Você ainda não cadastrou imóveis.</div>
            ) : (
              <div className="account-listings">
                {userListings.map((item) => (
                  <div key={item.id} className="account-listing">
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.location} · {item.price}</span>
                    </div>
                    <div className="account-listing-actions">
                      <button type="button" onClick={() => { openDetails(item); setAccountOpen(false) }}>Ver</button>
                      <button type="button" onClick={() => { openAnnouncementForm(item); setAccountOpen(false) }}>Editar</button>
                      <button type="button" onClick={() => removeUserListing(item.id)} aria-label={`Excluir ${item.title}`}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="account-new-listing" onClick={() => { openAnnouncementForm(); setAccountOpen(false) }}>+ Anunciar outro imóvel</button>
            <button type="button" className="account-logout" onClick={handleLogout}>↪&nbsp; Sair</button>
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
            {['Início', 'Imóveis', 'Mapa', 'Sobre', 'Contato'].map((item, index) => (
              <button key={item} type="button" className={`mobile-menu-item ${index === 0 ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <span>{['⌂', '⌂', '⌖', 'ⓘ', '✉'][index]}</span>{item}
              </button>
            ))}
            <button type="button" className="mobile-menu-announce" onClick={() => { setMobileMenuOpen(false); openAnnouncementForm() }}>+ Anunciar imóvel</button>
            {authUser ? (
              <button type="button" className="mobile-menu-login" onClick={() => setMobileMenuOpen(false)}>Minha conta</button>
            ) : (
              <button type="button" className="mobile-menu-login" onClick={() => { setMobileMenuOpen(false); setAuthOpen(true) }}>Entrar</button>
            )}
          </aside>
        </div>
      )}

      <section className="hero-content" aria-label="Encontre seu próximo lar">
        <div className="hero-copy">
          <h2>Encontre seu<br /><span>próximo lar.</span></h2>
          <p>Imóveis do seu jeito, perto de você.</p>
        </div>
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
          <span className="hero-listing-badge">
            {heroCarouselListings[heroSlideIndex % heroCarouselListings.length].type === 'aluguel' ? 'Aluguel' : 'Venda'}
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
        <div className="filter-search field">
          <label htmlFor="search-location">Onde você quer morar?</label>
          <select
            id="search-location"
            value={draftFilters.search}
            onChange={(event) => setDraftFilters({ ...draftFilters, search: event.target.value })}
          >
            <option>Ipuã-SP</option>
            <option>Guaíra-SP</option>
          </select>
        </div>
        <div className="field">
          <label>Tipo</label>
          <select value={draftFilters.type} onChange={(event) => setDraftFilters({ ...draftFilters, type: event.target.value })}>
            <option>Todos os imóveis</option>
            <option>Venda</option>
            <option>Aluguel</option>
            <option>Terrenos</option>
          </select>
        </div>

        <div className="field">
          <label>Bairro</label>
          <select value={draftFilters.neighborhood} onChange={(event) => setDraftFilters({ ...draftFilters, neighborhood: event.target.value })}>
            <option>Qualquer bairro</option>
            <option>Centro</option>
            <option>Jardim das Flores</option>
            <option>Zona Norte</option>
            <option>Jardim Primavera</option>
            <option>Residencial Santana</option>
          </select>
        </div>

        <div className="field">
          <label>Quartos</label>
          <select value={draftFilters.bedrooms} onChange={(event) => setDraftFilters({ ...draftFilters, bedrooms: event.target.value })}>
            <option>Qualquer</option>
            <option>1+</option>
            <option>2+</option>
            <option>3+</option>
          </select>
        </div>

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
                    {item.bedrooms > 0 ? `${item.bedrooms} quartos` : 'Terreno'}{item.area ? ` · ${item.area}` : ''}
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

      <section className="properties-section">
        <div className="section-title-row">
          <h2><span className="section-star">★</span> Imóveis em destaque</h2>
          <button type="button" className="view-all-btn" onClick={() => setShowAllListings((current) => !current)}>
            {showAllListings ? 'Voltar' : 'Ver todos'} <span>{showAllListings ? '‹' : '›'}</span>
          </button>
        </div>

        <div className="properties-grid">
          {featuredListings.map((item) => (
            <article key={item.id} className="property-card">
              <div className="property-thumb">
                <img src={item.image} alt={item.title} className="property-card-image" />
                <span className="thumb-badge">{item.type}</span>
              </div>

              <div className="property-content">
                <div className="content-top">
                  <span className="property-tag">{item.type}</span>
                  <strong>{item.price}</strong>
                </div>

                <h3>{item.title}</h3>
                <p>{item.location}</p>

                <div className="meta-row">
                  <span>{item.bedrooms > 0 ? `${item.bedrooms} quartos` : 'Terreno'}</span>
                  {item.area && <span>{item.area}</span>}
                </div>
                <button type="button" className="card-detail-button" onClick={() => openDetails(item)}>
                  Saiba mais
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {announcementOpen && (
        <div className="property-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAnnouncementForm()
        }}>
          <section className="property-modal announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
            <div className="announcement-header">
              <h2 id="announcement-title">{editingListingId ? 'Editar imóvel' : 'Cadastrar imóvel'}</h2>
              <p>Preencha os dados para criar o anúncio e posicioná-lo no mapa de Ipuã.</p>
            </div>
            <form className="announcement-form" onSubmit={handleAnnouncementSubmit}>
              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="title">Título do anúncio</label>
                  <input id="title" name="title" value={announcement.title} onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })} placeholder="Ex.: Casa com quintal no Centro" required />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Finalidade</label>
                  <select id="type" name="type" value={announcement.type} onChange={(event) => setAnnouncement({ ...announcement, type: event.target.value })}>
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                    <option value="terreno">Terreno</option>
                  </select>
                </div>
              </div>

              <div className="form-row three-columns">
                <div className="form-group">
                  <label htmlFor="price">Valor {announcement.type === 'aluguel' ? 'mensal' : ''}</label>
                  <input id="price" name="price" inputMode="numeric" value={announcement.price} onChange={(event) => setAnnouncement({ ...announcement, price: event.target.value.replace(/\D/g, '') })} placeholder="Ex.: 320000" required />
                </div>
                <div className="form-group">
                  <label htmlFor="bedrooms">Quartos</label>
                  <input id="bedrooms" name="bedrooms" type="number" min="0" value={announcement.bedrooms} onChange={(event) => setAnnouncement({ ...announcement, bedrooms: event.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="bathrooms">Banheiros</label>
                  <input id="bathrooms" name="bathrooms" type="number" min="0" value={announcement.bathrooms} onChange={(event) => setAnnouncement({ ...announcement, bathrooms: event.target.value })} />
                </div>
              </div>

              <div className="form-row three-columns">
                <div className="form-group">
                  <label htmlFor="city">Cidade</label>
                  <select id="city" name="city" value={announcement.city} onChange={(event) => {
                    const city = event.target.value
                    setAnnouncement({ ...announcement, city })
                    setAnnouncementCoordinates(cityCoordinates[city] || mapCenter)
                    setLocationConfirmed(false)
                  }}>
                    <option>Ipuã-SP</option>
                    <option>Guaíra-SP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="cep">CEP</label>
                  <input id="cep" name="cep" inputMode="numeric" value={announcement.cep} onChange={(event) => setAnnouncement({ ...announcement, cep: event.target.value.replace(/\D/g, '').slice(0, 8) })} onBlur={lookupCep} placeholder="Ex.: 14610-000" required />
                  <small>{addressLoading ? 'Consultando...' : addressMessage || 'Digite o CEP para localizar o endereço.'}</small>
                </div>
                <div className="form-group">
                  <label htmlFor="number">Número</label>
                  <input id="number" name="number" inputMode="numeric" value={announcement.number} onChange={(event) => setAnnouncement({ ...announcement, number: event.target.value })} placeholder="Ex.: 120" required />
                </div>
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="street">Rua</label>
                  <input id="street" name="street" value={announcement.street} onChange={(event) => setAnnouncement({ ...announcement, street: event.target.value })} placeholder="Preenchida pelo CEP" required />
                </div>
                <div className="form-group">
                  <label htmlFor="neighborhood">Bairro</label>
                  <input id="neighborhood" name="neighborhood" value={announcement.neighborhood} onChange={(event) => setAnnouncement({ ...announcement, neighborhood: event.target.value })} placeholder="Preenchido pelo CEP" required />
                </div>
              </div>

              <div className="location-confirmation">
                <div className="location-confirmation-header">
                  <div>
                    <strong>Confirme a localização</strong>
                    <small>{addressMessage || 'Localize o endereço e arraste o marcador até o ponto exato.'}</small>
                  </div>
                  <button type="button" className="locate-button" onClick={locateAnnouncement} disabled={addressLoading}>
                    {addressLoading ? 'Localizando...' : 'Localizar no mapa'}
                  </button>
                </div>
                <MapContainer center={announcementCoordinates} zoom={17} className="announcement-map" scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; Esri &copy; OpenStreetMap contributors'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  <Marker
                    position={announcementCoordinates}
                    draggable
                    eventHandlers={{
                      dragend: (event) => {
                        const marker = event.target
                        const position = marker.getLatLng()
                        setAnnouncementCoordinates([position.lat, position.lng])
                        setLocationConfirmed(true)
                        setAddressMessage('Ponto ajustado manualmente. Essa será a localização publicada.')
                      },
                    }}
                    icon={createMarkerIcon(typeColors[announcement.type])}
                  />
                </MapContainer>
              </div>

              <div className="form-group">
                <label htmlFor="description">Descrição completa</label>
                <textarea id="description" name="description" value={announcement.description} onChange={(event) => setAnnouncement({ ...announcement, description: event.target.value })} placeholder="Conte detalhes importantes do imóvel" required />
              </div>

              <div className="form-group">
                <label htmlFor="image">Foto principal do imóvel (opcional)</label>
                <input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} disabled={imageLoading} />
                <small>{imageLoading ? 'Enviando foto...' : imageMessage || 'Escolha uma foto da galeria do celular ou do computador.'}</small>
                {announcement.image && (
                  <img src={announcement.image} alt="Prévia do imóvel" className="announcement-image-preview" />
                )}
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="advertiser">Seu nome</label>
                  <input id="advertiser" name="advertiser" value={announcement.advertiser} onChange={(event) => setAnnouncement({ ...announcement, advertiser: event.target.value })} placeholder="Nome do anunciante" required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Telefone ou WhatsApp</label>
                  <input id="phone" name="phone" type="tel" value={announcement.phone} onChange={(event) => setAnnouncement({ ...announcement, phone: event.target.value })} placeholder="(16) 99999-1234" required />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-form-btn" onClick={closeAnnouncementForm}>Cancelar</button>
                <button type="submit" className="submit-form-btn">Publicar anúncio</button>
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
                {selectedListing.area && <div><strong>{selectedListing.area}</strong><span>Área</span></div>}
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
