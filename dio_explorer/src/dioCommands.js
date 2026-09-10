/**
 * dioCommands.js
 * --------------
 * Lógica de negócio dos comandos DIO Explorer:
 *   /trilha      – consulta trilhas por tecnologia
 *   /desafio     – gera template de desafio por tecnologia e nível
 *   /certificado – gera certificado de conclusão fictício
 */

const fs   = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "trilhas_dio.json");

// ---------------------------------------------------------------------------
// Carregamento de dados
// ---------------------------------------------------------------------------

function carregarTrilhas(filepath = DATA_FILE) {
  const raw = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(raw).trilhas;
}

// ---------------------------------------------------------------------------
// Normalização (case-insensitive + sem acentos)
// ---------------------------------------------------------------------------

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// /trilha
// ---------------------------------------------------------------------------

function buscarTrilhas(tecnologia, trilhas) {
  const termo = normalizar(tecnologia.trim());
  return trilhas.filter(t => normalizar(t.tecnologia).includes(termo));
}

function listarTecnologiasDisponiveis(trilhas) {
  const unicas = [...new Set(trilhas.map(t => t.tecnologia))];
  return unicas.sort();
}

function formatarTrilha(trilha) {
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

function comandoTrilha(tecnologia, trilhas) {
  const resultados = buscarTrilhas(tecnologia, trilhas);
  if (resultados.length === 0) {
    const techs = listarTecnologiasDisponiveis(trilhas);
    const lista = techs.map(t => `  - ${t}`).join("\n");
    return `Nenhuma trilha encontrada para '${tecnologia}'.\n\nTecnologias disponíveis:\n${lista}`;
  }
  return resultados.map(formatarTrilha).join("\n---\n\n");
}

// ---------------------------------------------------------------------------
// /desafio
// ---------------------------------------------------------------------------

const NIVEIS_MAPA = {
  iniciante:      "Iniciante",
  intermediario:  "Intermediário",
  intermediário:  "Intermediário",
  avancado:       "Avançado",
  avançado:       "Avançado",
};

function normalizarNivel(nivel) {
  const chave = normalizar(nivel.trim());
  return NIVEIS_MAPA[chave] || null;
}

function gerarTemplateCodigo(tecnologia, nivelCanonico) {
  const tec = tecnologia.toLowerCase();
  if (tec.includes("java")) {
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
  if (tec.includes("python")) {
    return (
      "```python\n" +
      "def solucao():\n" +
      `    """Desafio ${tecnologia} - Nível ${nivelCanonico}"""\n` +
      "    pass  # TODO\n" +
      "```"
    );
  }
  return `\`\`\`\n// Desafio ${tecnologia} - Nível ${nivelCanonico}\n// TODO: implemente aqui\n\`\`\``;
}

function gerarDesafio(tecnologia, nivel) {
  const nivelCanonico = normalizarNivel(nivel);
  if (!nivelCanonico) {
    return (
      `Nível '${nivel}' não reconhecido. ` +
      "Por favor, escolha entre: `iniciante`, `intermediário` ou `avançado`."
    );
  }

  const template = gerarTemplateCodigo(tecnologia, nivelCanonico);

  return (
    `# 💻 Desafio ${tecnologia} — Nível ${nivelCanonico}\n\n` +
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
    `${template}\n`
  );
}

// ---------------------------------------------------------------------------
// /certificado
// ---------------------------------------------------------------------------

function gerarCodigoVerificacao() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `DIO-${seg()}-${seg()}-${seg()}`;
}

function dataEmissaoPtBR(hoje = new Date()) {
  const meses = [
    "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${hoje.getDate()} de ${meses[hoje.getMonth() + 1]} de ${hoje.getFullYear()}`;
}

function gerarCertificado(nomeAluno, trilhaNome, trilhas, { codigo, hoje } = {}) {
  const termo = normalizar(trilhaNome.trim());
  const trilhaEncontrada = trilhas.find(
    t => normalizar(t.nome).includes(termo) || normalizar(t.tecnologia).includes(termo)
  );

  let nomeTrilha, tecnologia, nivel, xp, badges;
  if (trilhaEncontrada) {
    ({ nome: nomeTrilha, tecnologia, nivel, xp_total: xp, badges_disponiveis: badges } = trilhaEncontrada);
  } else {
    nomeTrilha = trilhaNome;
    tecnologia = trilhaNome;
    nivel = "N/A";
    xp = 0;
    badges = [];
  }

  const codigoVerif = codigo || gerarCodigoVerificacao();
  const dataEmissao = dataEmissaoPtBR(hoje);
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

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  carregarTrilhas,
  normalizar,
  buscarTrilhas,
  listarTecnologiasDisponiveis,
  formatarTrilha,
  comandoTrilha,
  normalizarNivel,
  gerarTemplateCodigo,
  gerarDesafio,
  gerarCodigoVerificacao,
  dataEmissaoPtBR,
  gerarCertificado,
  DATA_FILE,
};
