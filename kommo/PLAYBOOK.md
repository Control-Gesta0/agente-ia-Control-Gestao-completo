# PLAYBOOK KOMMO — do zero ao agente em produção

> Execute na ordem. Cada etapa tem o **porquê** (pra você ensinar, não só clicar).
> Tempo real com diagnóstico pronto: **~meio dia** (7 passos + o exame). O agente Kommo reusa **~80% da arquitetura do GHL** — o que muda está inteiro aqui.
>
> **Qual template este playbook constrói:** o **v2**, que vive dentro da skill em `assets/agente-kommo/` (Desenho A/Salesbot · OpenAI · portas com roteador em código). Tudo o que ele traz está marcado aqui como **v2**. O que só existe no **v1** (skill do curso `agente-ia-crm/assets/kommo/`: Claude, Desenho B com uazapi e voz, followup, playground, rastreio de origem) está marcado **[v1]** — é doutrina medida, mas **não vem na pasta que você copia**; ou se porta, ou se usa o v1.
>
> **Status honesto:** v1 validado em produção (dogfood Control Gestão desde **2026-07-11**, Desenho B E2E em **2026-07-12**, playground em **19/07/2026**). v2: `tsc` limpo e testes das travas verdes; **E2E em número real ainda por provar** no primeiro cliente (ver `assets/agente-kommo/INSTALAR.md`). Não chame o v2 de "validado em produção" antes disso.

## Pré-requisito

`comum/DIAGNOSTICO.md` respondido. Sem ele, pare — você vai construir um agente genérico.

**No Kommo só o Bloco 3 (CANAL) muda de peso:** a pergunta *"o WhatsApp é OFICIAL (dentro do Kommo) ou é uazapi?"* **decide o Desenho A ou o Desenho B** — e portanto decide o template (v2 só faz A), se tem voz, se tem multi-mensagem e se a janela de 24h da Meta vai te morder no followup. Pergunta irmã: *"tem uazapi/instância própria?"* → **ter uazapi própria é exatamente o que libera o Desenho B no Kommo**. Todo o resto do roteiro socrático vale igual.

**O que cada projeto traz (não mora na skill):** tokens e secrets da conta, os IDs vivos do CRM, o prompt e as portas, o roteiro de qualificação, os cenários de eval. Tudo isso sai do onboarding (`ONBOARDING.md`) e do diagnóstico, e entra nos arquivos **patch** do template (§4).

---

## §0 · O QUE ESTE AGENTE ENTREGA (capacidades declaradas)

**Template v2 (`assets/agente-kommo/`):** atende WhatsApp via **webhook nativo `add_message`** · entende **áudio, imagem e PDF** (OpenAI: transcrição + visão, uma vez na entrada) · **roteia por PORTAS** (menu numérico ou sinal inequívoco, em código) e carrega só o prompt da porta travada · **qualifica gravando campos do LEAD** (select por `enum_id`, com evidência literal do lead) · **finaliza** por motivo (qualificado, pediu humano, fora do escopo…) removendo o gate · **move etapa** só se a alçada estiver configurada · **recua** quando um humano falou nas últimas 6h. Envio **indireto** pelo **Salesbot** (Desenho A).

**Só no v1 (portar ou usar o template do curso):** Desenho B (uazapi) com **voz** ElevenLabs e multi-mensagem · **followup** com cadências · **marcar reunião** (task + campo de data) · rastreio de **origem/UTM** · playground "Testar ao vivo" · monitores (alerta, guardião, analista).

---

## §1 · AS 3 DIFERENÇAS ESTRUTURAIS (elas definem TUDO aqui)

Se você entender só isto, já constrói. O resto é consequência.

| # | Diferença | Consequência prática |
|---|---|---|
| **1** | **O Kommo NÃO devolve transcript de chat.** Não existe API pra reler a conversa. | O **histórico é NOSSO**, mora no Redis (`<prefixo>conv:{leadId}`). **Redis é OBRIGATÓRIO** nesta variante (no GHL era auxiliar/opcional). Perdeu o Redis, perdeu a memória da conversa. |
| **2** | **A API v4 NÃO envia mensagem.** | Envio **indireto**: **Salesbot** (Desenho A) ou **uazapi** (Desenho B, v1). O agente **deposita** a resposta e um terceiro entrega. |
| **3** | **Kommo é lead-cêntrico.** Não existe contact+opportunity como no GHL. | **Todas as tools operam no LEAD.** Campos de qualificação, tags, etapa, nota — tudo no lead. |

**Doutrina de arquitetura que isso quebra:** no GHL a lei é *"CRM é a fonte da verdade, agente 100% stateless"*. **No Kommo essa lei não se aplica ao histórico** — o CRM continua sendo a verdade do NEGÓCIO (etapa, campos, tags), mas a verdade da CONVERSA é nossa. É a única exceção do produto inteiro.

### Tabela comparativa completa (GHL × Kommo)

| Peça | GHL | Kommo (esta variante) |
|---|---|---|
| Histórico da conversa | API do CRM (fonte de verdade) | **Redis** `<prefixo>conv:{leadId}` |
| Envio de mensagem | `POST /conversations/messages` | **indireto**: Salesbot (v2) ou uazapi (v1) |
| Entrada | Workflow "Customer Replied" → webhook | **webhook nativo `add_message`** (ou webhook da uazapi, v1) |
| Voz (voice note) | upload + attachment → uazapi ptt | **só no Desenho B** (uazapi `ptt`, v1) |
| Agendamento | Calendars API (slots reais) | **não existe Calendars API** — v1: task (meeting) + campo "Data da reunião"; v2: não agenda |
| Entidade das tools | contact + opportunity | **lead** |
| Opções de select | `picklistOptions` por valor | **`enum_id`** (grava por ID, não por texto) |
| Redis | coordenação/fila (auxiliar) | **obrigatório** (dono do histórico) |

**Stack v2:** TypeScript · Vercel serverless · Upstash Redis · **OpenAI GPT-5.4 Mini** em Chat Completions com reasoning none (`LLM_MODEL`) · transcrição `STT_MODEL` e visão `VISION_MODEL` na OpenAI. **Zero VPS.** (v1: Claude Sonnet com `thinking` desligado · Groq Whisper · ElevenLabs `opus_48000_64`.)

