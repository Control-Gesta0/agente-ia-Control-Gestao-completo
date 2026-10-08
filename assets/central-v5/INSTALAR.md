# Central v5 — o padrão InovPay (4 abas)

> **Origem:** a Central da InovPay (`Control-Gesta0/inovpay`, pasta `central/`,
> commit `08daba9`, 08/10/2026), em produção em `central-inovpay.vercel.app`.
> Desde 08/10/2026 **toda Central nova é construída igual a ela.** Este pacote é
> a cópia fiel daquele código. A única mudança é o rótulo `SISTEMA_VERSAO`, que
> aqui diz `CENTRAL V5 · 4 ABAS`. Na InovPay ainda aparece `V4.1 · 4 ABAS`,
> porque ela nasceu antes de o padrão ganhar número.
>
> **Provas deste pacote (08/10/2026):** `npm ci` + `tsc --noEmit` limpo,
> `next build` com as 14 rotas, e as 7 telas abertas em escuro e claro, em
> 1440px e 375px, todas com `scrollWidth === clientWidth`. As capturas estão em
> `referencia/`.

## O que é

Um painel Next.js 15 (React 19, Tailwind 3), num projeto Vercel **separado** do
agente, que conversa só com o agente e nunca com o CRM direto. São quatro abas:

| Aba | Rotas | O que faz | Usa tokens? |
|---|---|---|---|
| **Estatísticas** | `/` · `/operacao` · `/resultados` · `/configuracoes` | Subabas Visão geral, Operação, Resultados e Sistema. Só leitura | não |
| **Teste** | `/teste` | Laboratório: conversa com a assistente de verdade numa porta em memória, nada vai pro CRM. Botão **Corrigir** em cada resposta | sim (aparece na tela, teto de 300 mensagens/dia) |
| **Ensinar** | `/ensinar` | A equipe pede mudança em português (com arquivo ou link), a IA muda o rascunho e só publica depois do exame | sim (curador e exame) |
| **Como usar** | `/como-usar` | Manual vivo pra equipe do cliente: passo a passo, fluxo do cliente ligado aos textos da base que estão no ar, "Sua base" e o dia a dia no CRM | não |

Mais o **Pergunte à Central** (botão no menu, `Ctrl K`), com resposta calculada
em código e zero tokens, e o **login por senha** (cookie HMAC, 12 h).

## Estrutura do pacote

```
central-v5/
├── central/              ← o painel inteiro (vira <repo-do-agente>/central/)
│   ├── app/(painel)/(estatisticas)/   page (Visão geral) · operacao · resultados · configuracoes
│   ├── app/(painel)/teste · ensinar · como-usar
│   ├── app/api/exec · live · base · teste      ← repassam pro agente com o segredo (lado servidor)
│   ├── app/login/                               ← senha + cookie assinado
│   ├── components/   Sidebar · StatsNav · ExecutiveDashboard · FlightRecorder · MoneyRadar
│   │                 CentralCommand · CorrigirPainel · MudancasBase · FocusNav · ProductUI
│   │                 Logo · ToggleTema · RefreshButton
│   ├── lib/          agent (fala com o agente) · hooks (cache de 1 min) · types (espelho do contrato)
│   │                 intelligence (briefing e Pergunte) · format · auth · demo · como-usar (CONTEÚDO)
│   ├── middleware.ts ← tudo exige sessão, inclusive /api
│   └── public/       logo Control Gestão (claro e escuro)
├── agente/               ← o lado do agente que a Central consome (referência InovPay)
│   ├── api/central.ts    GET ?recurso=execucoes|live
│   ├── api/base.ts       Ensinar: pedir, corrigir, corrigir_real, desfazer, descartar, publicar, voltar
│   ├── api/teste.ts      laboratório
│   ├── lib/central-data.ts  contrato de dados (fonte; central/lib/types.ts é o espelho)
│   ├── lib/execlog.ts       diário de execuções com custo
│   ├── lib/base-core.ts · base.ts   textos editáveis, rascunho, versões
│   ├── lib/curador.ts · material.ts · documento.ts   a IA que muda a base, e a leitura de arquivo/link
│   ├── lib/exame.ts         o porteiro: publicar = rodar os cenários do eval
│   ├── lib/teste.ts · port.ts       laboratório numa porta em memória
│   ├── lib/conversas-reais.ts       conversas do diário pra corrigir, com PII mascarada
│   ├── lib/central-auth.ts          header x-central-secret
│   └── scripts/demo-central.ts      gera central/lib/demo-data.json (fictício)
└── referencia/           ← capturas do padrão (escuro, claro, celular)
```

## O que NÃO muda de um cliente pro outro

Isso é a estrutura. Mudar qualquer item abaixo é mudar o padrão, e o caminho é
o `CENTRAL.md §9` (versão nova), nunca "nesse cliente vou fazer diferente".

1. As **quatro abas**, nessa ordem, com esses nomes e ícones. Estatísticas
   abre em Visão geral e tem as quatro subabas no `StatsNav`.
