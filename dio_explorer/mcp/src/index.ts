#!/usr/bin/env node
/**
 * dio-explorer-mcp/src/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MCP Server para o DIO Explorer.
 *
 * Ferramentas expostas:
 *   • trilha      – consulta trilhas de aprendizado por tecnologia
 *   • desafio     – gera template de desafio de código por tecnologia e nível
 *   • certificado – gera certificado fictício de conclusão de trilha
 *
 * Modos de transporte suportados:
 *   • stdio  (padrão)          – usado pelo Bob/Claude Desktop localmente
 *   • http   (TRANSPORT=http)  – Streamable HTTP para acesso remoto/SSO/API
 *
 * Variáveis de ambiente:
 *   TRANSPORT   = "stdio" | "http"   (padrão: "stdio")
 *   PORT        = número de porta    (padrão: 3100, apenas modo http)
 *   API_KEY     = chave de acesso    (opcional; ativa autenticação no modo http)
 *   DATA_PATH   = caminho alternativo para trilhas_dio.json
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as http from "http";
import * as crypto from "crypto";

// ─── Resolução de caminhos ────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_PATH = path.resolve(
  __dirname,
  "../../data/trilhas_dio.json"
);
const DATA_PATH = process.env.DATA_PATH ?? DEFAULT_DATA_PATH;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Promocao {
  desconto_percentual: number;
  validade: string | null;
  cupom: string | null;
}

interface LiveAoVivo {
  titulo: string;
  data: string;
  hora: string;
}

interface Trilha {
  id: number;
  nome: string;
  tecnologia: string;
  nivel: string;
  numero_de_modulos: number;
  xp_total: number;
  badges_disponiveis: string[];
  promocoes: Promocao;
  vitalicio: boolean;
  lives_ao_vivo: LiveAoVivo[];
}

// ─── Carregamento de dados ────────────────────────────────────────────────────

function carregarTrilhas(): Trilha[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return (JSON.parse(raw) as { trilhas: Trilha[] }).trilhas;
  } catch (err) {
    console.error(`[dio-explorer-mcp] Erro ao carregar trilhas de "${DATA_PATH}":`, err);
    return [];
  }
}

// ─── Utilitários de texto ─────────────────────────────────────────────────────

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ─── Lógica /trilha ───────────────────────────────────────────────────────────

function formatarTrilha(trilha: Trilha): string {
  const vitalicio = trilha.vitalicio ? "Sim" : "Não";
  const promo = trilha.promocoes;
  const badgesStr = trilha.badges_disponiveis.map(b => `  🏆 ${b}`).join("\n");
  const promoStr =
    promo.desconto_percentual > 0
      ? `> 🔖 **${promo.desconto_percentual}% de desconto** com o cupom \`${promo.cupom}\` · Válido até ${promo.validade}`
      : "_Nenhuma promoção ativa no momento._";
  const livesStr =
    trilha.lives_ao_vivo.length > 0
      ? trilha.lives_ao_vivo.map(l => `  - ${l.titulo} — ${l.data} às ${l.hora}`).join("\n")
      : "  Não há lives agendadas.";

  return (
    `# 🎯 Trilha: ${trilha.nome}\n\n` +
    `| Campo | Detalhe |\n` +
    `|---|---|\n` +
    `| 🖥️ Tecnologia | ${trilha.tecnologia} |\n` +
    `| 📊 Nível | ${trilha.nivel} |\n` +
    `| 📦 Nº de Módulos | ${trilha.numero_de_modulos} |\n` +
    `| ⭐ XP Total | ${trilha.xp_total} XP |\n` +
    `| ♾️ Acesso Vitalício | ${vitalicio} |\n\n` +
    `## 🏅 Badges Disponíveis\n${badgesStr}\n\n` +
    `## 🎁 Promoção Ativa\n${promoStr}\n\n` +
    `## 📅 Próximas Lives ao Vivo\n${livesStr}\n`
  );
}

function comandoTrilha(tecnologia: string): string {
  const trilhas = carregarTrilhas();
  const termo = normalizar(tecnologia.trim());
  const resultados = trilhas.filter(t => normalizar(t.tecnologia).includes(termo));

  if (resultados.length === 0) {
    const techs = [...new Set(trilhas.map(t => t.tecnologia))].sort();
    const lista = techs.map(t => `  - ${t}`).join("\n");
    return `Nenhuma trilha encontrada para '${tecnologia}'.\n\nTecnologias disponíveis:\n${lista}`;
  }
  return resultados.map(formatarTrilha).join("\n---\n\n");
}

// ─── Lógica /desafio ──────────────────────────────────────────────────────────

const NIVEIS_MAPA: Record<string, string> = {
  iniciante:      "Iniciante",
  intermediario:  "Intermediário",
  intermediário:  "Intermediário",
  avancado:       "Avançado",
  avançado:       "Avançado",
};

function normalizarNivel(nivel: string): string | null {
  const chave = normalizar(nivel.trim());
  return NIVEIS_MAPA[chave] ?? null;
}

function gerarTemplateCodigo(tecnologia: string, nivelCanonico: string): string {
  const tec = tecnologia.toLowerCase();

  // Java (exclui JavaScript)
  if (tec.includes("java") && !tec.includes("script")) {
    return (
      "```java\n" +
      "/**\n" +
      ` * Desafio ${tecnologia} - Nível ${nivelCanonico}\n` +
      " * Implemente a lógica conforme a descrição acima.\n" +
      " */\n" +
      "public class Desafio {\n" +
      "    public static void main(String[] args) {\n" +
      "        // TODO: implemente aqui\n" +
      "    }\n" +
      "}\n" +
      "```"
    );
  }

  // Python
  if (tec.includes("python")) {
    return (
      "```python\n" +
      "def solucao():\n" +
      `    """Desafio ${tecnologia} - Nível ${nivelCanonico}"""\n` +
      "    pass  # TODO\n" +
      "```"
    );
  }

  // TypeScript (antes de JavaScript para evitar overlap)
  if (tec.includes("typescript") || tec === "ts") {
    return (
      "```typescript\n" +
      `// Desafio ${tecnologia} - Nível ${nivelCanonico}\n` +
      "\n" +
      "function solucao(entrada: unknown): unknown {\n" +
      "  // TODO: implemente aqui\n" +
      "  throw new Error('Não implementado');\n" +
      "}\n" +
      "\n" +
      "export { solucao };\n" +
      "```"
    );
  }

  // React
  if (tec.includes("react")) {
    return (
      "```tsx\n" +
      `// Desafio ${tecnologia} - Nível ${nivelCanonico}\n` +
      "import React from 'react';\n" +
      "\n" +
      "interface Props {\n" +
      "  // TODO: defina as props\n" +
      "}\n" +
      "\n" +
      "const Solucao: React.FC<Props> = (props) => {\n" +
      "  // TODO: implemente aqui\n" +
      "  return <div>{/* TODO */}</div>;\n" +
      "};\n" +
      "\n" +
      "export default Solucao;\n" +
      "```"
    );
  }

  // Node.js
  if (tec.includes("node")) {
    return (
      "```javascript\n" +
      `// Desafio ${tecnologia} - Nível ${nivelCanonico}\n` +
      "'use strict';\n" +
      "\n" +
      "/**\n" +
      " * @param {*} entrada\n" +
      " * @returns {*}\n" +
      " */\n" +
      "function solucao(entrada) {\n" +
      "  // TODO: implemente aqui\n" +
      "}\n" +
      "\n" +
      "module.exports = { solucao };\n" +
      "```"
    );
  }

  // JavaScript
  if (tec.includes("javascript") || tec === "js") {
    return (
      "```javascript\n" +
      `// Desafio ${tecnologia} - Nível ${nivelCanonico}\n` +
      "\n" +
      "/**\n" +
      " * @param {*} entrada\n" +
      " * @returns {*}\n" +
      " */\n" +
      "function solucao(entrada) {\n" +
      "  // TODO: implemente aqui\n" +
      "}\n" +
      "```"
    );
  }

  // SQL
  if (tec.includes("sql")) {
    return (
      "```sql\n" +
      `-- Desafio ${tecnologia} - Nível ${nivelCanonico}\n` +
      "-- TODO: escreva sua query abaixo\n" +
      "\n" +
      "SELECT\n" +
      "  -- suas colunas aqui\n" +
      "FROM\n" +
      "  -- sua tabela aqui\n" +
      "WHERE\n" +
      "  -- suas condições aqui\n" +
      ";\n" +
      "```"
    );
  }

  // Genérico
  return `\`\`\`\n// Desafio ${tecnologia} - Nível ${nivelCanonico}\n// TODO: implemente aqui\n\`\`\``;
}