**Namespace Redis:** toda chave passa por `k()` com o prefixo **`REDIS_PREFIX`**, **único por cliente** (ex.: `ak-mtf:`; o padrão `ak:` é só para conta única). É o que permite dividir o **MESMO database Upstash** (free tier = 1 DB) entre clientes e com o agente GHL, sem colisão.

---

## §2 · OS DOIS DESENHOS

### Desenho A — WhatsApp OFICIAL dentro do Kommo (template v2)

```
Kommo webhook add_message (form-urlencoded, chaves "message[add][0][...]")
 → /api/inbound (responde 200 IMEDIATO + waitUntil)
     1. dedup por msgId (seen) · mídia vira texto (OpenAI, uma vez) · anti-eco (sent)
     2. grava no histórico Redis  <prefixo>conv:{leadId}
     3. tag HUMAN_TAG? sem GATE_TAG? humano falou nas últimas 6h? → recua
     4. buffer 10s + rate limit 10/min (token election: só o webhook MAIS NOVO sobrevive)
     5. ROTEADOR em código ─ menu / "não entendi" / porta sem agente → envia texto fixo, sem LLM
                           └ porta travada → nucleo.md + portas/<porta>.md → GPT + tools → travas
     6. DEPOSITA a resposta: campo de resposta no lead + outbox Redis
 → POST /api/v2/salesbot/run  [{bot_id, entity_id, entity_type: "leads"}]
 → Salesbot roda: bloco widget-request → chama /api/salesbot?secret=
     ← NÓS POSTamos no return_url:
       { data: { resposta_ia },
         execute_handlers: [{ handler: "goto", params: { type: "question", step: 1 } }] }
 → o bot, no passo seguinte, envia literalmente a macro {{json.resposta_ia}}
```

### Desenho B — WhatsApp na uazapi (`TRANSPORT=uazapi`) **[v1]**

```
uazapi webhook (in / out / fromMe → histórico COMPLETO, os 2 lados)
 → /api/uazapi
 → findOpenLeadByPhone: GET /api/v4/contacts?query=<fone>&with=leads
 → MESMO pipeline (dedup → STT → histórico → gate → buffer → modelo + tools)
 → envio DIRETO pela uazapi:
     /send/text  { number, text }                          ← multi-mensagem
     /send/media { number, type: "ptt", file: "data:audio/ogg;base64,..." }  ← voice note
   (Kommo fica só como CRM: etapas, campos, tarefas)
```

### ⚡ No v1 o transport é DINÂMICO **POR LEAD** **[v1]**

> Os dois desenhos **coexistem no MESMO deploy** do v1. Mensagem que entra pelo webhook do Kommo é respondida por **Salesbot**; mensagem que entra pela uazapi é respondida por **uazapi** (com voz). O canal de cada lead fica gravado em **`ak:via:{leadId}`**, e o **followup usa o ÚLTIMO canal usado**. O v2 só tem o Salesbot.

| Você tem | Desenho | Ganha | Paga |
|---|---|---|---|
| WhatsApp oficial (Cloud API) plugado no Kommo | **A** (v2) | Zero peça extra, chat oficial no Kommo | Sem voz · 1 mensagem por resposta · **janela 24h da Meta** morde o followup |
| Instância uazapi própria | **B** (v1) | **Voz** (ElevenLabs ptt) · multi-mensagem · **sem janela de 24h** | +1 fornecedor · 1 webhook por instância · busca de lead por telefone (fuzzy) |

---

## §3 · O QUE JÁ EXISTE (NÃO recriar do zero)

| Ativo | Onde |
|---|---|
| **Template do agente (Kommo) v2 — dentro da skill** | `assets/agente-kommo/` — **copiar esta pasta** e seguir `assets/agente-kommo/INSTALAR.md` (ordem de instalação, asset × patch, envs, status honesto) |
| Template v1 (Claude, Desenho A+B, voz, followup, playground, rastreio) | skill do curso `agente-ia-crm/assets/kommo/` (pode não existir na máquina — `PEGADINHAS §16`) |
| **Cliente já tem IA em n8n** | `../MIGRACAO-N8N.md` antes de qualquer passo |
| **Produção de referência (dogfood Control Gestão, v1)** | https://agente-ia-kommo-controlgestao.vercel.app · projeto Vercel `agente-ia-kommo-controlgestao` |
| **Template GHL (irmão)** | `ghl/PLAYBOOK.md` (o código vem do projeto de referência GHL) |
| **Doutrina comum** | `comum/ARQUITETURA.md` · `comum/CONTEXT-ENG.md` · `comum/EVALS.md` · `comum/PEGADINHAS.md` |

### Anatomia do template v2

| Arquivo | O que é |
|---|---|
| `prompts/nucleo.md` · `prompts/portas/<porta>.md` | **Patch.** Prompt comum + um prompt por porta; só o da porta travada entra na chamada (~6–8k tokens com cache) |
| `lib/crm-map.ts` | **Patch.** IDs vivos da conta: portas, campos (com `enum_id`), campo de resposta, finalização, alertas, alçada de etapas (§4) |
| `lib/regras.ts` · `scripts/test-cliente.ts` | **Patch.** Travas de texto do cliente e o teste de cada uma (bloqueia × passa) |
| `evals/cenarios.ts` | **Patch.** Cenários do exame (Passo 8) |
| `lib/router.ts` · `lib/port.ts` | Roteador em código (menu, sinal inequívoco, "não entendi") · porta do CRM (real ou em memória nos evals) |
| `lib/agent.ts` | Núcleo: gate → buffer → roteador → cérebro → travas → envio |
| `lib/llm.ts` · `lib/tools.ts` · `lib/guards.ts` | Adapter OpenAI · as tools (§6) · travas determinísticas da resposta |
| `lib/kommo.ts` | Client API v4 + `salesbot/run` (**merge de tags** — PATCH substitui tudo!) |
| `lib/history.ts` · `lib/state.ts` · `lib/buffer.ts` | Histórico + dedup + anti-eco · estado do lead (porta, respostas, finalização) · debounce, lock e rate limit |
| `lib/media.ts` · `lib/transport.ts` | Áudio/imagem/PDF → texto · depósito + disparo do Salesbot |
| `lib/execlog.ts` · `lib/reset.ts` | Diário de execuções · comando `reset` dos leads de teste |
| `api/inbound.ts` | Webhook `add_message` do Kommo · `GET` = health |
| `api/salesbot.ts` | Callback do widget-request do bot de envio |
| `api/validate.ts` | CRM_MAP vs Kommo vivo — **rodar após QUALQUER mexida no funil** |
| `api/executions.ts` | O diário (`?secret=&limit=&tipo=erro`) |
| `scripts/discover.ts` · `create-webhook.ts` · `simulate-inbound.ts` · `evals.ts` · `test-guards.ts` | Discovery ao vivo · webhook via API · teste E2E sem WhatsApp · exame · travas |