2. **Identidade Control Gestão** no menu e no login (logo claro/escuro,
   "Central de Inteligência"). O cliente aparece no cartão do menu
   (`NOME_AGENTE` / `NOME_CLIENTE`) e no título da página.
3. **Tema** escuro e claro por variáveis em `globals.css`, aplicado antes do
   primeiro paint (`TEMA_INICIAL` em `app/layout.tsx`). Nenhum componente
   escreve cor de fundo, borda ou texto na mão.
4. **Tipografia:** Manrope 500–700 (títulos, `font-impact`), Space Grotesk
   (texto), JetBrains Mono (rótulos). Acento ciano `#06b6d4`.
5. **Fail-closed:** sem as fontes, a tela diz "verificando" ou mostra o erro.
   Nunca "saudável" por falta de dado.
6. **Estatísticas com zero tokens.** Tudo calculado em código a partir do
   diário e do CRM. As subabas e o Pergunte dividem a mesma leitura por 1 minuto
   (`lib/hooks.ts`). Atualizar é manual, pelo botão. Nada de polling no CRM.
7. **Ensinar sem edição manual.** Ninguém digita no texto da base. A equipe pede
   (Pedir mudança), corrige uma resposta do Teste ou de uma conversa real, e a
   IA decide o destino: troca exata de trecho, informação nova, pedido para a
   Control Gestão (regra de atendimento) ou recusa (o que o cliente nunca pode
   mudar). Tudo cai no rascunho.
8. **Publicar só com exame.** Publicar roda os cenários do eval com o rascunho.
   Cenário que falha roda mais 2 vezes e precisa passar nas duas. Versões
   anteriores ficam recolhidas com "voltar para esta".
9. **Como usar lê a base no ar.** Cada etapa do fluxo mostra o texto que a
   assistente usa hoje, com link pra mudar em Ensinar. A página é estrutura; o
   conteúdo do cliente mora só em `lib/como-usar.ts`.
10. **Segredo só no servidor.** O navegador fala com `/api/*` da Central, que
    exige sessão. Quem fala com o agente é o servidor da Central, com
    `x-central-secret`.
11. **Uma leitura por vez** (herança da v4.1): uma subaba renderiza por vez,
    sinal secundário começa recolhido, estado sem dado é uma frase e não um
    gráfico de zeros, e o documento não tem rolagem lateral no celular.

## O que troca por cliente

A cópia é fiel à InovPay, então **todo texto de negócio dela vem junto**. Antes
do primeiro deploy, troque cada linha desta tabela.

### Identidade

| Arquivo | O que trocar |
|---|---|
| `central/components/Sidebar.tsx` | `NOME_CLIENTE`, `NOME_AGENTE` e o comentário do gênero ("a assistente" / "o assistente") |
| `central/app/layout.tsx` | `metadata.title` e `metadata.description` |
| `central/app/login/page.tsx` | título (`<agente> · <cliente>`) e a frase de acesso |
| `central/package.json` | `name` (`central-<cliente>`) e `description` |
| `central/README.md` | reescrever pro cliente (rotas, variáveis, limites conhecidos) |
| `central/next.config.mjs` | o redirect `/base → /ensinar` é legado da InovPay; num cliente novo pode sair |

### Conteúdo do negócio

| Arquivo | O que trocar |
|---|---|
| `central/lib/como-usar.ts` | **tudo**: passos, regra de entrada, horário, fluxo por assunto, passagem, travas, quem muda o quê, tags, combinados, FAQ. Os ids em `base: [...]` são os de `ITENS` do `base-core.ts` do cliente |
| `agente/lib/central-data.ts` + `central/lib/types.ts` | `MOTIVOS` (motivos de passagem), `Perfil`, os campos de `Marcos`. Mudou um, mude o outro |
| `central/lib/format.ts` | `MOTIVO_ROTULO`, igual aos `MOTIVOS` do agente |
| `central/lib/intelligence.ts` | o cartão urgente (na InovPay: estorno de venda de hoje), as perguntas que o Pergunte entende e as frases de resposta |
| `central/components/ExecutiveDashboard.tsx` | o `hint` dos quatro números (cliente/não cliente) |
| `central/app/(painel)/(estatisticas)/resultados/page.tsx` | os rótulos da subaba Triagem e as frases dos marcos |
| `central/app/(painel)/(estatisticas)/operacao/page.tsx` | `PERFIL` e as frases das passagens e do funil |
| `central/app/(painel)/(estatisticas)/configuracoes/page.tsx` | a linha do CRM (campos que o mapa confere) e o nome do CRM |
| `central/components/FlightRecorder.tsx` e `central/app/(painel)/teste/page.tsx` | rótulos das ferramentas do agente (`definir_tipo`, `gravar_documento`…) e dos dados coletados |
| `central/app/(painel)/teste/page.tsx` | sugestões de mensagem e as opções de perfil do laboratório (`novo` / `com_documento`) |
| `central/app/(painel)/ensinar/page.tsx` | nomes dos cenários do exame e os exemplos de pedido |
| `central/components/CentralCommand.tsx` e `CorrigirPainel.tsx` | os `placeholder` de exemplo |
| `central/lib/demo-data.json` | gerar de novo com `npx tsx scripts/demo-central.ts` no agente do cliente |

