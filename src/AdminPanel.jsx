import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  Check,
  CircleCheck,
  CircleX,
  Clock3,
  Eye,
  MapPin,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Shield,
  Star,
  Trash2,
  User,
  UsersRound,
  X,
} from 'lucide-react'
import { getListingPurpose, getListingPropertyType, isIndividualListingExpired } from './listingPresentation.js'
import { BILLING_STATUS_LABELS } from './billing/billingService.js'
import StandardListingGallery from './StandardListingGallery.jsx'

const sections = [
  ['overview', 'Visão Geral'],
  ['pending', 'Anúncios Pendentes'],
  ['listings', 'Todos os Anúncios'],
  ['neighborhoods', 'Gerenciar Bairros'],
  ['featured', 'Destaques da Home'],
  ['users', 'Usuários'],
  ['billing', 'Planos e cobrança'],
]

const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
  : 'Data não informada'

const subscriptionStatusLabel = (subscription) => {
  if (!subscription) return 'Sem plano ativo'
  if (subscription.status === 'active' && subscription.payment_status === 'isento') return 'Ativo sem cobrança'
  return ({
    inactive: 'Inativo',
    pending_payment: 'Pendente de pagamento',
    awaiting_confirmation: 'Aguardando confirmação',
    active: 'Ativo',
    past_due: 'Pagamento atrasado',
    cancelled: 'Cancelado',
  })[subscription.status] || 'Status desconhecido'
}

const statusKey = (listing, validityNow = Date.now()) => {
  const status = String(listing.status || '').trim().toLocaleLowerCase('pt-BR')
  if (['aprovado', 'disponível', 'disponivel', 'ativo', 'pausado'].includes(status)
    && isIndividualListingExpired(listing, validityNow)) return 'expired'
  if (status === 'em_analise' || status === 'em análise') return 'pending'
  if (status === 'reprovado') return 'rejected'
  if (status === 'pausado') return 'paused'
  if (status === 'concluido' || status.includes('conclu') || status.includes('vend') || status.includes('expir')) return 'completed'
  return 'approved'
}

const statusLabel = (listing, validityNow = Date.now()) => ({
  approved: 'Aprovado',
  expired: 'Expirado',
  pending: 'Pendente',
  rejected: 'Reprovado',
  paused: 'Pausado',
  completed: 'Concluído',
})[statusKey(listing, validityNow)]