---

## §4 · O QUE MUDA POR CLIENTE (os arquivos patch)

**1. Prompts** — `prompts/nucleo.md` (personalidade, limites, tom) + `prompts/portas/<porta>.md` (roteiro de cada assunto). Todo texto que o lead lê passa pelo §5.1 do `SKILL.md` (tom humano). Nada de dado inventado.

**2. `lib/crm-map.ts`** — os IDs do Kommo **AO VIVO** (`npm run discover`). Placeholder é `0` de propósito: o `/api/validate` acusa cada um.

| Chave | O que carrega |
|---|---|
| `respostaFieldId` | textarea onde a resposta é depositada (na migração do n8n: o **MESMO** campo que o bot antigo usava) |
| `camposProibidos` | field_ids onde a IA **nunca** escreve (CPF, senha, nº de processo…) |
| `campos` | campos do lead: `id`, `name` (o que o modelo vê), `kommoName` (o validate compara), `type`, **`options[]` com `enum_id`**, `sinal` (a evidência do lead precisa conter) e `pergunta` |
| `portas[]` | `id`, `label`, número no `menu`, `ativa`, `promptFile`, `sinais` (texto inequívoco), `roteiro` e `obrigatorios`, `mensagemSemAgente`, `abertura` |
| `menu` | texto do menu, número de "outros", `portaPadraoOutros`, `classificarTextoLivre`, textos de "pedir resumo" e "não entendi" |
| `finalizar` | `removerGate`, `tags` extras, `tagUrgente`, `nota` no card |
| `alertas[]` | detecções em código que viram aviso no contexto (advogado ativo, menor, urgência) e, se preciso, **finalização garantida** |
| `etapas[]` · `etapasProtegidas` | alçada de etapas (**vazio = a IA nunca move**) · status onde o lead já está adiantado (padrão `142`, `143`) |
| `textoSeguro` · `textoSeguroFinal` · `midia.instrucaoVisao` | textos de fallback das travas · instrução da visão para imagem/PDF |

**3. `lib/regras.ts` + `scripts/test-cliente.ts`** — travas de texto do cliente, cada uma com o caso que bloqueia e o que passa.

**4. `evals/cenarios.ts`** — os cenários do exame (Passo 8).

**5. Env vars** (modelo em `assets/agente-kommo/.env.local.example`):

```
KOMMO_DOMAIN=https://<conta>.kommo.com   KOMMO_TOKEN=eyJ...   KOMMO_ACCOUNT_ID=...
KOMMO_BOT_ID=              # obrigatório (só existe depois do passo 5)
OPENAI_API_KEY=   LLM_MODEL=   VISION_MODEL=   STT_MODEL=
UPSTASH_REDIS_REST_URL=   UPSTASH_REDIS_REST_TOKEN=   # OBRIGATÓRIOS
REDIS_PREFIX=ak-<cliente>:                            # ÚNICO por cliente
WEBHOOK_SECRET=<NOVO por cliente: openssl rand -hex 24>
CLIENT_NAME="Cliente · Agente"   GATE_TAG=   HUMAN_TAG=atendimento-humano   DEBOUNCE_SECONDS=10
TEST_LEAD_IDS=             # leads que podem mandar "reset"
DEPLOY_URL=                # só para os scripts locais
```

> **Token do Kommo começa com `eyJ`.** A "chave secreta" de 64 caracteres da mesma tela não é token e dá 401 (`PEGADINHAS §17`).

### As chaves do Redis (o mapa da memória, v2)

Todas com o prefixo `REDIS_PREFIX`:

| Chave | Papel |
|---|---|
| `conv:{leadId}` | **histórico da conversa** (o coração desta variante) |
| `state:{leadId}` | porta travada, respostas do roteiro, respondente, finalização |
| `seen:{msgId}` · `done:{leadId}` | dedup de webhook / idempotência da resposta |
| `token:{leadId}` · `lock:{leadId}` | eleição do buffer 10s / lock com dono |
| `rl:{leadId}` | rate limit 10/min por lead (custo **e** loop de eco) |
| `sent:{leadId}` | hashes do que enviamos → **anti-eco** |
| `humano:{leadId}` | humano falou pelo Kommo → a IA recua por 6h |
| `outbox:{leadId}` | resposta esperando o Salesbot consumir |
| `execlog` | diário de execuções (últimas 2000) |

> O v1 tem ainda `via`, `fu`, `phone2lead`, `click`/`link` e `uazlast` (canal por lead, followup, índice de telefone, rastreio, debug da uazapi).

---

## §5 · OS 7 PASSOS (~meio dia)

### Passo 1 · Copiar + discovery AO VIVO + crm-map

```bash
cp -r <skill>/assets/agente-kommo clientes/<cliente>/agente-ia-kommo
cd clientes/<cliente>/agente-ia-kommo && npm install
cp .env.local.example .env.local      # preencha com os dados DESTE cliente
npm run discover
```

O `discover` lê a conta **viva**: funis e status, campos com enums, tags, webhooks de terceiros, canal (`waba`?) e o campo alterado por integração (o campo de resposta do bot antigo, se houver). Com isso monte o `lib/crm-map.ts` — **incluindo os `enum_id` de cada opção** de select/multiselect (§7, pegadinha 3) — e escreva os prompts do núcleo e das portas.

> **Por quê:** a conta do cliente muda no mesmo dia (no GHL já vimos 4 campos deletados e 2 stages novos entre a manhã e a noite). ID de snapshot é dado perdido em silêncio.

### Passo 2 · Criar o campo de resposta no lead

Na migração do n8n, **reuse** o campo que o bot antigo já enviava (o `discover` mostra qual é). Conta nova:

```bash
curl -X POST "https://<conta>.kommo.com/api/v4/leads/custom_fields" \
  -H "Authorization: Bearer $KOMMO_TOKEN" -H "Content-Type: application/json" \
  -d '[{"name":"Resposta IA (agente)","type":"textarea"}]'
```

