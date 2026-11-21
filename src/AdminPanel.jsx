import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarDays,
  Check,
  CircleCheck,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Search,
  Shield,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { getListingPurpose, getListingPropertyType } from './listingPresentation.js'
import StandardListingGallery from './StandardListingGallery.jsx'

const sections = [
  ['overview', 'Visão Geral'],
  ['pending', 'Anúncios Pendentes'],
  ['listings', 'Todos os Anúncios'],
  ['neighborhoods', 'Gerenciar Bairros'],
  ['featured', 'Destaques da Home'],
  ['users', 'Usuários'],
]

const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
  : 'Data não informada'

const statusKey = (listing) => {
  const status = String(listing.status || '').trim().toLocaleLowerCase('pt-BR')
  if (status === 'em_analise' || status === 'em análise') return 'pending'
  if (status === 'reprovado') return 'rejected'
  if (status === 'concluido' || status.includes('conclu') || status.includes('vend') || status.includes('expir')) return 'completed'
  return 'approved'
}

const statusLabel = (listing) => ({
  approved: 'Aprovado',
  pending: 'Pendente',
  rejected: 'Reprovado',
  completed: 'Concluído',
})[statusKey(listing)]

function AdminListingCard({
  listing,
  owner,
  canModerate,
  onView,
  onEdit,
  onApprove,
  onReject,
  onToggleFeatured,
  saving,
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const purpose = getListingPurpose(listing)
  const propertyType = getListingPropertyType(listing)

  const confirmReject = async () => {
    if (await onReject(listing, reason)) {
      setRejecting(false)
      setReason('')
    }
  }

  return (
    <article className="account-dashboard-card standard-listing-card admin-listing-card">
      <StandardListingGallery listing={listing} purpose={purpose} />
      <div className="standard-listing-card-body">
        <h3>{listing.title}</h3>
        <p className="standard-listing-location"><MapPin size={16} aria-hidden="true" />{listing.neighborhood}, {listing.city || 'Ipuã-SP'}</p>
        <strong className={`account-card-price purpose-price purpose-${purpose}`}>{listing.price}</strong>
        <div className="standard-listing-features">
          <span>{propertyType.label}</span>
          <span>{owner?.name || listing.advertiser || 'Anunciante não informado'}</span>
          <span>{owner?.typeLabel || 'Tipo de usuário não informado'}</span>
        </div>
        <span className={`standard-listing-status ${statusKey(listing)}`}><i aria-hidden="true" /><CircleCheck size={15} aria-hidden="true" />{statusLabel(listing)}</span>
        <p className="standard-listing-date"><CalendarDays size={17} aria-hidden="true" />Enviado em {formatDate(listing.created_at)}</p>
        {listing.motivo_reprovacao && <p className="admin-listing-rejection">{listing.motivo_reprovacao}</p>}
      </div>
      <div className="standard-listing-actions admin-listing-actions">
        <button type="button" onClick={() => onView(listing)}><Eye size={16} aria-hidden="true" />Visualizar</button>
        <button type="button" onClick={() => onEdit(listing)}><Pencil size={16} aria-hidden="true" />Editar</button>
        <button type="button" className={listing.destaque_home ? 'is-featured' : ''} disabled={saving} onClick={() => onToggleFeatured(listing)}>
          <Star size={16} aria-hidden="true" />{listing.destaque_home ? 'Remover destaque' : 'Destacar'}
        </button>
        {canModerate && !rejecting && (
          <>
            <button type="button" className="approve-listing-button" disabled={saving} onClick={() => onApprove(listing)}><Check size={16} aria-hidden="true" />Aprovar</button>
            <button type="button" className="reject-listing-button" disabled={saving} onClick={() => setRejecting(true)}><X size={16} aria-hidden="true" />Reprovar</button>
          </>
        )}
        {rejecting && (
          <div className="admin-rejection-form">
            <label htmlFor={`admin-rejection-${listing.id}`}>Motivo da reprovação *</label>
            <textarea id={`admin-rejection-${listing.id}`} value={reason} onChange={(event) => setReason(event.target.value)} required />
            <button type="button" className="reject-listing-button" disabled={saving || !reason.trim()} onClick={confirmReject}>Confirmar reprovação</button>
            <button type="button" onClick={() => setRejecting(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </article>
  )
}

function ListingPreview({ listing, owner, onClose, onApprove, onReject, onEdit, onToggleFeatured, saving }) {
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const purpose = getListingPurpose(listing)
  const canModerate = statusKey(listing) === 'pending'

  const confirmReject = async () => {
    if (await onReject(listing, reason)) onClose()
  }
  const confirmApprove = async () => {
    if (await onApprove(listing)) onClose()
  }

  return (
    <div className="admin-preview-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-preview-modal" role="dialog" aria-modal="true" aria-labelledby="admin-preview-title">
        <header><h2 id="admin-preview-title">Visualização administrativa</h2><button type="button" aria-label="Fechar" onClick={onClose}><X size={22} /></button></header>
        <div className="admin-preview-content">
          <StandardListingGallery listing={listing} purpose={purpose} showThumbnails={false} />
          <div className="admin-preview-details">
            <span className={`standard-listing-status ${statusKey(listing)}`}><i aria-hidden="true" />{statusLabel(listing)}</span>
            <h3>{listing.title}</h3>
            <strong className={`account-card-price purpose-price purpose-${purpose}`}>{listing.price}</strong>
            <p><MapPin size={17} />{listing.neighborhood}, {listing.city || 'Ipuã-SP'}</p>
            <p><User size={17} />{owner?.name || listing.advertiser || 'Anunciante não informado'}{owner?.email ? ` · ${owner.email}` : ''}</p>
            <p><Building2 size={17} />{owner?.typeLabel || 'Tipo de usuário não informado'}</p>
            <p><CalendarDays size={17} />Enviado em {formatDate(listing.created_at)}</p>
            {listing.description && <p className="admin-preview-description">{listing.description}</p>}
            {listing.motivo_reprovacao && <p className="admin-listing-rejection">{listing.motivo_reprovacao}</p>}
          </div>
        </div>
        <footer>
          <button type="button" onClick={() => onEdit(listing)}><Pencil size={16} />Editar anúncio</button>
          <button type="button" className={listing.destaque_home ? 'is-featured' : ''} disabled={saving} onClick={() => onToggleFeatured(listing)}><Star size={16} />{listing.destaque_home ? 'Remover destaque' : 'Destacar'}</button>
          {canModerate && !rejecting && <button type="button" className="approve-listing-button" disabled={saving} onClick={confirmApprove}><Check size={16} />Aprovar</button>}
          {canModerate && !rejecting && <button type="button" className="reject-listing-button" onClick={() => setRejecting(true)}><X size={16} />Reprovar</button>}
          {rejecting && (
            <div className="admin-rejection-form">
              <label htmlFor={`preview-rejection-${listing.id}`}>Motivo da reprovação *</label>
              <textarea id={`preview-rejection-${listing.id}`} value={reason} onChange={(event) => setReason(event.target.value)} required />
              <button type="button" className="reject-listing-button" disabled={saving || !reason.trim()} onClick={confirmReject}>Confirmar reprovação</button>
            </div>
          )}
        </footer>
      </section>
    </div>
  )
}

export default function AdminPanel({
  section,
  onSectionChange,
  listings,
  listingsError,
  neighborhoods,
  users,
  currentUserId,
  usersLoading,
  usersError,
  usersMessage,
  onToggleAdmin,
  usersActionId,
  onApprove,
  onReject,
  onEdit,
  onToggleFeatured,
  onMoveFeatured,
  featuredSavingId,
  neighborhoodDraft,
  editingNeighborhoodName,
  neighborhoodSaving,
  neighborhoodActionName,
  neighborhoodError,
  neighborhoodMessage,
  neighborhoodsError,
  neighborhoodsStatus,
  moderationMessage,
  onNeighborhoodDraftChange,
  onNewNeighborhood,
  onEditNeighborhood,
  onSaveNeighborhood,
  onToggleNeighborhood,
}) {
  const [listingFilter, setListingFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [previewListing, setPreviewListing] = useState(null)
  const [previewUser, setPreviewUser] = useState(null)
  const ownersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const pending = listings.filter((listing) => statusKey(listing) === 'pending')
  const approved = listings.filter((listing) => statusKey(listing) === 'approved')
  const rejected = listings.filter((listing) => statusKey(listing) === 'rejected')
  const activeNeighborhoods = neighborhoods.filter((neighborhood) => neighborhood.active)
  const featured = listings
    .filter((listing) => listing.status === 'aprovado' && listing.destaque_home)
    .sort((first, second) => Number(first.ordem_destaque) - Number(second.ordem_destaque))
  const latest = [...listings]
    .sort((first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime())
    .slice(0, 6)
  const filteredListings = listings.filter((listing) => {
    const filterMatches = listingFilter === 'all'
      || (listingFilter === 'approved' && statusKey(listing) === 'approved')
      || (listingFilter === 'pending' && statusKey(listing) === 'pending')
      || (listingFilter === 'rejected' && statusKey(listing) === 'rejected')
    const owner = ownersById.get(listing.user_id)
    const query = search.trim().toLocaleLowerCase('pt-BR')
    const searchMatches = !query || [
      listing.title,
      listing.advertiser,
      listing.neighborhood,
      owner?.name,
      owner?.email,
    ].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query))
    return filterMatches && searchMatches
  })

  const renderListingCards = (rows, canModerate = false) => rows.length ? (
    <div className="standard-listing-grid admin-listing-grid">
      {rows.map((listing) => (
        <AdminListingCard
          key={listing.id}
          listing={listing}
          owner={ownersById.get(listing.user_id)}
          canModerate={canModerate}
          onView={setPreviewListing}
          onEdit={onEdit}
          onApprove={onApprove}
          onReject={onReject}
          onToggleFeatured={onToggleFeatured}
          saving={featuredSavingId === listing.id}
        />
      ))}
    </div>
  ) : <p className="account-empty">Nenhum anúncio encontrado.</p>

  return (
    <section className="admin-panel" aria-label="Administração">
      <nav className="admin-panel-nav" aria-label="Seções administrativas">
        {sections.map(([key, label]) => (
          <button key={key} type="button" className={section === key ? 'active' : ''} aria-current={section === key ? 'page' : undefined} onClick={() => onSectionChange(key)}>
            {label}
          </button>
        ))}
      </nav>
      {moderationMessage && <p className="my-area-feedback" role="status">{moderationMessage}</p>}
      {listingsError && <p className="my-area-feedback error" role="alert">{listingsError}</p>}

      {section === 'overview' && (
        <>
          <div className="my-area-stats-grid admin-stats-grid">
            <article className="my-area-stat-card"><span className="my-area-stat-icon"><Eye size={25} /></span><div><small>Pendentes</small><strong>{pending.length}</strong></div></article>
            <article className="my-area-stat-card"><span className="my-area-stat-icon views"><CircleCheck size={25} /></span><div><small>Aprovados</small><strong>{approved.length}</strong></div></article>
            <article className="my-area-stat-card"><span className="my-area-stat-icon admin-rejected-icon"><X size={25} /></span><div><small>Reprovados</small><strong>{rejected.length}</strong></div></article>
            <article className="my-area-stat-card"><span className="my-area-stat-icon admin-neighborhood-icon"><Building2 size={25} /></span><div><small>Bairros Ativos</small><strong>{activeNeighborhoods.length}</strong></div></article>
          </div>
          <section className="my-area-recent-listings admin-recent-listings">
            <header className="my-area-recent-heading"><h2>Últimos anúncios enviados</h2><button type="button" onClick={() => onSectionChange('listings')}>Ver todos <span aria-hidden="true">→</span></button></header>
            {latest.length ? (
              <div className="admin-table-scroll">
                <table className="my-area-listings-table admin-data-table">
                  <thead><tr><th>Título</th><th>Usuário</th><th>Data</th><th>Status</th><th>Ação</th></tr></thead>
                  <tbody>{latest.map((listing) => {
                    const owner = ownersById.get(listing.user_id)
                    return <tr key={listing.id}><td>{listing.title}</td><td>{owner?.name || listing.advertiser || 'Não informado'}</td><td>{formatDate(listing.created_at)}</td><td><span className={`standard-listing-status ${statusKey(listing)}`}>{statusLabel(listing)}</span></td><td><button type="button" onClick={() => setPreviewListing(listing)}>Visualizar</button></td></tr>
                  })}</tbody>
                </table>
              </div>
            ) : <p className="account-empty">Ainda não há anúncios cadastrados.</p>}
          </section>
        </>
      )}

      {section === 'pending' && (
        <section className="admin-section-content">
          <header className="admin-section-heading"><div><h2>Anúncios Pendentes</h2><p>{pending.length} aguardando análise</p></div></header>
          {renderListingCards(pending, true)}
        </section>
      )}

      {section === 'listings' && (
        <section className="admin-section-content">
          <header className="admin-section-heading"><div><h2>Todos os Anúncios</h2><p>{filteredListings.length} anúncio{filteredListings.length === 1 ? '' : 's'}</p></div></header>
          <div className="admin-listing-tools">
            <label className="admin-search"><Search size={18} /><span className="sr-only">Buscar título, anunciante ou bairro</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar título, anunciante ou bairro" /></label>
            <label><span className="sr-only">Filtrar anúncios por status</span><select value={listingFilter} onChange={(event) => setListingFilter(event.target.value)}><option value="all">Todos</option><option value="approved">Aprovados</option><option value="pending">Pendentes</option><option value="rejected">Reprovados</option></select></label>
          </div>
          {renderListingCards(filteredListings, false)}
        </section>
      )}

      {section === 'neighborhoods' && (
        <section className="admin-section-content">
          <header className="admin-section-heading"><div><h2>Gerenciar Bairros</h2><p>Cadastre, edite e altere a disponibilidade dos bairros.</p></div><button type="button" className="my-area-edit-button" onClick={onNewNeighborhood}><Plus size={17} />Novo Bairro</button></header>
          <form className="neighborhood-manager-form admin-neighborhood-form" onSubmit={onSaveNeighborhood}>
            <label htmlFor="admin-neighborhood-name">{editingNeighborhoodName ? 'Editar bairro' : 'Novo bairro'}</label>
            <div><input id="admin-neighborhood-name" value={neighborhoodDraft} onChange={(event) => onNeighborhoodDraftChange(event.target.value)} placeholder="Nome do bairro" maxLength={100} required /><button type="submit" disabled={neighborhoodSaving || neighborhoodsStatus !== 'loaded'}>{neighborhoodSaving ? 'Salvando…' : editingNeighborhoodName ? 'Salvar alterações' : 'Adicionar bairro'}</button>{editingNeighborhoodName && <button type="button" className="neighborhood-cancel" onClick={onNewNeighborhood}>Cancelar</button>}</div>
          </form>
          {neighborhoodError && <p className="my-area-feedback error" role="alert">{neighborhoodError}</p>}
          {neighborhoodMessage && <p className="my-area-feedback" role="status">{neighborhoodMessage}</p>}
          {neighborhoodsError && <p className="my-area-feedback error" role="alert">{neighborhoodsError}</p>}
          <div className="admin-table-scroll">
            <table className="my-area-listings-table admin-data-table">
              <thead><tr><th>Nome</th><th>Status</th><th>Anúncios</th><th>Ações</th></tr></thead>
              <tbody>{neighborhoods.map((neighborhood) => {
                const listingCount = listings.filter((listing) => listing.neighborhood === neighborhood.name).length
                return <tr key={neighborhood.name}><td>{neighborhood.name}</td><td><span className={`admin-neighborhood-state${neighborhood.active ? ' active' : ''}`}>{neighborhood.active ? 'Ativo' : 'Inativo'}</span></td><td>{listingCount}</td><td className="admin-table-actions"><button type="button" onClick={() => onEditNeighborhood(neighborhood)}><Pencil size={15} />Editar</button><button type="button" disabled={neighborhoodActionName === neighborhood.name} onClick={() => onToggleNeighborhood(neighborhood)}>{neighborhood.active ? <X size={15} /> : <Check size={15} />}{neighborhood.active ? 'Desativar' : 'Ativar'}</button></td></tr>
              })}</tbody>
            </table>
          </div>
          {!neighborhoods.length && <p className="account-empty">Nenhum bairro cadastrado.</p>}
        </section>
      )}

      {section === 'featured' && (
        <section className="admin-section-content">
          <header className="admin-section-heading"><div><h2>Destaques da Home</h2><p>Organize os imóveis destacados na página inicial.</p></div></header>
          <div className="admin-featured-list">
            {featured.map((listing, index) => (
              <article className="admin-featured-row" key={listing.id}>
                {listing.image ? <img src={listing.image} alt="" loading="lazy" /> : <span className="my-area-table-image-placeholder"><Building2 size={24} /></span>}
                <div><strong>{listing.title}</strong><span>{listing.neighborhood} · Ordem {listing.ordem_destaque}</span></div>
                <div className="admin-featured-row-actions">
                  <button type="button" aria-label={`Subir ${listing.title}`} disabled={index === 0} onClick={() => onMoveFeatured(listing, featured[index - 1])}><ArrowUp size={17} /></button>
                  <button type="button" aria-label={`Descer ${listing.title}`} disabled={index === featured.length - 1} onClick={() => onMoveFeatured(listing, featured[index + 1])}><ArrowDown size={17} /></button>
                  <button type="button" onClick={() => onToggleFeatured(listing)}><Trash2 size={16} />Remover destaque</button>
                </div>
              </article>
            ))}
            {!featured.length && <p className="account-empty">Nenhum imóvel está destacado.</p>}
          </div>
          <h3 className="admin-available-featured-title">Imóveis aprovados disponíveis</h3>
          <div className="admin-featured-candidates">
            {approved.filter((listing) => !listing.destaque_home).map((listing) => <article key={listing.id}><div><strong>{listing.title}</strong><span>{listing.neighborhood} · {listing.price}</span></div><button type="button" onClick={() => onToggleFeatured(listing)}><Star size={16} />Destacar</button></article>)}
            {!approved.some((listing) => !listing.destaque_home) && <p className="account-empty">Não há outros anúncios aprovados para destacar.</p>}
          </div>
        </section>
      )}

      {section === 'users' && (
        <section className="admin-section-content">
          <header className="admin-section-heading"><div><h2>Usuários</h2><p>Contas cadastradas e permissões administrativas.</p></div></header>
          {usersError && <p className="my-area-feedback error" role="alert">{usersError}</p>}
          {usersMessage && <p className="my-area-feedback" role="status">{usersMessage}</p>}
          {usersLoading ? <p className="account-empty" role="status">Carregando usuários…</p> : users.length ? (
            <div className="admin-table-scroll">
              <table className="my-area-listings-table admin-data-table">
                <thead><tr><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Administrador</th><th>Cadastro</th><th>Ações</th></tr></thead>
                <tbody>{users.map((user) => <tr key={user.id}>
                  <td>{user.name || 'Não informado'}</td><td>{user.email}</td><td>{user.typeLabel || 'Não informado'}</td><td>{user.isAdmin ? 'Sim' : 'Não'}</td><td>{formatDate(user.createdAt)}</td>
                  <td className="admin-table-actions"><button type="button" title={`Visualizar ${user.name || user.email}`} onClick={() => setPreviewUser(user)}><Eye size={16} />Visualizar</button>{user.id !== currentUserId && <button type="button" disabled={usersActionId === user.id} onClick={() => onToggleAdmin(user)}>{usersActionId === user.id ? 'Aguarde…' : user.isAdmin ? <><X size={15} />Remover admin</> : <><Shield size={15} />Tornar admin</>}</button>}</td>
                </tr>)}</tbody>
              </table>
            </div>
          ) : !usersError && <p className="account-empty">Nenhum usuário encontrado.</p>}
        </section>
      )}

      {previewListing && <ListingPreview listing={previewListing} owner={ownersById.get(previewListing.user_id)} onClose={() => setPreviewListing(null)} onApprove={onApprove} onReject={onReject} onEdit={(listing) => { setPreviewListing(null); onEdit(listing) }} onToggleFeatured={onToggleFeatured} saving={featuredSavingId === previewListing.id} />}
      {previewUser && (
        <div className="admin-preview-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPreviewUser(null)}>
          <section className="admin-user-preview" role="dialog" aria-modal="true" aria-labelledby="admin-user-preview-title">
            <header><h2 id="admin-user-preview-title">Dados do usuário</h2><button type="button" aria-label="Fechar" onClick={() => setPreviewUser(null)}><X size={22} /></button></header>
            <dl><div><dt>Nome</dt><dd>{previewUser.name || 'Não informado'}</dd></div><div><dt>E-mail</dt><dd>{previewUser.email}</dd></div><div><dt>Tipo de conta</dt><dd>{previewUser.typeLabel || 'Não informado'}</dd></div><div><dt>Administrador</dt><dd>{previewUser.isAdmin ? 'Sim' : 'Não'}</dd></div><div><dt>Data de cadastro</dt><dd>{formatDate(previewUser.createdAt)}</dd></div></dl>
          </section>
        </div>
      )}
    </section>
  )
}
