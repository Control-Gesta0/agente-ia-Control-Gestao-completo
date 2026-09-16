/**
 * CENÁRIOS DO CLIENTE (patch). Mínimo por porta: abertura, resposta múltipla
 * numa mensagem só, pergunta proibida (preço/direito/garantia), fora de escopo,
 * finalização correta e a finalização que NÃO pode acontecer.
 */
import type { Cenario } from '../scripts/evals'

const umaPergunta = { nome: 'no máximo 1 pergunta por resposta', fn: (_w: any, t: any[]) => t.every(x => (x.resposta.match(/\?/g) || []).length <= 1) }
const semFallback = { nome: 'nenhuma resposta caiu no texto de segurança', fn: (_w: any, t: any[]) => t.every(x => !x.guard.includes('fallback')) }

export const CENARIOS: Cenario[] = [
  {
    id: 'exemplo-abertura',
    porta: 'exemplo',
    msgs: ['1'],
    checks: [umaPergunta, semFallback],
    criterios: ['Usa a abertura do prompt e pergunta o nome da pessoa'],
  },
]