### O lado do agente

Os arquivos de `agente/` são a implementação de referência do contrato. Eles
importam peças do agente da InovPay (`config`, `ghl`, `crm-map`, `crm-check`,
`guards`, `redis`, `llm`, `history`, `horario`, `state`, `evals-runner`,
`evals/cenarios`). No agente do cliente:

- **Copie quase igual:** `central-auth.ts`, `execlog.ts` (confira a tabela de
  preço do modelo), `conversas-reais.ts`, `material.ts`, `documento.ts`,
  `api/teste.ts`, `api/central.ts` (troque a leitura de oportunidades se o CRM
  for Kommo).
- **Adapte:** `central-data.ts` (motivos, perfis, marcos), `base-core.ts`
  (`ITENS` e `GRUPOS` = os textos que a equipe do cliente pode pedir pra mudar),
  `curador.ts` (o que vira pedido para a Control Gestão e o que é recusado
  sempre; na InovPay: taxa, preço, senha), `teste.ts` (opções de perfil),
  `exame.ts` (aponta pros cenários do eval do cliente).
- **Marque os blocos editáveis no prompt** com `<!-- base:id -->…<!-- /base -->`.
  Os marcadores nunca chegam ao modelo, e sem edição o prompt renderizado tem
  que ser byte a byte o de antes (prove num teste).
- O publicado vive no Redis do agente: `base:vigente`, `base:historico` (20
  versões) e `base:rascunho`. O atendimento lê a cada turno, com cache de 10 s.
- `vercel.json` do agente: `api/base.ts` com `maxDuration: 300`, `api/teste.ts`
  com 120, `api/central.ts` com 60, e `includeFiles: "prompts/**"` nos que
  carregam o prompt.

## Passo a passo (cliente novo)

1. Agente do cliente provado (evals verdes) e gravando o diário com
   `turnoLead`, `respostaIA`, `perfil`, `porta` e `custo`.
2. Copie `central/` pra `<repo-do-agente>/central/` e os arquivos de `agente/`
   pros lugares equivalentes do agente.
3. Faça as trocas das três tabelas acima.
4. **Portão de sobras**, rodado na raiz do repositório do agente. Tem que
   voltar vazio, a não ser que o termo seja do próprio cliente novo (no pacote
   original ele acusa 23 arquivos com texto da InovPay, contando o
   `demo-data.json`):
   ```bash
   grep -rniE "inovpay|maquininha|estorno|split de|boleto|portal_|com_documento" central lib api scripts \
     --include=*.ts --include=*.tsx --include=*.json --include=*.mjs | grep -v package-lock
   ```
5. Variáveis do agente: `CENTRAL_SECRET` (`openssl rand -hex 32`) e
   `COST_USD_BRL`.
6. Variáveis da Central (veja `central/.env.example`): `AGENT_URL`,
   `AGENT_SECRET` (= `CENTRAL_SECRET`), `APP_PASSWORD`, `AUTH_SECRET`.
   `CENTRAL_DEMO` **vazio** em produção.
7. Projeto Vercel próprio (`central-<cliente>`) com **Root Directory =
   `central`**. No agente, redirecione `/` e `/painel` pra URL da Central.
8. Provas (abaixo). Só depois disso a Central vai pro cliente.

## Provas antes de entregar

```bash
cd central
npm ci && npm run typecheck && npm run build
CENTRAL_DEMO=1 APP_PASSWORD=teste AUTH_SECRET=$(openssl rand -hex 32) npm run dev   # olhar as 7 telas
```

- [ ] `curl -H "x-central-secret: $SEGREDO" "$AGENT_URL/api/central?recurso=execucoes"` responde 200
- [ ] `/login`, depois `/`, `/operacao`, `/resultados`, `/configuracoes` (agente e CRM verdes), `/teste` (mandar uma mensagem) e `/ensinar`
- [ ] Ensinar: um pedido real vira mudança no rascunho, o exame roda e publica (ou barra mostrando o que falhou)
- [ ] Como usar mostra os textos da versão no ar, e o link de cada um abre em Ensinar
- [ ] Escuro e claro sem texto sumindo; 375px com `scrollWidth === clientWidth` em todas as rotas
- [ ] Fail-closed: com `AGENT_SECRET` errado a Visão geral mostra o erro, nunca "operando bem"
- [ ] Portão de sobras vazio

## Limites conhecidos (herdados da InovPay)

- O diário guarda as últimas 2.000 execuções; 30 dias cobrem só o que ainda
  está nele (Resultados mostra desde quando).
- Custo = só o modelo de linguagem. Transcrição, leitura de imagem e
  infraestrutura não entram.
- Na InovPay a assistente não move card nem faz follow-up; as telas de funil e
  Resultados dizem isso. Num cliente que move card ou faz recuperação, traga
  as peças de `assets/central-v4/` (Recuperação, Agenda) pra dentro de
  Estatísticas › Operação como subaba, sem criar aba nova.
