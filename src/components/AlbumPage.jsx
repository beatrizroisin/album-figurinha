import React from 'react';
import FigurinhaCard from './FigurinhaCard.jsx';
import { getSetor } from '../data/album.js';
import { PER_PAGE } from '../data/album.js';
import styles from './AlbumPage.module.scss';

export default function AlbumPage({ emps, cMap, setor, pageNum, side, onCard, label }) {
  const s    = getSetor(setor);
  const grid = emps.slice(0, PER_PAGE);
  const empties = Math.max(0, PER_PAGE - grid.length);

  return (
    <div
      className={`${styles.page} ${side === 'full' ? styles.full : side === 'left' ? styles.left : styles.right}`}
      style={{ '--setor-cor': s.cor }}
    >
      {/* Cabeçalho da seção */}
      <div className={styles.header}>

        <span className={styles.headerNome}>{label ?? s.nome}</span>
        <span className={styles.pageNum}>pág. {pageNum}</span>
      </div>

      {/* Grid 3×3 */}
      <div className={styles.grid}>
        {grid.map((emp) => {
          const cnt = cMap[emp.id] ?? 0;
          return (
            <div key={emp.id} className={styles.cell}>
              <FigurinhaCard
                emp={emp}
                coletada={cnt > 0}
                qtd={cnt}
                size="sm"
                onClick={() => onCard?.(emp)}
              />
            </div>
          );
        })}
        {Array.from({ length: empties }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.emptySlot} />
        ))}
      </div>

      <span className={styles.watermark}>ALMAH Comunicação</span>
    </div>
  );
}
