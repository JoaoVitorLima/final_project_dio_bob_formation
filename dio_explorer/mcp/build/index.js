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
const DEFAULT_DATA_PATH = path.resolve(__dirname, "../../data/trilhas_dio.json");
const DATA_PATH = process.env.DATA_PATH ?? DEFAULT_DATA_PATH;
// ─── Carregamento de dados ────────────────────────────────────────────────────
function carregarTrilhas() {
    try {
        const raw = fs.readFileSync(DATA_PATH, "utf-8");
        return JSON.parse(raw).trilhas;
    }
    catch (err) {
        console.error(`[dio-explorer-mcp] Erro ao carregar trilhas de "${DATA_PATH}":`, err);
        return [];
    }
}
// ─── Utilitários de texto ─────────────────────────────────────────────────────
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
// ─── Lógica /trilha ───────────────────────────────────────────────────────────
function formatarTrilha(trilha) {
    const vitalicio = trilha.vitalicio ? "Sim" : "Não";
    const promo = trilha.promocoes;
    const badgesStr = trilha.badges_disponiveis.map(b => `  🏆 ${b}`).join("\n");
    const promoStr = promo.desconto_percentual > 0
        ? `> 🔖 **${promo.desconto_percentual}% de desconto** com o cupom \`${promo.cupom}\` · Válido até ${promo.validade}`
        : "_Nenhuma promoção ativa no momento._";
    const livesStr = trilha.lives_ao_vivo.length > 0
        ? trilha.lives_ao_vivo.map(l => `  - ${l.titulo} — ${l.data} às ${l.hora}`).join("\n")
        : "  Não há lives agendadas.";
    return (`# 🎯 Trilha: ${trilha.nome}\n\n` +
        `| Campo | Detalhe |\n` +
        `|---|---|\n` +
        `| 🖥️ Tecnologia | ${trilha.tecnologia} |\n` +
        `| 📊 Nível | ${trilha.nivel} |\n` +
        `| 📦 Nº de Módulos | ${trilha.numero_de_modulos} |\n` +
        `| ⭐ XP Total | ${trilha.xp_total} XP |\n` +
        `| ♾️ Acesso Vitalício | ${vitalicio} |\n\n` +
        `## 🏅 Badges Disponíveis\n${badgesStr}\n\n` +
        `## 🎁 Promoção Ativa\n${promoStr}\n\n` +
        `## 📅 Próximas Lives ao Vivo\n${livesStr}\n`);
}
function comandoTrilha(tecnologia) {
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
const NIVEIS_MAPA = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    intermediário: "Intermediário",
    avancado: "Avançado",
    avançado: "Avançado",
};
function normalizarNivel(nivel) {
    const chave = normalizar(nivel.trim());
    return NIVEIS_MAPA[chave] ?? null;
}
function gerarTemplateCodigo(tecnologia, nivelCanonico) {
    const tec = tecnologia.toLowerCase();
    if (tec.includes("java") && !tec.includes("script")) {
        return ("```java\n" +
            "/**\n" +
            ` * Desafio ${tecnologia} - Nível ${nivelCanonico}\n` +
            " * Implemente a lógica conforme a descrição acima.\n" +
            " */\n" +
            "public class Desafio {\n" +
            "    public static void main(String[] args) {\n" +
            "        // TODO: implemente aqui\n" +
            "    }\n" +
            "}\n" +
            "```");
    }
    if (tec.includes("python")) {
        return ("```python\n" +
            "def solucao():\n" +
            `    """Desafio ${tecnologia} - Nível ${nivelCanonico}"""\n` +
            "    pass  # TODO\n" +
            "```");
    }
    return `\`\`\`\n// Desafio ${tecnologia} - Nível ${nivelCanonico}\n// TODO: implemente aqui\n\`\`\``;
}
function gerarDesafio(tecnologia, nivel) {
    const nivelCanonico = normalizarNivel(nivel);
    if (!nivelCanonico) {
        return (`Nível '${nivel}' não reconhecido. ` +
            "Por favor, escolha entre: `iniciante`, `intermediário` ou `avançado`.");
    }
    const template = gerarTemplateCodigo(tecnologia, nivelCanonico);
    return (`# 💻 Desafio ${tecnologia} — Nível ${nivelCanonico}\n\n` +
        `## 📋 Descrição\n` +
        `Implemente uma solução em ${tecnologia} para o problema proposto no nível ${nivelCanonico}.\n\n` +
        `## 🎯 Objetivo\n` +
        `- Resolver o problema dentro das restrições definidas\n` +
        `- Escrever código limpo e bem documentado\n` +
        `- Atingir a complexidade esperada para o nível ${nivelCanonico}\n\n` +
        `## 📥 Entrada\n` +
        `Dados de entrada conforme especificação. Exemplo: \`[1, 2, 3]\`\n\n` +
        `## 📤 Saída Esperada\n` +
        `Resultado esperado. Exemplo: \`6\`\n\n` +
        `## 📌 Restrições\n` +
        `- Complexidade máxima: O(n²)\n` +
        `- Não utilize bibliotecas externas sem justificativa\n` +
        `- Trate edge cases (lista vazia, valores negativos)\n\n` +
        `## 💡 Dica\n` +
        `Considere a estrutura de dados mais adequada para o problema.\n\n` +
        `## 🧩 Template Inicial\n\n` +
        `${template}\n`);
}
// ─── Lógica /certificado ──────────────────────────────────────────────────────
function gerarCodigoVerificacao() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `DIO-${seg()}-${seg()}-${seg()}`;
}
function dataEmissaoPtBR(hoje = new Date()) {
    const meses = [
        "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ];
    return `${hoje.getDate()} de ${meses[hoje.getMonth() + 1]} de ${hoje.getFullYear()}`;
}
function gerarCertificado(nomeAluno, trilhaNome) {
    const trilhas = carregarTrilhas();
    const termo = normalizar(trilhaNome.trim());
    const trilhaEncontrada = trilhas.find(t => normalizar(t.nome).includes(termo) || normalizar(t.tecnologia).includes(termo));
    let nomeTrilha;
    let tecnologia;
    let nivel;
    let xp;
    let badges;
    if (trilhaEncontrada) {
        nomeTrilha = trilhaEncontrada.nome;
        tecnologia = trilhaEncontrada.tecnologia;
        nivel = trilhaEncontrada.nivel;
        xp = trilhaEncontrada.xp_total;
        badges = trilhaEncontrada.badges_disponiveis;
    }
    else {
        nomeTrilha = trilhaNome;
        tecnologia = trilhaNome;
        nivel = "N/A";
        xp = 0;
        badges = [];
    }
    const codigoVerif = gerarCodigoVerificacao();
    const dataEmissao = dataEmissaoPtBR();
    const badgesStr = badges.length > 0 ? badges.map(b => `🏆 ${b}`).join("\n") : "Nenhuma badge registrada.";
    return (`<div align="center">\n\n` +
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
        `</div>\n`);
}
// ─── Criação e registro do servidor MCP ──────────────────────────────────────
function criarServidor() {
    const server = new McpServer({
        name: "dio-explorer-mcp",
        version: "1.0.0",
    });
    // ── Ferramenta: trilha ───────────────────────────────────────────────────────
    server.registerTool("trilha", {
        description: "Consulta trilhas de aprendizado da DIO por tecnologia. " +
            "Retorna nome, nível, módulos, XP, badges, promoção ativa e lives programadas.",
        inputSchema: z.object({
            tecnologia: z
                .string()
                .min(1)
                .describe("Nome (parcial ou completo) da tecnologia desejada. Exemplos: 'Python', 'Java', 'React'."),
        }),
    }, async ({ tecnologia }) => {
        try {
            const resultado = comandoTrilha(tecnologia);
            return { content: [{ type: "text", text: resultado }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Erro ao buscar trilha: ${String(err)}` }],
                isError: true,
            };
        }
    });
    // ── Ferramenta: desafio ──────────────────────────────────────────────────────
    server.registerTool("desafio", {
        description: "Gera um template de desafio de código com descrição, objetivos, restrições e código inicial " +
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
    }, async ({ tecnologia, nivel }) => {
        try {
            const resultado = gerarDesafio(tecnologia, nivel);
            return { content: [{ type: "text", text: resultado }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Erro ao gerar desafio: ${String(err)}` }],
                isError: true,
            };
        }
    });
    // ── Ferramenta: certificado ──────────────────────────────────────────────────
    server.registerTool("certificado", {
        description: "Gera um certificado fictício de conclusão de trilha da DIO para o aluno informado, " +
            "com tecnologia, nível, XP, badges conquistadas e código único de verificação.",
        inputSchema: z.object({
            nome_aluno: z
                .string()
                .min(1)
                .describe("Nome completo do aluno que concluiu a trilha."),
            trilha: z
                .string()
                .min(1)
                .describe("Nome (parcial ou completo) da trilha ou tecnologia. Exemplos: 'Python', 'Trilha Node.js'."),
        }),
    }, async ({ nome_aluno, trilha }) => {
        try {
            const resultado = gerarCertificado(nome_aluno, trilha);
            return { content: [{ type: "text", text: resultado }] };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Erro ao gerar certificado: ${String(err)}` }],
                isError: true,
            };
        }
    });
    return server;
}
// ─── Transporte HTTP com autenticação opcional por API key ───────────────────
function iniciarServidorHTTP(mcpServer) {
    const PORT = parseInt(process.env.PORT ?? "3100", 10);
    const API_KEY = process.env.API_KEY;
    // Mapa de sessões ativas: sessionId → transport
    const sessoes = new Map();
    const httpServer = http.createServer(async (req, res) => {
        // ── Autenticação por API key (quando configurada) ──────────────────────────
        if (API_KEY) {
            const authHeader = req.headers["authorization"] ?? "";
            const providedKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-api-key"] ?? "";
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
            const sessionId = req.headers["mcp-session-id"] ?? crypto.randomUUID();
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
        }
        else {
            console.error("[dio-explorer-mcp] Sem autenticação (defina API_KEY para ativar).");
        }
    });
}
// ─── Entrypoint ───────────────────────────────────────────────────────────────
async function main() {
    const transport = (process.env.TRANSPORT ?? "stdio").toLowerCase();
    const mcpServer = criarServidor();
    if (transport === "http") {
        iniciarServidorHTTP(mcpServer);
    }
    else {
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
