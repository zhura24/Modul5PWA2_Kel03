import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CreateGunPage from './pages/CreateGunPage.jsx'
import EditGunPage from './pages/EditGunPage.jsx'
import GunDetail from './components/gun/GunDetail.jsx'
import EditProfilePage from './pages/EditProfilePage.jsx'
import DemoCartPage from './pages/DemoCartPage.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import { useGunById } from './hooks/useGuns.js'
import { archiveGun } from './services/archiveService.js'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list')
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sharedGunId, setSharedGunId] = useState(
    () => new URLSearchParams(window.location.search).get('gun'),
  )
  const { gun: sharedGun, loading: sharedGunLoading, error: sharedGunError } = useGunById(sharedGunId)
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bore_barrel_demo_cart') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    const syncSharedGun = () => setSharedGunId(new URLSearchParams(window.location.search).get('gun'))
    window.addEventListener('popstate', syncSharedGun)
    return () => window.removeEventListener('popstate', syncSharedGun)
  }, [])

  const saveCart = (nextCart) => {
    try {
      localStorage.setItem('bore_barrel_demo_cart', JSON.stringify(nextCart))
      setCart(nextCart)
      setCartError('')
    } catch (error) {
      setCartError(error.message || 'Could not save the demo cart.')
    }
  }

  const handleAddToCart = (gun) => {
    if (!gun?.id) {
      setCartError('Only items with a product ID can be added to the demo cart.')
      return
    }
    if (cart.some((item) => String(item.id) === String(gun.id))) return
    saveCart([
      ...cart,
      { id: gun.id, name: gun.name, image: gun.image_url || gun.image || '/guns/pistol.svg' },
    ])
  }

  const handleRemoveFromCart = (id) => {
    saveCart(cart.filter((item) => String(item.id) !== String(id)))
  }

  const clearSharedLink = () => {
    if (!sharedGunId) return
    const url = new URL(window.location.href)
    url.searchParams.delete('gun')
    window.history.replaceState({}, '', url)
    setSharedGunId(null)
  }

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'ProfileEdit') {
      setMode('profileEdit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      clearSharedLink()
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
    clearSharedLink()
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        cartCount={cart.length}
      />

      <main className="main">
        {/* Sub-page views */}
        {mode === 'create' && (
          <CreateGunPage
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'edit' && (
          <EditGunPage
            gun={editingGun}
            gunId={editingGun?.id}
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'detail' && selectedGun && (
          <GunDetail
            gun={selectedGun}
            onBack={handleBackToList}
            onEdit={(g) => handleNavigate('Edit', g)}
            onArchive={(g) => setDeleteTarget(g)}
            onAddToCart={handleAddToCart}
          />
        )}

        {mode === 'profileEdit' && (
          <EditProfilePage
            onBack={() => setMode('list')}
            onSuccess={() => {
              setMode('list')
              setTab('Profile')
            }}
          />
        )}

        {/* Top-level Tabs */}
        {mode === 'list' && (
          <>
            {sharedGunId && (
              sharedGunLoading ? (
                <div className="state-box">Loading shared item…</div>
              ) : sharedGun ? (
                <GunDetail
                  gun={sharedGun}
                  onBack={handleBackToList}
                  onEdit={(g) => handleNavigate('Edit', g)}
                  onArchive={(g) => setDeleteTarget(g)}
                  onAddToCart={handleAddToCart}
                />
              ) : (
                <div className="state-box state-box--error">
                  <p>{sharedGunError || 'The shared item could not be found.'}</p>
                  <button type="button" className="btn btn--outline" onClick={handleBackToList}>
                    Back to catalog
                  </button>
                </div>
              )
            )}
            {!sharedGunId && tab === 'Catalog' && (
              <Catalog
                onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                onAddToCart={handleAddToCart}
              />
            )}
            {!sharedGunId && tab === 'Favorites' && (
              <FavoritesPage
                onSelectGun={(g) => handleNavigate('Detail', g)}
                onNavigateCatalog={() => setTab('Catalog')}
              />
            )}
            {!sharedGunId && tab === 'Profile' && (
              <ProfilePage
                onReplaySplash={() => setShowSplash(true)}
                onEditProfile={() => handleNavigate('ProfileEdit')}
                onNavigate={(target, payload) => handleNavigate(target, payload)}
              />
            )}
            {!sharedGunId && tab === 'Cart' && (
              <DemoCartPage
                items={cart}
                error={cartError}
                onRemove={handleRemoveFromCart}
                onBrowse={() => setTab('Catalog')}
              />
            )}
          </>
        )}
        {cartError && <div className="toast toast--error" role="alert">{cartError}</div>}
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Archive Hardware Record"
        message={`Move "${deleteTarget?.name}" to your profile archive? You can restore it later.`}
        confirmLabel="Archive"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            archiveGun(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to archive record.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