// ─── Banco de desafios por (tecnologia-normalizada, nivel-canonico) ───────────

interface DesafioEntry {
  descricao: string;
  objetivos: string[];
  entrada: string;
  saida: string;
  restricoes: string[];
  dica: string;
}

const BANCO_DESAFIOS: Record<string, DesafioEntry[]> = {
  "java:Iniciante": [
    { descricao: "Crie um programa que leia um número inteiro e determine se ele é par ou ímpar.", objetivos: ["Ler um inteiro da entrada padrão", "Verificar divisibilidade por 2", "Imprimir 'Par' ou 'Ímpar'"], entrada: "Um inteiro N. Exemplo: `7`", saida: "`Ímpar`", restricoes: ["Não use operador ternário aninhado", "Trate o caso N = 0", "Use Scanner para leitura"], dica: "O operador `%` retorna o resto da divisão — se o resto por 2 for zero, o número é par." },
    { descricao: "Implemente um método que inverta uma string sem usar StringBuilder.reverse().", objetivos: ["Receber uma String como parâmetro", "Retornar a string com os caracteres em ordem inversa"], entrada: "Uma string. Exemplo: `\"hello\"`", saida: "`\"olleh\"`", restricoes: ["Proibido usar StringBuilder.reverse()", "Complexidade O(n)", "Trate string vazia"], dica: "Percorra o array de chars de trás para frente e construa um novo array." },
  ],
  "java:Intermediário": [
    { descricao: "Implemente uma pilha genérica (Stack) com os métodos push, pop, peek e isEmpty usando um ArrayList internamente.", objetivos: ["Implementar push(T item)", "Implementar pop() com exceção em pilha vazia", "Implementar peek() sem remover", "Implementar isEmpty()"], entrada: "Sequência de operações. Exemplo: push(1), push(2), pop(), peek()", saida: "`2` (pop) e `1` (peek)", restricoes: ["Use generics (<T>)", "Proibido usar java.util.Stack", "Lance EmptyStackException em pop/peek vazios"], dica: "ArrayList com índice do último elemento funciona como topo de pilha." },
    { descricao: "Dado um array de inteiros, encontre o par de números cuja soma seja mais próxima de um alvo K.", objetivos: ["Retornar os dois números do par", "Minimizar |soma - K|", "Funcionar com negativos"], entrada: "`[1, 3, 4, 7, 10]`, K = `8`", saida: "`[1, 7]` (soma = 8)", restricoes: ["Complexidade O(n log n)", "Não use força bruta O(n²)", "Array com pelo menos 2 elementos"], dica: "Ordene o array e use dois ponteiros — um no início e outro no fim." },
  ],
  "java:Avançado": [
    { descricao: "Implemente o algoritmo de Dijkstra para encontrar o menor caminho entre dois vértices em um grafo ponderado.", objetivos: ["Representar o grafo com lista de adjacência", "Retornar a distância mínima", "Retornar o caminho percorrido"], entrada: "Grafo com 5 vértices, arestas com pesos, origem=0, destino=4", saida: "Distância e lista de vértices do caminho", restricoes: ["Use PriorityQueue para a fila de prioridade", "Complexidade O((V+E) log V)", "Trate grafos desconexos"], dica: "Mantenha um array de distâncias inicializado com Integer.MAX_VALUE e atualize conforme relaxa as arestas." },
  ],
  "python:Iniciante": [
    { descricao: "Escreva uma função que receba uma lista de números e retorne a média aritmética.", objetivos: ["Somar todos os elementos", "Dividir pelo total de elementos", "Retornar float com 2 casas decimais"], entrada: "`[4, 8, 15, 16, 23, 42]`", saida: "`18.0`", restricoes: ["Não use a função sum() nativa — implemente o loop manualmente", "Trate lista vazia retornando 0.0"], dica: "Percorra a lista acumulando a soma em uma variável, depois divida pelo len()." },
    { descricao: "Crie uma função que verifique se uma palavra é um palíndromo.", objetivos: ["Ignorar maiúsculas/minúsculas", "Ignorar espaços", "Retornar True ou False"], entrada: "`\"Racecar\"`", saida: "`True`", restricoes: ["Não use [::-1] direto — compare char a char", "Trate string vazia como palíndromo"], dica: "Use dois índices, um no início e outro no fim, e avance-os em direção ao centro." },
  ],
  "python:Intermediário": [
    { descricao: "Implemente um decorador @memoize que armazene em cache os resultados de uma função para evitar recálculos.", objetivos: ["Criar um decorador funcional", "Usar um dicionário como cache", "Funcionar com qualquer função de argumento único"], entrada: "Função `fib(n)` decorada com `@memoize`", saida: "`fib(10)` retorna `55` sem recalcular valores já computados", restricoes: ["Não use functools.lru_cache", "O cache deve persistir entre chamadas", "Complexidade de lookup O(1)"], dica: "Um closure com um dict interno como cache é o padrão clássico para isso." },
    { descricao: "Dado um texto, retorne as 3 palavras mais frequentes ignorando palavras com menos de 4 caracteres.", objetivos: ["Tokenizar o texto por espaço e pontuação", "Contar frequências", "Retornar top-3 como lista de tuplas (palavra, contagem)"], entrada: "`\"o rato roeu a roupa do rei de roma\"`", saida: "`[('roupa', 1), ('roma', 1), ('rato', 1)]`", restricoes: ["Não use Counter diretamente", "Ignore case", "Trate texto vazio"], dica: "re.findall(r'\\b\\w+\\b', texto.lower()) tokeniza bem o texto." },
  ],
  "python:Avançado": [
    { descricao: "Implemente um gerador que produza permutações de uma lista sem carregar todas na memória de uma vez.", objetivos: ["Usar yield para produzir uma permutação por vez", "Não usar itertools.permutations", "Funcionar para listas de qualquer tamanho"], entrada: "`[1, 2, 3]`", saida: "Gerador que produz todas as 6 permutações", restricoes: ["Proibido itertools.permutations", "Complexidade de memória O(n)", "Use o algoritmo de Heap ou backtracking"], dica: "O algoritmo de backtracking troca um elemento de cada posição com o restante e recursa." },
  ],
  "javascript:Iniciante": [
    { descricao: "Crie uma função que receba um array de strings e retorne somente as que começam com letra maiúscula.", objetivos: ["Filtrar o array", "Verificar o primeiro caractere de cada string", "Retornar novo array sem mutar o original"], entrada: "`['Ana', 'bob', 'Carlos', 'diana']`", saida: "`['Ana', 'Carlos']`", restricoes: ["Não mute o array original", "Use filter()", "Trate array vazio"], dica: "str[0] === str[0].toUpperCase() verifica se o primeiro caractere é maiúsculo." },
    { descricao: "Implemente uma função que achate um array com um único nível de aninhamento sem usar Array.flat().", objetivos: ["Transformar [[1,2],[3,4]] em [1,2,3,4]", "Não usar Array.flat()", "Retornar novo array"], entrada: "`[[1, 2], [3, 4], [5]]`", saida: "`[1, 2, 3, 4, 5]`", restricoes: ["Proibido Array.flat() e Array.flatMap()", "Apenas um nível de aninhamento", "Trate arrays vazios internos"], dica: "reduce() com concat() é o padrão clássico para isso." },
  ],
  "javascript:Intermediário": [
    { descricao: "Implemente uma função debounce que adie a execução de um callback até que N milissegundos tenham passado sem nova chamada.", objetivos: ["Receber função e delay em ms", "Cancelar timer anterior a cada nova chamada", "Executar a função apenas após o silêncio"], entrada: "debounce(fn, 300) chamado 5 vezes em 100ms de intervalo", saida: "fn executada apenas 1 vez, 300ms após a última chamada", restricoes: ["Use setTimeout/clearTimeout", "Retorne uma nova função", "Preserve o contexto (this)"], dica: "Guarde o ID do timer em uma variável no closure e dê clearTimeout a cada nova invocação." },
    { descricao: "Crie uma função que achate profundamente um array de qualquer nível de aninhamento sem usar Array.flat().", objetivos: ["Suportar aninhamento arbitrário", "Retornar array plano de primitivos", "Não usar flat() nem flatMap()"], entrada: "`[1, [2, [3, [4]], 5]]`", saida: "`[1, 2, 3, 4, 5]`", restricoes: ["Proibido flat() e flatMap()", "Deve ser recursivo ou usar stack", "Trate arrays mistos"], dica: "Array.isArray(item) verifica se um elemento é array — use isso na recursão." },
  ],
  "javascript:Avançado": [
    { descricao: "Implemente um sistema de EventEmitter do zero, com os métodos on, off, emit e once.", objetivos: ["on(event, listener): registrar handler", "off(event, listener): remover handler", "emit(event, ...args): disparar evento", "once(event, listener): handler de uso único"], entrada: "emitter.on('data', fn); emitter.emit('data', 42);", saida: "fn é chamado com 42; after off(), fn não é chamado", restricoes: ["Sem dependências externas", "once deve remover o handler após a primeira execução", "Suporte a múltiplos listeners por evento"], dica: "Guarde os listeners em um Map<string, Set<Function>> para facilitar adição e remoção." },
  ],
  "typescript:Iniciante": [
    { descricao: "Crie uma interface `Produto` e uma função que filtre uma lista de produtos pelo preço máximo informado.", objetivos: ["Definir interface com id, nome e preco", "Tipar corretamente parâmetros e retorno", "Retornar apenas produtos com preco <= precoMax"], entrada: "Lista de Produto[], precoMax = 50", saida: "Array filtrado de Produto[]", restricoes: ["Use interface, não type alias", "Tipar explicitamente a função", "Trate lista vazia"], dica: "O retorno da função deve ser Produto[], não any[]." },
  ],
  "typescript:Intermediário": [
    { descricao: "Implemente um tipo utilitário `DeepReadonly<T>` que torne recursivamente todas as propriedades de um objeto readonly.", objetivos: ["Criar um tipo genérico", "Aplicar readonly em propriedades aninhadas", "Funcionar com objetos, arrays e primitivos"], entrada: "DeepReadonly<{ a: { b: number[] } }>", saida: "Tipo em que a.b não pode ser reatribuído nem mutado", restricoes: ["Não use as const externo", "Deve tratar arrays virando ReadonlyArray", "Use conditional types se necessário"], dica: "{ readonly [K in keyof T]: DeepReadonly<T[K]> } é o padrão para recursão em tipos." },
  ],
  "typescript:Avançado": [
    { descricao: "Implemente um tipo `Pipeline<Fns>` que infira o tipo de retorno de uma cadeia de funções passadas ao pipe().", objetivos: ["Tipar pipe() de forma que cada função receba o tipo de saída da anterior", "Detectar incompatibilidade de tipos em tempo de compilação", "Funcionar com cadeias de tamanho variável"], entrada: "pipe(x => x + 1, x => x.toString(), x => x.length)", saida: "Tipo inferido: number (para entrada number)", restricoes: ["Sem any", "Use conditional types e tuple manipulation", "Erro de compilação se os tipos não encaixarem"], dica: "Infer + recursive conditional types em tuplas é o caminho. Pesquise 'TypeScript variadic tuple types'." },
  ],
  "react:Iniciante": [
    { descricao: "Crie um componente Counter com botões de incrementar, decrementar e resetar, exibindo o valor atual.", objetivos: ["Usar useState para o estado do contador", "Botões funcionais para as três ações", "Valor nunca fica negativo"], entrada: "Nenhuma prop necessária", saida: "Componente renderizado com valor e três botões", restricoes: ["Não use variáveis externas ao componente para guardar o estado", "Usar hooks funcionais", "Valor mínimo = 0"], dica: "useState retorna [valor, setter] — use o setter com a forma funcional: setCount(prev => prev + 1)." },
  ],
  "react:Intermediário": [
    { descricao: "Implemente um hook personalizado useLocalStorage que sincronize um estado com o localStorage.", objetivos: ["API idêntica ao useState: [value, setValue]", "Persistir no localStorage a cada mudança", "Restaurar valor ao montar o componente"], entrada: "useLocalStorage('tema', 'claro')", saida: "Estado persistido entre recarregamentos da página", restricoes: ["Tratar erros de JSON.parse", "Funcionar no SSR (sem window no servidor)", "Tipar com generics se usar TypeScript"], dica: "Inicialize o estado dentro de uma função para ler do localStorage apenas uma vez." },
  ],
  "react:Avançado": [
    { descricao: "Implemente um componente VirtualList que renderize apenas os itens visíveis de uma lista de 10.000 elementos.", objetivos: ["Calcular quais itens estão no viewport", "Renderizar somente os visíveis + buffer", "Manter scroll fluido"], entrada: "items: T[], itemHeight: number, containerHeight: number", saida: "Lista com posicionamento absoluto, apenas ~20 elementos no DOM", restricoes: ["Sem biblioteca de virtualização", "Use onScroll e useRef", "Complexidade de render O(itens visíveis)"], dica: "startIndex = Math.floor(scrollTop / itemHeight) e endIndex = startIndex + Math.ceil(containerHeight / itemHeight)." },
  ],
  "node:Iniciante": [
    { descricao: "Crie um script Node.js que leia um arquivo .txt e imprima o número de linhas, palavras e caracteres.", objetivos: ["Ler arquivo com fs.readFileSync", "Contar linhas", "Contar palavras", "Contar caracteres"], entrada: "Caminho do arquivo via process.argv[2]", saida: "Linhas: 5 | Palavras: 23 | Caracteres: 142", restricoes: ["Tratar arquivo inexistente com mensagem amigável", "Não use dependências externas", "Encoding UTF-8"], dica: "process.argv[2] contém o primeiro argumento passado ao script na linha de comando." },
  ],
  "node:Intermediário": [
    { descricao: "Implemente uma API REST mínima com Node.js puro (sem Express) que gerencie uma lista de tarefas em memória.", objetivos: ["GET /tasks — listar todas", "POST /tasks — criar nova (body JSON)", "DELETE /tasks/:id — remover por id"], entrada: "Requisições HTTP na porta 3000", saida: "Respostas JSON com status codes corretos (200, 201, 404)", restricoes: ["Sem Express ou qualquer framework", "Use apenas http nativo do Node", "Parse manual do body com chunks"], dica: "Acumule os chunks do request em um buffer e use JSON.parse no evento 'end'." },
  ],
  "node:Avançado": [
    { descricao: "Implemente um worker pool usando worker_threads para processar uma lista de tarefas pesadas em paralelo.", objetivos: ["Criar N workers configurável", "Distribuir tarefas por fila", "Coletar resultados preservando ordem", "Encerrar workers ao final"], entrada: "Array de 100 números, N = 4 workers, tarefa: calcular fatorial", saida: "Array de resultados na mesma ordem da entrada", restricoes: ["Use worker_threads nativo", "Não bloqueie a thread principal", "Destrua workers ao terminar"], dica: "Use uma fila (queue) na thread principal e envie uma nova tarefa ao worker assim que ele retornar um resultado." },
  ],
  "sql:Iniciante": [
    { descricao: "Escreva uma query que retorne o nome e o salário dos funcionários cujo salário seja maior que a média salarial da empresa.", objetivos: ["Calcular a média com AVG()", "Filtrar com WHERE", "Ordenar por salário decrescente"], entrada: "Tabela `funcionarios(id, nome, salario, departamento)`", saida: "Lista de funcionários com salário acima da média", restricoes: ["Não use subquery correlacionada", "Resultado ordenado por salário DESC", "Alias legível nas colunas"], dica: "Uma subquery escalar SELECT AVG(salario) FROM funcionarios no WHERE é a abordagem mais clara." },
  ],
  "sql:Intermediário": [
    { descricao: "Usando window functions, calcule o ranking de vendas por vendedor dentro de cada região.", objetivos: ["Usar RANK() ou DENSE_RANK() com PARTITION BY", "Particionar por região", "Ordenar por total_vendas dentro de cada partição"], entrada: "Tabela `vendas(id, vendedor, regiao, total_vendas)`", saida: "Tabela com coluna extra `ranking` por região", restricoes: ["Use window functions, não subquery de contagem", "DENSE_RANK() para rankings sem gaps", "Resultado final ordenado por regiao, ranking"], dica: "DENSE_RANK() OVER (PARTITION BY regiao ORDER BY total_vendas DESC) é a construção exata." },
  ],
  "sql:Avançado": [
    { descricao: "Implemente uma CTE recursiva que percorra uma hierarquia de funcionários e retorne todos os subordinados de um gerente.", objetivos: ["Usar WITH RECURSIVE", "Encontrar todos os níveis da hierarquia", "Incluir o nível de profundidade de cada nó"], entrada: "Tabela `funcionarios(id, nome, gerente_id)`, gerente raiz id=1", saida: "Todos os subordinados diretos e indiretos com coluna `nivel`", restricoes: ["Use CTE recursiva, não JOIN em cascata", "Evitar loops infinitos com condição de parada", "Funcionar em qualquer profundidade"], dica: "O anchor member seleciona o gerente raiz; o recursive member faz JOIN da tabela com a CTE pelo gerente_id." },
  ],
};

