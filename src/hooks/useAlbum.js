import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { MAX_PACKS_DAY, TODOS } from '../data/album.js'

const PACK_INTERVAL_MS = 5 * 60 * 60 * 1000  // 5 horas em ms

// ─── Hook principal da coleção ────────────────────────────────
export function useAlbum() {
  const { user } = useAuth()
  const [cMap,         setCMap]         = useState({})
  const [restantes,    setRestantes]    = useState(MAX_PACKS_DAY)
  const [proximoReset, setProximoReset] = useState(null) // Date quando a próxima janela abre
  const [loading,      setLoading]      = useState(true)

  const cMapRef = useRef({})
  useEffect(() => { cMapRef.current = cMap }, [cMap])

  // ── Carrega coleção do Supabase ──
  useEffect(() => {
    if (!user) { setCMap({}); setRestantes(MAX_PACKS_DAY); setProximoReset(null); setLoading(false); return }
    setLoading(true)
    Promise.all([loadColecao(), loadPacotes()]).finally(() => setLoading(false))
  }, [user])

  async function loadColecao() {
    const { data, error } = await supabase
      .from('colecao')
      .select('figurinha_id')
      .eq('user_id', user.id)
    if (error) { console.error(error); return }
    const map = {}
    data.forEach(({ figurinha_id }) => { map[figurinha_id] = (map[figurinha_id] ?? 0) + 1 })
    setCMap(map)
  }

  async function loadPacotes() {
    const { data, error } = await supabase
      .from('pacotes_dia')
      .select('abertos_hoje, ultimo_reset')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      setRestantes(MAX_PACKS_DAY)
      setProximoReset(null)
      return
    }
    if (error) { console.error(error); return }

    const ultimoTs   = data.ultimo_reset ? new Date(data.ultimo_reset).getTime() : 0
    const passouJanela = (Date.now() - ultimoTs) >= PACK_INTERVAL_MS
    const abertos    = passouJanela ? 0 : (data.abertos_hoje ?? 0)

    setRestantes(MAX_PACKS_DAY - abertos)
    setProximoReset(!passouJanela && abertos >= MAX_PACKS_DAY
      ? new Date(ultimoTs + PACK_INTERVAL_MS)
      : null
    )
  }

  // ── Salva figurinhas abertas ──
  const addPack = useCallback(async (cards) => {
    if (!user) return

    // 1. Insere as figurinhas na coleção
    const rows = cards.map(c => ({ user_id: user.id, figurinha_id: c.id }))
    const { error: errCol } = await supabase.from('colecao').insert(rows)
    if (errCol) { console.error(errCol); return }

    // 2. Atualiza/cria o controle de pacotes (janela de 5h)
    const agora = new Date()
    const { data: existing } = await supabase
      .from('pacotes_dia')
      .select('abertos_hoje, ultimo_reset')
      .eq('user_id', user.id)
      .single()

    const ultimoTs     = existing?.ultimo_reset ? new Date(existing.ultimo_reset).getTime() : 0
    const passouJanela = (agora.getTime() - ultimoTs) >= PACK_INTERVAL_MS
    const abertosAtuais = passouJanela ? 0 : (existing?.abertos_hoje ?? 0)
    const novoTotal     = abertosAtuais + 1
    const novoReset     = passouJanela ? agora.toISOString() : existing?.ultimo_reset

    await supabase.from('pacotes_dia').upsert({
      user_id:      user.id,
      abertos_hoje: novoTotal,
      ultimo_reset: novoReset,
    }, { onConflict: 'user_id' })

    // 3. Atualiza state local (sem re-fetch)
    setCMap(prev => {
      const nm = { ...prev }
      cards.forEach(c => { nm[c.id] = (nm[c.id] ?? 0) + 1 })
      return nm
    })
    setRestantes(prev => Math.max(0, prev - 1))
    if (novoTotal >= MAX_PACKS_DAY) {
      setProximoReset(new Date(new Date(novoReset).getTime() + PACK_INTERVAL_MS))
    }
  }, [user])

  // ── Aplica troca (recebe uma, perde uma) ──
  // Retorna true se a figurinha recebida era nova (não estava no álbum)
  const applyTrade = useCallback(async (recebidoId, entregueId) => {
    if (!user) return false

    const eraNova = (cMapRef.current[recebidoId] ?? 0) === 0

    await supabase.from('colecao').insert({ user_id: user.id, figurinha_id: recebidoId })

    const { data: rows } = await supabase
      .from('colecao')
      .select('id')
      .eq('user_id', user.id)
      .eq('figurinha_id', entregueId)
      .limit(1)

    if (rows?.length) {
      await supabase.from('colecao').delete().eq('id', rows[0].id)
    }

    setCMap(prev => {
      const nm = { ...prev }
      nm[recebidoId] = (nm[recebidoId] ?? 0) + 1
      if ((nm[entregueId] ?? 0) > 0) nm[entregueId]--
      return nm
    })

    return eraNova
  }, [user])

  return { cMap, restantes, proximoReset, loading, addPack, applyTrade }
}

