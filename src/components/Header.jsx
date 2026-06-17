import React, { useState } from 'react'
import styles from './Header.module.scss'
import { TODOS } from '../data/album.js'

const NAV = [
  { id: 'album',     label: 'Álbum' },
  { id: 'pacotes',   label: 'Pacotinhos' },
  { id: 'trocas',   label: 'Trocas' },
  { id: 'repetidas', label: 'Figurinhas Repetidas' },
]

export default function Header({ view, setView, cMap, restantes, userName, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function selectView(id) {
    setView(id)
    setMenuOpen(false)
  }

  return (
    <header className={styles.header}>

      {/* Nav + User */}
      <div className={styles.right}>
        <nav className={styles.nav}>
          {NAV.map(t => (
            <button
              key={t.id}
              className={`${styles.navBtn} ${view === t.id ? styles.active : ''}`}
              onClick={() => selectView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Usuário logado */}
        {userName && (
          <div className={styles.user}>
            <div className={styles.userAvatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{userName.split(' ')[0]}</span>
            <button className={styles.logoutBtn} onClick={onLogout} title="Sair">
              ⏏
            </button>
          </div>
        )}
      </div>

      {/* Menu mobile (dropdown) */}
      {menuOpen && (
        <nav className={styles.navMobile}>
          {NAV.map(t => (
            <button
              key={t.id}
              className={`${styles.navMobileBtn} ${view === t.id ? styles.active : ''}`}
              onClick={() => selectView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}
