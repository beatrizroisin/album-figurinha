import React, { useState, useRef, useCallback, useEffect } from 'react'
import AlbumPage from '../components/AlbumPage.jsx'
import { TODOS, SETORES, PER_PAGE } from '../data/album.js'
import styles from './AlbumView.module.scss'

// ── Capa ──────────────────────────────────────────────────────
function Capa({ side }) {
  return <div className={`${styles.capa} ${side === 'full' ? styles.full : ''}`} />
}

function ContraCapa({ side }) {
  return (
    <div className={`${styles.contraCapa} ${side === 'full' ? styles.full : ''}`}>
      <span></span>
      <p>Guarde com carinho.<br />Cada figurinha é uma<br />história do time.</p>
      <small>ALMAH COMUNICAÇÃO</small>
    </div>
  )
}

function PageContent({ content, side, pageNum, cMap, onCard }) {
  if (!content) return <div className={`${styles.emptyPage} ${styles[side]}`} />
  if (content === 'capa')   return <Capa side={side} />
  if (content === 'contra') return <ContraCapa side={side} />
  return (
    <AlbumPage
      emps={content.emps} cMap={cMap}
      setor={content.setor} pageNum={pageNum}
      side={side} onCard={onCard} label={content.label}
    />
  )
}

// ══════════════════════════════════════════════════════════
//  COMO FUNCIONA O FLIP PANINI:
//
//  O livro tem L | SPINE | R sempre visíveis.
//  Ao virar DIREITA:
//    1. A página R começa em cima de R (rotateY=0)
//    2. Ela gira em torno do CENTRO DA LOMBADA (borda esquerda de R)
//       → transform-origin: 0% 50%   (left center de R)
//    3. Chega em rotateY = -180deg e fica espelhada sobre L
//       mostrando o VERSO = próxima página L
//
//  Ao virar ESQUERDA: inverso
//    1. Página L começa em cima de L (rotateY=0)
//    2. Gira em torno da BORDA DIREITA de L (transform-origin: 100% 50%)
//    3. Chega em rotateY = 180deg sobre R
//       mostrando o VERSO = página R anterior
// ══════════════════════════════════════════════════════════

