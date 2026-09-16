# MIGRAÇÃO n8n → agente Vercel (Kommo) — protocolo

> **Leia quando:** o cliente "já tem uma IA feita em n8n" e quer a nova.
> Nasceu na MTF Advocacia (Kommo, 15–16/09/2026): 6 assistentes n8n
> (triagem + 5 especialistas), WhatsApp oficial, Salesbot disparado pelo n8n.
> Template: `assets/agente-kommo/`.

## 1 · A frase que muda o projeto

*"Já tem uma IA no n8n"* significa que **já existe** na conta: um webhook
`add_message` consumindo tudo, um Salesbot de envio, um campo onde o n8n deposita
a resposta, uma tag que liga a IA e um jeito (ou nenhum) de encerrar. A nova IA
herda essa infraestrutura. **Não crie campo, bot ou tag novos se os antigos servem.**

## 2 · Descobrir sem perguntar ao cliente (API, somente leitura)

| Pergunta | Onde a API responde |
|---|---|
| Quem mais escuta a conta? | `GET /api/v4/webhooks` → o n8n aparece com `add_message`; outros sistemas com `add_lead/update_lead` |
| WhatsApp oficial? | `GET /api/v4/events` → `incoming_chat_message.value_after[0].message.origin == "waba"` |
| Qual campo o n8n usa para responder? | eventos `custom_field_<id>_value_changed` com `created_by: 0`, repetidos (MTF: campo `IA`, 25 em 100 eventos) |
| Qual tag liga a IA antiga? | tags da conta + leads recentes com a tag (confirme com o cliente) |
| Qual o `bot_id`? | **não sai na API** — está no nó do n8n que chama `salesbot/run` |

`npm run discover` faz tudo isso e grava em `discovery/` (fora do git).

## 3 · Perguntar só o que a API não diz

1. A IA antiga atende **só quem tem a tag**? Quem coloca a tag?
2. O que acontece quando a IA termina? (MTF: **nada** — nem etapa, nem aviso. Decisão: remover a tag.)
3. Os prompts dos assistentes (texto de cada um).
4. Posso alterar funis/etapas? (MTF: **não** — `etapas: []`.)
5. Follow-up entra agora? (MTF: não.)

## 4 · Ler os prompts do n8n como auditoria, não como cópia

O que encontramos na MTF e vale checar em toda migração:

| Achado | Por quê importa |
|---|---|
| **Agente de triagem pagando LLM para reconhecer "3"** | vira roteador em código (`lib/router.ts`), zero token |
| **Menu não bate com os assistentes ativos** (opção "auxílio acidente", ativo "auxílio doença"; "dívidas empresariais" apontando para agente PF) | leads caem na porta errada há meses sem ninguém ver |
| **Dois produtos disputando o mesmo lead** (superendividamento × revisão de dívida PF) | precisa de regra de separação escrita pelo cliente |
| **"Agente nunca muda" × "procure o e-mail do site"** | lead com segundo assunto fica sem atendimento → `registrar_outro_assunto` |
| **Regras de segurança desiguais entre assistentes** (menor de idade e urgência só em um) | vão para o `nucleo.md`, valem para todas as portas |
| **Prompt que promete "vou encaminhar agora" sem ação no CRM** | promessa que mente — ver `kommo/PEGADINHAS.md §20` |
| **Frases que a própria regra proíbe** ("bancos cometem irregularidades", proibição de admitir que é IA) | red flag de conformidade para o cliente validar (advocacia: OAB) |
| **Prompts de 6–9k tokens cada, ~70% repetidos** | núcleo comum + porta ativa |

## 5 · Coexistência durante a rampagem (sem mexer no n8n)

O webhook `add_message` é da conta inteira: os dois sistemas recebem toda mensagem.
Gates **disjuntos** resolvem sem tocar no n8n:

| Fase | Lead de teste | n8n | Nova IA |
|---|---|---|---|
| E2E | tira a tag antiga, põe a nova (`sofia`) | ignora (sem tag dele) | atende |
| 10 leads | idem, à mão | ignora esses 10 | atende |
| Virada | — | **webhook desativado** (ação aprovada pelo cliente) | `GATE_TAG` = tag antiga, redeploy |

⚠️ Se a tag antiga é colocada **automaticamente** em todo lead que entra, o lead de
teste recebe as duas tags ao entrar: remova a antiga à mão antes da 1ª mensagem.

## 6 · Reaproveitar o bot e o campo

A MTF usava "n8n preenche o campo → dispara o bot". A nova IA faz exatamente isso
(`transport.ts`): mesmo campo (`respostaFieldId`), mesmo bot (`KOMMO_BOT_ID`).
Ganho: zero passo manual no Salesbot, e outros webhooks da conta (ex.: sistema que
escuta `update_lead`) recebem o **mesmo** evento que já recebiam.

## 7 · Definição de pronto da migração

- descoberta gravada (webhooks, canal, campo, tag, bot);
- auditoria dos prompts entregue ao cliente, com decisões registradas;
- `npm test` verde + evals aprovados em 3 repetições por porta;
- E2E real: menu → porta → roteiro → finalização (tag removida, relida na API);
- 10 leads sem resposta dupla (conferir no chat do Kommo);
- virada: webhook do n8n desativado **com aprovação**, `GATE_TAG` trocada, redeploy,
  primeira conversa real conferida.
