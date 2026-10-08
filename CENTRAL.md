# CENTRAL DE IA — o padrão da casa

> **A Central de IA é o "ó" de tudo que a casa faz.** Vercel, Redis, Claude, o CRM, o agente, os
> evals, a Escola — nada disso o cliente vê por dentro. Ele vê a **Central**. É a vitrine e o painel
> de controle: onde ele acompanha a IA ao vivo, entende o que ela faz, e a **ensina** sem tocar em
> prompt. Se a Central é confusa, o cliente acha que o produto é confuso — não importa quão bom seja
> o motor por baixo.

> **Este arquivo é o PADRÃO.** Toda Central de cliente segue ele. Não existe "a Central do fulano é
> de um jeito, a do ciclano é de outro". Existe **a Central v{N}**, e todo cliente está numa versão
> dela. Quando a gente evolui, evolui o padrão — e o padrão propaga, versionado, pra todo mundo.

**Leia este arquivo quando:** for criar a Central de um cliente novo · for evoluir qualquer aba ·
alguém propuser "vou fazer diferente nesse cliente" · você precisar decidir **onde um conhecimento
mora** (a régua do §2) · for propagar uma melhoria pra frota.

> ⭐ **O PADRÃO VIGENTE É A CENTRAL v5 = A CENTRAL DA INOVPAY (desde 08/10/2026).**
> Toda Central nova é construída **igual à da InovPay**: quatro abas (Estatísticas,
> Teste, Ensinar, Como usar), identidade Control Gestão, Ensinar sem edição manual e
> publicação só com exame. O código é `assets/central-v5/` (cópia fiel de
> `Control-Gesta0/inovpay/central`, commit `08daba9`) e o passo a passo é
> `assets/central-v5/INSTALAR.md`. Não monte Central por camadas nem aba por aba: copie
> a v5 e troque o conteúdo.
>
> 📦 **Legado, consulta só:** `assets/central-v2/` (motor de conteúdo: régua, catálogo,
> conhecimento, mídias), `assets/central-v3/` (cockpit de 5 áreas + ledger) e
> `assets/central-v4/` (camada Autônoma v4.1: Briefing, comando, Flight Recorder, Radar,
> Mapa Vivo, Shadow, E se?, Recibo, Recuperação). Servem para manter as Centrais v4.1 que
> já estão no ar e como fonte de peças que um cliente específico precise (§1.1). A v4.1
> foi provada no dogfood da Control Gestão em 23/07/2026 (typecheck, 74 asserções,
> build, dark/light, desktop/mobile, smoke HTTP).

**Legenda de origem** (de onde cada peça do padrão veio):
| Selo | Significado |
|---|---|
| 🏠 | **Nosso** — construído e provado na casa (Control Gestão) |
| 🔷 | **Continuare** — o padrão de produto que o sócio evoluiu e a casa adotou (análise 22/07/2026) |
| ✨ | **Novo** — nasce neste padrão; nem nós nem eles tínhamos |
| 🩸 | cicatriz — a razão nasceu de uma dor real, com data |

---

## §0 · A DOUTRINA — a Central é padrão, e o padrão evolui SEMPRE

Três leis, e elas resolvem a tensão que o mestre nomeou: *"a Central não pode ficar parada, mas não
pode virar um de cada jeito"*.

**LEI 1 — UM PADRÃO, TODOS OS CLIENTES.** As abas, o que cada uma faz, as travas por baixo: iguais
pra todo mundo. O que muda por cliente é o **conteúdo** (o cérebro dele, o catálogo dele, a marca),
**nunca a estrutura**. Central sem tema claro/escuro num cliente e com tema noutro é o sintoma da
doença — significa que alguém evoluiu um projeto e esqueceu o padrão.

**LEI 2 — BUG SE CORRIGE NA HORA; PADRÃO SÓ MUDA COM VERSÃO.** Achou um bug numa Central? conserta
naquele cliente imediatamente, e a correção vira cicatriz aqui. Quer **mudar o padrão** (aba nova,
fluxo novo)? isso **bump o `SISTEMA_VERSAO`** (§9) e entra pra propagação. A diferença importa:
correção é local e urgente; evolução de padrão é global e controlada.

**LEI 3 — A CENTRAL NUNCA FICA PARADA.** Ela é o produto vivo. Toda vez que a casa aprende algo —
uma aba melhor, um destino novo de conhecimento, uma trava — isso vira **próxima versão do padrão**,
e a skill sabe propagar. Central parada é produto morrendo devagar.

> 🏛️ **A skill é a professora que executa este padrão.** Ela sabe a ordem das tarefas pra criar uma
> Central nova (§10.1) e o ritual pra evoluir uma existente (§10.2). Não é improviso: é procedimento.

---

## §1 · O MAPA DAS ABAS (o contrato de cada uma)

A Central v5 tem **4 abas**, nessa ordem, com esses nomes. Feature técnica não
ganha aba: primeiro se decide qual pergunta do dono ela responde e em qual das
quatro ela mora.

