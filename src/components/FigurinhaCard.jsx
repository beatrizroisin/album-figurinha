import React from 'react';
import { getSetor } from '../data/album.js';
import styles from './FigurinhaCard.module.scss';

export default function FigurinhaCard({ emp, coletada = false, qtd = 0, onClick, size = 'md' }) {
  const setor = getSetor(emp.setor);
  const isBri = emp.brilhante;
  const isEsp = emp.especial;

  const cls = [
    styles.card,
    styles[`size-${size}`],
    coletada  ? styles.coletada  : styles.vazia,
    isBri     ? styles.brilhante : '',
    isEsp     ? styles.especial  : '',
    onClick   ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      onClick={onClick}
      style={{ '--setor-cor': setor.cor }}
      title={emp.nome}
    >
      {/* Holo overlay para brilhante coletada */}
      {isBri && coletada && <div className={styles.holo} />}

      {/* Foto preenchendo o card inteiro */}
      <div className={styles.photo}>
        {emp.foto && coletada ? (
          <img src={emp.foto} alt={emp.nome} />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon} />
          </div>
        )}
      </div>

      {/* Número da figurinha — pequeno, canto inferior esquerdo */}
      {coletada && (
        <span className={styles.num}>#{emp.id}</span>
      )}

      {/* Ícone brilhante — canto superior direito */}
      {isBri && coletada && <span className={styles.shineBadge} />}
      {isEsp && coletada && <span className={`${styles.shineBadge} ${styles.espBadge}`} />}

      {/* Faixa de cor do setor — só uma listra fina na base */}
      <div className={styles.stripe} />

      {/* Badge de repetida */}
      {qtd > 1 && <span className={styles.repBadge}>×{qtd}</span>}
    </div>
  );
}