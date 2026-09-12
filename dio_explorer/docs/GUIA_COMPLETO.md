# 📖 Guia Completo — DIO Explorer com IBM Bob

> Documentação completa do projeto final da **Formação IBM Bob** na DIO.  
> Este guia cobre todos os prompts utilizados, modos de uso, dicas práticas e insights para quem deseja aprender com este projeto.

---

## Índice

1. [O que é este projeto](#1-o-que-é-este-projeto)
2. [Arquitetura do Projeto](#2-arquitetura-do-projeto)
3. [Fase 1 — Comandos Bob (Slash Commands)](#3-fase-1--comandos-bob-slash-commands)
4. [Fase 2 — Lógica de Negócio e Testes](#4-fase-2--lógica-de-negócio-e-testes)
5. [Fase 3 — Servidor MCP](#5-fase-3--servidor-mcp)
6. [Todos os Prompts Utilizados](#6-todos-os-prompts-utilizados)
7. [Modos de Uso do IBM Bob](#7-modos-de-uso-do-ibm-bob)
8. [Dicas de Uso](#8-dicas-de-uso)
9. [Insights para Futuros Profissionais](#9-insights-para-futuros-profissionais)

---

## 1. O que é este projeto

O **DIO Explorer** é um assistente inteligente para a plataforma DIO com três capacidades principais:

- **`/trilha`** — consulta trilhas de aprendizado e gera um plano de estudos personalizado
- **`/desafio`** — gera desafios de código com template inicial por tecnologia e nível
- **`/certificado`** — emite certificados fictícios de conclusão de trilha em Markdown

O projeto demonstra o ciclo completo de criação de uma ferramenta com IBM Bob:

```
Prompt Engineering → Comandos Slash → Lógica de Negócio → Testes → Servidor MCP
```

---

## 2. Arquitetura do Projeto

### Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuário / Agente IA                       │
└────────────────────┬───────────────────────────────────────-┘
                     │
         ┌───────────┴──────────┐
         │                      │
         ▼                      ▼
  Bob Slash Commands       MCP Server
  (.bob/commands/)         (mcp/src/index.ts)
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
           Lógica de Negócio
           (src/dioCommands.js)
                    │
                    ▼
           Base de Dados JSON
           (data/trilhas_dio.json)
```

### Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| IBM Bob | — | Plataforma de IA / IDE inteligente |
| Node.js | ≥ 18 | Runtime do servidor MCP |
| TypeScript | 5.x | Linguagem do servidor MCP |
| `@modelcontextprotocol/sdk` | 1.15+ | SDK oficial do protocolo MCP |
| Zod | 3.x | Validação de schema das ferramentas MCP |
| Jest | 29.x | Framework de testes unitários |
| Python | 3.x | Implementação alternativa dos comandos |

### Dados

O arquivo `data/trilhas_dio.json` contém o catálogo de trilhas com o schema:

```json
{
  "trilhas": [
    {
      "id": 1,
      "nome": "Trilha Java Completa",
      "tecnologia": "Java",
      "nivel": "Intermediário",
      "numero_de_modulos": 8,
      "xp_total": 4500,
      "badges_disponiveis": ["Java Developer", "OOP Master"],
      "promocoes": {
        "desconto_percentual": 20,
        "validade": "2025-08-31",
        "cupom": "DIO20"
      },
      "vitalicio": true,
      "lives_ao_vivo": [
        { "titulo": "Java 21 Features", "data": "2025-08-10", "hora": "19:00" }
      ]
    }
  ]
}
```

---

## 3. Fase 1 — Comandos Bob (Slash Commands)

Os slash commands são arquivos Markdown em `.bob/commands/`. Quando o usuário digita `/trilha Python` no Bob, o arquivo `trilha.md` é executado com `$1 = "Python"`.

### Como funcionam

1. O arquivo `.md` começa com um bloco YAML (frontmatter) com `description` e `argument-hint`
2. O corpo do arquivo é um **prompt** enviado ao modelo de linguagem
3. Parâmetros posicionais: `$1`, `$2`, etc.
4. O modelo lê arquivos do workspace, processa e responde

### `/trilha` — Prompt completo

**Arquivo:** `.bob/commands/trilha.md`

```markdown
---
description: Exibe o plano de estudos formatado de uma trilha DIO
argument-hint: <tecnologia>
---

Leia o arquivo `data/trilhas_dio.json` que está na raiz deste projeto (pasta `dio_explorer`).

Com base no conteúdo desse arquivo, encontre todas as trilhas cujo campo `tecnologia`
contenha **$1** (busca case-insensitive, sem diferenciar acentos).

Se nenhuma trilha for encontrada, informe ao usuário e liste todas as tecnologias
disponíveis no arquivo a partir dos valores únicos do campo `tecnologia`.

Se uma ou mais trilhas forem encontradas, exiba cada uma com:
- Tabela com tecnologia, nível, módulos, XP, acesso vitalício
- Badges com 🏆 na frente de cada uma
- Plano de estudos com exatamente {numero_de_modulos} módulos numerados,
  cada um com 3 a 5 tópicos práticos
- Promoção ativa (se desconto_percentual > 0)
- Próximas lives ao vivo

Use tom motivador. Emojis com moderação. Responda sempre em português.
```

**Decisões de design:**
- A busca é delegada ao LLM (que lê o JSON diretamente), tornando o comando simples e poderoso
- O plano de estudos é gerado dinamicamente pela IA com base no número real de módulos
- O tom motivador foi intencional para o contexto de plataforma educacional

---

### `/desafio` — Prompt completo

**Arquivo:** `.bob/commands/desafio.md`

```markdown
---
description: Gera um desafio de código aleatório por tecnologia e nível
argument-hint: <tecnologia> <nivel>
---

Gere um **desafio de código aleatório** para a tecnologia **$1** no nível **$2**.

Níveis aceitos: `iniciante`, `intermediário` ou `avançado`
(aceite variações de maiúsculas, minúsculas e sem acento).

Se o nível não for reconhecido, pergunte ao usuário qual dos três níveis ele deseja.

Apresente o desafio com as seções:
- 📋 Descrição (2 a 4 frases)
- 🎯 Objetivo (bullets)
- 📥 Entrada (com exemplo)
- 📤 Saída Esperada
- 📌 Restrições (2 a 4)
- 💡 Dica (sutil, sem entregar a solução)
- 🧩 Template Inicial (código com assinatura, docstring, corpo vazio)

Critérios de dificuldade:
- iniciante → strings, loops, listas simples, lógica básica
- intermediário → estruturas de dados, recursão, ordenação, APIs
- avançado → grafos, programação dinâmica, concorrência, design patterns

Varie sempre o tema. Nunca repita o mesmo problema em chamadas consecutivas.
Adapte o template à linguagem de $1. Responda sempre em português.
```

**Decisões de design:**
- A variação do tema é solicitada explicitamente para evitar repetição
- O template de código deve ter o corpo vazio — a IA não deve resolver o desafio
- A validação do nível inclui tratamento de entrada por escolha do usuário

---

### `/certificado` — Prompt completo

**Arquivo:** `.bob/commands/certificado.md`

```markdown
---
description: Gera um certificado fictício de conclusão em Markdown
argument-hint: <seu-nome> <trilha-concluida>
---

Gere um **certificado fictício de conclusão** em Markdown para **$1**
referente à trilha **$2**.

Leia o arquivo `data/trilhas_dio.json`. Procure uma trilha cujo campo `nome`
ou `tecnologia` seja compatível com **$2** (case-insensitive). Se encontrar,
use os dados reais da trilha. Caso não encontre, preencha com as informações
fornecidas pelo usuário.

Use a data atual como data de emissão. Gere um código de verificação fictício
no formato `DIO-XXXX-XXXX-XXXX`.

Após o certificado, com base nas trilhas em `data/trilhas_dio.json`, sugira
**3 trilhas complementares** com nome, motivo e frase motivadora.

Responda sempre em português.
```

**Decisões de design:**
- Fallback gracioso: se a trilha não existe no JSON, usa os dados do usuário
- Sugestão de próximos passos torna o certificado mais útil pedagogicamente
- O código de verificação cria uma sensação de autenticidade

---

## 4. Fase 2 — Lógica de Negócio e Testes

### Por que criar `dioCommands.js`?

Os slash commands dependem do LLM para funcionar. Para garantir **comportamento determinístico e testável**, a lógica de negócio foi extraída para um módulo JavaScript puro.

**Funções exportadas:**

| Função | Descrição |
|---|---|
| `carregarTrilhas(filepath?)` | Lê o JSON de trilhas |
| `normalizar(texto)` | Lowercase + remove acentos (NFD) |
| `buscarTrilhas(tecnologia, trilhas)` | Filtra por tecnologia (busca parcial) |
| `listarTecnologiasDisponiveis(trilhas)` | Lista tecnologias únicas ordenadas |
| `formatarTrilha(trilha)` | Formata uma trilha como Markdown |
| `comandoTrilha(tecnologia, trilhas)` | Integração completa do `/trilha` |
| `normalizarNivel(nivel)` | Mapeia strings de nível para canônico |
| `gerarTemplateCodigo(tecnologia, nivel)` | Template de código por linguagem |
| `gerarDesafio(tecnologia, nivel)` | Gera desafio completo em Markdown |
| `gerarCodigoVerificacao()` | Gera `DIO-XXXX-XXXX-XXXX` |
| `dataEmissaoPtBR(hoje?)` | Data no formato "15 de julho de 2025" |
| `gerarCertificado(nome, trilha, trilhas, opts?)` | Certificado completo em Markdown |

### Estratégia de testes

**113 testes** cobrindo:

- **Testes unitários puros**: cada função em isolamento com dados mockados
- **Testes de integração**: usando o arquivo `trilhas_dio.json` real
- **Testes end-to-end**: fluxo completo `/trilha` → `/desafio` → `/certificado` para um aluno fictício

**Resultado:**

```
Test Suites: 1 passed,  1 total
Tests:       113 passed, 113 total
Statements:  100%
Branches:    96%
Functions:   100%
Lines:       100%
```

### Como executar os testes

```bash
cd dio_explorer
npm install
npm test               # Com cobertura resumida
npm run test:verbose   # Com detalhes de cada teste
```

---

## 5. Fase 3 — Servidor MCP

### O que é MCP?

**Model Context Protocol** é um padrão aberto que permite que ferramentas externas sejam acessadas por agentes de IA de forma padronizada. É como uma "API universal para agentes de IA".

### Arquitetura do servidor

```
McpServer (SDK)
  ├── ferramenta: trilha      → comandoTrilha()
  ├── ferramenta: desafio     → gerarDesafio()
  └── ferramenta: certificado → gerarCertificado()

Transportes:
  ├── StdioServerTransport    → Bob / Claude Desktop (local)
  └── StreamableHTTPServerTransport → APIs / acesso remoto
```

### Instalação e build

```bash
cd dio_explorer/mcp
npm install
npm run build
```

### Executar em modo stdio (para Bob)

```bash
node build/index.js
```

### Executar em modo HTTP

```bash
TRANSPORT=http PORT=3100 node build/index.js
```

### Executar com autenticação

```bash
API_KEY=minha-chave-secreta TRANSPORT=http PORT=3100 node build/index.js
```

### Testar via curl

```bash
# Listar ferramentas disponíveis
curl -X POST http://localhost:3100/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Chamar a ferramenta trilha
curl -X POST http://localhost:3100/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"trilha","arguments":{"tecnologia":"Python"}}}'
```

### Configuração no Bob

**Uso local** (`.bob/mcp.json` no workspace):

```json
{
  "mcpServers": {
    "dio-explorer": {
      "command": "node",
      "args": ["caminho/absoluto/para/dio_explorer/mcp/build/index.js"]
    }
  }
}
```

**Uso remoto** (servidor HTTP já rodando):

```json
{
  "mcpServers": {
    "dio-explorer-remote": {
      "type": "http",
      "url": "https://meu-servidor.exemplo.com/mcp",
      "headers": {
        "Authorization": "Bearer minha-chave"
      }
    }
  }
}
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `TRANSPORT` | `stdio` | `"stdio"` ou `"http"` |
| `PORT` | `3100` | Porta HTTP (modo http) |
| `API_KEY` | _(vazio)_ | Chave de autenticação (ativa auth quando definida) |
| `DATA_PATH` | `../data/trilhas_dio.json` | Caminho alternativo para os dados |

---

## 6. Todos os Prompts Utilizados

Esta seção documenta os prompts que foram usados **para construir o próprio projeto** com o IBM Bob.

### Prompt 1 — Criar a estrutura do projeto

```
Crie a estrutura de pastas do projeto DIO Explorer com:
- Pasta principal dio_explorer/
- Subpastas: src/, data/, docs/, commands/, mcp/
- Arquivo .gitignore adequado para Node.js
- Arquivos .gitkeep nas pastas vazias
- package.json configurado para Jest com cobertura mínima de 70%
```

### Prompt 2 — Criar a base de dados de trilhas

```
Crie o arquivo data/trilhas_dio.json com pelo menos 10 trilhas fictícias
mas realistas para a plataforma DIO. Cada trilha deve ter:
id, nome, tecnologia, nivel, numero_de_modulos, xp_total,
badges_disponiveis, promocoes (desconto_percentual, validade, cupom),
vitalicio, lives_ao_vivo (titulo, data, hora).

Inclua tecnologias variadas: Java, Python, JavaScript, React, Node.js,
TypeScript, Docker, Kubernetes, etc.
Alguns com promoção ativa, outros sem.
Algumas com lives agendadas, outras não.
```

### Prompt 3 — Criar o slash command `/trilha`

```
Crie o arquivo .bob/commands/trilha.md como um slash command do Bob.
O comando recebe uma tecnologia como argumento ($1) e deve:
1. Ler o arquivo data/trilhas_dio.json
2. Buscar trilhas cujo campo tecnologia contenha $1 (case-insensitive, sem acentos)
3. Se não encontrar, listar as tecnologias disponíveis
4. Se encontrar, exibir ficha completa + plano de estudos gerado pela IA
   com exatamente o numero_de_modulos correto da trilha
5. Usar tom motivador, emojis com moderação, responder em português
```

### Prompt 4 — Criar o slash command `/desafio`

```
Crie o arquivo .bob/commands/desafio.md como slash command do Bob.
Argumentos: $1 = tecnologia, $2 = nível.
Deve gerar desafios variados com as seções:
Descrição, Objetivo, Entrada, Saída, Restrições, Dica, Template Inicial.
O template deve ter apenas a assinatura da função, sem implementação.
Incluir critérios de dificuldade por nível.
Nunca repetir o mesmo tipo de problema.
```

### Prompt 5 — Criar o slash command `/certificado`

```
Crie .bob/commands/certificado.md. Argumentos: $1 = nome do aluno, $2 = trilha.
Deve ler trilhas_dio.json, buscar por nome ou tecnologia (case-insensitive).
Se encontrar, usar dados reais. Se não encontrar, usar dados do usuário.
Gerar código de verificação fictício no formato DIO-XXXX-XXXX-XXXX.
Após o certificado, sugerir 3 trilhas complementares com justificativa.
```

### Prompt 6 — Criar a lógica de negócio JavaScript

```
Crie src/dioCommands.js com toda a lógica de negócio dos três comandos
em funções puras e testáveis. Exporte todas as funções.
As funções devem ser independentes do Bob/LLM — só usar Node.js padrão.
Inclua: carregarTrilhas, normalizar, buscarTrilhas,
listarTecnologiasDisponiveis, formatarTrilha, comandoTrilha,
normalizarNivel, gerarTemplateCodigo, gerarDesafio,
gerarCodigoVerificacao, dataEmissaoPtBR, gerarCertificado.
```

### Prompt 7 — Criar os testes unitários com Jest

```
Crie src/dioCommands.test.js com testes Jest para todas as funções de
dioCommands.js. Requisitos:
- Cobertura mínima de 70% em todas as métricas
- Testes unitários com dados mockados E integração com o arquivo real
- Suite de fluxo completo simulando um aluno real (Java)
- Testar casos felizes E casos de erro (tecnologia não encontrada,
  nível inválido, trilha não encontrada)
- Incluir testes para normalização de acentos e case-insensitive
```

### Prompt 8 — Criar o servidor MCP em TypeScript

```
Crie mcp/src/index.ts como servidor MCP para o DIO Explorer.
Use @modelcontextprotocol/sdk com McpServer e registerTool.
Expor três ferramentas: trilha, desafio, certificado.
Suportar dois transportes: stdio (padrão) e HTTP (TRANSPORT=http).
No modo HTTP: autenticação opcional por API_KEY via header Bearer ou x-api-key,
rota /health, gerenciamento de sessões com Map.
Usar Zod para validação dos inputSchema de cada ferramenta.
Variáveis de ambiente: TRANSPORT, PORT, API_KEY, DATA_PATH.
```

### Prompt 9 — Configurar o MCP no Bob

```
Configure o arquivo .bob/mcp.json no workspace para registrar o servidor
dio-explorer usando o executável node com o caminho absoluto para
mcp/build/index.js. O servidor deve rodar em modo stdio.
```

### Prompt 10 — Criar README do servidor MCP

```
Crie mcp/README.md com documentação completa do servidor MCP.
Incluir: ferramentas disponíveis, modos de transporte, instalação,
configuração no Bob (stdio e HTTP remoto), variáveis de ambiente,
autenticação (API key e HTTPS/nginx), exemplos de uso via Bob,
exemplos de chamada curl, estrutura de arquivos.
```

---

## 7. Modos de Uso do IBM Bob

### Modo Agent (padrão)

O modo usado durante todo o desenvolvimento. Permite ler/escrever arquivos, executar comandos, criar testes.

```
Bob Agent → lê código → entende contexto → cria/edita arquivos → roda testes
```

**Quando usar:** Para implementar funcionalidades, criar arquivos, rodar testes, corrigir bugs.

### Modo Ask

Para tirar dúvidas conceituais sem alterar código.

```
"Como funciona o protocolo MCP?"
"Qual a diferença entre stdio e HTTP transport no MCP SDK?"
```

**Quando usar:** Para aprender conceitos, entender erros, buscar documentação IBM.

### Modo Plan

Para desenhar a arquitetura antes de implementar.

```
"Planeje a estrutura de um servidor MCP com autenticação e rate limiting"
```

**Quando usar:** Para projetos novos, decisões arquiteturais, quebrar tarefas complexas.

### Slash Commands no projeto

| Comando | Uso |
|---|---|
| `/trilha Python` | Consultar trilha de Python |
| `/desafio JavaScript intermediário` | Gerar desafio JS intermediário |
| `/certificado "Ana Lima" React` | Emitir certificado para Ana |

### MCP Tools via Bob (após registrar o servidor)

Após registrar o servidor MCP, o Bob passa a ter as ferramentas disponíveis automaticamente. Basta conversar naturalmente:

- *"Quais trilhas de Python estão disponíveis?"*
- *"Gere um desafio de Java avançado para mim"*
- *"Emita meu certificado de conclusão da trilha React"*

---

## 8. Dicas de Uso

### Para slash commands

**✅ Faça:**
- Use nomes de tecnologia como aparecem no JSON (`Python`, `Java`, `React`)
- Experimente nomes parciais: `/trilha node` encontra trilhas Node.js
- Use aspas para nomes com espaços: `/certificado "João Silva" "Node.js"`

**❌ Evite:**
- Não use tecnologias que não existem no JSON sem esperar fallback
- Não espere o mesmo desafio duas vezes (variação é intencional)

### Para o servidor MCP

**Em desenvolvimento:**
```bash
# Teste rápido sem build (modo desenvolvimento)
node --loader ts-node/esm src/index.ts
```

**Em produção:**
```bash
# Sempre faça o build antes de usar em produção
npm run build
TRANSPORT=http API_KEY=chave-segura PORT=3100 node build/index.js
```

**Adicionando novas trilhas:**
- Edite `data/trilhas_dio.json` seguindo o schema existente
- O servidor recarrega os dados a cada chamada (sem restart necessário)

### Para testes

```bash
# Executar apenas um grupo de testes
npx jest --testNamePattern="gerarDesafio"

# Ver cobertura no browser
npm test -- --coverageReporters=html
# Abrir coverage/index.html
```

### Para expandir o projeto

**Adicionar nova ferramenta no MCP:**

1. Criar função em `src/dioCommands.js`
2. Escrever testes em `dioCommands.test.js`
3. Adicionar `server.registerTool()` em `mcp/src/index.ts`
4. Fazer rebuild: `cd mcp && npm run build`

**Adicionar novo slash command:**

1. Criar `novocomando.md` em `.bob/commands/`
2. Começar com frontmatter `description` e `argument-hint`
3. Escrever prompt claro com `$1`, `$2`, etc.

---

## 9. Insights para Futuros Profissionais

### 🧠 Prompt Engineering é uma habilidade de software

Os prompts dos slash commands não são "frases mágicas" — são **especificações de comportamento**. Trate-os com o mesmo rigor de código:

- **Seja explícito sobre edge cases**: "Se não encontrar, liste as opções disponíveis"
- **Defina o formato de saída**: estrutura Markdown, seções obrigatórias, emojis com moderação
- **Inclua restrições**: "Nunca repita o mesmo tipo de problema"
- **Defina a persona**: "Tom motivador, responda sempre em português"

### 🏗️ Separe o prompt da lógica de negócio

O maior erro ao trabalhar com IA é colocar toda a lógica no prompt. Neste projeto, a **lógica de negócio** (busca, normalização, formatação) vive em `dioCommands.js` — testável, determinística, sem IA.

O prompt só dirige **o que fazer**, não **como fazer**. Isso torna o sistema:
- Testável (113 testes, 100% de cobertura)
- Previsível
- Manutenível sem depender do LLM

### 🔌 MCP é o futuro da integração de ferramentas com IA

O Model Context Protocol está se tornando o padrão da indústria para conectar ferramentas a agentes de IA. Dominar MCP hoje é equivalente a dominar REST APIs em 2010 — uma habilidade que vai diferenciá-lo no mercado.

**Conceitos importantes:**
- `stdio` é para uso local (desenvolvimento, IDEs, CLIs)
- `HTTP/SSE` é para produção (múltiplos clientes, acesso remoto)
- Sempre valide inputs com Zod ou JSON Schema
- Sessões no modo HTTP garantem contexto por cliente

### 🧪 Testes são sua rede de segurança ao iterar com IA

Ao usar IA para gerar código, o risco não é o código inicial — é as **mudanças subsequentes**. Uma suíte de testes robusta permite que você itere com confiança, sabendo que o comportamento existente não foi quebrado.

Estratégia recomendada:
1. Escreva os testes **junto** com o código (não depois)
2. Teste **unidades pequenas** com dados mockados
3. Adicione testes de **integração** com dados reais
4. Crie **fluxos end-to-end** que simulam o uso real

### 🎯 Dados são o produto, não o código

O `trilhas_dio.json` é o coração do DIO Explorer. Sem ele, nenhuma ferramenta funciona bem. Pense sempre na **qualidade dos dados** que sua ferramenta de IA vai consumir:

- Estrutura consistente (schema bem definido)
- Campos suficientes para casos de uso reais
- Dados de fallback para entradas inválidas

### 🚀 Comece pequeno, expanda com confiança

Este projeto seguiu uma progressão deliberada:

```
Prompt simples → Slash Command → Lógica testável → Servidor MCP
```

Cada fase validou a anterior antes de avançar. Esta abordagem incremental é a mais segura ao trabalhar com IA — você sempre tem um estado funcional para voltar.

### 💡 O IBM Bob é uma IDE, não um chatbot

Use os diferentes **modos do Bob** intencionalmente:

- **Agent**: para implementar (escreve código, roda testes, corrige erros)
- **Plan**: para arquitetar (quebra problemas, discute trade-offs)
- **Ask**: para aprender (consulta documentação, explica conceitos)

Combinar os modos é mais poderoso do que usar apenas um.

---

## Referências e Recursos

- [DIO — Digital Innovation One](https://dio.me)
- [IBM Bob Documentation](https://ibm.com/bob)
- [Model Context Protocol — Spec Oficial](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Jest — Testing Framework](https://jestjs.io)
- [Zod — TypeScript Schema Validation](https://zod.dev)

---

*"O conhecimento é a única riqueza que ninguém pode te tirar."*  
**Digital Innovation One — [dio.me](https://dio.me)**