function sortearDesafio(tecnologia: string, nivelCanonico: string): DesafioEntry | null {
  const tecNorm = normalizar(tecnologia.trim());
  for (const chave of Object.keys(BANCO_DESAFIOS)) {
    const [tecChave, nivelChave] = chave.split(":");
    if (nivelChave !== nivelCanonico) continue;
    if (tecNorm.includes(tecChave) || tecChave.includes(tecNorm)) {
      const lista = BANCO_DESAFIOS[chave];
      return lista[Math.floor(Math.random() * lista.length)];
    }
  }
  return null;
}

function gerarDesafio(tecnologia: string, nivel: string): string {
  const nivelCanonico = normalizarNivel(nivel);
  if (!nivelCanonico) {
    return (
      `Nível '${nivel}' não reconhecido. ` +
      "Por favor, escolha entre: `iniciante`, `intermediário` ou `avançado`."
    );
  }
  const template = gerarTemplateCodigo(tecnologia, nivelCanonico);
  const desafio = sortearDesafio(tecnologia, nivelCanonico);

  const descricao  = desafio ? desafio.descricao : `Implemente uma solução em ${tecnologia} para o problema proposto no nível ${nivelCanonico}.`;
  const objetivos  = desafio ? desafio.objetivos.map(o => `- ${o}`).join("\n") : `- Resolver o problema dentro das restrições definidas\n- Escrever código limpo e bem documentado`;
  const entrada    = desafio ? desafio.entrada : `Dados de entrada conforme especificação. Exemplo: \`[1, 2, 3]\``;
  const saida      = desafio ? desafio.saida : `Resultado esperado. Exemplo: \`6\``;
  const restricoes = desafio ? desafio.restricoes.map(r => `- ${r}`).join("\n") : `- Complexidade máxima: O(n²)\n- Não utilize bibliotecas externas sem justificativa`;
  const dica       = desafio ? desafio.dica : `Considere a estrutura de dados mais adequada para o problema.`;

  return (
    `# 💻 Desafio ${tecnologia} — Nível ${nivelCanonico}\n\n` +
    `## 📋 Descrição\n${descricao}\n\n` +
    `## 🎯 Objetivo\n${objetivos}\n\n` +
    `## 📥 Entrada\n${entrada}\n\n` +
    `## 📤 Saída Esperada\n${saida}\n\n` +
    `## 📌 Restrições\n${restricoes}\n\n` +
    `## 💡 Dica\n${dica}\n\n` +
    `## 🧩 Template Inicial\n\n${template}\n`
  );
}