| Aba | Pergunta que responde | O que contém | Trava por baixo |
|---|---|---|---|
| **Estatísticas** | “Ela está bem, o que pede decisão e quanto custou?” | subabas **Visão geral** (veredito, o que pede decisão, quatro números de hoje) · **Operação** (Agora · Passagens · Histórico · Funil) · **Resultados** (Resumo · Triagem, 7 ou 30 dias, custo) · **Sistema** (agente, CRM e quem ela atende) | zero tokens; só fica verde depois que **todas** as fontes responderem; PII mascarada no histórico |
| **Teste** | “Como ela responderia isso?” | laboratório com a assistente de verdade (mesmo cérebro, ferramentas e travas) numa porta em memória; opções de perfil, fora do horário e versão no ar × rascunho; “No CRM isso faria”; **Corrigir** em cada resposta | nada vai pro CRM nem pro WhatsApp; teto diário de mensagens; custo na tela |
| **Ensinar** | “Como corrijo ou atualizo a IA?” | **Pedir mudança** (em português, com até 3 arquivos ou links) · **Conversas reais** (corrigir resposta do WhatsApp) · **O que ela sabe** (textos da base, só leitura); quadro de versão no ar, rascunho e versões anteriores | **ninguém edita texto à mão**; a IA (curador) decide o destino e escreve no rascunho; publicar = exame (§6) |
| **Como usar** | “Como a equipe trabalha com ela?” | **Passo a passo** · **Fluxo do cliente** (cada etapa com o texto da base que está no ar) · **Sua base** (versão, textos por assunto, quem muda o quê) · **Equipe no CRM** (tags, combinados, dúvidas) | lê a base publicada: mudou em Ensinar, mudou aqui; o conteúdo do cliente vive só em `lib/como-usar.ts` |

Mais duas peças globais: **Pergunte à Central** (botão no menu, `Ctrl K`,
resposta calculada em código, zero tokens) e **login por senha** (cookie
assinado, 12 h; tudo exige sessão, inclusive `/api`).

**Por que a v5** (decisão do mestre, 08/10/2026, depois da InovPay):

- **Leitura numa aba só.** Visão geral, Operação, Resultados e Sistema eram quatro
  itens de menu na v4.1. Na v5 viram subabas de Estatísticas e dividem a mesma
  leitura por 1 minuto: trocar de subaba não busca o CRM de novo.
- **Testar ganhou aba própria.** É o que a equipe do cliente mais usa no dia a dia,
  e o botão Corrigir em cada resposta leva direto pro Ensinar.
- **Ensinar sem editor.** Na v4.1 o dono tinha seis modos e a agência um editor de
  texto cru. Na v5 ninguém digita no prompt: a equipe pede, a IA muda o rascunho
  por troca exata de trecho, e o exame decide se vale.
- **Como usar** é o manual vivo que antes não existia: a equipe do cliente aprende
  a usar a Central e entende o fluxo do atendimento sem chamar a gente.

🩸 **A dor que forçou a v3 (continua valendo):** nove itens no menu, todos com o
mesmo peso, e headlines de landing page em toda rota. O cliente precisava
conhecer nossa arquitetura para achar o que queria. Organize por **intenção de
negócio**, não por nome de módulo. A v5 leva isso até o fim: quatro portas.

### §1.1 · O que ficou da camada Autônoma v4

A v4 mudou o verbo da Central para **mostrar → interpretar → priorizar →
simular → provar**. Na v5 o verbo continua, com menos peças:

| Peça | Na v5 | Onde |
|---|---|---|
| Briefing Executivo | ✅ fica | Estatísticas › Visão geral (“O que pede decisão · calculado sem tokens”) |
| Pergunte à Central | ✅ fica | menu, `Ctrl K` |
| Flight Recorder | ✅ fica | Estatísticas › Operação › Histórico |
| Radar de Dinheiro | ✅ fica | Estatísticas › Operação › Funil (oportunidades paradas) |
| Shadow Lab | ↪ substituído | **Teste** (laboratório) + **exame** na publicação |
| Mapa Vivo | ↪ substituído | Ensinar › O que ela sabe + Como usar › Sua base |
| Modo E se? · Recibo de Valor | ✖ fora do padrão | só entram se o cliente pedir, como subaba de Resultados |
| Recuperação · Agenda | ✖ fora do padrão | só em agente que faz follow-up ou agenda, como subaba de Operação |

Peça que sai do padrão continua em `assets/central-v4/` e pode voltar num cliente
**como subaba dentro de uma das quatro abas**, nunca como aba nova. Se ela fizer
sentido pra todos, aí é evolução de padrão (§9).

### §1.2 · Camadas de leitura — uma pergunta por vez

> **Capacidade não precisa virar simultaneidade.** Uma Central pode ter oito
> features fortes e ainda ser confusa se todas aparecem na primeira rolagem.

Contrato de densidade da v5:

| Tela | Primeira leitura | Segundo nível |
|---|---|---|
| Estatísticas › Visão geral | veredito, **uma** prioridade e quatro números de hoje | “Mais N pontos” recolhido |
| Estatísticas › Operação | uma subaba entre Agora × Passagens × Histórico × Funil | filtros do histórico (todas, passou/resolveu, com trava, erros) |
| Estatísticas › Resultados | Resumo (7 ou 30 dias) | Triagem em subaba própria |
| Estatísticas › Sistema | agente e CRM, verde ou vermelho | divergências do CRM só quando existem |
| Teste | a conversa | “No CRM isso faria” ao lado; detalhes de cada resposta sob demanda |
| Ensinar | quadro da versão + Pedir mudança | Conversas reais × O que ela sabe; versões anteriores recolhidas |
| Como usar | Passo a passo | Fluxo do cliente × Sua base × Equipe no CRM |

