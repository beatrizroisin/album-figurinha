import React from 'react'
import FigurinhaCard from '../components/FigurinhaCard.jsx'
import { TODOS } from '../data/album.js'
import styles from './RepetidosView.module.scss'

export default function RepetidosView({ cMap, onCard }) {
  const repetidas = TODOS.filter(e => (cMap[e.id] ?? 0) > 1)

  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <h2>Figurinhas Repetidas</h2>
        <p>{repetidas.length} figurinha{repetidas.length !== 1 ? 's' : ''} repetida{repetidas.length !== 1 ? 's' : ''}</p>
      </div>

      {repetidas.length === 0 ? (
        <p className={styles.empty}>Nenhuma figurinha repetida ainda.<br />Abra mais pacotinhos!</p>
      ) : (
        <div className={styles.grid}>
          {repetidas.map(emp => (
            <div key={emp.id} className={styles.item} onClick={() => onCard?.(emp)}>
              <FigurinhaCard emp={emp} coletada qtd={cMap[emp.id] ?? 0} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
