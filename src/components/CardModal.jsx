import React from 'react';
import FigurinhaCard from './FigurinhaCard.jsx';
import styles from './CardModal.module.scss';

async function downloadFigurinha(emp) {
  try {
    const resp = await fetch(emp.foto)
    const blob = await resp.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${emp.nome.replace(/\s+/g, '_')}.png`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.open(emp.foto, '_blank')
  }
}

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
        <div className={styles.actions}>
          <button className={styles.downloadBtn} onClick={() => downloadFigurinha(emp)}>
            ↓ Baixar figurinha
          </button>
          <button className={styles.closeBtn} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