Regras duras:

1. **Só uma análise renderiza por vez.**
2. **Sinal secundário começa recolhido.**
3. **Estado sem dados é uma explicação, não um gráfico cheio de zeros.**
4. **Mobile pode ter scroll horizontal dentro da subnavegação; o documento não
   pode ter overflow.** Prove `scrollWidth === clientWidth` em 375px, em todas
   as rotas e nos dois temas.
5. A URL profunda continua funcionando (`/operacao?aba=passagens`,
   `/resultados#conversao`, `/ensinar?ver=sabe#item-<id>`).
6. **Atualizar é manual** (botão “Atualizar”). Nada de polling no CRM.

🩸 **Dor que forçou a v4.1 (continua valendo):** no dogfood as features foram
aprovadas, mas o cliente sentiu excesso de informação por tela. O problema não
era o que existia, era tudo aparecer ao mesmo tempo. A cura foi divulgação
progressiva.

🩸 **Falha fechada também é UX:** no primeiro smoke da v3 em produção, `/api/live`
recebeu 401 do GHL e a tela antiga podia nascer verde antes da resposta. Mostre
“verificando” e só declare saúde depois das fontes; erro de conector vira atenção
explícita. Nunca derive “saudável” da ausência temporária de dados.

🩸 **Tipografia e hover também são contrato:** display Manrope 500–700; só
elemento clicável recebe `interactive-card`, com mudança sutil de
borda/superfície e foco visível. Card informativo fica imóvel. Movimento não
pode ser a única pista de clique.

**+ o TEMA claro/escuro** é padrão (§8). **+ o organismo** (guardião diário,
analista semanal, auditora de funil) roda por trás e alimenta Estatísticas — o
cliente não configura, só colhe.

> 🩸 **Por que o motor é invisível:** o cliente que vê "eval score 8.4/10, rubrica v3, holdout 8%"
> não entende e assusta. O cliente que vê *"testei sua correção contra 14 conversas e não publiquei
> porque uma delas quebrou"* entende e confia. **A inteligência aparece como CONSEQUÊNCIA em
> português, nunca como painel técnico.**

---

## §2 · A RÉGUA DE DESTINO DO CONHECIMENTO ⭐ (a peça-mãe)

**Este é o coração do padrão, e é o furo que nem a casa nem a Continuare tinham resolvido.** Quando o
cliente diz *"a IA deveria ter feito X"* ou *"quero que ela saiba Y"*, **onde isso mora?** Errar o
destino é a causa de metade dos problemas de agente de IA: preço no prompt apodrece, FAQ gigante no
prompt deixa lento, regra de tom no catálogo não faz sentido.

São **seis destinos**. A régua decide em ordem — **para no primeiro que casar**:

```
┌─ 1. É DADO QUE MUDA TODA HORA?  (agenda, status do lead, estoque em tempo real)
│     → TOOL / CRM.  A IA consulta na hora. NUNCA decora.
│
├─ 2. É PRODUTO / PREÇO / SERVIÇO que ela oferece e cota?
│     → CATÁLOGO.  Tabela viva. Ela lê a linha; muda? edita a linha. (§4)
│
├─ 3. É FATO / POLÍTICA / PROCEDIMENTO que ela consulta quando perguntam?
│     ├─ cabe no orçamento do cérebro (<10k tokens no total) e é consultado SEMPRE?
│     │     → CÉREBRO, numa seção. 
│     └─ é muito (dezenas de FAQs, documento longo, >150 itens, empurra >25k)?
│           → BASE DE CONHECIMENTO (RAG).  Ela busca o trecho e responde. (§5)
│
├─ 4. É REGRA DE COMPORTAMENTO / TOM / JORNADA?  (como conduz, o que faz e não faz)
│     ├─ dá pra escrever como instrução curta?
│     │     → CÉREBRO, na seção certa. (§3)
│     └─ é difícil instruir mas fácil demonstrar? (ritmo, acolhimento)
│           → EXEMPLO (few-shot).  Um turno modelo. 🔷
│
├─ 5. É uma FOTO / PDF / VÍDEO que ela envia?
│     → MÍDIA. (§7)
│
└─ 6. Não é nada disso, ou precisa de gente?
      → TICKET.  Vira chamado pra Control Gestão.
```

**Os limiares NÃO são chute — são medidos** (`comum/CONTEXT-ENG.md`, 12/07/2026):

| Sinal | Vai pro CÉREBRO | Vira RAG |
|---|---|---|
| tamanho total do prompt | até **~10k tokens** (cache 90% desconto, resposta ~4,7s) | acima de **~25k** (latência sobe pra ~9,5s) |
| nº de FAQs / fatos | até ~150 | acima disso |
| frequência de consulta | usado em quase toda conversa | consultado só quando perguntam daquilo |

> 🩸 **Por que "preço → catálogo" e não "preço → cérebro":** número no prompt vira texto fixo. No dia
> em que o cliente muda o preço, a IA continua cotando o valor velho **com toda a confiança do
> mundo**, e ninguém percebe até um lead reclamar. A régua manda preço pro catálogo (tabela viva) ou
> pra tool (dado vivo) — **nunca pro texto do cérebro.** É a mesma lei que a Escola já aplica; aqui
> ela ganha o destino estruturado (catálogo) em vez de só "vira ticket".