// ─── Hook de trocas ───────────────────────────────────────────
export function useTrocas(applyTrade, showToast) {
  const { user, profile } = useAuth()
  const [pendentes,  setPendentes]  = useState([]) // trocas que eu criei e estão pendentes
  const [historico,  setHistorico]  = useState([])
  const [loading,    setLoading]    = useState(true)

  const applyTradeRef = useRef(applyTrade)
  useEffect(() => { applyTradeRef.current = applyTrade }, [applyTrade])

  const showToastRef = useRef(showToast)
  useEffect(() => { showToastRef.current = showToast }, [showToast])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadTrocas()

    // Realtime: re-verifica sempre que alguma troca mudar
    const channel = supabase
      .channel('trocas_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trocas' }, () => {
        loadTrocas()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  async function loadTrocas() {
    const { data, error } = await supabase
      .from('trocas')
      .select('*')
      .eq('criador_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) { console.error(error); setLoading(false); return }

    const novasPendentes = data.filter(t => t.status === 'pendente')
    const novoHistorico  = data.filter(t => t.status !== 'pendente')

    // Aplica trocas aceitas que ainda não foram aplicadas à coleção.
    // Usa localStorage para não re-aplicar ao recarregar a página.
    // IMPORTANTE: grava no localStorage ANTES dos awaits para evitar
    // que chamadas concorrentes (mount + realtime) apliquem duas vezes.
    if (applyTradeRef.current) {
      const storageKey  = `trocas_aplicadas_${user.id}`
      const aplicadas   = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'))
      const paraAplicar = novoHistorico.filter(t => t.status === 'aceita' && !aplicadas.has(t.id))

      if (paraAplicar.length > 0) {
        paraAplicar.forEach(t => aplicadas.add(t.id))
        localStorage.setItem(storageKey, JSON.stringify([...aplicadas]))  // síncrono, antes dos awaits

        for (const troca of paraAplicar) {
          try {
            const empRecebida = TODOS.find(e => e.id === troca.desejo_id)
            const eraNova = await applyTradeRef.current(troca.desejo_id, troca.oferta_id)
            if (showToastRef.current && empRecebida) {
              showToastRef.current(
                eraNova
                  ? `Sua troca foi aceita! ${empRecebida.nome} colada no álbum!`
                  : `Sua troca foi aceita! ${empRecebida.nome} adicionada às repetidas`
              )
            }
          } catch {
            // Se falhou, remove do localStorage para poder tentar de novo
            aplicadas.delete(troca.id)
            localStorage.setItem(storageKey, JSON.stringify([...aplicadas]))
          }
        }
      }
    }

    setPendentes(novasPendentes)
    setHistorico(novoHistorico)
    setLoading(false)
  }

  // ── Cria proposta de troca ──
  const criarTroca = useCallback(async (codigo, ofertaId, desejoId) => {
    const { error } = await supabase.from('trocas').insert({
      codigo,
      criador_id:   user.id,
      criador_nome: profile?.nome ?? user.email,
      oferta_id:    ofertaId,
      desejo_id:    desejoId,
    })
    if (error) throw error
    await loadTrocas()
  }, [user, profile])

  // ── Cancela troca própria ──
  const cancelarTroca = useCallback(async (id) => {
    await supabase.from('trocas').update({ status: 'cancelada' }).eq('id', id)
    await loadTrocas()
  }, [])

  // ── Busca troca pelo código (qualquer usuário logado) ──
  const resolverCodigo = useCallback(async (codigo) => {
    const { data, error } = await supabase
      .from('trocas')
      .select('*')
      .eq('codigo', codigo.trim().toUpperCase())
      .eq('status', 'pendente')
      .gt('expires_at', new Date().toISOString())
      .single()
    if (error) return null
    return data
  }, [])

  // ── Aceita troca ──
  const confirmarTroca = useCallback(async (troca) => {
    const { error } = await supabase
      .from('trocas')
      .update({ status: 'aceita', aceito_por_id: user.id })
      .eq('id', troca.id)
    if (error) throw error
    await loadTrocas()
  }, [user])

  return { pendentes, historico, loading, criarTroca, cancelarTroca, resolverCodigo, confirmarTroca }
}