É o campo onde o agente **deposita** a resposta antes de mandar o Salesbot rodar. Anote o `id` → `respostaFieldId` no crm-map.

> ⚠️ **curl no Git Bash do Windows corrompe UTF-8** em body JSON com acento (`invalid_unicode`). Para qualquer chamada com texto em português, **use Python ou Node**.

### Passo 3 · Travas + exame + envs + deploy + provar o mapa

```bash
npm run typecheck && npm test            # verde, incluindo scripts/test-cliente.ts
EVAL_REPS=3 npm run evals                # Passo 8 — ANTES do primeiro deploy
vercel link --project=agente-ia-kommo-<cliente> --yes
printf "valor" | vercel env add NOME production      # repita pra cada env do §4
vercel deploy --prod --yes
```

`vercel.json` já vem certo: `maxDuration: 300` + `includeFiles: "prompts/**"` em `api/inbound.ts`, e `prompts/**` também no `api/validate.ts`.

```bash
curl "https://<deploy>.vercel.app/api/inbound"                  # health → {ok:true, cliente, model, gate}
curl "https://<deploy>.vercel.app/api/validate?secret=XXX"      # TEM que dar {"ok": true}
```

### Passo 4 · Webhook de entrada **VIA API** (não no UI)

```bash
npx tsx scripts/create-webhook.ts           # só LISTA os webhooks atuais da conta
npx tsx scripts/create-webhook.ts --criar   # cria <DEPLOY_URL>/api/inbound?secret=<WEBHOOK_SECRET>
```

Faz `POST /api/v4/webhooks {destination, settings: ["add_message"]}` — o **mesmo evento** que o ROTEADOR do n8n usa. O script lê `KOMMO_DOMAIN`/`KOMMO_TOKEN`/`DEPLOY_URL`/`WEBHOOK_SECRET` do `.env.local`. Rode primeiro sem `--criar` e **confirme com o responsável antes de criar**: é ação externa na conta do cliente. O script não remove nenhum webhook existente.

> No **Desenho B** (v1) o `add_message` é redundante (a uazapi já entrega tudo) — pode remover.

### Passo 5 · O Salesbot de envio no UI — **operação visual (~3 min)**

A API não cria esse grafo, mas o agente pode montá-lo na sessão autenticada.
Siga `../comum/OPERACAO-VISUAL.md`: confirme a conta, trabalhe em rascunho,
reabra o bot, capture o `bot_id` e prove lead → outbox → Salesbot → mensagem.
Sem navegador controlável, guie o humano exatamente pelos mesmos blocos.

Duas formas, as duas funcionam:

| Opção | Como | Quando usar |
|---|---|---|
| **1 — widget-request** (padrão Control Gestão, plug-compatible) | Duplique um bot widget-request existente e troque a URL do request pra `https://<deploy>.vercel.app/api/salesbot?secret=<WEBHOOK_SECRET>`. O **passo seguinte (step 1) continua enviando `{{json.resposta_ia}}`** | Conta que já tinha o bot do n8n — troca cirúrgica de URL |
| **2 — campo do lead** (sem widget) | Bot de **1 bloco "Enviar mensagem"** cujo conteúdo é o campo de resposta — o transport grava lá antes do run | Conta nova, sem legado |

**Depois de criar:** anote o **`bot_id`** → env **`KOMMO_BOT_ID`** → **REDEPLOY**. Sem isso o sender não dispara (env só vale em deploy novo) — a resposta fica no card e no outbox.

> ⚠️ **Desligue o bot antigo pro mesmo público**, ou use **gates de tag disjuntos**: o webhook `add_message` é da **conta inteira** — dois agentes com o mesmo gate respondem duplicado.

### Passo 5b · uazapi (só Desenho B) **[v1]**

1. Conecte o número na instância uazapi e aponte o webhook de mensagens pra `https://<deploy>.vercel.app/api/uazapi?secret=<WEBHOOK_SECRET>`
2. `TRANSPORT=uazapi` + `UAZAPI_BASE_URL` + `UAZAPI_TOKEN` (+ `ELEVENLABS_*` pra voz)
3. O parser é tolerante, mas **valide com um POST real da instância** (o formato varia por versão): mande uma msg de teste e confira `vercel logs` / `ak:uazlast`

### Passo 6 · Testes (E2E sem WhatsApp e com WhatsApp)

```bash
npx tsx scripts/simulate-inbound.ts <LEAD_ID> "quero saber do agente de ia"   # DEPLOY_URL no .env.local
curl "https://<deploy>/api/executions?secret=XXX"                             # o diário: saiu execução?
curl "https://<deploy>/api/executions?secret=XXX&tipo=erro"                   # só os erros
```

> ⚠️ **O lead PRECISA ter a `GATE_TAG`** — sem ela o agente ignora **de propósito**. Lead de teste em `TEST_LEAD_IDS` pode mandar **`reset`**: zera memória, porta e estado e devolve a tag de gate (lead real que digitar "reset" não apaga nada).

**Checklist E2E (não pule):**
☐ texto vago → **menu** · ☐ número do menu → **porta trava** e a abertura sai · ☐ texto com sinal inequívoco → porta direto · ☐ **rajada de 3 msgs → UMA resposta** · ☐ **áudio → transcreve** · ☐ imagem/PDF → descrição entra no histórico · ☐ `salvar_respostas` **preenche campos por enum_id** · ☐ roteiro completo → `finalizar_atendimento` **remove o gate** (e tags/nota do `finalizar`) · ☐ `mover_etapa` só se houver alçada · ☐ humano responde pelo Kommo → IA **recua 6h** · ☐ tudo aparece em `/api/executions` · ☐ a mensagem **chegou no celular** (log de sucesso não é entrega — `comum/PEGADINHAS.md` §1).

### Passo 7 · Rampagem pela GATE_TAG

- **Ligar:** tag do gate (ex `IAV`) no **lead** → o agente atende. `GATE_TAG=` vazio = atende todos (só no fim).
- **Desligar:** tag `HUMAN_TAG` (`atendimento-humano`) no lead, ou tirar a tag do gate. Ao finalizar, a própria IA remove o gate (`finalizar.removerGate`).
- **Ordem:** 1 lead seu → 10 leads → todos. Na migração do n8n, gate **disjunto** durante a rampagem (`MIGRACAO-N8N.md`).

### Passo 8 (não é opcional na prática) · Certificar o cérebro com EVALS

