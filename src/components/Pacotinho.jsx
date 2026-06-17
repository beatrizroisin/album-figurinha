import React, { useState, useEffect, useRef } from 'react'
import FigurinhaCard from './FigurinhaCard.jsx'
import { sortearPacote } from '../data/album.js'
import styles from './Pacotinho.module.scss'

// ── Partículas de brilho ──────────────────────────────────────
function Sparkles({ active }) {
  if (!active) return null
  return (
    <div className={styles.sparkles}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={styles.sparkle} style={{
          '--x': `${Math.random() * 200 - 100}px`,
          '--y': `${Math.random() * 200 - 100}px`,
          '--delay': `${Math.random() * 0.4}s`,
          '--size': `${4 + Math.random() * 6}px`,
        }} />
      ))}
    </div>
  )
}

export default function Pacotinho({ onComplete, disabled, cMap = {} }) {
  const [fase, setFase]       = useState('idle')   // idle | hover | drag | tearing | reveal | done
  const [tearPct, setTearPct] = useState(0)        // 0-100 quanto foi rasgado
  const [cards, setCards]     = useState([])
  const [cardIdx, setCardIdx] = useState(0)
  const [cardAnim, setCardAnim] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragDelta, setDragDelta]   = useState(0)  // px arrastado pra cima
  const packRef   = useRef(null)
  const tearTimer = useRef(null)

  // Limpa ao desmontar
  useEffect(() => () => clearInterval(tearTimer.current), [])

  // ── Drag to tear ──
  function onPointerDown(e) {
    if (disabled || fase !== 'idle') return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    setDragStartY(e.clientY)
    setDragDelta(0)
    setFase('drag')
  }

  function onPointerMove(e) {
    if (!isDragging || fase !== 'drag') return
    const delta = Math.max(0, dragStartY - e.clientY) // só pra cima
    setDragDelta(delta)
    const pct = Math.min(100, (delta / 140) * 100)
    setTearPct(pct)
    if (pct >= 100) finalizarRasgo()
  }

  function onPointerUp() {
    if (!isDragging) return
    setIsDragging(false)
    if (fase === 'drag') {
      if (tearPct >= 40) {
        // Passou do ponto sem retorno — continua automaticamente
        autoTear(tearPct)
      } else {
        // Volta ao início
        setTearPct(0)
        setDragDelta(0)
        setFase('idle')
      }
    }
  }

  function autoTear(from) {
    setFase('tearing')
    let pct = from
    tearTimer.current = setInterval(() => {
      pct += 4
      setTearPct(pct)
      if (pct >= 100) {
        clearInterval(tearTimer.current)
        finalizarRasgo()
      }
    }, 16)
  }

  function finalizarRasgo() {
    clearInterval(tearTimer.current)
    setTearPct(100)
    setFase('reveal')
    const picked = sortearPacote(cMap)
    setCards(picked)
    setCardIdx(0)
    setTimeout(() => setCardAnim(true), 100)
  }

  // Clique simples também abre
  function onClickPack() {
    if (disabled || fase !== 'idle') return
    setFase('tearing')
    let pct = 0
    tearTimer.current = setInterval(() => {
      pct += 3
      setTearPct(pct)
      if (pct >= 100) {
        clearInterval(tearTimer.current)
        finalizarRasgo()
      }
    }, 14)
  }

  function nextCard() {
    setCardAnim(false)
    setTimeout(() => {
      if (cardIdx < cards.length - 1) {
        setCardIdx(i => i + 1)
        setTimeout(() => setCardAnim(true), 50)
      } else {
        setFase('done')
        onComplete?.(cards)
      }
    }, 200)
  }

  // ── Calcula geometria do rasgo ──
  const topHeight   = Math.min(tearPct * 0.9, 85)   // % da tampa que subiu
  const topOpacity  = Math.max(0, 1 - tearPct / 60)
  const topTransY   = -(tearPct * 2.2)               // px que a tampa subiu
  const topRotate   = tearPct * 0.08                 // leve rotação ao rasgar
  const glowOpacity = tearPct / 100

  // ── RENDER ──
  if (fase === 'idle' || fase === 'drag' || fase === 'tearing') {
    return (
      <div className={styles.scene}>
        <Sparkles active={tearPct > 60} />

        {/* Sombra projetada */}
        <div className={styles.shadow} style={{
          opacity: 0.35 + tearPct * 0.003,
          transform: `scaleX(${1 - tearPct * 0.003}) translateY(${tearPct * 0.3}px)`,
        }} />

        {/* PACOTE */}
        <div
          ref={packRef}
          className={`${styles.pack3d} ${disabled ? styles.disabled : ''} ${fase === 'drag' ? styles.dragging : ''}`}
          style={{
            transform: `
              perspective(800px)
              rotateX(${fase === 'idle' ? 8 : 4}deg)
              rotateY(${isDragging ? dragDelta * 0.05 : 0}deg)
              translateY(${isDragging ? -dragDelta * 0.15 : 0}px)
            `,
          }}
          onClick={onClickPack}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Flap (parte superior que se levanta no rasgo) */}
          <div
            className={styles.packFlap}
            style={{
              transform: `translateY(${topTransY}px) rotate(${topRotate}deg)`,
              opacity: topOpacity,
            }}
          >
            <img src="/fotos/newpac2.png" alt="pacote" draggable={false} />
          </div>

          {/* Corpo com a imagem — clip revela abertura */}
          <div
            className={styles.packBody}
            style={{
              clipPath: tearPct > 0
                ? `inset(${Math.min(tearPct * 0.22, 22)}% 0 0 0)`
                : 'none',
            }}
          >
            <img src="/fotos/newpac2.png" alt="pacote" draggable={false} />
          </div>

          {/* Linha de rasgo */}
          {tearPct > 0 && tearPct < 95 && (
            <div className={styles.tearLine} style={{
              top: `${Math.max(0, 28 - tearPct * 0.22)}%`,
              opacity: Math.min(1, tearPct / 20),
            }} />
          )}
        </div>

        {/* Instrução */}
        {fase === 'idle' && !disabled && (
          <p className={styles.hint}>Clique ou arraste pra cima para abrir</p>
        )}
        {disabled && (
          <p className={styles.hintDisabled}>Volte amanhã para mais pacotinhos</p>
        )}
      </div>
    )
  }

  // ── REVEAL: figurinhas saindo do pacote ──
  if (fase === 'reveal' && cards.length > 0) {
    const card = cards[cardIdx]
    return (
      <div className={styles.revealScene}>
        <Sparkles active />

        <p className={styles.revealCounter}>{cardIdx + 1} / {cards.length}</p>

        {/* Card com animação de entrada */}
        <div className={`${styles.revealCard} ${cardAnim ? styles.revealCardIn : styles.revealCardOut}`}>
          <FigurinhaCard emp={card} coletada size="lg" />
        </div>

        {card.brilhante && (
          <div className={styles.specialMsg} style={{ color: '#FFD700', textShadow: '0 0 20px #FFD700' }}>
            FIGURINHA BRILHANTE!
          </div>
        )}
        {card.especial && (
          <div className={styles.specialMsg} style={{ color: '#A78BFA', textShadow: '0 0 16px #7C3AED' }}>
            FIGURINHA ESPECIAL!
          </div>
        )}

        <button className={styles.nextBtn} onClick={nextCard}>
          {cardIdx < cards.length - 1 ? 'Próxima →' : 'Guardar no álbum ✓'}
        </button>
      </div>
    )
  }

  return null
}