import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((msg, tipo = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3200);
  }, []);

  return { toast, show };
}