O template Kommo já traz o harness: `scripts/evals.ts` + os cenários do cliente em `evals/cenarios.ts`. Ele roda os prompts **locais** com as tools **reais** numa porta em memória (zero efeito no CRM), confere em código tool chamada, campo gravado, finalização e trava, e passa os critérios para um juiz cego. Qualquer checagem ou critério reprovado → `exit 1`.

```bash
EVAL_REPS=3 npm run evals          # todos aprovados ou não sobe (OPENAI_API_KEY no .env.local)
npx tsx scripts/evals.ts <id>      # roda só os cenários com esse id
```

⚠️ Como o exame roda o prompt **local**, o deploy tem que levar **exatamente** o prompt que passou. Modelos: `LLM_MODEL` (agente) e `EVAL_JUDGE_MODEL` (juiz).

**EVALS SÃO OBRIGATÓRIOS antes de todo deploy de prompt.** Comprovado no GHL: pegaram **2 defeitos + 1 regressão invisíveis ao teste manual** (8,2 → 9,7/10). Detalhe do harness, os 8 cenários que todo cliente precisa e a regra do juiz: `comum/EVALS.md`.

---

## §6 · AS TOOLS DO v2 (e a alçada)

O modelo só vê as tools da **porta travada**. Menu, "não entendi" e porta sem agente são respondidos **pelo código**, sem LLM.

| Tool | O que faz | Guard |
|---|---|---|
| `salvar_respostas` | grava várias respostas do roteiro de uma vez; o retorno diz o que falta | só campos do roteiro da porta · **evidência literal do lead** (e `sinal` do campo) · select/multiselect **por `enum_id`**, multiselect faz **UNION** · resposta já gravada não se regrava · `camposProibidos` nunca |
| `registrar_respondente` | registra quem digita quando não é o interessado (a mãe pelo filho) | — |
| `registrar_outro_assunto` | anota assunto de outra área para a equipe; a IA segue no roteiro atual | evidência literal |
| `finalizar_atendimento` | encerra a IA com `motivo` (`qualificado`, `advogado_ativo`, `menor_de_idade`, `urgencia`, `fora_do_escopo`, `pediu_humano`, `desistiu`) + resumo | `qualificado` só com os `obrigatorios` respondidos · motivos exigem evidência com sinal mínimo · remove o gate, aplica tags/nota do `finalizar` |
| `mover_etapa` | move o lead para uma etapa da alçada | só existe se `etapas` não estiver vazio · **fail-closed**: outro funil ou etapa protegida = recusa |

Depois do modelo, as **travas** (`lib/guards.ts` + `lib/regras.ts`) barram texto corrompido, JSON vazado, travessão, mais de uma pergunta e as regras do cliente; o fallback é o `textoSeguro`.

**Lei da alçada:** a IA qualifica e entrega. Reunião, proposta e negociação são território do humano. No v2, alçada vazia = a IA nunca move etapa.

**Fail-closed:** o lead pode estar em **OUTRO pipeline** ou já adiantado. As tools **recusam** em vez de chutar (`PEGADINHAS §14`).

> **[v1]** O template do curso tem outras 6 tools: `buscar_dados_lead`, `adicionar_tag`, `mover_etapa_funil` (só avança pelo `stageOrder`), `preencher_qualificacao`, `marcar_reuniao` (task `task_type_id: 2` + campo de data, epoch em **segundos**) e `escalar_para_humano` (tag + `clearFollowup`).

---

## §7 · PEGADINHAS KOMMO (verificadas em produção — leia ANTES de construir)

> Detalhe completo, sintoma/causa/cura, em `kommo/PEGADINHAS.md`. O resumo abaixo é o que você precisa ter na cabeça **enquanto** executa os 7 passos.

| # | Pegadinha | Cura |
|---|---|---|
| **1** | **PATCH de tags SUBSTITUI o conjunto inteiro** | sempre **merge local** — `addLeadTags` / `removeLeadTags` do template (remoção via `tags_to_delete`) |
| **2** | **Multiselect também substitui** | `salvar_respostas` faz **UNION com os enum_ids atuais** antes de gravar |
| **3** | **select/multiselect gravam por `enum_id`, NÃO por value** | por isso o crm-map carrega os enums |
| **4** | 🚨 **Loop de eco:** `add_message` pode disparar pra mensagem que o **PRÓPRIO bot** enviou — **loop infinito real, aconteceu no Imigre USA** | 3 camadas no template: **hash do que enviamos (`sent`)**, gravado **antes** do run + tipo da mensagem + **rate limit 10/min/lead** |
| **5** | Webhook chega **form-urlencoded com chaves em colchetes** (`message[add][0][text]`) | o parser cobre formato **PLANO E ANINHADO** |
| **6** | **Payload confirmado em produção (Control Gestão):** `account[id]` · `message[add][0][id\|entity_id\|contact_id\|text\|created_at\|attachment[type]\|attachment[link]]` | attachment types: **`voice` / `picture` / `file`**; o **link do áudio é PÚBLICO** (a transcrição baixa direto, sem auth) |
| **7** | `salesbot/run`: `entity_type` é a **STRING `"leads"`** (endpoint legado v2) | — |
| **7b** | ⚠️ um **502 do `salesbot/run` PODE ter rodado mesmo assim** | o sender **NÃO faz retry em 5xx** — retry cegaria em mensagem duplicada |
| **8** | **Kommo não tem Calendars API** | v1: `marcar_reuniao` cria **TASK (`task_type_id: 2`)** + campo de data + move etapa, **`date_time` em epoch SEGUNDOS**. v2: não agenda — finaliza e o humano marca |
| **9** | **Janela 24h da Meta** vale no **WhatsApp OFICIAL** do Kommo: **cadência 1 (12h) entra; cadência 2+ NÃO entrega texto livre** (sem erro visível) | **uazapi (Desenho B)** ou um **bloco de template WABA aprovado** dentro do bot |
| **10** | **Salesbot = 1 mensagem por resposta** (as partes viram parágrafos na mesma msg) | **multi-mensagem e voz só existem no Desenho B** |
| **11** | Lead pode estar em **OUTRO pipeline** | tools **fail-closed** se o funil ≠ mapa ou o status é protegido |
| **12** | **A conta muda no mesmo dia** | rode `/api/validate` **após qualquer mexida no funil** (no v1 o guardião roda todo dia) |
| **13** | **curl no Git Bash Windows corrompe UTF-8** em JSON com acento | Python/Node pra qualquer chamada com português |