> ✨ **O destino que faltava — RAG:** antes desta versão, quando um cliente tinha muito conteúdo
> (manual de 40 páginas, 200 FAQs, políticas extensas), a casa **não tinha onde pôr**. Ou entupia o
> cérebro (lento, caro) ou virava ticket sem fim. Agora tem a Base de Conhecimento (§5), e a régua
> diz **exatamente** quando um conhecimento cruza a fronteira do cérebro pra ela.

**A régua é o cérebro da aba "Ensinar a IA".** Toda correção do cliente passa por ela antes de virar
proposta. E ela é **determinística onde dá** (dado volátil, tamanho) e só chama modelo pra classificar
o que é genuinamente ambíguo (regra vs exemplo) — igual à triagem da Escola, agora com 6 saídas em vez
de 2.

---

## §3 · O CÉREBRO POR SEÇÕES DE NEGÓCIO 🔷

**O que muda:** em vez de um textão de prompt dividido por blocos técnicos, o Cérebro é **seccionado
pelo momento do atendimento** — nomes que o dono entende sem manual:

```
· Saudação                        (como ela abre)
· Qualificação                    (o que ela descobre antes de oferecer)
· Envio de informações / produto  (como apresenta o que vende)
· Envio do orçamento              (como cota — puxando do CATÁLOGO, §4)
· Agendamento                     (como marca)
· Transferência para humano       (quando e como escala)
· Finalização de atendimento      (como fecha)
· Fora do escopo                  (o que ela NÃO responde) ← a trava de recusa
```

**Por que é melhor que o textão:** o dono não pensa em "bloco 3 do prompt". Ele pensa *"a saudação
está fria"* ou *"ela está cotando errado"*. A seção casa com o vocabulário dele. E a **régua §2**
sabe rotear: correção de saudação → seção Saudação; correção de preço → Catálogo, não seção nenhuma.

**Como convive com o `prompt.md`:** as seções são os **12 blocos do `prompt.md` de fábrica**,
renomeados pra linguagem de dono e agrupados por momento. O `render()` monta o prompt final juntando
as seções na ordem canônica — **byte a byte igual ao `prompt.md` quando nada foi editado** (a mesma
invariante da Escola). O eval-porteiro vale igual aqui. **Na v5 ninguém edita texto cru pela
Central:** o dono pede e a IA muda o rascunho (§6); mudança de regra de atendimento vira pedido pra
Control Gestão, que mexe no repositório.

> 🔷 **"Fora do escopo" é a trava de recusa da Continuare, e a casa adota.** Uma seção que lista o
> que a IA **não** faz e devolve uma recusa educada. Na clínica era *"não dá diagnóstico, não fala
> preço de tratamento, não processa reembolso, não se revela como IA"*. Genérico: **toda Central tem
> uma seção Fora do Escopo**, e a régua §2 manda pra lá o que o cliente pedir que a IA **não deve**
> fazer.

---

## §4 · O CATÁLOGO 🔷 — a tabela viva do que ela oferece

**A sacada da Continuare, adotada inteira.** Uma tabela estruturada — `produto · preço · descrição ·
categoria` — que o dono importa de planilha (`.xlsx`/`.csv`) ou edita na mão. **Regra dura: a IA
nunca oferece nem cota o que não está no catálogo.**

**Por que resolve preço melhor que a nossa triagem:** a Escola manda preço virar ticket (não deixa
entrar no cérebro — certo). Mas ticket é passivo: alguém tem que atender. O catálogo é **ativo**: a
IA cota da tabela em tempo real. Preço mudou? o dono edita uma linha e **a IA já cota o novo** —
sem deploy, sem prompt, sem ticket.

**O contrato:**
- a IA recebe o catálogo como **dado** (não como texto decorado no prompt) — igual a uma tool
- import de planilha com de-para de coluna (o dono mapeia "qual coluna é o preço")
- categorias organizam (a IA sabe agrupar: "temos 3 planos nessa faixa")
- **fonte única de verdade de preço/oferta** — a régua §2 manda todo preço pra cá

> 🩸 Isto fecha, do lado do produto, a mesma dor que a triagem fecha do lado do motor: **número não
> mora em texto.** A triagem impede (defesa); o catálogo oferece o lugar certo (solução).

---

## §5 · A BASE DE CONHECIMENTO (RAG) ✨ — o destino que faltava

**Ninguém tinha isto — nem a casa, nem a Continuare.** É onde mora o conhecimento **extenso** que a
IA consulta sob demanda: manual de procedimentos, 200 FAQs, políticas, catálogo de casos. Coisa que
**não cabe no cérebro** (estouraria o orçamento de tokens, deixaria lenta e cara) mas que ela precisa
saber quando perguntam.

**Quando um conhecimento entra aqui (a régua §2, destino 3-RAG):**
- é consultado **só quando perguntam daquilo** (não em toda conversa)
- é **muito** (empurra o cérebro pra >25k tokens, ou passa de ~150 itens)
- é **semi-estável** (muda às vezes, não toda hora — senão é tool)

**Como funciona (o contrato):**
1. o dono sobe documentos ou escreve FAQs, **organizados por tópico**
2. o conteúdo é **indexado** (chunk + embedding) numa store de vetores
3. no atendimento, a IA **busca o trecho relevante** e responde com ele — não carrega tudo
4. o que não achar, ela diz que vai confirmar (nunca inventa)