export default function AlbumView({ cMap, onCard, restantes = 0, setView }) {
  const [spreadIdx,  setSpreadIdx]  = useState(0)
  const [anim,       setAnim]       = useState(null)
  // anim: { dir, progress 0→1, fromIdx }
  const rafRef   = useRef(null)
  const startRef = useRef(null)
  const DURATION = 600

  // ── Detecta mobile (≤ tablet): no mobile vira 1 página por vez ──
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  // Os índices têm significados diferentes em cada modo (página vs spread) —
  // ao trocar de modo, volta pro início pra não ficar com índice inválido.
  useEffect(() => { setSpreadIdx(0); setAnim(null) }, [isMobile])

  // drag
  const dragStartX = useRef(null)

  // Monta páginas agrupando setores com o mesmo número de page
  const MOBILE_PER_PAGE = 4
  const sectorPages = []
  const mobileSectorPages = []
  const pageGroups = {}
  SETORES.filter(s => s.id !== 'especial').forEach(s => {
    if (!pageGroups[s.page]) pageGroups[s.page] = []
    pageGroups[s.page].push(s)
  })
  Object.keys(pageGroups).sort((a, b) => a - b).forEach(pg => {
    const sectors = pageGroups[pg]
    const allEmps = sectors.flatMap(s => TODOS.filter(e => e.setor === s.id && !e.especial))
    const label = sectors.length > 1 ? sectors.map(s => s.nome).join(' / ') : null
    for (let i = 0; i < allEmps.length; i += PER_PAGE)
      sectorPages.push({ setor: sectors[0].id, emps: allEmps.slice(i, i + PER_PAGE), label })
    for (let i = 0; i < allEmps.length; i += MOBILE_PER_PAGE)
      mobileSectorPages.push({ setor: sectors[0].id, emps: allEmps.slice(i, i + MOBILE_PER_PAGE), label })
  })
  const especiais = TODOS.filter(e => e.especial)
  if (especiais.length > 0) {
    for (let i = 0; i < especiais.length; i += PER_PAGE)
      sectorPages.push({ setor: 'especial', emps: especiais.slice(i, i + PER_PAGE) })
    for (let i = 0; i < especiais.length; i += MOBILE_PER_PAGE)
      mobileSectorPages.push({ setor: 'especial', emps: especiais.slice(i, i + MOBILE_PER_PAGE) })
  }

  // ── Modo mobile: lista plana, 1 página por vez (máx 4 figurinhas/página) ──
  const mobilePages  = ['capa', ...mobileSectorPages, 'contra']
  const totalMobile  = mobilePages.length

  // ── Modo desktop: spreads de 2 páginas ──
  // A 1ª página de conteúdo vai na capa (direita) e a última vai na
  // contracapa (esquerda) — só as páginas "do meio" se repetem em pares.
  const n = sectorPages.length
  const middlePages = n >= 2 ? sectorPages.slice(1, n - 1) : []
  const totalSpreads = 1 + Math.ceil(middlePages.length / 2) + 1

  function getSpread(idx) {
    if (idx < 0 || idx >= totalSpreads) return { left: null, right: null }
    if (idx === 0) return { left: 'capa', right: sectorPages[0] ?? null }
    if (idx === totalSpreads - 1) return {
      left:  n >= 2 ? sectorPages[n - 1] : null,
      right: 'contra',
    }
    const li = (idx - 1) * 2
    return { left: middlePages[li] ?? null, right: middlePages[li + 1] ?? null }
  }

  const total = isMobile ? totalMobile : totalSpreads

  // Easing suave
  function easeInOut(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2
  }

  const startFlip = useCallback((dir) => {
    if (anim) return
    if (dir === 'right' && spreadIdx >= total - 1) return
    if (dir === 'left'  && spreadIdx <= 0)          return

    const fromIdx = spreadIdx
    setAnim({ dir, progress: 0, fromIdx })
    startRef.current = null

    function frame(ts) {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / DURATION, 1)
      const p = easeInOut(t)

      setAnim({ dir, progress: p, fromIdx })

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setAnim(null)
        setSpreadIdx(fromIdx + (dir === 'right' ? 1 : -1))
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [anim, spreadIdx, total])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // Drag/swipe
  function onDown(e) {
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX
  }
  function onUp(e) {
    if (dragStartX.current == null) return
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? dragStartX.current
    const delta = endX - dragStartX.current
    if (delta < -55)  startFlip('right')
    if (delta >  55)  startFlip('left')
    dragStartX.current = null
  }

  // ── Estado de animação ──
  const isFlipping = !!anim
  const progress   = anim?.progress ?? 0
  const dir        = anim?.dir
  const fromIdx    = anim?.fromIdx ?? spreadIdx

  const cur  = getSpread(isFlipping ? fromIdx : spreadIdx)
  const next = getSpread(fromIdx + (dir === 'right' ? 1 : -1))

  // O ângulo da folha voadora
  // Direita: 0 → -180  (dobra para a esquerda sobre a página L)
  // Esquerda: 0 → 180  (dobra para a direita sobre a página R)
  const angle = dir === 'right'
    ? progress * -180
    : dir === 'left'
    ? progress *  180
    : 0

  // Sombra dinâmica (máxima no meio do flip)
  const shadowIntensity = Math.sin(progress * Math.PI)

  // O que aparece estático enquanto a folha vira
  // Quando vira direita:
  //   - L fica estático (mostra L do spread atual)
  //   - R fica estático com o conteúdo do PRÓXIMO spread R (que vai ser revelado)
  // Quando vira esquerda: inverso
  const staticLeft  = dir === 'right' ? cur.left  : next.left
  const staticRight = dir === 'right' ? next.right : cur.right

  // Conteúdo da folha voadora
  // Frente (face visível no início): a página que está saindo
  // Verso (face visível ao final, rotacionada 180): a nova página chegando
  const flyFront  = dir === 'right' ? cur.right  : cur.left
  const flyBack   = dir === 'right' ? next.left  : next.right

  // page numbers
  const leftNum  = (spreadIdx - 1) * 2 + 1
  const rightNum = (spreadIdx - 1) * 2 + 2

  const totalFuncs     = TODOS.filter(e => !e.especial).length
  const totalColetados = TODOS.filter(e => !e.especial && (cMap[e.id] ?? 0) > 0).length

  // A folha vira a partir da borda central (lombada)
  // Direita: folha ocupa a metade DIREITA, gira da borda esquerda (= lombada)
  // Esquerda: folha ocupa a metade ESQUERDA, gira da borda direita (= lombada)
  const flyOriginX = dir === 'right' ? '0%' : '100%'
  const flyLeft    = dir === 'right' ? '50%' : '0%'
  const flyWidth   = '50%' // cada metade tem 50% do livro (descontando lombada)

  // ── Modo mobile: 1 página por vez, sem lombada ──
  // Direita (próxima): a página gira a partir da borda DIREITA (fica "presa" nela).
  // Esquerda (anterior): gira a partir da borda ESQUERDA.
  const curPage  = mobilePages[isFlipping ? fromIdx : spreadIdx] ?? null
  const nextPage = mobilePages[fromIdx + (dir === 'right' ? 1 : -1)] ?? null
  const mFlyOriginX = dir === 'right' ? '100%' : '0%'

  const packNotif = restantes > 0 && (
    <button className={styles.packNotif} onClick={() => setView?.('pacotes')}>
      <img src="/fotos/newpac2.png" alt="" className={styles.packNotifImg} />
      <span>
        {restantes} pacotinho{restantes > 1 ? 's' : ''} disponível{restantes > 1 ? 'is' : ''}!
      </span>
    </button>
  )

  if (isMobile) {
    return (
      <div className={styles.wrapper}>
        {packNotif}
        <div className={styles.bookScene}>
          <div className={styles.floorShadow} />

          <div
            className={styles.mBook}
            onMouseDown={onDown} onMouseUp={onUp}
            onTouchStart={onDown} onTouchEnd={onUp}
          >
            {!isFlipping && (
              <PageContent content={curPage} side="full" pageNum={spreadIdx} cMap={cMap} onCard={onCard} />
            )}

            {isFlipping && (
              <div
                className={styles.mFlyWrap}
                style={{
                  transformOrigin: `${mFlyOriginX} 50%`,
                  transform:       `perspective(1800px) rotateY(${angle}deg)`,
                }}
              >
                <div className={styles.mFlyFront}>
                  <PageContent content={curPage} side="full" pageNum={fromIdx} cMap={cMap} onCard={onCard} />
                  <div className={styles.flyGradientFront} style={{
                    opacity: shadowIntensity * 0.45,
                    background: dir === 'right'
                      ? 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 15%, transparent 40%, rgba(255,255,255,0.06) 80%, rgba(255,255,255,0.15) 100%)'
                      : 'linear-gradient(to left,  rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 15%, transparent 40%, rgba(255,255,255,0.06) 80%, rgba(255,255,255,0.15) 100%)',
                  }} />
                </div>
                <div className={styles.mFlyBack}>
                  <PageContent
                    content={nextPage} side="full"
                    pageNum={fromIdx + (dir === 'right' ? 1 : -1)}
                    cMap={cMap} onCard={onCard}
                  />
                  <div className={styles.flyGradientBack} style={{
                    opacity: shadowIntensity * 0.4,
                    background: dir === 'right'
                      ? 'linear-gradient(to left,  rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 15%, transparent 50%)'
                      : 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 15%, transparent 50%)',
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLES */}
        <div className={styles.controls}>
          <button
            className={`${styles.arrow} ${spreadIdx === 0 || isFlipping ? styles.arrowOff : ''}`}
            onClick={() => startFlip('left')}
          >‹</button>
          <div className={styles.dots}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i}
                className={`${styles.dot} ${i === spreadIdx ? styles.dotActive : ''}`}
                onClick={() => { if (!isFlipping && i !== spreadIdx) startFlip(i > spreadIdx ? 'right' : 'left') }}
              />
            ))}
          </div>
          <button
            className={`${styles.arrow} ${spreadIdx >= total - 1 || isFlipping ? styles.arrowOff : ''}`}
            onClick={() => startFlip('right')}
          >›</button>
        </div>

        {/* PROGRESSO */}
        {/* <div className={styles.progress}>
          <span className={styles.progressLabel}>Progresso</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(totalColetados / totalFuncs) * 100}%` }} />
          </div>
          <span className={styles.progressCount}>{totalColetados}/{totalFuncs}</span>
        </div> */}
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {packNotif}

      {/* LIVRO COM SETAS NAS LATERAIS */}
      <div className={styles.bookRow}>
        <button
          className={`${styles.arrowSide} ${spreadIdx === 0 || isFlipping ? styles.arrowOff : ''}`}
          onClick={() => startFlip('left')}
        >‹</button>

      <div className={styles.bookScene}>
        <div className={styles.floorShadow} />

        <div
          className={styles.book}
          onMouseDown={onDown} onMouseUp={onUp}
          onTouchStart={onDown} onTouchEnd={onUp}
        >
          {/* ── PÁGINA ESQUERDA ── */}
          <div className={styles.pageLeft}>
            <PageContent
              content={isFlipping ? staticLeft : cur.left}
              side="left" pageNum={leftNum} cMap={cMap} onCard={onCard}
            />
            {/* Sombra que a folha projeta sobre L ao virar direita */}
            {isFlipping && dir === 'right' && shadowIntensity > 0 && (
              <div className={styles.pageShadowLeft} style={{
                opacity: shadowIntensity * 0.5,
              }} />
            )}
          </div>

          {/* ── LOMBADA ── */}
          <div className={styles.spine}>
            <div className={styles.spineLines} />
          </div>

          {/* ── PÁGINA DIREITA ── */}
          <div className={styles.pageRight}>
            <PageContent
              content={isFlipping ? staticRight : cur.right}
              side="right" pageNum={rightNum} cMap={cMap} onCard={onCard}
            />
            {/* Sombra que a folha projeta sobre R ao virar esquerda */}
            {isFlipping && dir === 'left' && shadowIntensity > 0 && (
              <div className={styles.pageShadowRight} style={{
                opacity: shadowIntensity * 0.5,
              }} />
            )}
          </div>

          {/* ── FOLHA VOADORA ── */}
          {isFlipping && (
            <div
              className={styles.flyWrap}
              style={{
                left:            flyLeft,
                width:           flyWidth,
                transformOrigin: `${flyOriginX} 50%`,
                transform:       `perspective(2400px) rotateY(${angle}deg)`,
              }}
            >
              {/* FRENTE */}
              <div className={styles.flyFront}>
                <PageContent
                  content={flyFront}
                  side={dir === 'right' ? 'right' : 'left'}
                  pageNum={dir === 'right' ? rightNum : leftNum}
                  cMap={cMap} onCard={onCard}
                />
                {/* Gradiente de curvatura do papel na frente */}
                <div className={styles.flyGradientFront} style={{
                  opacity: shadowIntensity * 0.45,
                  background: dir === 'right'
                    ? 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 15%, transparent 40%, rgba(255,255,255,0.06) 80%, rgba(255,255,255,0.15) 100%)'
                    : 'linear-gradient(to left,  rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 15%, transparent 40%, rgba(255,255,255,0.06) 80%, rgba(255,255,255,0.15) 100%)',
                }} />
              </div>

              {/* VERSO (aparece quando passa de 90°) */}
              <div className={styles.flyBack}>
                <PageContent
                  content={flyBack}
                  side={dir === 'right' ? 'left' : 'right'}
                  pageNum={dir === 'right' ? leftNum + 2 : rightNum - 2}
                  cMap={cMap} onCard={onCard}
                />
                {/* Gradiente de curvatura no verso */}
                <div className={styles.flyGradientBack} style={{
                  opacity: shadowIntensity * 0.4,
                  background: dir === 'right'
                    ? 'linear-gradient(to left,  rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 15%, transparent 50%)'
                    : 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 15%, transparent 50%)',
                }} />
              </div>
            </div>
          )}

          {/* Sombras internas da lombada */}
          <div className={styles.innerShadowL} />
          <div className={styles.innerShadowR} />
        </div>
      </div>

        <button
          className={`${styles.arrowSide} ${spreadIdx >= total - 1 || isFlipping ? styles.arrowOff : ''}`}
          onClick={() => startFlip('right')}
        >›</button>
      </div>

      {/* DOTS */}
      <div className={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i}
            className={`${styles.dot} ${i === spreadIdx ? styles.dotActive : ''}`}
            onClick={() => { if (!isFlipping && i !== spreadIdx) startFlip(i > spreadIdx ? 'right' : 'left') }}
          />
        ))}
      </div>

      {/* PROGRESSO */}
      {/* <div className={styles.progress}>
        <span className={styles.progressLabel}>Progresso</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(totalColetados / totalFuncs) * 100}%` }} />
        </div>
        <span className={styles.progressCount}>{totalColetados}/{totalFuncs}</span>
      </div> */}
    </div>
  )
}