### Pegadinhas da uazapi (Desenho B — verificadas em produção) **[v1]**

| # | Pegadinha | Cura |
|---|---|---|
| **B1** | Payload: `{EventType: "messages", chat, message}` — texto em `message.text`, mídia em `message.content.URL` (**`.enc` criptografada, INÚTIL direto**); `fromMe`+`wasSentByApi` = **eco nosso** (ignorar) | **1 webhook POR instância** (POST **substitui** o anterior!) — se outro sistema consome (inbox Bridge), nosso endpoint **RETRANSMITE** via env `UAZAPI_RELAY_URL` |
| **B2** | Áudio inbound: `POST /message/download {id}` → fileURL mp3 descriptografado. É **ASSÍNCRONO** (o webhook chega antes da conversão) | **retry 2/4/8s**. **Imagem e PDF: descreva com a VISÃO do próprio modelo** numa chamada **na ENTRADA** e grave como texto no histórico (`[imagem do lead]:` / `[documento do lead]:`) — sem OCR à parte, e você não paga visão a cada turno (o v2 já faz assim em `lib/media.ts`) |
| **B3** | Envio: `/send/text {number, text}` · voz `/send/media {number, type:"ptt", file:"data:audio/ogg;base64,..."}` (ElevenLabs `opus_48000_64` direto) | — |
| **B4** | 🚨 **DUPLA ENTREGA:** número conectado no Kommo **E** na uazapi → a mesma mensagem chega **2x** | **canal único por lead** — `via=uazapi` faz o `add_message` **ignorar aquele lead** |
| **B5** | A **busca de contato por telefone no Kommo é FUZZY** e contatos de teste com o mesmo número confundem | validar o telefone do contato **DÍGITO A DÍGITO** + manter o índice **`ak:phone2lead:`** |
| **B6** | **Canal voz/texto = decisão do CÓDIGO, bidirecional** — o modelo imita o padrão do histórico nos 2 sentidos (chega a responder texto em voz) | turno de **áudio → voz forçada** (≤500 chars, sem link); turno de **texto → voz derrubada**; exceção: lead pediu áudio por escrito. Prompt imperativo + aviso dinâmico guiam só o **CONTEÚDO** |
| **B7** | Auto-criação de lead (`UAZAPI_AUTO_CREATE_LEAD=1`) | **SÓ em número DEDICADO da IA**. Em número **compartilhado** (ex: suporte) mantenha o **gate por tag** — senão todo cliente de suporte vira lead atendido pela IA |

### 🚨 UM NÚMERO = UM AGENTE (a pegadinha nasceu AQUI, 11/07/2026)

Um número WhatsApp pode estar **simultaneamente** na Cloud API oficial (GHL) **E** pareado na uazapi (bridge do Kommo) — coexistência permitida pela Meta. Uma **única** mensagem do lead entra pelos **DOIS** caminhos e, se os dois agentes tiverem gate aberto pro contato, o lead recebe **RESPOSTA DUPLA**. Aconteceu no dogfood: **Bia GHL + Bia Kommo responderam juntas a mesma mensagem** — e a bridge ainda puxa as respostas do oficial pro Kommo, virando bagunça no chat.

**Regras:** produção = **número exclusivo por agente**. Dogfood com número compartilhado = **só UM gate (tag) aberto por vez** pro mesmo contato.

---

## §8 · O CÉREBRO — "Testar ao vivo" (playground) **[v1]**

> **O v2 não traz playground nem Central.** O que ele tem para certificar o cérebro é o exame offline do Passo 8 (`scripts/evals.ts`, porta em memória). O playground abaixo é do v1 e se porta com o mesmo padrão.

Painel **self-contained servido pelo próprio agente** (sem app Next.js separado): o cliente edita o prompt candidato e conversa com a IA **como se fosse o lead**. As tools rodam em **DRY-RUN** (simuladas, **ZERO efeito no CRM**) e a UI mostra o que a IA faria por trás.

**Abrir (v1):** `/api/cerebro?secret=<WEBHOOK_SECRET>` (o secret fica só na URL).

Port **aditivo — NÃO toca no caminho de conversa**. São 3 arquivos + 1 entrada no `vercel.json`:

| Arquivo | O que faz |
|---|---|
| `lib/playground.ts` | `simulateChat(promptTexto, turns)` — espelha o loop do agente, trocando a execução real das tools por uma **simulada** e usando o prompt candidato. Retorna `{ reply, toolCalls[], voice }` |
| `api/prompt.ts` | `GET` devolve o prompt de fábrica (carrega no editor) · `POST {acao:'chat', texto, mensagens}` roda a simulação. Auth `?secret=` |
| `api/cerebro.ts` | a página (HTML self-contained; lê o `secret` da URL pra falar com `/api/prompt`) |
| `vercel.json` | registrar `api/prompt.ts` com `maxDuration: 300` + `includeFiles` dos prompts |

**Validado E2E em produção (v1) 19/07/2026:** a IA respondeu **E** chamou `preencher_qualificacao("Origem do lead"="Instagram")` + `mover_etapa_funil` — **tudo simulado, CRM intocado**.

### ⚠️ GAP declarado: cérebro editável ao vivo no Kommo

Nem o v1 nem o v2 têm a **Central / prompt-store** (publicar prompt sem deploy, com o eval como **PORTEIRO**). Pra ter isso no v2:

1. **Portar** do template GHL: `prompt-store.ts` + a validação server-side + `api/prompt.ts` (publicar/restaurar/rollback) + a página do cérebro.
2. **Reusar a porta em memória** que o `scripts/evals.ts` já usa: é o mesmo dry-run que o playground precisa, e cobre as tools do v2.
3. O prompt do v2 é **por porta** (`nucleo.md` + `portas/*`): o store precisa versionar o conjunto, não um arquivo só.
4. O padrão do componente e o dry-run estão em `comum/PLAYGROUND.md`; a propagação pros demais clientes segue a **"4ª perna"** do `SKILL.md`.

---

## §9 · MONITORAMENTO E ALERTAS (portar do template GHL — validado E2E 11/07/2026)

> **O v2 traz só o diário** (`/api/executions`). Alerta, guardião, analista e followup são porte. O padrão completo vive no template GHL e porta pro Kommo com **adaptações mínimas**:

