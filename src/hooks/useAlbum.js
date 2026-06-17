import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { MAX_PACKS_DAY } from '../data/album.js'

// ─── Hook principal da coleção ────────────────────────────────
export function useAlbum() {
  const { user } = useAuth()
  const [cMap,      setCMap]      = useState({})   // { figurinha_id: count }
  const [restantes, setRestantes] = useState(MAX_PACKS_DAY)
  const [loading,   setLoading]   = useState(true)

  // ── Carrega coleção do Supabase ──
  useEffect(() => {
    if (!user) { setCMap({}); setRestantes(MAX_PACKS_DAY); setLoading(false); return }
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
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('pacotes_dia')
      .select('abertos_hoje, ultimo_reset')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Linha ainda não existe → pacotes disponíveis
      setRestantes(MAX_PACKS_DAY)
      return
    }
    if (error) { console.error(error); return }

    const abertos = data.ultimo_reset === today ? data.abertos_hoje : 0
    setRestantes(MAX_PACKS_DAY - abertos)
  }

  // ── Salva figurinhas abertas ──
  const addPack = useCallback(async (cards) => {
    if (!user) return

    // 1. Insere as figurinhas na coleção
    const rows = cards.map(c => ({ user_id: user.id, figurinha_id: c.id }))
    const { error: errCol } = await supabase.from('colecao').insert(rows)
    if (errCol) { console.error(errCol); return }

    // 2. Atualiza/cria o controle de pacotes do dia
    const today = new Date().toISOString().slice(0, 10)
    const { data: existing } = await supabase
      .from('pacotes_dia')
      .select('abertos_hoje, ultimo_reset')
      .eq('user_id', user.id)
      .single()

    const abertosAtuais = existing?.ultimo_reset === today ? (existing.abertos_hoje ?? 0) : 0
    const novoTotal = abertosAtuais + 1

    await supabase.from('pacotes_dia').upsert({
      user_id:      user.id,
      abertos_hoje: novoTotal,
      ultimo_reset: today,
    }, { onConflict: 'user_id' })

    // 3. Atualiza state local (sem re-fetch)
    setCMap(prev => {
      const nm = { ...prev }
      cards.forEach(c => { nm[c.id] = (nm[c.id] ?? 0) + 1 })
      return nm
    })
    setRestantes(prev => Math.max(0, prev - 1))
  }, [user])

  // ── Aplica troca (recebe uma, perde uma) ──
  const applyTrade = useCallback(async (recebidoId, entregueId) => {
    if (!user) return

    // Insere a que ganhou
    await supabase.from('colecao').insert({ user_id: user.id, figurinha_id: recebidoId })

    // Remove UMA instância da que entregou
    const { data: rows } = await supabase
      .from('colecao')
      .select('id')
      .eq('user_id', user.id)
      .eq('figurinha_id', entregueId)
      .limit(1)

    if (rows?.length) {
      await supabase.from('colecao').delete().eq('id', rows[0].id)
    }

    // Atualiza state local
    setCMap(prev => {
      const nm = { ...prev }
      nm[recebidoId] = (nm[recebidoId] ?? 0) + 1
      if ((nm[entregueId] ?? 0) > 0) nm[entregueId]--
      return nm
    })
  }, [user])

  return { cMap, restantes, loading, addPack, applyTrade }
}

// ─── Hook de trocas ───────────────────────────────────────────
export function useTrocas() {
  const { user, profile } = useAuth()
  const [pendentes,  setPendentes]  = useState([]) // trocas que eu criei e estão pendentes
  const [historico,  setHistorico]  = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadTrocas()

    // Realtime: atualiza quando alguém aceita
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
    setPendentes(data.filter(t => t.status === 'pendente'))
    setHistorico(data.filter(t => t.status !== 'pendente'))
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
