import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const failures = []
const passes = []

async function text(path) {
  return readFile(join(root, path), 'utf8')
}

async function exists(path) {
  try {
    await stat(join(root, path))
    return true
  } catch {
    return false
  }
}

function pass(label) {
  passes.push(label)
}

function fail(label, detail) {
  failures.push(`${label}: ${detail}`)
}

async function requireFile(path) {
  if (await exists(path)) pass(`arquivo ${path}`)
  else fail(`arquivo ${path}`, 'ausente')
}

async function requireMarkers(path, markers) {
  const body = await text(path)
  for (const marker of markers) {
    if (body.includes(marker)) pass(`${path} contém ${JSON.stringify(marker)}`)
    else fail(path, `não contém ${JSON.stringify(marker)}`)
  }
}

async function walk(path) {
  const absolute = join(root, path)
  const entries = await readdir(absolute, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) files.push(...await walk(child))
    else files.push(child)
  }
  return files
}

const requiredFiles = [
  'SKILL.md',
  'NOVO-CLIENTE.md',
  'ONBOARDING.md',
  'CENTRAL.md',
  'RECUPERACAO.md',
  'comum/DIAGNOSTICO.md',
  'comum/OPERACAO-VISUAL.md',
  'assets/central-v5/INSTALAR.md',
  'assets/central-v5/central/components/Sidebar.tsx',
  'assets/central-v5/central/components/StatsNav.tsx',
  'assets/central-v5/central/components/ExecutiveDashboard.tsx',
  'assets/central-v5/central/components/CorrigirPainel.tsx',
  'assets/central-v5/central/components/Logo.tsx',
  'assets/central-v5/central/app/(painel)/teste/page.tsx',
  'assets/central-v5/central/app/(painel)/ensinar/page.tsx',
  'assets/central-v5/central/app/(painel)/como-usar/page.tsx',
  'assets/central-v5/central/app/globals.css',
  'assets/central-v5/central/lib/como-usar.ts',
  'assets/central-v5/central/lib/types.ts',
  'assets/central-v5/central/public/logo-control-gestao.png',
  'assets/central-v5/central/public/logo-control-gestao-dark.png',
  'assets/central-v5/agente/api/central.ts',
  'assets/central-v5/agente/api/base.ts',
  'assets/central-v5/agente/api/teste.ts',
  'assets/central-v5/agente/lib/central-data.ts',
  'assets/central-v5/agente/lib/curador.ts',
  'assets/central-v5/agente/lib/exame.ts',
  'assets/central-v4/INSTALAR.md',
  'assets/central-v4/central/components/FocusNav.tsx',
  'assets/central-v4/central/components/ExecutiveDashboard.tsx',
  'assets/central-v4/central/components/MoneyRadar.tsx',
  'assets/central-v4/central/components/FlightRecorder.tsx',
  'assets/central-v4/central/components/KnowledgeMap.tsx',
  'assets/central-v4/central/components/ShadowLab.tsx',
  'assets/central-v4/central/components/ScenarioLab.tsx',
  'assets/central-v4/central/components/ValueReceipt.tsx',
  'assets/central-v4/central/components/RecoveryPanel.tsx',
  'assets/central-v4/central/app/cerebro/page.tsx',
  'assets/central-v4/central/app/resultados/page.tsx',
  'assets/onboarding/schema.json',
  'assets/onboarding/compile.mjs',
  'assets/onboarding/test.mjs',
  'assets/onboarding/examples/cliente-ghl.json',
]

for (const file of requiredFiles) await requireFile(file)

await requireMarkers('SKILL.md', [
  'GoHighLevel ou no Kommo?',
  'NOVO-CLIENTE.md',
  'mentor E executor',
  'Evals antes de deploy de prompt',
  'Central **v5 canônica (igual à InovPay)**',
  'assets/central-v5/',
  'UI-ONLY NÃO É HUMAN-ONLY',
])

await requireMarkers('comum/OPERACAO-VISUAL.md', [
  'Manual para a API não significa manual para o mestre',
  'Navegador autenticado',
  'Nunca confiar em “salvo”',
  'E2E real',
])

await requireMarkers('NOVO-CLIENTE.md', [
  'Professor + Executor',
  'GoHighLevel, Kommo ou ainda não escolheu CRM?',
  'A skill tem obrigação de barrar',
  'Máquina de estados do projeto',
  'Instalar a Central **igual à da InovPay**',
  'portão de sobras',
  '10/10 ou não publica',
  'Nunca use “no ar” como sinônimo de “deploy respondeu 200”',
])

