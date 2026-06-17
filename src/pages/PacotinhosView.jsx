import React, { useState, useEffect } from 'react';
import Pacotinho from '../components/Pacotinho.jsx';
import styles from './PacotinhosView.module.scss';
import { MAX_PACKS_DAY } from '../data/album.js';

function calcTimeLeft() {
  const now = new Date()
  const midnight = new Date()
  midnight.setUTCHours(24, 0, 0, 0)
  const diff = Math.max(0, midnight - now)
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

function Countdown() {
  const [t, setT] = useState(calcTimeLeft)
  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className={styles.countdown}>
      <p className={styles.countdownLabel}>Próximos pacotinhos em</p>
      <div className={styles.countdownTime}>
        <div className={styles.countdownUnit}>
          <span>{String(t.h).padStart(2, '0')}</span>
          <small>horas</small>
        </div>
        <span className={styles.countdownSep}>:</span>
        <div className={styles.countdownUnit}>
          <span>{String(t.m).padStart(2, '0')}</span>
          <small>min</small>
        </div>
        <span className={styles.countdownSep}>:</span>
        <div className={styles.countdownUnit}>
          <span>{String(t.s).padStart(2, '0')}</span>
          <small>seg</small>
        </div>
      </div>
    </div>
  )
}

export default function PacotinhosView({ restantes, cMap, onPackOpened }) {
  const [key, setKey] = useState(0); // força re-mount após abrir

  function handleComplete(cards) {
    onPackOpened(cards);
    // Reseta o componente Pacotinho após fechar
    setTimeout(() => setKey((k) => k + 1), 700);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <h2>Pacotinhos Diários</h2>
        <p>{MAX_PACKS_DAY} pacotinhos por dia · 5 figurinhas cada</p>
      </div>

      {/* Slots visuais */}
      <div className={styles.slots}>
        {Array.from({ length: MAX_PACKS_DAY }).map((_, i) => {
          const usado = i >= restantes;
          return (
            <div key={i} className={`${styles.slot} ${usado ? styles.slotUsado : styles.slotDisp}`}>
              <span className={styles.slotIcon} style={{ opacity: usado ? 0.18 : 1 }} />
              <span className={styles.slotLabel}>{usado ? 'Aberto' : 'Disponível'}</span>
            </div>
          );
        })}
      </div>

      {/* Pacotinho */}
      <Pacotinho key={key} onComplete={handleComplete} disabled={restantes <= 0} cMap={cMap} />

      {restantes <= 0 && <Countdown />}

      {/* Dicas */}
      <div className={styles.dicas}>
        <p>Você pode encontrar:</p>
        <strong>Brilhantes</strong> <br />
        <strong>Especiais</strong> <br />
        <strong>Comuns</strong> <br />
        Figurinhas repetidas? Use a aba <strong>Trocas</strong>!
      </div>
    </div>
  );
}