**O limiar de decisão está no §2 e é medido.** A Central mostra pro dono, em português: *"esse
conteúdo é grande demais pro cérebro (ela ficaria lenta). Vou guardar na Base de Conhecimento — ela
consulta quando alguém perguntar."* — a mesma lógica de "cérebro editável", agora com o destino RAG.

> ⚠️ **RAG só entra quando o volume PEDE.** Cliente com 20 FAQs **não** precisa de RAG — vai no
> cérebro e pronto (mais simples, mais rápido, cache de graça). Ligar RAG cedo demais é engenharia
> negativa: custo e latência de busca sem necessidade. A régua §2 protege contra isso.

---

## §6 · ENSINAR A IA — pedir, testar, corrigir e publicar com exame 🏠

**Na v5 ninguém edita texto à mão, nem o dono, nem a agência pela Central.** A
equipe do cliente fala com uma IA (o **curador**, com a chave do cliente) e ela
muda o rascunho. O WhatsApp só muda depois do exame. É o fluxo da InovPay:

```
Teste ── resposta errada? ── Corrigir (como deveria ser + por quê) ─┐
Conversas reais (diário, PII mascarada) ── Corrigir ────────────────┤
Pedir mudança (texto + até 3 arquivos ou links) ────────────────────┤
                                                                    ▼
                         CURADOR decide o destino (régua §2 aplicada à base)
   ┌──────────────┬───────────────────┬──────────────────────┬───────────────┐
   │ base         │ nova_informacao   │ control_gestao       │ recusado      │
   │ troca EXATA  │ informação curta  │ regra de atendimento,│ o que o       │
   │ de trecho    │ nova (seção de    │ roteiro, tags, tarefa│ cliente nunca │
   │ num texto    │ informações)      │ nova → vira pedido   │ muda (preço,  │
   │              │                   │ pra Control Gestão   │ taxa, senha…) │
   └──────┬───────┴─────────┬─────────┴──────────────────────┴───────────────┘
          ▼                 ▼             (+ "pergunta": falta dado, ela pergunta)
       RASCUNHO  ──  Testar o rascunho (Teste com versão = rascunho)
          ▼
   Publicar com exame: roda os cenários do eval com o rascunho.
   Cenário que falha roda mais 2 vezes e precisa passar nas duas.
          ▼
   passou → vira a versão no ar (histórico de 20, "voltar para esta")
   falhou → nada muda no WhatsApp e a tela mostra a conversa que quebrou
```

| Etapa | Contrato |
|---|---|
| testar | aba **Teste**: mesma assistente, ferramentas e travas, numa porta em memória; nada vai pro CRM |
| corrigir | botão **Corrigir** embaixo de cada resposta (Teste ou conversa real): *como deveria ser* + *por que está errado* |
| classificar | o curador escolhe o destino; o que é regra de atendimento nunca vira texto da base, vira pedido pra Control Gestão |
| escrever | troca **exata** de trecho (o resto do texto fica idêntico) e `validarTexto()` em código; mostra antes × depois e pode **desfazer** |
| provar | **exame = eval-porteiro**: os cenários de aceite do cliente com o rascunho; reprovou, não publica |
| aplicar | versão nova no Redis do agente (`base:vigente`); o atendimento lê a cada turno (cache de 10 s); voltar versão é um clique |

**Material para ensinar:** até 3 arquivos (PDF, Word `.docx`, texto, Markdown,
CSV, imagem; 3 MB no total) ou 3 links públicos (site, Google Docs ou Planilhas
com "qualquer pessoa com o link"). Vira texto uma vez; o arquivo não é guardado.
O que é proibido (preço, taxa, senha, dado pessoal) não entra mesmo que esteja
no material. Link para localhost ou IP interno é bloqueado.

**Onde mora o editável:** blocos do prompt marcados com
`<!-- base:id -->…<!-- /base -->` mais os textos fixos que as ferramentas
devolvem (encerramentos, aviso de fora do horário). Sem edição, o prompt
renderizado é **byte a byte** o arquivo sem os marcadores — prove num teste.

**E a régua §2, o catálogo §4, o RAG §5 e as mídias §7?** Continuam decidindo
**onde um conhecimento mora**. Na v5 eles aparecem como destinos do curador e
como grupos em *O que ela sabe*, nunca como aba nova. Cliente que cota preço
ganha o catálogo como destino; cliente com manual de 40 páginas ganha o RAG
como destino. A estrutura de quatro abas não muda.

> 🩸 **O eval-porteiro é inegociável.** Humano aprova sem ler, e foi assim que a casa quase
> publicou a regressão da Porta 3 (nota 10→2 numa "melhoria" inocente, `comum/EVALS.md` §8). Na
> InovPay o exame tem 14 cenários; o ruído do modelo foi medido em ≈1 falha a cada 30 rodadas de um
> cenário (08/10/2026), por isso o "2 de 3" no cenário que falhou: regressão de verdade falha
> sempre, o acaso não barra edição boa.

Código de referência: `assets/central-v5/central/app/(painel)/ensinar/` (tela) e
`assets/central-v5/agente/lib/curador.ts`, `base-core.ts`, `base.ts`,
`exame.ts`, `material.ts` (motor). `ESCOLA.md` e `assets/escola/` ficam como
legado das Centrais v4.1.

---

## §7 · MÍDIAS 🔷