function AdminListingCard({
  listing,
  owner,
  canModerate,
  onView,
  onEdit,
  onApprove,
  onReject,
  onRequestReactivate,
  onReleaseWithoutCharge,
  onToggleFeatured,
  validityNow,
  saving,
  statusSaving,
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const purpose = getListingPurpose(listing)
  const propertyType = getListingPropertyType(listing)
  const listingStatus = statusKey(listing, validityNow)
  const paymentUnconfirmed = ['pendente_pagamento', 'aguardando_confirmacao'].includes(listing.billing_status)

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
          {[propertyType.label, owner?.name || listing.advertiser || 'Anunciante não informado', owner?.typeLabel || 'Tipo de usuário não informado']
            .map((value, index) => (
              <span key={`${index}-${value}`}>
                {index > 0 && <span className="standard-listing-feature-separator" aria-hidden="true">-</span>}
                {value}
              </span>
            ))}
        </div>
        <span className={`standard-listing-status ${listingStatus}`}><i aria-hidden="true" /><CircleCheck size={15} aria-hidden="true" />{statusLabel(listing, validityNow)}</span>
        {listing.billing_status && (
          <p className="admin-listing-billing-state">
            Cobrança: {BILLING_STATUS_LABELS[listing.billing_status] || listing.billing_status}
            {listing.billing_status === 'pendente_pagamento' && ' · R$ 4,90'}
          </p>
        )}
        <p className="standard-listing-date"><CalendarDays size={17} aria-hidden="true" />Enviado em {formatDate(listing.created_at)}</p>
        {listing.motivo_reprovacao && <p className="admin-listing-rejection">{listing.motivo_reprovacao}</p>}
      </div>
      <div className="standard-listing-actions admin-listing-actions">
        <button type="button" onClick={() => onView(listing)}><Eye size={16} aria-hidden="true" />Visualizar</button>
        <button type="button" onClick={() => onEdit(listing)}><Pencil size={16} aria-hidden="true" />Editar</button>
        <button type="button" className={listing.destaque_home ? 'is-featured' : ''} disabled={saving} onClick={() => onToggleFeatured(listing)}>
          <Star size={16} aria-hidden="true" />{listing.destaque_home ? 'Remover destaque' : 'Destacar'}
        </button>
        {owner?.userType === 'pessoa_fisica' && ['pendente_pagamento', 'aguardando_confirmacao'].includes(listing.billing_status) && (
          <button type="button" className="approve-listing-button" disabled={saving || statusSaving} onClick={() => onReleaseWithoutCharge(listing)}>
            <Check size={16} aria-hidden="true" />Liberar sem cobrança
          </button>
        )}
        {listingStatus === 'expired' && <button type="button" className="approve-listing-button" disabled={saving || statusSaving} onClick={() => onRequestReactivate(listing)}><Play size={16} aria-hidden="true" />Reativar anúncio</button>}
        {canModerate && !paymentUnconfirmed && !rejecting && (
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

function ListingPreview({ listing, owner, onClose, onApprove, onReject, onEdit, onToggleFeatured, onPause, onReactivate, onRequestReactivate, onReleaseWithoutCharge, onComplete, onDelete, moderationError, statusSaving, validityNow, saving }) {
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [statusAction, setStatusAction] = useState(null)
  const [statusActionBusy, setStatusActionBusy] = useState(false)
  const [statusActionError, setStatusActionError] = useState('')
  const purpose = getListingPurpose(listing)
  const listingStatus = statusKey(listing, validityNow)
  const canModerate = listingStatus === 'pending'
  const paymentUnconfirmed = ['pendente_pagamento', 'aguardando_confirmacao'].includes(listing.billing_status)

  const confirmStatusAction = async () => {
    const handler = statusAction === 'pause' ? onPause : onReactivate
    setStatusActionBusy(true)
    setStatusActionError('')
    try {
      if (typeof handler !== 'function') throw new Error('A ação de status não está disponível.')
      if (await handler(listing)) {
        setStatusAction(null)
        onClose()
      }
    } catch (error) {
      console.error('Falha ao confirmar a alteração de status:', error)
      setStatusActionError(`Não foi possível confirmar a alteração: ${error.message}`)
    } finally {
      setStatusActionBusy(false)
    }
  }
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
        {(statusActionError || moderationError) && <p className="my-area-feedback error" role="alert">{statusActionError || moderationError}</p>}
        <div className="admin-preview-content">
          <StandardListingGallery listing={listing} purpose={purpose} showThumbnails={false} />
          <div className="admin-preview-details">
            <span className={`standard-listing-status ${listingStatus}`}><i aria-hidden="true" />{statusLabel(listing, validityNow)}</span>
            <h3>{listing.title}</h3>
            <strong className={`account-card-price purpose-price purpose-${purpose}`}>{listing.price}</strong>
            <p><MapPin size={17} />{listing.neighborhood}, {listing.city || 'Ipuã-SP'}</p>
            <p><User size={17} />{owner?.name || listing.advertiser || 'Anunciante não informado'}{owner?.email ? ` · ${owner.email}` : ''}</p>
            <p><Building2 size={17} />{owner?.typeLabel || 'Tipo de usuário não informado'}</p>
            <p><CalendarDays size={17} />Enviado em {formatDate(listing.created_at)}</p>
            {listing.billing_status && <p><CreditCard size={17} />Cobrança: {BILLING_STATUS_LABELS[listing.billing_status] || listing.billing_status}{listing.billing_status === 'pendente_pagamento' ? ' · R$ 4,90' : ''}</p>}
            {listing.description && <p className="admin-preview-description">{listing.description}</p>}
            {listing.motivo_reprovacao && <p className="admin-listing-rejection">{listing.motivo_reprovacao}</p>}
          </div>
        </div>
        <footer>
          <button type="button" onClick={() => onEdit(listing)}><Pencil size={16} />Editar anúncio</button>
          <button type="button" className={listing.destaque_home ? 'is-featured' : ''} disabled={saving} onClick={() => onToggleFeatured(listing)}><Star size={16} />{listing.destaque_home ? 'Remover destaque' : 'Destacar'}</button>
          {owner?.userType === 'pessoa_fisica' && paymentUnconfirmed && <button type="button" className="approve-listing-button" disabled={saving || statusSaving} onClick={async () => { if (await onReleaseWithoutCharge(listing)) onClose() }}><Check size={16} />Liberar sem cobrança</button>}
          {['paused', 'expired'].includes(listingStatus)
            ? <button type="button" className="approve-listing-button" disabled={saving || statusSaving} onClick={() => {
              if (listing.individual_validity_started_at) onRequestReactivate(listing)
              else setStatusAction('reactivate')
            }}><Play size={16} />Reativar anúncio</button>
            : listingStatus === 'approved' && <button type="button" disabled={saving || statusSaving} onClick={() => setStatusAction('pause')}><Pause size={16} />Pausar anúncio</button>}
          {statusAction && (
            <div className="admin-status-confirmation" role="group" aria-label="Confirmar alteração de status">
              <p>{statusAction === 'pause'
                ? `Pausar o anúncio “${listing.title}”? Ele deixará de aparecer publicamente.`
                : `Reativar o anúncio “${listing.title}”? Ele voltará a aparecer publicamente.`}</p>
              <button type="button" className={statusAction === 'reactivate' ? 'approve-listing-button' : ''} disabled={statusSaving || statusActionBusy} onClick={confirmStatusAction}>
                {statusSaving || statusActionBusy ? 'Salvando…' : statusAction === 'pause' ? 'Confirmar pausa' : 'Confirmar reativação'}
              </button>
              <button type="button" disabled={statusSaving || statusActionBusy} onClick={() => setStatusAction(null)}>Cancelar</button>
            </div>
          )}
          {['approved', 'paused'].includes(listingStatus) && <button type="button" disabled={saving} onClick={async () => { if (await onComplete(listing)) onClose() }}><Check size={16} />Marcar concluído</button>}
          <button type="button" className="reject-listing-button" disabled={saving} onClick={async () => { if (await onDelete(listing)) onClose() }}><Trash2 size={16} />Excluir anúncio</button>
          {canModerate && !paymentUnconfirmed && !rejecting && <button type="button" className="approve-listing-button" disabled={saving} onClick={confirmApprove}><Check size={16} />Aprovar</button>}
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
  billingPlans,
  billingSubscriptions,
  billingLoading,
  billingError,
  billingMessage,
  billingSavingId,
  onAssignPlan,
  onSaveBillingPlan,
  onToggleAdmin,
  usersActionId,
  onApprove,
  onReject,
  onPause,
  onReactivate,
  onRequestReactivate,
  onReleaseWithoutCharge,
  onComplete,
  onDelete,
  onEdit,
  onToggleFeatured,
  onMoveFeatured,
  featuredSavingId,
  statusSavingId,
  validityNow,
  moderationError,
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
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [previewListing, setPreviewListing] = useState(null)
  const [previewUser, setPreviewUser] = useState(null)
  const [selectedPlanByUser, setSelectedPlanByUser] = useState({})
  const [billingPlanDrafts, setBillingPlanDrafts] = useState({})
  const ownersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const subscriptionsByUser = useMemo(() => new Map(billingSubscriptions.map((item) => [item.user_id, item])), [billingSubscriptions])
  const pending = listings.filter((listing) => statusKey(listing, validityNow) === 'pending')
  const approved = listings.filter((listing) => statusKey(listing, validityNow) === 'approved')
  const expired = listings.filter((listing) => statusKey(listing, validityNow) === 'expired')
  const rejected = listings.filter((listing) => statusKey(listing, validityNow) === 'rejected')
  const activeNeighborhoods = neighborhoods.filter((neighborhood) => neighborhood.active)
  const realtors = users.filter((user) => user.userType === 'corretor')
  const agencies = users.filter((user) => user.userType === 'imobiliaria')
  const featured = listings
    .filter((listing) => statusKey(listing, validityNow) === 'approved' && listing.destaque_home)
    .sort((first, second) => Number(first.ordem_destaque) - Number(second.ordem_destaque))
  const latest = [...listings]
    .sort((first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime())
    .slice(0, 6)
  const filteredListings = listings.filter((listing) => {
    const filterMatches = listingFilter === 'all'
      || (listingFilter === 'approved' && statusKey(listing, validityNow) === 'approved')
      || (listingFilter === 'expired' && statusKey(listing, validityNow) === 'expired')
      || (listingFilter === 'pending' && statusKey(listing, validityNow) === 'pending')
      || (listingFilter === 'rejected' && statusKey(listing, validityNow) === 'rejected')
      || (listingFilter === 'paused' && statusKey(listing, validityNow) === 'paused')
    const owner = ownersById.get(listing.user_id)
    const ownerTypeMatches = ownerTypeFilter === 'all' || owner?.userType === ownerTypeFilter
    const query = search.trim().toLocaleLowerCase('pt-BR')
    const searchMatches = !query || [
      listing.title,
      listing.advertiser,
      listing.neighborhood,
      owner?.name,
      owner?.email,
    ].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query))
    return filterMatches && ownerTypeMatches && searchMatches
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
          onRequestReactivate={onRequestReactivate}
          onReleaseWithoutCharge={onReleaseWithoutCharge}
          onToggleFeatured={onToggleFeatured}
          validityNow={validityNow}
          saving={featuredSavingId === listing.id}
          statusSaving={statusSavingId === listing.id}
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
      {moderationError && <p className="my-area-feedback error" role="alert">{moderationError}</p>}
      {listingsError && <p className="my-area-feedback error" role="alert">{listingsError}</p>}

      {section === 'overview' && (
        <div className="admin-overview">
          <section className="admin-overview-section" aria-labelledby="admin-listing-status-title">
            <h2 id="admin-listing-status-title">Situação dos anúncios</h2>
            <div className="admin-status-cards">
              <article className="admin-status-card pending">
                <span className="admin-status-icon"><Clock3 size={30} strokeWidth={1.8} /></span>
                <div className="admin-status-copy">
                  <h3>Pendentes</h3>
                  <strong>{pending.length}</strong>
                  <p>{pending.length === 0 ? 'Nenhum anúncio aguardando análise' : `${pending.length} anúncio${pending.length === 1 ? '' : 's'} aguardando análise`}</p>
                </div>
              </article>
              <article className="admin-status-card approved">
                <span className="admin-status-icon"><CircleCheck size={30} strokeWidth={1.8} /></span>
                <div className="admin-status-copy">
                  <h3>Aprovados</h3>
                  <strong>{approved.length}</strong>
                  <p>Anúncios aprovados</p>
                </div>
              </article>
              <article className="admin-status-card expired">
                <span className="admin-status-icon"><CalendarDays size={30} strokeWidth={1.8} /></span>
                <div className="admin-status-copy">
                  <h3>Expirados</h3>
                  <strong>{expired.length}</strong>
                  <p>Anúncios de pessoa física vencidos</p>
                </div>
              </article>
              <article className="admin-status-card rejected">
                <span className="admin-status-icon"><CircleX size={30} strokeWidth={1.8} /></span>
                <div className="admin-status-copy">
                  <h3>Reprovados</h3>
                  <strong>{rejected.length}</strong>
                  <p>{rejected.length === 0 ? 'Nenhum anúncio reprovado' : `${rejected.length} anúncio${rejected.length === 1 ? '' : 's'} reprovado${rejected.length === 1 ? '' : 's'}`}</p>
                </div>
              </article>
            </div>
          </section>

          <section className="admin-management" aria-labelledby="admin-management-title">
            <h2 id="admin-management-title">Gerenciamento</h2>
            <div className="admin-management-cards">
              <article><MapPin size={28} strokeWidth={1.8} /><div><span>Bairros ativos</span><strong>{activeNeighborhoods.length}</strong></div></article>
              <article><UsersRound size={28} strokeWidth={1.8} /><div><span>Usuários</span><strong>{usersLoading ? '—' : users.length}</strong></div></article>
              <article><BriefcaseBusiness size={28} strokeWidth={1.8} /><div><span>Corretores</span><strong>{usersLoading ? '—' : realtors.length}</strong></div></article>
              <article><Building2 size={28} strokeWidth={1.8} /><div><span>Imobiliárias</span><strong>{usersLoading ? '—' : agencies.length}</strong></div></article>
            </div>
          </section>

          <section className="my-area-recent-listings admin-recent-listings">
            <header className="my-area-recent-heading"><h2>Últimos anúncios enviados</h2><button type="button" onClick={() => onSectionChange('listings')}>Ver todos <span aria-hidden="true">→</span></button></header>
            {latest.length ? (
              <div className="admin-table-scroll">
                <table className="my-area-listings-table admin-data-table">
                  <thead><tr><th>Título</th><th>Usuário</th><th>Data</th><th>Status</th><th>Ação</th></tr></thead>
                  <tbody>{latest.slice(0, 4).map((listing) => {
                    const owner = ownersById.get(listing.user_id)
                    return <tr key={listing.id}>
                      <td>{listing.title}</td>
                      <td>{owner?.name || listing.advertiser || 'Não informado'}</td>
                      <td>{formatDate(listing.created_at)}</td>
                      <td><span className={`standard-listing-status ${statusKey(listing, validityNow)}`}><i aria-hidden="true" />{statusLabel(listing, validityNow)}</span></td>
                      <td><button type="button" onClick={() => setPreviewListing(listing)}>Visualizar</button></td>
                    </tr>
                  })}</tbody>
                </table>
              </div>
            ) : <p className="account-empty">Ainda não há anúncios cadastrados.</p>}
          </section>
        </div>
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
            <label><span className="sr-only">Filtrar anúncios por status</span><select value={listingFilter} onChange={(event) => setListingFilter(event.target.value)}><option value="all">Todos os status</option><option value="approved">Aprovados</option><option value="expired">Expirados</option><option value="pending">Pendentes</option><option value="rejected">Reprovados</option><option value="paused">Pausados</option></select></label>
            <label><span className="sr-only">Filtrar anúncios por tipo de anunciante</span><select value={ownerTypeFilter} onChange={(event) => setOwnerTypeFilter(event.target.value)}><option value="all">Todos os tipos</option><option value="pessoa_fisica">Pessoa Física</option><option value="imobiliaria">Imobiliária</option><option value="corretor">Corretor</option></select></label>
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
                <thead><tr><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Plano profissional</th><th>Administrador</th><th>Cadastro</th><th>Ações</th></tr></thead>
                <tbody>{users.map((user) => <tr key={user.id}>
                  <td>{user.name || 'Não informado'}</td><td>{user.email}</td><td>{user.typeLabel || 'Não informado'}</td>
                  <td>{['corretor', 'imobiliaria'].includes(user.userType) ? (() => {
                    const subscription = subscriptionsByUser.get(user.id)
                    const eligiblePlans = billingPlans.filter((plan) => plan.account_type === user.userType && plan.active)
                    const selectedPlanId = selectedPlanByUser[user.id] ?? subscription?.plan_id ?? ''
                    return (
                      <div className="admin-user-plan-control">
                        <select aria-label={`Plano de ${user.name || user.email}`} value={selectedPlanId} onChange={(event) => setSelectedPlanByUser((current) => ({ ...current, [user.id]: event.target.value }))} disabled={billingLoading || billingSavingId === user.id}>
                          <option value="">Selecione um plano</option>
                          {eligiblePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · até {plan.active_listing_limit} anúncios</option>)}
                        </select>
                        <small>{subscriptionStatusLabel(subscription)}</small>
                        <button type="button" disabled={!selectedPlanId || billingLoading || billingSavingId === user.id} onClick={() => onAssignPlan(user.id, selectedPlanId)}>
                          {billingSavingId === user.id ? 'Salvando…' : 'Atribuir e ativar'}
                        </button>
                      </div>
                    )
                  })() : '—'}</td>
                  <td>{user.isAdmin ? 'Sim' : 'Não'}</td><td>{formatDate(user.createdAt)}</td>
                  <td className="admin-table-actions"><button type="button" title={`Visualizar ${user.name || user.email}`} onClick={() => setPreviewUser(user)}><Eye size={16} />Visualizar</button>{user.id !== currentUserId && <button type="button" disabled={usersActionId === user.id} onClick={() => onToggleAdmin(user)}>{usersActionId === user.id ? 'Aguarde…' : user.isAdmin ? <><X size={15} />Remover admin</> : <><Shield size={15} />Tornar admin</>}</button>}</td>
                </tr>)}</tbody>
              </table>
            </div>
          ) : !usersError && <p className="account-empty">Nenhum usuário encontrado.</p>}
        </section>
      )}

      {section === 'billing' && (
        <section className="admin-section-content">
          <header className="admin-section-heading"><div><h2>Planos e cobrança</h2><p>Configure limites de referência e acompanhe os planos ativados manualmente, sem cobrança externa.</p></div></header>
          {billingError && <p className="my-area-feedback error" role="alert">{billingError}</p>}
          {billingMessage && <p className="my-area-feedback" role="status">{billingMessage}</p>}
          {billingLoading ? <p className="account-empty" role="status">Carregando planos e assinaturas…</p> : (
            <div className="admin-billing-plan-list">
              {billingPlans.map((plan) => {
                const draft = billingPlanDrafts[plan.id] || {
                  limit: String(plan.active_listing_limit),
                  price: plan.monthly_price_cents == null ? '' : (plan.monthly_price_cents / 100).toFixed(2),
                }
                return (
                  <form className="admin-billing-plan-card" key={plan.id} onSubmit={(event) => {
                    event.preventDefault()
                    onSaveBillingPlan(plan.id, draft.limit, draft.price)
                  }}>
                    <div><h3>{plan.name}</h3><span>{plan.account_type === 'imobiliaria' ? 'Imobiliária' : 'Corretor'}</span></div>
                    <label>Limite de anúncios ativos<input type="number" min="1" step="1" value={draft.limit} onChange={(event) => setBillingPlanDrafts((current) => ({ ...current, [plan.id]: { ...draft, limit: event.target.value } }))} required /></label>
                    <label>Mensalidade de referência (R$)<input type="number" min="0" step="0.01" value={draft.price} placeholder="A definir" onChange={(event) => setBillingPlanDrafts((current) => ({ ...current, [plan.id]: { ...draft, price: event.target.value } }))} /></label>
                    <button type="submit" disabled={billingSavingId === plan.id}>{billingSavingId === plan.id ? 'Salvando…' : 'Salvar plano'}</button>
                  </form>
                )
              })}
              {!billingPlans.length && <p className="account-empty">Nenhum plano de referência foi configurado.</p>}
            </div>
          )}
          <p className="admin-billing-note">Os planos são atribuídos e ativados por um administrador sem cobrança nesta etapa. O estado de pagamento é controlado no servidor; a integração com Pix, cartão e webhook ainda não está ativa.</p>
        </section>
      )}

      {previewListing && <ListingPreview listing={previewListing} owner={ownersById.get(previewListing.user_id)} onClose={() => setPreviewListing(null)} onApprove={onApprove} onReject={onReject} onPause={onPause} onReactivate={onReactivate} onRequestReactivate={onRequestReactivate} onReleaseWithoutCharge={onReleaseWithoutCharge} onComplete={onComplete} onDelete={onDelete} onEdit={(listing) => { setPreviewListing(null); onEdit(listing) }} onToggleFeatured={onToggleFeatured} moderationError={moderationError} statusSaving={statusSavingId === previewListing.id} validityNow={validityNow} saving={featuredSavingId === previewListing.id} />}
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