| Camada | Arquivo | O que faz no Kommo |
|---|---|---|
| **Alerta instantâneo** | `lib/alert.ts` | Erro no processamento/followup → mensagem **NA HORA** no grupo de WhatsApp de operações via uazapi. Envs `UAZAPI_URL`/`UAZAPI_TOKEN`/`ALERT_GROUP_JID` — grupo multi-cliente **"🚨 Alertas IA - Clientes Control Gestão"**, JID `<JID_DO_GRUPO_DE_ALERTAS>@g.us` (**MESMO grupo pra todos os projetos**; preencher com o grupo da Control Gestão). Carimbo obrigatório: env **`CLIENT_NAME`** ("Cliente · Agente") no cabeçalho de toda mensagem. **Throttle Redis 10min/tipo.** No v1 o transport uazapi já existe; no v2 o alerta traz o client uazapi junto |
| **Guardião** | `lib/guardian.ts` | Check-up diário heurístico: `validate` + erros 24h do execlog + diagnóstico por padrão + **retrigger seguro (máx 3)** + laudo no grupo **SÓ se houver problema** |
| **Analista semanal** | `lib/analyst.ts` | Segundas: relatório com números **calculados EM CÓDIGO** + o modelo analisa as conversas. ✅ **No Kommo ele lê do PRÓPRIO histórico Redis (`conv:{leadId}`) — nem precisa de API externa, é mais fácil que no GHL.** Destaque + até 3 sugestões de prompt **com evidência**. Snapshot comparativo no Redis. **Sugestões NUNCA aplicadas automaticamente** |
| **Orquestração** | `api/cron-daily.ts` | Dispatcher no **ÚNICO cron diário do Vercel Hobby**: followup → guardião → (segunda) analista |

### Followup pontual: o cron diário NÃO basta

Cadência sub-diária (ex: 1ª em 6h) não é pega por um cron 1x/dia. **Use QStash** (Upstash — **MESMA conta do Redis**, não é peça estranha ao stack) como **relógio horário** apontando pro `/api/followup`:

- QStash `0 0-11,13-23 * * *` + cron Vercel `0 12 * * *` = **cobertura horária completa, ZERO colisão, grátis, sem Pro**
- QStash é **só o relógio**; motor + fila seguem no Vercel + Redis (fila com **claim atômico** — `PEGADINHAS §10`)
- Auth: o QStash forwarda `Upstash-Forward-Authorization: Bearer <CRON_SECRET>` → o endpoint valida
- **Hobby é não-comercial nos termos** — cliente pagante = Pro (ou QStash como gatilho + Hobby só de cron nativo)

### ⚠️ Handoff × followup (vale IGUAL no Kommo)

Quando o agente passa o lead pro humano, o loop **NÃO pode** agendar a checagem de silêncio depois — senão o próprio handoff agenda perseguição pra quem **acabou de ir pro humano**. No fim do turno (v1):

```ts
if (reply.toolsUsed.includes('escalar_para_humano')) await clearFollowup(id)
else await scheduleSilenceCheck(id, 0)
```

No v2, o equivalente é o `handoff` que o `finalizar_atendimento` devolve: quem portar o followup limpa a fila quando ele vier `true`.

**Doutrina:** a fila vive no Redis, mas **a verdade do gate é do CRM** — todo painel de fila filtra pelas **tags reais**, e **toda ação que tira o lead do fluxo tira da fila na MESMA volta**. (Bug silencioso: o cron até dropa esses leads, então ninguém recebe followup errado — **mas o painel mente até lá**.)

### ⚠️ A janela comercial ENGOLE o tique do relógio (vale IGUAL no Kommo)

Relógio de hora em hora + janela 8h–18h → quem vence às **17h38** não é pego pelo tique das 17h (cedo) nem pelo das 18h (janela já rejeita) e só sai no dia seguinte: **22 minutos viram 14 horas de atraso**.

- **Cura (motor):** se o PRÓXIMO tique cai fora da janela, **antecipe** quem vence até lá — `getDue(limite, lookAhead)` com `zrange` até `now + 1h`. Antecipa **no máximo um tique**.
- **Cura (painel):** **nunca** escreva "agora" pro que só sai amanhã — escreva **"amanhã a partir das 8h"**, com a janela vinda da **API do motor** (uma fonte só).
- **Doutrina: a granularidade do gatilho é o piso da sua promessa.**

### ⚠️ Rotinas cloud do Claude (claude.ai/code/routines) NÃO têm saída de rede

Curls falham **em silêncio**. **Monitores DEVEM viver no próprio agente Vercel.** Rotinas cloud só pra tarefa sem rede.

### Aba "Recuperação" (quando a Central chegar ao Kommo)

Dashboard do followup: fila e próximos envios · voltou a conversar · concretizou o
objetivo · influência assistida · eficácia por toque · esgotados/cancelados.
Fonte = `GET /api/followup-stats`; o objetivo usa `status_id`, campo, tag ou
webhook confirmado no lead. Trackings e atribuição estão em `RECUPERACAO.md`.

---

## §10 · TRAQUEAMENTO DE ORIGEM **[v1]** (Fase 1 — no ar, testado E2E 2026-07-12)

> Não vem no v2. Porte do v1 junto com os campos de origem no `crm-map`.

Clique → código → 1ª mensagem → card, **tudo no mesmo projeto**:

```
Bio / YouTube / anúncio → /api/r/{slug}?utm_...   (redirecionador PÚBLICO)
  → clique salvo no Redis (código de 4 chars, TTL 7d, USO ÚNICO)
  → 302 pro wa.me com texto pré-preenchido + " #CODE"
1ª mensagem chega → resolver acha o #CODE → REMOVE do texto (o modelo nem vê)
  → grava no lead:
      utm_* nos campos tracking_data NATIVOS
    + "Fonte do lead" por ENUM (canal sem enum cai no campo texto "Fonte")
    + NOTA DE AUDITORIA no card (canal, UTMs, hora do clique, IP)
```

**Gerenciar links** (`/api/links?secret=`, v1):

```bash
curl -X POST "https://<deploy>/api/links?secret=XXX" -H "Content-Type: application/json" \
  -d '{"slug":"yt-canal","canal":"Youtube","phone":"5521999999999","text":"Olá! Quero saber mais sobre o agente de IA","utm_source":"youtube","utm_medium":"video"}'
curl "https://<deploy>/api/links?secret=XXX"     # lista com as URLs prontas pra divulgar
```

