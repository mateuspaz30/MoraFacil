import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { isSupabaseConfigured, supabase } from './lib/supabase'

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

const emptyAnnouncement = {
  title: '',
  type: 'venda',
  status: 'Disponível',
  price: '',
  bedrooms: '0',
  bathrooms: '1',
  area: '',
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
  const [authOpen, setAuthOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [draftFilters, setDraftFilters] = useState({
    type: 'Todos os imóveis',
    bedrooms: 'Qualquer',
    price: 'Qualquer faixa',
    neighborhood: 'Qualquer bairro',
  })
  const [appliedFilters, setAppliedFilters] = useState(draftFilters)
  const [activeCategory, setActiveCategory] = useState('Todos os imóveis')

  const listings = [...sampleListings, ...(isSupabaseConfigured ? publishedListings : userListings)]

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
          location: `${item.neighborhood}, Ipuã-SP`,
          area: `${item.area} m²`,
          owner: item.user_id === authUser?.id,
        }))
        setPublishedListings(normalizedListings)
        setUserListings(authUser ? normalizedListings.filter((item) => item.user_id === authUser.id) : [])
      }
    }

    loadUserListings()
  }, [authUser])

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

    return typeMatches && categoryMatches && bedroomsMatches && priceMatches && neighborhoodMatches
  })

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
    setAnnouncementOpen(true)
  }

  const closeAnnouncementForm = () => {
    setAnnouncementOpen(false)
    setEditingListingId(null)
    setAnnouncement(emptyAnnouncement)
  }

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault()
    const coordinates = neighborhoodCoordinates[announcement.neighborhood] || mapCenter
    const listing = {
      ...announcement,
      id: editingListingId || `user-${Date.now()}`,
      price: announcement.type === 'aluguel' ? `R$ ${announcement.price}/mês` : `R$ ${announcement.price}`,
      location: `${announcement.neighborhood}, Ipuã-SP`,
      bedrooms: Number.parseInt(announcement.bedrooms, 10) || 0,
      area: `${announcement.area} m²`,
      coordinates,
      image: announcement.image || sampleListings[0].image,
      status: announcement.status || 'Disponível',
      owner: true,
    }

    if (isSupabaseConfigured && authUser) {
      const databaseListing = {
        user_id: authUser.id,
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
        ? supabase.from('listings').update(databaseListing).eq('id', editingListingId).eq('user_id', authUser.id)
        : supabase.from('listings').insert(databaseListing)
      const { error } = await query
      if (error) {
        setAuthMessage(`Não foi possível salvar o anúncio: ${error.message}`)
        return
      }
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
      const normalizedListings = (data || []).map((item) => ({ ...item, coordinates: [item.latitude, item.longitude], location: `${item.neighborhood}, Ipuã-SP`, area: `${item.area} m²`, owner: item.user_id === authUser.id }))
      setPublishedListings(normalizedListings)
      setUserListings(normalizedListings.filter((item) => item.user_id === authUser.id))
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
    setUserListings([])
    setAccountOpen(false)
  }

  const removeUserListing = async (id) => {
    if (!window.confirm('Excluir este anúncio?')) return

    if (isSupabaseConfigured && authUser) {
      await supabase.from('listings').delete().eq('id', id).eq('user_id', authUser.id)
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
      <header className="top-header">
        <div className="brand-group">
          <div className="brand-mark" aria-hidden="true">
            <span>M</span>
            <i />
          </div>
          <div>
            <h1>Mora Fácil</h1>
            <small>Seu próximo endereço começa aqui.</small>
          </div>
        </div>

        <div className="header-actions">
          <span className="availability-note"><b /> 32 oportunidades abertas</span>
          {isSupabaseConfigured && (authUser ? (
            <button type="button" className="account-btn account-trigger" onClick={() => setAccountOpen((current) => !current)} aria-expanded={accountOpen}>
              <span className="account-avatar">{authUser.email?.charAt(0).toUpperCase() || 'M'}</span>
              <span>Minha conta</span>
            </button>
          ) : (
            <button type="button" className="account-btn" onClick={() => setAuthOpen(true)}>Entrar</button>
          ))}
          <button type="button" className="announce-btn" onClick={() => openAnnouncementForm()}>
            <span className="announce-plus">+</span> Anunciar imóvel
          </button>
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
            <div className="account-section-title">Meus imóveis</div>
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

      <nav className="category-nav" aria-label="Categorias">
        {['Todos os imóveis', 'Casas', 'Apartamentos', 'Terrenos'].map((category) => (
          <button
            key={category}
            className={`nav-item ${activeCategory === category ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <section className="filters-bar">
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
          <label>Quartos</label>
          <select value={draftFilters.bedrooms} onChange={(event) => setDraftFilters({ ...draftFilters, bedrooms: event.target.value })}>
            <option>Qualquer</option>
            <option>1+</option>
            <option>2+</option>
            <option>3+</option>
          </select>
        </div>

        <div className="field">
          <label>Preço</label>
          <select value={draftFilters.price} onChange={(event) => setDraftFilters({ ...draftFilters, price: event.target.value })}>
            <option>Qualquer faixa</option>
            <option>Até R$ 200 mil</option>
            <option>Até R$ 500 mil</option>
            <option>Acima de R$ 500 mil</option>
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

        <button type="button" className="search-btn" onClick={() => setAppliedFilters(draftFilters)}>Buscar</button>
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
                    {item.bedrooms > 0 ? `${item.bedrooms} quartos` : 'Terreno'} · {item.area}
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
        <h2>Imóveis cadastrados pela comunidade</h2>

        <div className="properties-grid">
          {filteredListings.map((item) => (
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
                  <span>{item.area}</span>
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

              <div className="form-row four-columns">
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
                <div className="form-group">
                  <label htmlFor="area">Área construída (m²)</label>
                  <input id="area" name="area" type="number" min="1" value={announcement.area} onChange={(event) => setAnnouncement({ ...announcement, area: event.target.value })} placeholder="Ex.: 120" required />
                </div>
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="neighborhood">Bairro</label>
                  <select id="neighborhood" name="neighborhood" value={announcement.neighborhood} onChange={(event) => setAnnouncement({ ...announcement, neighborhood: event.target.value })}>
                    {Object.keys(neighborhoodCoordinates).map((neighborhood) => <option key={neighborhood}>{neighborhood}</option>)}
                  </select>
                  <small>O mapa usará a localização aproximada do bairro.</small>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Endereço ou ponto de referência</label>
                  <input id="address" name="address" value={announcement.address} onChange={(event) => setAnnouncement({ ...announcement, address: event.target.value })} placeholder="Rua, número ou referência" required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Descrição completa</label>
                <textarea id="description" name="description" value={announcement.description} onChange={(event) => setAnnouncement({ ...announcement, description: event.target.value })} placeholder="Conte detalhes importantes do imóvel" required />
              </div>

              <div className="form-group">
                <label htmlFor="image">Foto do imóvel (opcional)</label>
                <input id="image" name="image" type="url" value={announcement.image} onChange={(event) => setAnnouncement({ ...announcement, image: event.target.value })} placeholder="Cole o link de uma imagem" />
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
                <div><strong>{selectedListing.area}</strong><span>Área</span></div>
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
