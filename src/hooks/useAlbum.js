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

  // ── Lê o status de pacotes direto do banco (sem incrementar) ──
  // Substitui o getPackWindow baseado em localStorage: agora a fonte
  // de verdade é única (banco), então não importa o dispositivo/navegador.
  async function loadPacotes() {
    const { data, error } = await supabase.rpc('get_pack_status', {
      p_user_id:   user.id,
      p_max:       MAX_PACKS_DAY,
      p_janela_ms: PACK_INTERVAL_MS,
    })
    if (error) { console.error(error); return }

    const abertos = data?.abertos ?? 0
    const inicio  = data?.inicio ? new Date(data.inicio) : null

    setRestantes(MAX_PACKS_DAY - abertos)
    setProximoReset(
      inicio && abertos >= MAX_PACKS_DAY
        ? new Date(inicio.getTime() + PACK_INTERVAL_MS)
        : null
    )
  }

  // ── Salva figurinhas abertas ──
  const addPack = useCallback(async (cards) => {
    if (!user) return

    // Incrementa atomicamente no banco — qualquer dispositivo/aba que
    // chamar isso ao mesmo tempo é serializado pelo "for update" no SQL.
    const { data, error: errInc } = await supabase.rpc('increment_pack_window', {
      p_user_id:   user.id,
      p_max:       MAX_PACKS_DAY,
      p_janela_ms: PACK_INTERVAL_MS,
    })
    if (errInc) { console.error(errInc); return }

    // Já bateu o limite da janela — banco recusou o incremento
    if (data?.bloqueado) {
      const inicio = data.inicio ? new Date(data.inicio) : null
      setRestantes(0)
      if (inicio) setProximoReset(new Date(inicio.getTime() + PACK_INTERVAL_MS))
      return
    }

    const abertosNovo = data?.abertos ?? 0
    const inicio      = data?.inicio ? new Date(data.inicio) : null

    // Insere as figurinhas na coleção
    const rows = cards.map(c => ({ user_id: user.id, figurinha_id: c.id }))
    const { error: errCol } = await supabase.from('colecao').insert(rows)
    if (errCol) { console.error(errCol); return }

    // Atualiza state local com os valores reais vindos do banco
    setCMap(prev => {
      const nm = { ...prev }
      cards.forEach(c => { nm[c.id] = (nm[c.id] ?? 0) + 1 })
      return nm
    })
    setRestantes(Math.max(0, MAX_PACKS_DAY - abertosNovo))
    setProximoReset(
      abertosNovo >= MAX_PACKS_DAY && inicio
        ? new Date(inicio.getTime() + PACK_INTERVAL_MS)
        : null
    )
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
// (sem alterações nesta etapa — continua igual ao original)
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
