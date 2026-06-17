import React from 'react';
import FigurinhaCard from './FigurinhaCard.jsx';
import styles from './CardModal.module.scss';

export default function CardModal({ emp, qtd, onClose }) {
  if (!emp) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <FigurinhaCard emp={emp} coletada qtd={qtd} size="lg" />
        <p className={styles.info}>
          {qtd > 1
            ? `Você tem ${qtd} cópias — ${qtd - 1} disponível${qtd - 1 !== 1 ? 'eis' : ''} para troca!`
            : 'Única cópia — guarde bem!'}
        </p>
        <button className={styles.closeBtn} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