// ─── Lógica /certificado ──────────────────────────────────────────────────────

function gerarCodigoVerificacao(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `DIO-${seg()}-${seg()}-${seg()}`;
}

function dataEmissaoPtBR(hoje: Date = new Date()): string {
  const meses = [
    "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${hoje.getDate()} de ${meses[hoje.getMonth() + 1]} de ${hoje.getFullYear()}`;
}

function gerarCertificado(nomeAluno: string, trilhaNome: string): string {
  const trilhas = carregarTrilhas();
  const termo = normalizar(trilhaNome.trim());
  const trilhaEncontrada = trilhas.find(
    t => normalizar(t.nome).includes(termo) || normalizar(t.tecnologia).includes(termo)
  );

  let nomeTrilha: string;
  let tecnologia: string;
  let nivel: string;
  let xp: number;
  let badges: string[];

  if (trilhaEncontrada) {
    nomeTrilha  = trilhaEncontrada.nome;
    tecnologia  = trilhaEncontrada.tecnologia;
    nivel       = trilhaEncontrada.nivel;
    xp          = trilhaEncontrada.xp_total;
    badges      = trilhaEncontrada.badges_disponiveis;
  } else {
    nomeTrilha  = trilhaNome;
    tecnologia  = trilhaNome;
    nivel       = "N/A";
    xp          = 0;
    badges      = [];
  }

  const codigoVerif = gerarCodigoVerificacao();
  const dataEmissao = dataEmissaoPtBR();
  const badgesStr =
    badges.length > 0 ? badges.map(b => `🏆 ${b}`).join("\n") : "Nenhuma badge registrada.";

  return (
    `<div align="center">\n\n` +
    `# 🏆 CERTIFICADO DE CONCLUSÃO\n\n` +
    `---\n\n` +
    `### *A Digital Innovation One certifica que*\n\n` +
    `## ${nomeAluno}\n\n` +
    `### *concluiu com êxito a trilha*\n\n` +
    `# 🎓 ${nomeTrilha}\n\n` +
    `---\n\n` +
    `| 🖥️ Tecnologia | 📊 Nível | ⭐ XP Conquistado |\n` +
    `|:---:|:---:|:---:|\n` +
    `| ${tecnologia} | ${nivel} | ${xp} XP |\n\n` +
    `---\n\n` +
    `### 🏅 Badges Conquistadas\n\n` +
    `${badgesStr}\n\n` +
    `---\n\n` +
    `*Emitido em **${dataEmissao}***\n\n` +
    `*Este certificado confirma que o(a) participante demonstrou domínio dos conteúdos,*\n` +
    `*completou todos os módulos e desafios previstos na trilha.*\n\n` +
    `---\n\n` +
    `🔐 **Código de verificação:** \`${codigoVerif}\`\n\n` +
    `---\n\n` +
    `*"O conhecimento é a única riqueza que ninguém pode te tirar."*\n\n` +
    `**Digital Innovation One — [dio.me](https://dio.me)**\n\n` +
    `</div>\n`
  );
}

// ─── Criação e registro do servidor MCP ──────────────────────────────────────

function criarServidor(): McpServer {
  const server = new McpServer({
    name: "dio-explorer-mcp",
    version: "1.0.0",
  });

  // ── Ferramenta: trilha ───────────────────────────────────────────────────────
  server.registerTool(
    "trilha",
    {
      description:
        "Consulta trilhas de aprendizado da DIO por tecnologia. " +
        "Retorna nome, nível, módulos, XP, badges, promoção ativa e lives programadas.",
      inputSchema: z.object({
        tecnologia: z
          .string()
          .min(1)
          .describe(
            "Nome (parcial ou completo) da tecnologia desejada. Exemplos: 'Python', 'Java', 'React'."
          ),
      }),
    },
    async ({ tecnologia }) => {
      try {
        const resultado = comandoTrilha(tecnologia);
        return { content: [{ type: "text", text: resultado }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Erro ao buscar trilha: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  // ── Ferramenta: desafio ──────────────────────────────────────────────────────
  server.registerTool(
    "desafio",
    {
      description:
        "Gera um template de desafio de código com descrição, objetivos, restrições e código inicial " +
        "para a tecnologia e nível informados.",
      inputSchema: z.object({
        tecnologia: z
          .string()
          .min(1)
          .describe("Linguagem ou tecnologia. Exemplos: 'JavaScript', 'Python', 'Java'."),
        nivel: z
          .string()
          .min(1)
          .describe("Nível de dificuldade. Valores aceitos: 'iniciante', 'intermediário', 'avançado'."),
      }),
    },
    async ({ tecnologia, nivel }) => {
      try {
        const resultado = gerarDesafio(tecnologia, nivel);
        return { content: [{ type: "text", text: resultado }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Erro ao gerar desafio: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  // ── Ferramenta: certificado ──────────────────────────────────────────────────
  server.registerTool(
    "certificado",
    {
      description:
        "Gera um certificado fictício de conclusão de trilha da DIO para o aluno informado, " +
        "com tecnologia, nível, XP, badges conquistadas e código único de verificação.",
      inputSchema: z.object({
        nome_aluno: z
          .string()
          .min(1)
          .describe("Nome completo do aluno que concluiu a trilha."),
        trilha: z
          .string()
          .min(1)
          .describe(
            "Nome (parcial ou completo) da trilha ou tecnologia. Exemplos: 'Python', 'Trilha Node.js'."
          ),
      }),
    },
    async ({ nome_aluno, trilha }) => {
      try {
        const resultado = gerarCertificado(nome_aluno, trilha);
        return { content: [{ type: "text", text: resultado }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Erro ao gerar certificado: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}

// ─── Transporte HTTP com autenticação opcional por API key ───────────────────

function iniciarServidorHTTP(mcpServer: McpServer): void {
  const PORT = parseInt(process.env.PORT ?? "3100", 10);
  const API_KEY = process.env.API_KEY;

  // Mapa de sessões ativas: sessionId → transport
  const sessoes = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    // ── Autenticação por API key (quando configurada) ──────────────────────────
    if (API_KEY) {
      const authHeader = req.headers["authorization"] ?? "";
      const providedKey =
        authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-api-key"] as string ?? "";

      if (providedKey !== API_KEY) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized: API key inválida ou ausente." }));
        return;
      }
    }

    // ── Rota de health check ───────────────────────────────────────────────────
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", server: "dio-explorer-mcp", version: "1.0.0" }));
      return;
    }

    // ── Rota MCP (/mcp) ────────────────────────────────────────────────────────
    if (req.url === "/mcp" || req.url === "/") {
      const sessionId = (req.headers["mcp-session-id"] as string) ?? crypto.randomUUID();

      let transport = sessoes.get(sessionId);

      if (!transport) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
        });
        sessoes.set(sessionId, transport);
        await mcpServer.connect(transport);

        transport.onclose = () => {
          sessoes.delete(sessionId);
          console.error(`[dio-explorer-mcp] Sessão encerrada: ${sessionId}`);
        };
      }

      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Rota não encontrada." }));
  });

  httpServer.listen(PORT, () => {
    console.error(`[dio-explorer-mcp] HTTP MCP server rodando em http://0.0.0.0:${PORT}/mcp`);
    console.error(`[dio-explorer-mcp] Health check disponível em http://0.0.0.0:${PORT}/health`);
    if (API_KEY) {
      console.error("[dio-explorer-mcp] Autenticação por API key ATIVADA.");
    } else {
      console.error("[dio-explorer-mcp] Sem autenticação (defina API_KEY para ativar).");
    }
  });
}

// ─── Entrypoint ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = (process.env.TRANSPORT ?? "stdio").toLowerCase();
  const mcpServer = criarServidor();

  if (transport === "http") {
    iniciarServidorHTTP(mcpServer);
  } else {
    // Modo stdio — padrão para uso com Bob/Claude Desktop
    const stdioTransport = new StdioServerTransport();
    await mcpServer.connect(stdioTransport);
    console.error("[dio-explorer-mcp] Servidor MCP rodando em stdio.");
  }
}

main().catch((err) => {
  console.error("[dio-explorer-mcp] Erro fatal:", err);
  process.exit(1);
});
