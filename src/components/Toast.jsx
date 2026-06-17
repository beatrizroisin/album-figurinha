import React from 'react';
import styles from './Toast.module.scss';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`${styles.toast} ${styles[toast.tipo]}`}>
      {toast.msg}
    </div>
  );
}
