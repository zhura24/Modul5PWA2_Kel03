import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import {
  archiveGun,
  getArchivedGunIds,
  getPermanentlyDeletedGunIds,
} from '../services/archiveService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page — the main product listing.
 *
 * Data source priority:
 *   1. Live API via useGuns()
 *   2. Local static array (GUNS_LOCAL) when the API is unreachable
 *
 * Features: search, category filter, sort, CRUD actions, detail modal.
 */
export default function Catalog({ onNavigate, onAddToCart }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 50 })
  const [useLocal, setUseLocal] = useState(false)
  const [archiveState, setArchiveState] = useState(() => {
    try {
      return { ids: getArchivedGunIds(), error: '' }
    } catch (archiveError) {
      return { ids: [], error: archiveError.message }
    }
  })
  const archivedIds = archiveState.ids
  const [permanentlyDeletedState] = useState(() => {
    try {
      return { ids: getPermanentlyDeletedGunIds(), error: '' }
    } catch (archiveError) {
      return { ids: [], error: archiveError.message }
    }
  })
  const permanentlyDeletedIds = permanentlyDeletedState.ids
  const [visibleState, setVisibleState] = useState({ filterKey: '', count: 12 })
  const loadMoreRef = useRef(null)

  // Decide data source
  const rawGuns = useMemo(() => {
    if (useLocal || (error && apiGuns.length === 0)) {
      // Enrich local data with synthetic ids so FavoriteButton and detail work
      return GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    }
    return apiGuns
  }, [apiGuns, error, useLocal])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const visibleCatalog = useMemo(
    () => rawGuns.filter((gun) =>
      !archivedIds.includes(String(gun.id)) &&
      !permanentlyDeletedIds.includes(String(gun.id)),
    ),
    [rawGuns, archivedIds, permanentlyDeletedIds],
  )
  const categories = useMemo(() => extractCategories(visibleCatalog), [visibleCatalog])

  const filteredGuns = useMemo(() => {
    let result = visibleCatalog.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [visibleCatalog, search, activeCategory, sortKey, sortOrder])

  const filterKey = JSON.stringify([search, activeCategory, sortKey, sortOrder])
  const visibleCount = visibleState.filterKey === filterKey ? visibleState.count : 12
  const displayedGuns = filteredGuns.slice(0, visibleCount)

  const loadMore = useCallback(() => {
    setVisibleState((current) => {
      const currentCount = current.filterKey === filterKey ? current.count : 12
      return { filterKey, count: Math.min(currentCount + 12, filteredGuns.length) }
    })
  }, [filterKey, filteredGuns.length])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || visibleCount >= filteredGuns.length || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore()
      }
    }, { rootMargin: '240px' })

    observer.observe(node)
    return () => observer.disconnect()
  }, [filteredGuns.length, visibleCount, filterKey, loadMore])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // ---- delete ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      archiveGun(deleteTarget.id)
      setArchiveState((current) => ({
        ids: [...new Set([...current.ids, String(deleteTarget.id)])],
        error: '',
      }))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.message || 'Failed to archive.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onArchive={(g) => { setSelectedGun(null); setDeleteTarget(g) }}
        onAddToCart={onAddToCart}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section>
        {(archiveState.error || permanentlyDeletedState.error) && (
          <p className="form-error" role="alert">{archiveState.error || permanentlyDeletedState.error}</p>
        )}
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order) }}
        />

        {/* States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No active products match your search.</p>
          </div>
        )}

        {/* Product grid */}
        {displayedGuns.length > 0 && (
          <ul className="stock">
            {displayedGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onArchive={setDeleteTarget}
              />
            ))}
          </ul>
        )}
        {visibleCount < filteredGuns.length && (
          <div className="load-more">
            <div ref={loadMoreRef} aria-hidden="true" />
            <button
              type="button"
              className="btn btn--outline"
              onClick={loadMore}
            >
              Load more items
            </button>
          </div>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Archive Product"
        message={`Move "${deleteTarget?.name}" to your profile archive? You can restore it later.`}
        confirmLabel="Archive"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
      />
      {deleteError && <div className="toast toast--error" role="alert">{deleteError}</div>}
    </>
  )
}