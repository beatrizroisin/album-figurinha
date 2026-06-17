import React, { useState } from 'react';
import Pacotinho from '../components/Pacotinho.jsx';
import FigurinhaCard from '../components/FigurinhaCard.jsx';
import styles from './PacotinhosView.module.scss';
import { MAX_PACKS_DAY } from '../data/album.js';

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

      {restantes <= 0 && (
        <div className={styles.esgotado}>
          Todos os pacotinhos de hoje foram abertos!<br />
          <span>Volte amanhã para mais {MAX_PACKS_DAY} pacotinhos.</span>
        </div>
      )}

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
