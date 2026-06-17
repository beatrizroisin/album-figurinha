import React, { useState } from 'react'
import FigurinhaCard from '../components/FigurinhaCard.jsx'
import { TODOS, gerarCodigo } from '../data/album.js'
import { useTrocas } from '../hooks/useAlbum.js'
import styles from './TrocasView.module.scss'

export default function TrocasView({ cMap, onTrade, showToast }) {
  const { pendentes, historico, loading, criarTroca, cancelarTroca, resolverCodigo, confirmarTroca } = useTrocas()

  const [modo,      setModo]      = useState('menu')  // menu | gerar | colar
  const [etapa,     setEtapa]     = useState(1)
  const [oferta,    setOferta]    = useState(null)
  const [desejo,    setDesejo]    = useState(null)
  const [codGerado, setCodGerado] = useState('')
  const [codInput,  setCodInput]  = useState('')
  const [saving,    setSaving]    = useState(false)

  const repetidas = TODOS.filter(e => (cMap[e.id] ?? 0) > 1)
  const naoTenho  = TODOS.filter(e => (cMap[e.id] ?? 0) === 0)

  function resetGerar() { setEtapa(1); setOferta(null); setDesejo(null); setCodGerado('') }

  // ── Gerar código ──
  async function handleGerarCodigo() {
    if (!oferta || !desejo || saving) return
    setSaving(true)
    try {
      const cod = gerarCodigo()
      await criarTroca(cod, oferta.id, desejo.id)
      setCodGerado(cod)
      setEtapa(3)
    } catch (err) {
      showToast('Erro ao criar troca. Tente novamente.', 'err')
    } finally {
      setSaving(false)
    }
  }

  // ── Usar código ──
  async function handleUsarCodigo() {
    const cod = codInput.trim().toUpperCase()
    if (!cod) { showToast('Digite um código!', 'err'); return }
    setSaving(true)
    try {
      const troca = await resolverCodigo(cod)
      if (!troca) { showToast('Código inválido ou expirado', 'err'); return }

      const empOferece = TODOS.find(e => e.id === troca.oferta_id)
      const empDeseja  = TODOS.find(e => e.id === troca.desejo_id)
      if (!empOferece || !empDeseja) { showToast('Figurinhas não encontradas', 'err'); return }

      await confirmarTroca(troca)
      await onTrade(troca.oferta_id, troca.desejo_id)
      showToast(`Troca aceita! Você ganhou: ${empOferece.nome}`)
      setCodInput('')
      setModo('menu')
    } catch {
      showToast('Erro ao confirmar troca.', 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Trocas de Figurinhas</h2>

      {/* ── MENU ── */}
      {modo === 'menu' && (
        <>
          <div className={styles.menuGrid}>
            <button className={styles.menuCard} onClick={() => { setModo('gerar'); resetGerar() }}>
              <span className={styles.menuIcon} />
              <strong>Propor Troca</strong>
              <small>{repetidas.length} repetida{repetidas.length !== 1 ? 's' : ''} disponível{repetidas.length !== 1 ? 'eis' : ''}</small>
            </button>
            <button className={`${styles.menuCard} ${styles.menuCardPurple}`} onClick={() => setModo('colar')}>
              <span className={styles.menuIcon} />
              <strong>Usar Código</strong>
              <small>Recebi um código de troca</small>
            </button>
          </div>

          {/* Pendentes */}
          {pendentes.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Aguardando resposta</h3>
              {pendentes.map(t => {
                const e1 = TODOS.find(e => e.id === t.oferta_id)
                const e2 = TODOS.find(e => e.id === t.desejo_id)
                return (
                  <div key={t.id} className={styles.row}>
                    <span className={styles.rowText}><b>{e1?.nome}</b> ↔ <b>{e2?.nome}</b></span>
                    <div className={styles.rowActions}>
                      <code className={styles.code}>{t.codigo}</code>
                      <button className={styles.cancelBtn} onClick={() => cancelarTroca(t.id)}>Cancelar</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Histórico */}
          {historico.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Histórico</h3>
              {historico.slice(0, 6).map((h, i) => {
                const e1 = TODOS.find(e => e.id === h.oferta_id)
                const e2 = TODOS.find(e => e.id === h.desejo_id)
                return (
                  <div key={i} className={styles.row}>
                    <span className={styles.rowText}>{e1?.nome} ↔ {e2?.nome}</span>
                    <span className={`${styles.aceita} ${h.status === 'cancelada' ? styles.cancelada : ''}`}>
                      {h.status === 'aceita' ? 'Aceita' : 'Cancelada'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── GERAR ── */}
      {modo === 'gerar' && (
        <div className={styles.flow}>
          <div className={styles.flowHeader}>
            <button className={styles.backBtn} onClick={() => setModo('menu')}>← Voltar</button>
            <h3>
              {etapa === 1 ? 'Passo 1: Qual você oferece?' :
               etapa === 2 ? 'Passo 2: Qual você quer?' : 'Código gerado!'}
            </h3>
          </div>

          <div className={styles.steps}>
            {[1, 2, 3].map(s => (
              <div key={s} className={`${styles.step} ${etapa >= s ? styles.stepActive : ''}`} />
            ))}
          </div>

          {etapa === 1 && (
            repetidas.length === 0
              ? <p className={styles.empty}>Você não tem figurinhas repetidas ainda.<br />Abra mais pacotinhos!</p>
              : <div className={styles.grid}>
                  {repetidas.map(emp => (
                    <div key={emp.id}
                      className={`${styles.gridItem} ${oferta?.id === emp.id ? styles.selected : ''}`}
                      onClick={() => { setOferta(emp); setEtapa(2) }}>
                      <FigurinhaCard emp={emp} coletada qtd={cMap[emp.id] ?? 0} size="sm" />
                    </div>
                  ))}
                </div>
          )}

          {etapa === 2 && (
            <>
              <p className={styles.subtext}>Você oferece: <b>{oferta?.nome}</b><br />O que você quer receber?</p>
              {naoTenho.length === 0
                ? <p className={styles.empty}>Parabéns! Você tem todas as figurinhas!</p>
                : <div className={`${styles.grid} ${styles.gridScroll}`}>
                    {naoTenho.map(emp => (
                      <div key={emp.id}
                        className={`${styles.gridItem} ${desejo?.id === emp.id ? styles.selected : ''}`}
                        onClick={() => setDesejo(emp)}>
                        <FigurinhaCard emp={emp} coletada size="sm" />
                      </div>
                    ))}
                  </div>
              }
              {desejo && (
                <button className={styles.gerarBtn} onClick={handleGerarCodigo} disabled={saving}>
                  {saving ? 'Gerando…' : 'Gerar Código de Troca →'}
                </button>
              )}
            </>
          )}

          {etapa === 3 && codGerado && (
            <div className={styles.codResult}>
              <p className={styles.codSummary}>
                Você oferece <b>{oferta?.nome}</b><br />em troca de <b>{desejo?.nome}</b>
              </p>
              <p className={styles.codLabel}>Envie este código para o seu colega:</p>
              <div className={styles.codBox}>
                <span className={styles.codValue}>{codGerado}</span>
                <small>Válido por 24h</small>
              </div>
              <button className={styles.copyBtn} onClick={() => {
                navigator.clipboard?.writeText(codGerado)
                showToast('Código copiado!')
              }}>Copiar código</button>
              <button className={styles.backBtn} onClick={() => setModo('menu')}>Voltar ao menu</button>
            </div>
          )}
        </div>
      )}

      {/* ── COLAR CÓDIGO ── */}
      {modo === 'colar' && (
        <div className={styles.flow}>
          <div className={styles.flowHeader}>
            <button className={styles.backBtn} onClick={() => setModo('menu')}>← Voltar</button>
            <h3>Inserir código de troca</h3>
          </div>
          <div className={styles.colarBox}>
            <p>Cole o código que seu colega enviou:</p>
            <input
              className={styles.codeInput}
              value={codInput}
              onChange={e => setCodInput(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="EX: AB3X9K"
              autoFocus
            />
            <button className={styles.gerarBtn} onClick={handleUsarCodigo} disabled={saving}>
              {saving ? 'Verificando…' : 'Confirmar Troca ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
