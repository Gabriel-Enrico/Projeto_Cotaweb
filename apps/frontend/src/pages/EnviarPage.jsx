import { useState } from 'react';
import Icons from '../icons';
import * as api from '../api';

const NOME_APP = 'COTAWEB'

export default function EnviarPage({ 
  fornecedoresList, 
  itensList, 
  restauranteId, 
  toast, 
  ultimaCotacaoId, 
  setUltimaCotacaoId 
}) {
  const podeEnviar = fornecedoresList.length > 0 && itensList.length > 0

  async function enviarWhatsApp() {
    if (!podeEnviar) {
      toast('Adicione fornecedores e itens antes de enviar!', 'warning')
      return
    }

    try {
      const cotacao = await api.cotacoes.criar({
        restaurante_id: restauranteId,
        titulo: `Cotação ${new Date().toLocaleDateString('pt-BR')}`,
        itens: itensList.map(i => ({
          item_id: i.id,
          produto: i.produto,
          unidade: i.unidade,
          quantidade: Number(i.quantidade),
        })),
        fornecedor_ids: fornecedoresList.map(f => f.id),
      })

      await api.cotacoes.enviar(cotacao.id)
      setUltimaCotacaoId(cotacao.id)

      const completa = await api.cotacoes.buscar(cotacao.id)
      const linhaItens = itensList.map(i => `• ${i.produto}: ${i.quantidade} ${i.unidade}`).join('\n')

      completa.fornecedores.forEach(cf => {
        const linkResposta = `${window.location.origin}/responder/${cf.token_resposta}`
        const msg =
          `*Cotação de Preços — ${NOME_APP}*\n\n` +
          `Olá, ${cf.fornecedor_nome}!\n\n` +
          `*Itens para cotar:*\n${linhaItens}\n\n` +
          `*Informe seus preços aqui:*\n${linkResposta}\n\n` +
          `Obrigado!`
        window.open(`https://wa.me/${cf.fornecedor_telefone}?text=${encodeURIComponent(msg)}`, '_blank')
      })

      toast(`Cotação enviada para ${completa.fornecedores.length} fornecedor(es)!`, 'success')
    } catch (err) {
      toast('Erro ao criar cotação: ' + err.message, 'error')
    }
  }

  async function exportarExcel() {
    try {
      let cotacaoId = ultimaCotacaoId
      if (!cotacaoId) {
        const cotacao = await api.cotacoes.criar({
          restaurante_id: restauranteId,
          titulo: `Cotação ${new Date().toLocaleDateString('pt-BR')}`,
          itens: itensList.map(i => ({
            item_id: i.id,
            produto: i.produto,
            unidade: i.unidade,
            quantidade: Number(i.quantidade),
          })),
          fornecedor_ids: fornecedoresList.map(f => f.id),
        })
        await api.cotacoes.enviar(cotacao.id)
        setUltimaCotacaoId(cotacao.id)
        cotacaoId = cotacao.id
      }
      window.open(`/api/exportar/cotacao/${cotacaoId}`, '_blank')
    } catch (err) {
      toast('Erro ao exportar: ' + err.message, 'error')
    }
  }

  if (!podeEnviar) {
    return (
      <section>
        <div className="alert">
          <p>Adicione fornecedores e itens antes de enviar a cotação.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="resumo">
        <h3>Resumo da cotação</h3>
        <div className="resumo-row">
          <span>Fornecedores</span>
          <span className="tag">{fornecedoresList.length}</span>
        </div>
        <div className="resumo-row">
          <span>Produtos</span>
          <span className="tag">{itensList.length}</span>
        </div>
      </div>

      <button className="btn btn--whatsapp" onClick={enviarWhatsApp}>
        <span className="btn-icon">{Icons.whatsapp}</span>
        Enviar cotação por WhatsApp
      </button>

      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
        Cria a cotação no sistema e abre o WhatsApp para cada fornecedor com link de resposta.
      </p>

      <button className="btn btn--excel" onClick={exportarExcel} style={{ marginTop: 12 }}>
        <span className="btn-icon">{Icons.excel}</span>
        Exportar comparativo (.xlsx)
      </button>
    </section>
  )
}