Foto, PDF e vídeo que a IA envia no atendimento, organizados por categoria. O tipo é validado por
**content-type da resposta** (nunca pela extensão — `ghl/PEGADINHAS.md §GHL-14`: link de mídia vem
sem extensão, e um HEAD leva 405). O dono sobe; a régua §2 manda pra cá o que o cliente pedir que a
IA **mostre** (cardápio em PDF, tabela de preço em imagem, vídeo do espaço).

### 7.1 · O LEDGER DE CUSTOS — valor por execução e gasto geral

Cada execução nova congela o custo estimado **na hora em que aconteceu**:

```ts
{
  tokens: { input, cacheWrite, cacheRead, output, chamadas },
  vozCaracteres,
  sttSegundos,
  claudeUsd, vozUsd, sttUsd, infraBrl,
  usdBrl, tabela, modelo,
  totalUsd, totalBrl
}
```

**Por que gravar e não recalcular:** preço de modelo, contrato e câmbio mudam.
Recalcular dezembro com a tabela de março falsifica o passado. A execução guarda
a tabela e a cotação usadas; a fatura do provedor permanece o fechamento
contábil.

**O acumulador soma tudo:** chamada inicial, loops de tool, retry por
`max_tokens`, resposta final forçada, voz realmente entregue e transcrição nova.
Contar só a resposta final subestima justamente as conversas complexas.

**Honestidade do histórico:** registros anteriores ao ledger aparecem como
`não medido`. Nunca aplique uma média retroativa e apresente como fato.

**Valores padrão em 23/07/2026:** Sonnet 5 usa preço introdutório oficial até
31/08/2026 e muda automaticamente para a tabela padrão depois; cache write =
1,25× input e cache read = 10% do input. ElevenLabs Flash e Groq Whisper usam
env configurável. Ao propagar, confirme preços oficiais e contrato do cliente.

**Na v5 (InovPay)** o diário grava o custo do **modelo de linguagem** por execução
(`custo: { totalBrl, modeloUsd, usdBrl, tokens }`, cotação em `COST_USD_BRL`). Transcrição de
áudio, leitura de imagem e infraestrutura não entram, e a tela de Resultados diz isso. Modelo fora
da tabela de preço do `execlog.ts` fica `não medido`, nunca estimado.

🩸 **Primeira prova:** endpoint financeiro em produção em 23/07/2026, separando
5 registros antigos como `sem custo`. A prova E2E final é uma conversa nova
gerar `custo.totalBrl`; até isso acontecer, diga “ledger no ar, aguardando
primeira execução”, não “validado ponta a ponta”.

---

## §8 · O TEMA claro/escuro 🏠 — padrão visual, não opção

**Tema claro/escuro é PADRÃO de toda Central, não um extra de alguns projetos.** Foi a divergência
que o mestre citou ("uns têm, outros não") como sintoma da falta de padrão. A partir desta versão:

- **tokens de tema no `globals.css`** — fundo, superfície, borda, 4 níveis de texto, cada um com par
  claro/escuro. **Nenhum componente escreve cor na mão** (se escrever, quebra num tema).
- **script anti-flash** no `layout` — aplica o tema salvo antes do primeiro paint (sem piscar).
- **respeita o SO** na 1ª visita; a escolha do usuário manda depois, salva em `localStorage`.
- **toggle** no topo da barra lateral.
- **referência:** `assets/central-v5/central/app/globals.css` (tokens) e as capturas em
  `assets/central-v5/referencia/` (escuro, claro, 375px).

**Identidade (v5):** a Central sai com a marca **Control Gestão** — logo claro/escuro no topo do
menu e no login, com "Central de Inteligência" embaixo. O cliente aparece no cartão do menu (nome
da assistente + nome do cliente), no título da aba do navegador e no título do login. Fontes:
Manrope 500–700 nos títulos, Space Grotesk no texto, JetBrains Mono nos rótulos; acento ciano
`#06b6d4`. Isso é estrutura, não muda por cliente.

> 🩸 A lição que virou padrão: cor cravada no componente (`bg-white/[0.03]`, `#0a0a0a`, `text-white`)
> vira texto invisível ou caixa preta no tema oposto. **Cor sempre em token; hover sempre em
> `hover-raise`; superfície sempre em `.surface`.** Detalhe em `reference_design_system_controlgestao`.

> 🩸 **E a segunda lição, medida em produção (22/07/2026): alpha não funciona no tema CLARO.**
> `rgba(15,23,42,0.035)` sobre fundo branco é **invisível** — o campo some e o cliente vê uma tela
> quebrada ("as caixas estão apagadas, quase ilegíveis"). No claro, superfície usa **cor sólida**
> (`#f2f4f8`) e todo input usa a classe **`.campo`** (fundo branco + borda visível). O escuro
> continua com alpha, que ali funciona. **Nunca teste um tema só.**

### 8.1 · 🩸 O FLASH DE PERFIL — a tela que pisca

**Sintoma (relatado pelo cliente):** *"aparece outra tela por 1 segundo e depois some, aparecendo a
tela certa"*.

**Causa:** a tela nasce com o perfil `dono` (fail-closed, e isso está **certo** — §11.5) e só descobre
que é `agencia` quando o `GET /api/prompt` responde. No intervalo, o React já renderizou o **título,
o texto e as abas da versão errada**. Quando o perfil chega, tudo troca na cara do usuário.

**Cura — vale para QUALQUER tela cujo conteúdo dependa de perfil ou de dado remoto:**

