import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { useAlbum } from './hooks/useAlbum.js'
import { useToast } from './hooks/useToast.js'
import Header    from './components/Header.jsx'
import Toast     from './components/Toast.jsx'
import CardModal from './components/CardModal.jsx'
import AuthPage       from './pages/AuthPage.jsx'
import AlbumView      from './pages/AlbumView.jsx'
import PacotinhosView from './pages/PacotinhosView.jsx'
import TrocasView     from './pages/TrocasView.jsx'
import RepetidosView  from './pages/RepetidosView.jsx'
import styles from './App.module.scss'

// ── Inner app (só renderiza quando logado) ────────────────────
function AlbumApp() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const { cMap, restantes, loading: albumLoading, addPack, applyTrade } = useAlbum()
  const { toast, show: showToast } = useToast()
  const [view,     setView]     = useState('album')
  const [selected, setSelected] = useState(null)

  if (authLoading || albumLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDot} />
        <span>Carregando álbum…</span>
      </div>
    )
  }

  async function handlePackOpened(cards) {
    await addPack(cards)
    showToast('5 figurinhas adicionadas ao álbum!')
  }

  return (
    <div className={styles.app}>
      <Toast toast={toast} />
      <CardModal emp={selected} qtd={selected ? cMap[selected.id] ?? 0 : 0} onClose={() => setSelected(null)} />

      <Header
        view={view}
        setView={setView}
        cMap={cMap}
        restantes={restantes}
        userName={profile?.nome ?? user?.email}
        onLogout={signOut}
      />

      <main className={styles.main}>
        {view === 'album'     && <AlbumView      cMap={cMap} onCard={setSelected} restantes={restantes} setView={setView} />}
        {view === 'pacotes'   && <PacotinhosView restantes={restantes} cMap={cMap} onPackOpened={handlePackOpened} />}
        {view === 'trocas'    && <TrocasView     cMap={cMap} onTrade={applyTrade} showToast={showToast} />}
        {view === 'repetidas' && <RepetidosView  cMap={cMap} onCard={setSelected} />}
      </main>
    </div>
  )
}

// ── Root com Auth guard ───────────────────────────────────────
function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDot} />
      </div>
    )
  }

  return user ? <AlbumApp /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
