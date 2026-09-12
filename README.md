# 🚀 DIO Explorer — Projeto Final de Formação IBM Bob

> Projeto desenvolvido durante a **Formação IBM Bob** na [DIO (Digital Innovation One)](https://dio.me).  
> Demonstra como construir um assistente de IA completo, com comandos customizados, servidor MCP e testes automatizados, usando o **IBM Bob** como plataforma de desenvolvimento.

---

## 📚 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Comandos Bob (Slash Commands)](#comandos-bob-slash-commands)
- [Servidor MCP](#servidor-mcp)
- [Testes Automatizados](#testes-automatizados)
- [Como Executar](#como-executar)
- [Prompts Utilizados na Construção](#prompts-utilizados-na-construção)
- [Dicas de Uso](#dicas-de-uso)
- [Insights para Futuros Profissionais](#insights-para-futuros-profissionais)

---

## Visão Geral

O **DIO Explorer** é um assistente inteligente que permite a qualquer usuário do Bob:

| Capacidade | O que faz |
|---|---|
| `/trilha <tecnologia>` | Exibe trilha de aprendizado com plano de estudos gerado por IA |
| `/desafio <tecnologia> <nivel>` | Gera um desafio de código aleatório com template inicial |
| `/certificado <nome> <trilha>` | Emite certificado fictício de conclusão em Markdown |

Tudo isso está disponível tanto via **comandos slash no Bob** quanto via **servidor MCP** (para integração com outros agentes de IA).

---

## Estrutura do Projeto

```
dio_explorer/
├── .bob/
│   ├── mcp.json              # Configuração do servidor MCP para o Bob
│   └── commands/
│       ├── trilha.md         # Prompt do comando /trilha
│       ├── desafio.md        # Prompt do comando /desafio
│       └── certificado.md    # Prompt do comando /certificado
├── commands/                 # Cópia dos comandos (referência)
├── data/
│   └── trilhas_dio.json      # Base de dados com trilhas DIO
├── docs/                     # Documentação detalhada
├── mcp/
│   ├── src/index.ts          # Servidor MCP em TypeScript
│   ├── build/index.js        # Build compilado
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md             # Documentação específica do MCP
├── src/
│   ├── dioCommands.js        # Lógica de negócio (Node.js)
│   ├── dioCommands.test.js   # Testes unitários (Jest)
│   ├── dio_commands.py       # Implementação alternativa (Python)
│   └── test_dio_commands.py  # Testes Python
├── resultados_testes.txt     # Relatório completo dos testes
└── package.json              # Configuração Jest
```

---

## Comandos Bob (Slash Commands)

Os comandos estão em `.bob/commands/` e são ativados diretamente no chat do Bob.

### `/trilha <tecnologia>`

```
/trilha Python
/trilha JavaScript
/trilha Java
```

Busca case-insensitive e sem distinção de acentos. Retorna ficha completa da trilha com plano de estudos gerado pela IA do Bob.

### `/desafio <tecnologia> <nivel>`

```
/desafio JavaScript intermediário
/desafio Python avancado
/desafio Java iniciante
```

Níveis aceitos: `iniciante`, `intermediário` / `intermediario`, `avançado` / `avancado`.

### `/certificado <seu-nome> <trilha-concluida>`

```
/certificado "João Silva" Python
/certificado "Maria Costa" React
```

Gera certificado em Markdown com dados reais da trilha, data atual, badges e código de verificação único (`DIO-XXXX-XXXX-XXXX`).

---

## Servidor MCP

O servidor MCP expõe as mesmas três ferramentas via protocolo MCP, permitindo integração com qualquer agente compatível (Bob, Claude Desktop, etc.).

### Instalação

```bash
cd dio_explorer/mcp
npm install
npm run build
```

### Configuração no Bob

O arquivo `.bob/mcp.json` já está configurado para uso local:

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

### Modos de execução

| Modo | Comando | Uso |
|---|---|---|
| stdio (local) | `node build/index.js` | Bob / Claude Desktop |
| HTTP | `TRANSPORT=http PORT=3100 node build/index.js` | APIs / acesso remoto |
| HTTP com auth | `API_KEY=minha-chave TRANSPORT=http node build/index.js` | Produção segura |

---

## Testes Automatizados

146 testes unitários, 100% de cobertura de statements e funções.

```bash
cd dio_explorer
npm install
npm test
```

| Métrica | Resultado |
|---|---|
| Testes | 146/146 ✅ |
| Statements | 100% |
| Functions | 100% |
| Branches | 98.36% |
| Lines | 100% |

---

## Prompts Utilizados na Construção

Consulte o [Guia Completo](dio_explorer/docs/GUIA_COMPLETO.md) para ver todos os prompts usados durante o desenvolvimento do projeto com o IBM Bob.

---

## Dicas de Uso

- Use `/trilha` antes de `/desafio` para conhecer o nível certo para você
- O certificado funciona mesmo para trilhas não cadastradas — ideal para uso criativo
- O servidor MCP em modo HTTP pode ser acessado por múltiplos agentes simultaneamente
- Defina `API_KEY` sempre que expor o servidor em rede pública

---

## Insights para Futuros Profissionais

Consulte o [Guia Completo](dio_explorer/docs/GUIA_COMPLETO.md) para insights detalhados sobre:

- Como pensar em "ferramentas de IA" como produtos reais
- Engenharia de prompts para comandos robustos
- Boas práticas em servidores MCP
- Como testar lógica de IA de forma determinística

---

## ✨ Melhorias Realizadas

Estas melhorias foram implementadas além do escopo mínimo do desafio:

| # | Melhoria | Detalhe |
|---|---|---|
| 1 | **Banco de desafios variados** | `gerarDesafio()` sorteia aleatoriamente entre múltiplos problemas reais por `(tecnologia, nível)`, em vez de gerar sempre o mesmo texto genérico |
| 2 | **Templates de código expandidos** | `gerarTemplateCodigo()` agora cobre JavaScript, TypeScript, React, Node.js e SQL, além de Java e Python |
| 3 | **Dupla implementação (JS + Python)** | Toda a lógica de negócio existe em [`src/dioCommands.js`](dio_explorer/src/dioCommands.js) e [`src/dio_commands.py`](dio_explorer/src/dio_commands.py) |
| 4 | **113 testes unitários** | Cobertura de 100% em statements, funções e linhas (96% em branches) |
| 5 | **Servidor MCP completo** | Suporte a stdio, HTTP e HTTP com autenticação por API key |
| 6 | **JSON rico** | Trilhas com promoções, cupons, badges, lives ao vivo e acesso vitalício |
| 7 | **Busca inteligente** | Case-insensitive + normalização de acentos em todos os comandos |
| 8 | **Guia Completo** | [`docs/GUIA_COMPLETO.md`](dio_explorer/docs/GUIA_COMPLETO.md) com todos os prompts usados e arquitetura detalhada |

---

## O que aprendi

- **Prompt Engineering é engenharia de software**: um prompt bem estruturado com exemplos, restrições e formato de saída definido se comporta como uma especificação funcional.
- **Separe o prompt da lógica de negócio**: os slash commands (`.bob/commands/`) definem *o quê* mostrar; `dioCommands.js` define *como* calcular — testável de forma determinística.
- **MCP conecta ferramentas de IA**: o protocolo MCP permite que qualquer agente compatível consuma as mesmas ferramentas, tornando o projeto extensível além do Bob.
- **Testes são a rede de segurança ao iterar com IA**: com 113 testes, cada iteração de prompt ou código pode ser validada em menos de 1 segundo.
- **Dados são o produto**: o `trilhas_dio.json` é o coração do projeto — enriquecê-lo melhora todos os três comandos de uma vez.

---

*Projeto construído com ❤️ durante a Formação IBM Bob na DIO.*
