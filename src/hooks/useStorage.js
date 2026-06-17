import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'almah_album_v1';
const TROCAS_KEY  = 'almah_trocas_v1';

const DEFAULT_STATE = {
  cMap:      {},   // { [id]: count }
  packsDia:  0,
  lastPack:  null,
};

// ─── Hook principal do álbum ──────────────────────────────────
export function useAlbum() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
    } catch {
      // ignora erros de parse
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next) => {
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  // Abre pacote: adiciona figurinhas sorteadas
  const addPack = useCallback((cards) => {
    setState((prev) => {
      const nm = { ...prev.cMap };
      cards.forEach((c) => { nm[c.id] = (nm[c.id] ?? 0) + 1; });
      const now = Date.now();
      const fresh = prev.lastPack && (now - prev.lastPack) < 86_400_000;
      const pd = (fresh ? prev.packsDia : 0) + 1;
      const next = { cMap: nm, packsDia: pd, lastPack: now };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Troca: ganha recebidoId, perde entregueId
  const applyTrade = useCallback((recebidoId, entregueId) => {
    setState((prev) => {
      const nm = { ...prev.cMap };
      nm[recebidoId] = (nm[recebidoId] ?? 0) + 1;
      if ((nm[entregueId] ?? 0) > 0) nm[entregueId]--;
      const next = { ...prev, cMap: nm };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Pacotes restantes hoje
  const now        = Date.now();
  const freshToday = state.lastPack && (now - state.lastPack) < 86_400_000;
  const usedToday  = freshToday ? state.packsDia : 0;
  const restantes  = 3 - usedToday;

  return { ...state, loaded, restantes, addPack, applyTrade };
}

// ─── Hook de trocas ───────────────────────────────────────────
export function useTrocas() {
  const [historico,  setHistorico]  = useState([]);
  const [pendentes,  setPendentes]  = useState({});
  const [loaded,     setLoaded]     = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TROCAS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setHistorico(d.historico ?? []);
        setPendentes(d.pendentes ?? {});
      }
    } catch {}
    setLoaded(true);
  }, []);

  const persist = useCallback((hist, pend) => {
    setHistorico(hist);
    setPendentes(pend);
    try { localStorage.setItem(TROCAS_KEY, JSON.stringify({ historico: hist, pendentes: pend })); } catch {}
  }, []);

  const criarTroca = useCallback((codigo, ofertaId, desejoId) => {
    const np = { ...pendentes, [codigo]: { oferta: ofertaId, desejo: desejoId, quando: Date.now() } };
    persist(historico, np);
  }, [historico, pendentes, persist]);

  const cancelarTroca = useCallback((codigo) => {
    const np = { ...pendentes };
    delete np[codigo];
    persist(historico, np);
  }, [historico, pendentes, persist]);

  // Retorna { troca } ou null se código inválido
  const resolverCodigo = useCallback((codigo) => {
    return pendentes[codigo.trim().toUpperCase()] ?? null;
  }, [pendentes]);

  const confirmarTroca = useCallback((codigo, troca) => {
    const novoHist = [{ codigo, ...troca, status: 'aceita', quando: troca.quando }, ...historico];
    const np = { ...pendentes };
    delete np[codigo];
    persist(novoHist, np);
  }, [historico, pendentes, persist]);

  return { historico, pendentes, loaded, criarTroca, cancelarTroca, resolverCodigo, confirmarTroca };
}