```tsx
const [pronto, setPronto] = useState(false)
// no carregador:  .finally(() => setPronto(true))

{!pronto ? <Esqueleto/> : <ConteudoReal/>}   // nunca a versão errada
```

**ANTICORPO:** *fail-closed no PERMISSIONAMENTO, esqueleto na RENDERIZAÇÃO.* O padrão seguro de
segurança (assumir o menor privilégio) vira bug de UX se for renderizado — porque o palpite seguro
**aparece** e depois é desmentido. Guarde os três modos atrás de `pronto &&`, não só o header.

**Como conferir:** abra a tela e leia o HTML inicial. Se ele contiver o título de **qualquer** um dos
perfis, ainda pisca. Certo é conter só o esqueleto.

---

## §9 · VERSIONAMENTO E PROPAGAÇÃO — evoluir controladamente

**Como a Central evolui sem virar "um de cada jeito":**

**`SISTEMA_VERSAO`** é a versão do **padrão compartilhado** — não do conteúdo do cliente. Na v5
ela mora em `central/components/Sidebar.tsx` e aparece no rodapé do menu: `CENTRAL V5 · 4 ABAS`.
(Nas Centrais v4.1 ela mora em `lib/manifest.ts`, formato `AAAA.MM.DD-marco`.) Toda mudança de
**padrão** (aba nova, subaba nova pra todos, destino novo, trava nova) bump essa versão. Bate o olho
no rodapé de cada cliente e você sabe quem está atrás.

> A InovPay, que deu origem à v5, ainda mostra `CENTRAL V4.1 · 4 ABAS` no rodapé porque nasceu antes
> de o padrão ganhar número. No próximo deploy dela, troque para `CENTRAL V5 · 4 ABAS`.

> 🩸 A `SISTEMA_VERSAO` foi mandada em 5 documentos por meses **sem existir no código** — a doutrina
> dizia "bump" e a constante não existia. Foi criada em 22/07/2026 (`ESCOLA.md`). **Doc que afirma
> que algo existe é pior que doc omissa.** Este §9 só vale porque a constante agora existe.

**O ritual de propagação** (quando o padrão evolui):
1. a evolução entra **no padrão** (aqui e no código do template), com bump de `SISTEMA_VERSAO`
2. cicatriz nova → entra na fonte (a skill) e propaga (a regra de `feedback_propagacao_cicatriz`)
3. cada cliente ativo recebe a atualização **redeployado** — componente que só vive no template não
   chegou em ninguém (a "4ª perna", `SKILL.md §7.3`)
4. **nada entra no manifesto como `ativo` sem prova com data**

**Bug × evolução (a Lei 2 do §0):** bug se conserta no cliente na hora e vira cicatriz. Evolução de
padrão bump versão e propaga. Não confunda — correção urgente local ≠ mudança de padrão global.

---

## §10 · A ORDEM DE CONSTRUÇÃO — a professora que executa

### 10.1 · Criar a Central de um cliente NOVO (a 1ª tarefa, a 2ª…)

**Toda Central nova é igual à da InovPay.** O caminho é sempre este:

```
1. o agente do cliente já está no ar e provado?  (ghl/PLAYBOOK.md ou kommo/PLAYBOOK.md)
      └─ SEM isso, não há o que a Central mostre. Pare e faça o agente primeiro.
      └─ o diário precisa gravar turnoLead, respostaIA, perfil, porta (motivo) e custo.
2. copie assets/central-v5/central/ para <repo-do-agente>/central/
      └─ NÃO monte aba por aba, NÃO aplique camadas antigas (v2 → v3 → Escola → v4.1).
3. leve o lado do agente: assets/central-v5/agente/ (api/central, api/base, api/teste,
   central-data, execlog, base-core, base, curador, material, exame, teste, conversas-reais)
      └─ marque os blocos editáveis no prompt com <!-- base:id -->…<!-- /base -->
4. troque o CONTEÚDO, nunca a estrutura (tabelas de assets/central-v5/INSTALAR.md):
      · identidade do cliente (Sidebar, layout, login, package.json)
      · lib/como-usar.ts inteiro · motivos/perfis/marcos (central-data ↔ types ↔ format)
      · textos de negócio (intelligence, Resultados, Operação, Teste, Ensinar)
5. rode o PORTÃO DE SOBRAS: o grep do INSTALAR.md tem que voltar vazio
      └─ texto da InovPay na Central de outro cliente é vazamento, e o cliente percebe.
6. CENTRAL_SECRET no agente; AGENT_URL / AGENT_SECRET / APP_PASSWORD / AUTH_SECRET na Central
7. projeto Vercel próprio (central-<cliente>), Root Directory = central
8. provas: typecheck + build · as 7 telas nos dois temas · 375px com
   scrollWidth === clientWidth · fail-closed com segredo errado · /teste respondendo ·
   um pedido real em /ensinar virando rascunho e passando (ou barrando) no exame
9. gere uma conversa real e confirme `custo.totalBrl` no histórico
10. rode `node scripts/audit-skill.mjs` na fonte da skill
11. registre o cliente e a SISTEMA_VERSAO dele (CENTRAL V5 · 4 ABAS), com data
```

> **Legado:** as Centrais que já estão no ar em v4.1 foram montadas na ordem
> `central-v2 → central-v3 → Escola → central-v4.1`, com o `/cerebro` de seis
> modos. Para mantê-las, siga `assets/central-v4/INSTALAR.md`. Para trazê-las ao
> padrão, use o ritual de migração abaixo. Cliente novo nunca entra por esse caminho.