- **UTMs na URL do clique sobrescrevem os defaults do link** — use isso nos anúncios
- **Fallback declarado:** o prompt manda o agente perguntar a origem **UMA vez** e gravar no campo de origem (no v2, um campo do roteiro com `sinal`)
- **Fase 2 (futuro):** `referral`/`ctwa_clid` de anúncio CTWA — na **uazapi**: `contextInfo` da 1ª msg. No **OFICIAL**: ⚠️ **o Kommo preenche o UTM SOZINHO, mas SÓ SE o WABA estiver no MESMO Business Manager da conta de anúncios** → vira **item de checklist de implantação** e é a **provável causa do "UTM 0%"** que vimos em clientes
- **Fase 3:** CAPI da Meta (evento de qualificação com `ctwa_clid`)

---

## §11 · ESTADO DO DOGFOOD CONTROL GESTÃO (referência viva, v1)

> A variante Kommo foi **construída e deployada em 2026-07-11 como dogfood da própria Control Gestão**, no template v1. É a conta de referência para comportamento do Kommo: quando algo não bate, compare com ela. Os IDs abaixo são **desta conta** — cliente novo tira os dele pelo `discover`.

| Item | Valor |
|---|---|
| Deploy | https://agente-ia-kommo-controlgestao.vercel.app |
| Funil | **"Vendas Implementações" — id `12839352`** |
| Alçada (etapas) | Primeiro contato **99017612** → Qualificação **99017620** → Agendamento de reunião **99017880** |
| `stageOrder` real | 99017608 (Incoming) · 99017612 · 99017616 (Followup) · 99017620 · 99017880 · 142 (won) · 143 (lost) |
| Campos | **Resposta IA `1126115`** · **Demonstrou interesse `1117491`** (enums `815671`–`815685`) · **Follow-up `1122909`** · **Data da reunião `1085812`** |
| Webhook `add_message` | **id `47402316`** |
| Gate | **`GATE_TAG=iav`** (tag `IAV` no lead) · secrets no **`.env.local` da pasta do projeto** |
| Salesbot de envio | **bot `65955`** — cópia do `62431` com a URL do widget-request trocada pra `/api/salesbot?secret=` |
| Cadeia E2E | ✅ **validada 2026-07-11**: outbox consumido · lead moveu de etapa · **multiselect gravado por enum_id** |
| Desenho B | ✅ **validado E2E 2026-07-12** com **voice note real** |
| Playground | ✅ **no ar 19/07/2026** |

### ⚠️ Dois avisos que valem ouro nessa conta

1. **NÃO usar o bot `62431`** — ele aponta pro **n8n/Postgres antigo**.
2. **O fluxo n8n antigo (gate tag `IA`) continua ATIVO na conta.** Os gates são **disjuntos**: **NUNCA** coloque `IA` e `IAV` no mesmo lead.

---

## §12 · PROCESSO NUMA SESSÃO NOVA

1. Invocar esta skill + **ler `assets/agente-kommo/INSTALAR.md`** (e `MIGRACAO-N8N.md` se já existe IA na conta)
2. **SEMPRE:** discovery ao vivo dos IDs **antes** do crm-map (a conta muda no mesmo dia) → review adversarial antes de cliente real → exame (Passo 8) → teste E2E com lead próprio → rampagem por tag

## §13 · DEPOIS DO GO-LIVE (o que faz o cliente ficar)

- **Ensine o time:** o que é o gate, como desligar a IA num lead (tag `HUMAN_TAG`), como ler o diário (`/api/executions`)
- **Mensal:** rode os evals de novo (o mundo muda) · `/api/validate` **depois de qualquer mexida no funil**
- **Custo:** o `npm run evals` imprime o custo do agente por rodada; use-o para estimar o custo por conversa do cliente. A escolha de modelo e os limiares estão em `comum/ESCOLHA-LLM.md` e `comum/CONTEXT-ENG.md`. (Medido no v1 com Claude: conversa completa ≈ **R$0,16** com prompt caching → mil conversas/mês ≈ **R$162**.)
- **Depois de portados (§9):** grupo de alertas com o time do cliente dentro (carimbo `CLIENT_NAME`) · cron diário com followup + guardião · segunda: relatório + evolução do prompt

## §14 · DEBUG RÁPIDO

| Sintoma | Primeiro passo |
|---|---|
| "Nem respondeu" | Saiu execução em `/api/executions`? **Não** = webhook/gate (rode `scripts/simulate-inbound.ts` pra provar que o código roda; o lead tem a `GATE_TAG`? tem a `HUMAN_TAG`?) · **Sim** = leia o erro no diário · humano falou nas últimas 6h? (a IA recua de propósito) |
| Respondeu mas o lead não recebeu | `KOMMO_BOT_ID` setado **e redeployado**? · o bot está publicado/ativo? · o outbox foi consumido? · `salesbot/run` deu 502 (**pode ter rodado — não repita**) |
| Resposta duplicada | Dois agentes com gate aberto (n8n + este)? · número em 2 sistemas (**Kommo + uazapi**)? |
| Loop infinito de mensagens | Anti-eco: `sent:{leadId}` · rate limit 10/min (pegadinha 4) |
| Campo não preenche | `/api/validate` · está gravando por **enum_id**? · a evidência tem o `sinal` do campo? · o campo está no `roteiro` da porta? · está em `camposProibidos`? |
| Etapa não anda | `etapas` está vazio (a IA nunca move)? · lead está no funil da etapa? · status atual é protegido? (**fail-closed** recusa de propósito) |
| Mostra o menu de novo / porta errada | `sinais` da porta ambíguos? · `classificarTextoLivre` · o `state` do lead (mande `reset` num lead de teste) |
| Áudio vira placeholder | `OPENAI_API_KEY` / `STT_MODEL` · o link do anexo veio no webhook? · no Desenho B (v1), o `/message/download` é **assíncrono** (retry 2/4/8s) |
| Followup não sai (v1) | Janela comercial? · domingo? · **janela 24h da Meta** (só oficial)? · o relógio é diário (precisa de QStash)? |
| "O followup atrasou horas" (v1) | Janela comercial engolindo o tique (§9) — **prove o relógio antes de acusar o motor**: `lastScheduleTime`/`isPaused` no QStash + bater no endpoint com o MESMO header (segredo trocado = **401 silencioso a cada hora**) |
