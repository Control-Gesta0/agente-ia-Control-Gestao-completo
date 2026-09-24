# Humanizer aplicado a prompt de agente (PT-BR)

Esta pasta traz uma cópia da skill [blader/humanizer](https://github.com/blader/humanizer)
(licença MIT, `LICENSE` ao lado; versão 3.0.0, commit `9862685`, 06/09/2026) em
`HUMANIZER.md`. Ela lista 25 padrões de texto com cara de IA, baseados no guia
*Signs of AI writing* da Wikipédia. Com a cópia aqui dentro, a skill da Control Gestão
funciona mesmo quando o `humanizer` não está instalado na sessão.

Este arquivo diz como usar o humanizer na hora de **escrever** o prompt do agente,
não só na revisão. A regra continua sendo a de `SKILL.md §5.1`: o filtro mexe na forma,
e o fato (preço, prazo, nome da oferta, regra, porta) não pode sumir.

## Por que o prompt precisa passar pelo filtro

O modelo imita o registro do prompt. Se o `prompt.md` está cheio de travessão,
"não é só X, é Y" e "Perfeito! Vamos lá", o agente devolve o mesmo tom pro lead.
Um prompt escrito do jeito que o melhor vendedor da casa fala produz respostas
nesse tom com menos instrução de estilo.

## O que passa pelo filtro e o que fica intacto

| Passa (prosa que o lead lê ou que o modelo copia) | Fica como está |
|---|---|
| Persona, tom e abertura da porta | Nome de tool (`salvar_respostas`) e de campo |
| Frases de exemplo e few-shots | Variáveis `{{...}}` e `[PLACEHOLDER]` |
| Objeções e respostas prontas | Preço, prazo, número, data, link |
| Encerramento, textos de fallback (`textoSeguro`) | Regras de segurança e de alçada (só a redação pode mudar) |
| Cadências de followup e recuperação | IDs, `enum_id`, regex das travas |
| Mensagem de menu (`menu.texto`, `pedirResumo`) | Blocos de código e JSON |

## Os 25 padrões traduzidos pro WhatsApp comercial

Numeração igual à de `HUMANIZER.md`. Os marcados com ★ são os 8 tells de `SKILL.md §5.1`.

| # | Padrão | Como aparece em PT-BR | Reescrita típica |
|---|---|---|---|
| 1 ★ | Não X, mas Y | "Não é só um curso, é uma transformação" | "São 8 semanas com aula ao vivo e correção individual" |
| 2 ★ | Fecho de uma linha | "Simples assim." · "Faz sentido?" em toda mensagem | Terminar na última informação útil |
| 3 | Frase de efeito | "No fundo, o que importa é..." · "a chave do sucesso" | Dizer o fato concreto |
| 4 ★ | Abertura encenada | "Ótima pergunta!" · "Bora lá!" · "Deixa eu te explicar" | Começar pela resposta |
| 5 | Discutir com ninguém | "Não estou dizendo que..." · "Pode parecer que..., mas" | Cortar a defesa |
| 6 ★ | Tríade forçada | "prático, rápido e eficiente" | Os itens que existem de verdade |
| 7 | Mesma abertura repetida | "Você vai... Você terá... Você pode..." | Juntar frases ou mudar o sujeito |
| 8 ★ | Travessão | "O curso — que começa em março — custa..." | Vírgula, ponto ou dois-pontos |
| 9 | Ressalva empilhada | "pode ser que eventualmente talvez" | Uma ressalva, quando for real |
| 12 ★ | Vocabulário de IA | "robusto", "potencializar", "no cenário atual", "vale ressaltar", "de forma eficaz", "aliado estratégico", "jornada" (fora de contexto) | O verbo que o dono do negócio usaria num áudio |
| 13 | Importância inflada | "um marco na sua carreira" | O resultado concreto, se existir |
| 16 | Linguagem de anúncio | "incrível", "exclusivo", "imperdível", "revolucionário" | Descrever o que é |
| 18 | Evitar "é" e "tem" | "conta com", "dispõe de", "se destaca por" | "tem", "é" |
| 19 ★ | Negrito decorativo | "**Vantagem:** você aprende no seu ritmo" | Prosa. Negrito só em preço, data e nome da oferta |
| 20 ★ | Emoji como rótulo | "🚀 Início" · "💡 Dica:" | Tirar o emoji-rótulo; emoji solto e raro pode ficar se a marca usa |
| 22 ★ | Resíduo de chatbot | "Espero ter ajudado!" · "Fico à disposição" · "Posso ajudar em algo mais?" | Cortar |
| 23 | Aviso de limite | "Com base nas informações disponíveis..." | Dizer o que não sabe e chamar o especialista |

Os padrões 10, 11, 14, 15, 17, 21, 24 e 25 quase não aparecem em conversa de WhatsApp.
Valem na Central, no relatório semanal e na proposta.

## Roteiro pra escrever um prompt novo com o filtro

1. Escreva o conteúdo primeiro, sem se preocupar com estilo (`SKILL.md §5`: fatos,
   preços, portas, a ordem da resposta).
2. Rode o humanizer em modo arquivo sobre `prompts/nucleo.md`, cada
   `prompts/portas/*.md` e os textos de `lib/crm-map.ts` que o lead lê.
   Sem a skill instalada, leia `HUMANIZER.md` e aplique a tabela acima na mão.
3. Compare antes e depois: nenhum preço, número, nome, regra ou porta pode ter sumido.
4. Coloque no prompt as regras duras de tom (bloco "Como escrever" do `nucleo.md`).
   O que dá pra checar em código fica em `lib/guards.ts` (travessão já é trava do motor).
5. Cole de 5 a 10 trechos de conversa real boa do cliente como exemplo de tom.
   Adjetivo ("seja natural") não muda nada; exemplo muda.
6. Sandbox `/cerebro`, depois o eval com o cenário `Tom humano` (`comum/EVALS.md`).

## O que não cortar

Tirar tell não é deixar o texto seco. Fala corrente ("tá", "pra", "dá uma olhada"),
mensagem curta seguida de outra curta, opinião quando a marca tem opinião, gíria do
nicho e o detalhe que só quem conhece o negócio sabe são o que faz o agente soar
como gente. Texto limpo demais vira outro sotaque de IA.

## Atualizar a cópia

```bash
git clone --depth 1 https://github.com/blader/humanizer.git /tmp/humanizer
cp /tmp/humanizer/SKILL.md humanizer/HUMANIZER.md
cp /tmp/humanizer/LICENSE  humanizer/LICENSE
```

Depois atualize a versão e o commit no topo deste arquivo. Se a numeração dos padrões
mudar, ajuste a tabela.