### 10.2 · Evoluir uma Central EXISTENTE (o ritual)

```
1. a mudança é BUG ou PADRÃO?
      · bug   → conserta no cliente, vira cicatriz aqui, fim.
      · padrão→ segue abaixo.
2. escreve o padrão novo AQUI primeiro (a professora aprende antes de executar)
3. implementa no template + bump SISTEMA_VERSAO
4. testa (tsc limpo, teste do motor verde, smoke na tela)
5. propaga pros clientes ativos, um a um, redeployando (a 4ª perna)
6. atualiza o manifesto de cada um com a versão nova + prova datada
```

**Migrar uma Central v4.1 para a v5** é evolução de padrão (ritual acima), feita um cliente por
vez: instale a v5 num projeto Vercel novo apontando pro mesmo agente, leve o lado do agente
(`api/base`, `api/teste`, curador, exame), confira que o conteúdo do cliente chegou em
`como-usar.ts` e nos textos da base, rode as provas do §10.1 e só então troque o link que o cliente
usa. Peça da v4.1 que esse cliente usa de verdade (Recuperação, Agenda, Recibo) entra como subaba
(§1.1), nunca como aba.

> 🏛️ **Esta é a resposta ao pedido do mestre:** a skill **sabe** a primeira tarefa e a segunda. Criar
> Central nova é o §10.1; evoluir é o §10.2. Não é adivinhação a cada projeto — é o mesmo caminho,
> sempre, e ele melhora com versão.

---

## §11 · O QUE É NOSSO E NÃO SE PERDE (o motor de segurança)

A Continuare ganhou no produto; a casa ganhou no motor. **Estas peças ficam por baixo de TODA
Central, invisíveis, e adotar o layout deles jamais pode custar qualquer uma:**

1. **Eval como PORTEIRO** — juiz automático, cenários com nota, **bloqueia** publicação que quebre o
   que já passava. A trava que a Continuare não tem. (`comum/EVALS.md`)
2. **Triagem determinística** — regex que impede dado volátil (preço/prazo/data) de entrar no
   cérebro, com a régua §2 completa. (`assets/escola/`)
3. **Anonimização de PII** — antes de guardar qualquer conversa (o celular-BR = CPF, etc.).
4. **O organismo** — guardião diário (valida o mapa contra o CRM vivo), analista semanal, auditora de
   funil, alertas no grupo, diário estruturado. A Central **colhe** o que ele produz.
5. **Ninguém edita prompt cru pela Central** — o dono ensina em português pelo curador (§6); regra
   de atendimento, roteiro e travas mudam no repositório, pela Control Gestão, com eval.

> 🩸 **A frase que resume o padrão:** *pegue a casca da Continuare e o motor da casa.* O cliente vê a
> simplicidade deles; a segurança nossa roda escondida. Nenhuma das duas metades é opcional.

---

## §12 · FONTES

**🔷 A análise da Continuare** (`continuare-ia.vercel.app`, acesso autorizado pelo mestre — sócio da
Continuare —, 22/07/2026). Mapeadas: 7 rotas (`/` `/ao-vivo` `/cerebro` `/configurar` `/dashboard`
`/rastreio` `/testar`) e 9 endpoints (`/api/testar` `/api/treinar` `/api/simulador` `/api/admin/prompt`
`/api/admin/business` `/api/live` `/api/media/upload` + login/reset). Confirmado: cérebro por seções,
catálogo com import de planilha, mídias por categoria, testar+corrigir fundido, few-shot como destino,
guarda de recusa — **e ausência de eval-porteiro** (têm cenários que "rodam", sem nota/bloqueio; a
trava deles é confirmação humana). Conteúdo da clínica **não** foi copiado — só o desenho de produto.

**🏠 A Central da InovPay — o padrão v5** (`Control-Gesta0/inovpay`, pasta `central/`, commit
`08daba9`, 08/10/2026; produção em `central-inovpay.vercel.app`). Copiada fiel em
`assets/central-v5/`. Provas da cópia: `tsc` limpo, `next build` com 14 rotas, 7 telas × 2 temas ×
1440/375px sem overflow.

**🏠 A base da casa:**
| Peça | Onde |
|---|---|
| **Central v5 (padrão vigente)** | `assets/central-v5/` + `assets/central-v5/INSTALAR.md` |
| A Escola (legado v4.1: testar+corrigir, o motor, o modelo de dados) | `ESCOLA.md` + `assets/escola/` |
| Limiares medidos prompt × RAG × custo | `comum/CONTEXT-ENG.md` |
| O eval como porteiro | `comum/EVALS.md` |
| O organismo e a Central atual | `SKILL.md` §1 · `comum/ARQUITETURA.md` |
| Versionamento e propagação (a 4ª perna) | `SKILL.md` §7.3 · `ESCALA.md` |
| Design system e tema | `reference_design_system_controlgestao` |

---

> **A régra de ouro deste arquivo:** a Central é o rosto do que a casa faz. Ela segue **um** padrão,
> evolui **sempre**, e propaga **versionada**. Casca simples pro cliente, motor de segurança por
> baixo. Quando em dúvida sobre onde um conhecimento mora, volte ao **§2** — é a peça-mãe.