await requireMarkers('ONBOARDING.md', [
  'ONBOARDING COMPILER',
  'readyForBuild: true',
  'segredo nunca entra',
  'crm-map.draft.ts',
])

await requireMarkers('CENTRAL.md', [
  'O PADRÃO VIGENTE É A CENTRAL v5',
  'Toda Central nova é igual à da InovPay',
  'PORTÃO DE SOBRAS',
  'Só uma análise renderiza por vez',
  'ninguém edita texto à mão',
])

await requireMarkers('assets/central-v5/INSTALAR.md', [
  'O que NÃO muda de um cliente pro outro',
  'O que troca por cliente',
  'Portão de sobras',
  'Provas antes de entregar',
  'Migrar uma Central v4.1 que já está no ar',
  'byte a byte o arquivo original',
])

await requireMarkers('assets/central-v5/central/components/Sidebar.tsx', [
  "label: 'Estatísticas'",
  "label: 'Teste'",
  "label: 'Ensinar'",
  "label: 'Como usar'",
  "SISTEMA_VERSAO = 'CENTRAL V5 · 4 ABAS'",
])

await requireMarkers('assets/central-v5/central/components/StatsNav.tsx', [
  "label: 'Visão geral'",
  "label: 'Operação'",
  "label: 'Resultados'",
  "label: 'Sistema'",
])

await requireMarkers('assets/central-v5/central/app/(painel)/ensinar/page.tsx', [
  "type View = 'conversa' | 'reais' | 'sabe'",
])

await requireMarkers('assets/central-v5/central/components/Logo.tsx', [
  'Control Gestão',
])

await requireMarkers('RECUPERACAO.md', [
  'Recuperação de conversa',
  'Recuperação de resultado',
  'Influência assistida',
  'Eficácia por toque',
  'objetivo comercial não configurado',
])

await requireMarkers('assets/central-v4/central/components/RecoveryPanel.tsx', [
  "type View = 'agora' | 'eficacia' | 'resultados' | 'definicao'",
  'Voltaram a conversar',
  'Concretizaram',
  'ainda sem base',
])

await requireMarkers('assets/central-v4/INSTALAR.md', [
  'A v4.1 é sempre aplicada por último',
  'inicio → ler | ensinar | mapa | laboratorio | editar',
  'não está pronta',
])

await requireMarkers('assets/escola/INSTALAR.md', [
  'LEGADO/BASELINE',
  'Não reconverta essa',
  'página para três modos',
])

await requireMarkers('assets/central-v4/central/app/cerebro/page.tsx', [
  "type Modo = 'inicio' | 'ler' | 'ensinar' | 'mapa' | 'laboratorio' | 'editar'",
  'Todas as opções',
])

await requireMarkers('assets/central-v4/central/app/resultados/page.tsx', [
  "type View = 'resumo' | 'radar' | 'simular' | 'recibo'",
  '<FocusNav',
])

await requireMarkers('assets/central-v4/central/components/MoneyRadar.tsx', [
  'signals.slice(0, 2)',
])

const codeFiles = (await walk('assets/central-v4/central'))
  .filter(path => /\.(ts|tsx|css)$/.test(path))
const forbidden = [
  [/\bcontrolgestao\b/i, 'controlgestao'],
  [/control[\s-]?gest[aã]o/i, 'Control Gestão'],
  [/metrik/i, 'Metrik (marca antiga)'],
  [/\bbia\b/i, 'Bia'],
]

for (const path of codeFiles) {
  const body = await text(path)
  for (const [pattern, label] of forbidden) {
    if (pattern.test(body)) fail(relative(root, join(root, path)), `identidade proibida: ${label}`)
  }
}
if (!failures.some(item => item.includes('identidade proibida'))) {
  pass('assets v4.1 (legado) sem identidade Control Gestão/controlgestao/Metrik/Bia')
}

console.log(`\nAUDITORIA agente-ia-control-gestao-completo`)
console.log(`✅ ${passes.length} verificações passaram`)

if (failures.length) {
  console.error(`❌ ${failures.length} falharam:\n`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('✅ Skill íntegra: protocolo Professor + Executor e Central v5 canônica (padrão InovPay).')
