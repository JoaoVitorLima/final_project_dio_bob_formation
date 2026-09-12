/**
 * dioCommands.test.js
 * -------------------
 * Testes unitários — DIO Explorer
 *   /trilha      (foco: JAVA)
 *   /desafio     (Java + outros níveis)
 *   /certificado (fluxo completo do aluno)
 *
 * Meta de cobertura: >= 70 %
 * Executar: npx jest --coverage
 */

const path = require("path");
const {
  normalizar,
  buscarTrilhas,
  listarTecnologiasDisponiveis,
  formatarTrilha,
  comandoTrilha,
  normalizarNivel,
  gerarTemplateCodigo,
  BANCO_DESAFIOS,
  sortearDesafio,
  gerarDesafio,
  gerarCodigoVerificacao,
  dataEmissaoPtBR,
  gerarCertificado,
  carregarTrilhas,
  DATA_FILE,
} = require("./dioCommands");

// ===========================================================================
// Fixtures
// ===========================================================================

const TRILHA_JAVA = {
  id: 2,
  nome: "Desenvolvedor Java Full Stack",
  tecnologia: "Java",
  nivel: "Intermediário",
  numero_de_modulos: 14,
  xp_total: 9800,
  badges_disponiveis: ["Java Developer", "Spring Boot Pro", "Full Stack Hero"],
  promocoes: { desconto_percentual: 15, validade: "2025-11-30", cupom: "JAVA15" },
  vitalicio: true,
  lives_ao_vivo: [
    { titulo: "Spring Boot na Prática", data: "2025-01-20", hora: "19:30" },
    { titulo: "API REST com Java",      data: "2025-02-18", hora: "20:00" },
  ],
};

const TRILHA_PYTHON = {
  id: 1,
  nome: "Fundamentos de Python para Data Science",
  tecnologia: "Python",
  nivel: "Iniciante",
  numero_de_modulos: 8,
  xp_total: 4500,
  badges_disponiveis: ["Python Starter", "Data Novice", "Code Explorer"],
  promocoes: { desconto_percentual: 20, validade: "2025-12-31", cupom: "PYTHON20" },
  vitalicio: true,
  lives_ao_vivo: [{ titulo: "Introdução ao Python", data: "2025-02-10", hora: "19:00" }],
};

const TRILHA_SEM_PROMOCAO = {
  id: 6,
  nome: "Machine Learning com Scikit-Learn",
  tecnologia: "Scikit-Learn",
  nivel: "Intermediário",
  numero_de_modulos: 11,
  xp_total: 8700,
  badges_disponiveis: ["ML Practitioner"],
  promocoes: { desconto_percentual: 0, validade: null, cupom: null },
  vitalicio: true,
  lives_ao_vivo: [],
};

const TRILHA_SEM_VITALICIO = {
  id: 3,
  nome: "Engenharia de Dados com Apache Spark",
  tecnologia: "Apache Spark",
  nivel: "Avançado",
  numero_de_modulos: 12,
  xp_total: 11200,
  badges_disponiveis: ["Spark Engineer", "Big Data Master"],
  promocoes: { desconto_percentual: 10, validade: "2025-10-15", cupom: "SPARK10" },
  vitalicio: false,
  lives_ao_vivo: [],
};

const CATALOGO = [TRILHA_JAVA, TRILHA_PYTHON, TRILHA_SEM_PROMOCAO, TRILHA_SEM_VITALICIO];

// ===========================================================================
// 1. normalizar
// ===========================================================================

describe("normalizar()", () => {
  test("converte para minúsculas", () => {
    expect(normalizar("JAVA")).toBe("java");
  });
  test("remove acento agudo", () => {
    expect(normalizar("Nível")).toBe("nivel");
  });
  test("remove cedilha", () => {
    expect(normalizar("Avançado")).toBe("avancado");
  });
  test("string vazia permanece vazia", () => {
    expect(normalizar("")).toBe("");
  });
  test("texto sem acentos permanece igual (minúsculo)", () => {
    expect(normalizar("java")).toBe("java");
  });
  test("remove múltiplos acentos", () => {
    expect(normalizar("Intermediário")).toBe("intermediario");
  });
  test("normaliza ã", () => {
    expect(normalizar("Não")).toBe("nao");
  });
  test("normaliza é", () => {
    expect(normalizar("você")).toBe("voce");
  });
});

// ===========================================================================
// 2. buscarTrilhas — foco JAVA
// ===========================================================================

describe("buscarTrilhas() — /trilha java", () => {
  test("encontra Java com maiúscula exata", () => {
    const r = buscarTrilhas("Java", CATALOGO);
    expect(r).toHaveLength(1);
    expect(r[0].tecnologia).toBe("Java");
  });
  test("encontra java com minúscula (case-insensitive)", () => {
    const r = buscarTrilhas("java", CATALOGO);
    expect(r[0].nome).toBe("Desenvolvedor Java Full Stack");
  });
  test("encontra JAVA com todas maiúsculas", () => {
    expect(buscarTrilhas("JAVA", CATALOGO)).toHaveLength(1);
  });
  test("encontra JaVa com caixa mista", () => {
    expect(buscarTrilhas("JaVa", CATALOGO)).toHaveLength(1);
  });
  test("retorna vazio para tecnologia inexistente", () => {
    expect(buscarTrilhas("Rust", CATALOGO)).toHaveLength(0);
  });
  test("retorna vazio para catálogo vazio", () => {
    expect(buscarTrilhas("Java", [])).toHaveLength(0);
  });
  test("encontra Python", () => {
    expect(buscarTrilhas("python", CATALOGO)).toHaveLength(1);
  });
  test("não busca no campo nome — 'Full Stack' retorna vazio", () => {
    expect(buscarTrilhas("Full Stack", CATALOGO)).toHaveLength(0);
  });
  test("busca parcial 'va' contida em 'Java'", () => {
    const r = buscarTrilhas("va", CATALOGO);
    expect(r.some(t => t.tecnologia === "Java")).toBe(true);
  });
  test("retorna vazio para COBOL", () => {
    expect(buscarTrilhas("COBOL", CATALOGO)).toHaveLength(0);
  });
});

// ===========================================================================
// 3. listarTecnologiasDisponiveis
// ===========================================================================

describe("listarTecnologiasDisponiveis()", () => {
  test("retorna um array", () => {
    expect(Array.isArray(listarTecnologiasDisponiveis(CATALOGO))).toBe(true);
  });
  test("contém Java", () => {
    expect(listarTecnologiasDisponiveis(CATALOGO)).toContain("Java");
  });
  test("contém Python", () => {
    expect(listarTecnologiasDisponiveis(CATALOGO)).toContain("Python");
  });
  test("sem duplicatas", () => {
    const cat = [TRILHA_JAVA, TRILHA_JAVA, TRILHA_PYTHON];
    const techs = listarTecnologiasDisponiveis(cat);
    expect(techs.length).toBe(new Set(techs).size);
  });
  test("resultado ordenado alfabeticamente", () => {
    const techs = listarTecnologiasDisponiveis(CATALOGO);
    expect(techs).toEqual([...techs].sort());
  });
  test("catálogo vazio retorna []", () => {
    expect(listarTecnologiasDisponiveis([])).toEqual([]);
  });
});

// ===========================================================================
// 4. formatarTrilha
// ===========================================================================

describe("formatarTrilha()", () => {
  test("contém o nome da trilha", () => {
    expect(formatarTrilha(TRILHA_JAVA)).toContain("Desenvolvedor Java Full Stack");
  });
  test("contém a tecnologia", () => {
    expect(formatarTrilha(TRILHA_JAVA)).toContain("Java");
  });
  test("contém o nível", () => {
    expect(formatarTrilha(TRILHA_JAVA)).toContain("Intermediário");
  });
  test("contém XP total", () => {
    expect(formatarTrilha(TRILHA_JAVA)).toContain("9800");
  });
  test("acesso vitalício = Sim", () => {
    expect(formatarTrilha(TRILHA_JAVA)).toContain("Sim");
  });
  test("acesso vitalício = Não quando false", () => {
    expect(formatarTrilha(TRILHA_SEM_VITALICIO)).toContain("Não");
  });
  test("contém todas as badges", () => {
    const saida = formatarTrilha(TRILHA_JAVA);
    TRILHA_JAVA.badges_disponiveis.forEach(b => expect(saida).toContain(b));
  });
  test("exibe promoção ativa com % e cupom", () => {
    const saida = formatarTrilha(TRILHA_JAVA);
    expect(saida).toContain("15%");
    expect(saida).toContain("JAVA15");
  });
  test("exibe mensagem quando sem promoção", () => {
    expect(formatarTrilha(TRILHA_SEM_PROMOCAO)).toContain("Nenhuma promoção ativa");
  });
  test("lista lives ao vivo", () => {
    expect(formatarTrilha(TRILHA_JAVA)).toContain("Spring Boot na Prática");
  });
  test("mensagem quando sem lives", () => {
    expect(formatarTrilha(TRILHA_SEM_PROMOCAO)).toContain("Não há lives agendadas");
  });
  test("contém número de módulos", () => {
    expect(formatarTrilha(TRILHA_JAVA)).toContain("14");
  });
});

// ===========================================================================
// 5. comandoTrilha — integração /trilha
// ===========================================================================

describe("comandoTrilha() — integração", () => {
  test("Java encontrado", () => {
    expect(comandoTrilha("Java", CATALOGO)).toContain("Desenvolvedor Java Full Stack");
  });
  test("java minúsculo encontrado", () => {
    expect(comandoTrilha("java", CATALOGO)).toContain("Java");
  });
  test("tecnologia inexistente exibe aviso", () => {
    expect(comandoTrilha("Rust", CATALOGO)).toContain("Nenhuma trilha encontrada");
  });
  test("tecnologia inexistente lista as disponíveis", () => {
    const saida = comandoTrilha("COBOL", CATALOGO);
    expect(saida).toContain("Java");
    expect(saida).toContain("Python");
  });
  test("múltiplas trilhas têm separador ---", () => {
    const cat = [TRILHA_JAVA, { ...TRILHA_JAVA, id: 99, nome: "Java Avançado Extra" }];
    expect(comandoTrilha("java", cat)).toContain("---");
  });
  test("end-to-end com arquivo real: Java encontrado", () => {
    const trilhas = carregarTrilhas(DATA_FILE);
    const saida = comandoTrilha("Java", trilhas);
    expect(saida).toContain("Java");
    expect(saida).toContain("9800");
  });
  test("end-to-end com arquivo real: tecnologia inexistente lista opções", () => {
    const trilhas = carregarTrilhas(DATA_FILE);
    const saida = comandoTrilha("COBOL", trilhas);
    expect(saida).toContain("Nenhuma trilha encontrada");
  });
});

// ===========================================================================
// 6. normalizarNivel
// ===========================================================================

describe("normalizarNivel()", () => {
  test("iniciante → Iniciante", () => {
    expect(normalizarNivel("iniciante")).toBe("Iniciante");
  });
  test("Iniciante maiúsculo → Iniciante", () => {
    expect(normalizarNivel("Iniciante")).toBe("Iniciante");
  });
  test("intermediario sem acento → Intermediário", () => {
    expect(normalizarNivel("intermediario")).toBe("Intermediário");
  });
  test("intermediário com acento → Intermediário", () => {
    expect(normalizarNivel("intermediário")).toBe("Intermediário");
  });
  test("avancado sem acento → Avançado", () => {
    expect(normalizarNivel("avancado")).toBe("Avançado");
  });
  test("avançado com acento → Avançado", () => {
    expect(normalizarNivel("avançado")).toBe("Avançado");
  });
  test("nível inválido → null", () => {
    expect(normalizarNivel("expert")).toBeNull();
  });
  test("string vazia → null", () => {
    expect(normalizarNivel("")).toBeNull();
  });
  test("número como string → null", () => {
    expect(normalizarNivel("3")).toBeNull();
  });
});

// ===========================================================================
// 7. gerarTemplateCodigo
// ===========================================================================

describe("gerarTemplateCodigo()", () => {
  test("Java gera public class", () => {
    expect(gerarTemplateCodigo("Java", "Iniciante")).toContain("public class");
  });
  test("Java gera método main", () => {
    expect(gerarTemplateCodigo("Java", "Intermediário")).toContain("main");
  });
  test("Java gera TODO", () => {
    expect(gerarTemplateCodigo("Java", "Avançado")).toContain("TODO");
  });
  test("JAVA maiúsculo também gera public class (case-insensitive)", () => {
    expect(gerarTemplateCodigo("JAVA", "Iniciante")).toContain("public class");
  });
  test("Python gera def", () => {
    expect(gerarTemplateCodigo("Python", "Iniciante")).toContain("def");
  });
  test("Python gera pass", () => {
    expect(gerarTemplateCodigo("Python", "Intermediário")).toContain("pass");
  });
  test("tecnologia genérica gera TODO", () => {
    expect(gerarTemplateCodigo("Rust", "Avançado")).toContain("TODO");
  });
  // Novas tecnologias
  test("JavaScript NÃO gera public class (não confunde com Java)", () => {
    expect(gerarTemplateCodigo("JavaScript", "Iniciante")).not.toContain("public class");
  });
  test("JavaScript gera bloco javascript", () => {
    expect(gerarTemplateCodigo("JavaScript", "Iniciante")).toContain("```javascript");
  });
  test("JavaScript gera function solucao", () => {
    expect(gerarTemplateCodigo("JavaScript", "Iniciante")).toContain("function solucao");
  });
  test("TypeScript gera bloco typescript", () => {
    expect(gerarTemplateCodigo("TypeScript", "Iniciante")).toContain("```typescript");
  });
  test("TypeScript gera assinatura tipada", () => {
    expect(gerarTemplateCodigo("TypeScript", "Intermediário")).toContain("unknown");
  });
  test("React gera bloco tsx", () => {
    expect(gerarTemplateCodigo("React", "Iniciante")).toContain("```tsx");
  });
  test("React gera import React", () => {
    expect(gerarTemplateCodigo("React", "Intermediário")).toContain("import React");
  });
  test("Node.js gera use strict", () => {
    expect(gerarTemplateCodigo("Node.js", "Iniciante")).toContain("'use strict'");
  });
  test("Node.js gera module.exports", () => {
    expect(gerarTemplateCodigo("Node.js", "Intermediário")).toContain("module.exports");
  });
  test("SQL gera SELECT", () => {
    expect(gerarTemplateCodigo("SQL", "Iniciante")).toContain("SELECT");
  });
  test("SQL gera bloco sql", () => {
    expect(gerarTemplateCodigo("SQL", "Intermediário")).toContain("```sql");
  });
});

// ===========================================================================
// 7b. sortearDesafio
// ===========================================================================

describe("sortearDesafio()", () => {
  test("retorna desafio para Java Iniciante", () => {
    const d = sortearDesafio("Java", "Iniciante");
    expect(d).not.toBeNull();
    expect(d).toHaveProperty("descricao");
    expect(d).toHaveProperty("objetivos");
    expect(d).toHaveProperty("entrada");
    expect(d).toHaveProperty("saida");
    expect(d).toHaveProperty("restricoes");
    expect(d).toHaveProperty("dica");
  });
  test("retorna desafio para Python Iniciante", () => {
    expect(sortearDesafio("Python", "Iniciante")).not.toBeNull();
  });
  test("retorna desafio para JavaScript Intermediário", () => {
    expect(sortearDesafio("JavaScript", "Intermediário")).not.toBeNull();
  });
  test("retorna desafio para TypeScript Avançado", () => {
    expect(sortearDesafio("TypeScript", "Avançado")).not.toBeNull();
  });
  test("retorna desafio para React Iniciante", () => {
    expect(sortearDesafio("React", "Iniciante")).not.toBeNull();
  });
  test("retorna desafio para Node.js Intermediário", () => {
    expect(sortearDesafio("Node.js", "Intermediário")).not.toBeNull();
  });
  test("retorna desafio para SQL Avançado", () => {
    expect(sortearDesafio("SQL", "Avançado")).not.toBeNull();
  });
  test("retorna null para tecnologia não cadastrada", () => {
    expect(sortearDesafio("Rust", "Iniciante")).toBeNull();
  });
  test("busca é case-insensitive: 'javascript' encontra 'javascript:Iniciante'", () => {
    expect(sortearDesafio("javascript", "Iniciante")).not.toBeNull();
  });
  test("desafio Java tem pelo menos 1 objetivo", () => {
    const d = sortearDesafio("Java", "Iniciante");
    expect(d.objetivos.length).toBeGreaterThanOrEqual(1);
  });
  test("BANCO_DESAFIOS exportado é um objeto", () => {
    expect(typeof BANCO_DESAFIOS).toBe("object");
  });
  test("BANCO_DESAFIOS contém java:Iniciante", () => {
    expect(BANCO_DESAFIOS["java:Iniciante"]).toBeDefined();
  });
});

// ===========================================================================
// 8. gerarDesafio — /desafio
// ===========================================================================

describe("gerarDesafio() — /desafio", () => {
  test("desafio Java Iniciante contém Java", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("Java");
  });
  test("desafio Java Iniciante contém Iniciante", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("Iniciante");
  });
  test("desafio Java Intermediário exibe nível correto", () => {
    expect(gerarDesafio("Java", "intermediario")).toContain("Intermediário");
  });
  test("desafio Java Avançado exibe nível correto", () => {
    expect(gerarDesafio("Java", "avancado")).toContain("Avançado");
  });
  test("nível inválido retorna mensagem não reconhecido", () => {
    expect(gerarDesafio("Java", "expert")).toContain("não reconhecido");
  });
  test("nível inválido sugere as opções válidas", () => {
    const saida = gerarDesafio("Java", "mestre");
    expect(saida.toLowerCase()).toMatch(/iniciante|intermediário|avançado/);
  });
  test("contém seção Descrição (emoji 📋)", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("📋");
  });
  test("contém seção Objetivo (emoji 🎯)", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("🎯");
  });
  test("contém seção Entrada (emoji 📥)", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("📥");
  });
  test("contém seção Saída (emoji 📤)", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("📤");
  });
  test("contém seção Restrições (emoji 📌)", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("📌");
  });
  test("contém seção Dica (emoji 💡)", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("💡");
  });
  test("contém seção Template (emoji 🧩)", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("🧩");
  });
  test("template Java contém public class", () => {
    expect(gerarDesafio("Java", "iniciante")).toContain("public class");
  });
  test("nível com acento funciona: avançado", () => {
    expect(gerarDesafio("Java", "avançado")).toContain("Avançado");
  });
});

// ===========================================================================
// 9. gerarCodigoVerificacao
// ===========================================================================

describe("gerarCodigoVerificacao()", () => {
  test("começa com DIO-", () => {
    expect(gerarCodigoVerificacao()).toMatch(/^DIO-/);
  });
  test("segue o padrão DIO-XXXX-XXXX-XXXX", () => {
    expect(gerarCodigoVerificacao()).toMatch(/^DIO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
  test("tem exatamente 18 caracteres (DIO-XXXX-XXXX-XXXX)", () => {
    // DIO- (4) + 4 + "-" + 4 + "-" + 4 = 18 chars
    expect(gerarCodigoVerificacao()).toHaveLength(18);
  });
  test("gera códigos diferentes em chamadas consecutivas (alta prob.)", () => {
    const codes = new Set(Array.from({ length: 10 }, () => gerarCodigoVerificacao()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

// ===========================================================================
// 10. dataEmissaoPtBR
// ===========================================================================

describe("dataEmissaoPtBR()", () => {
  test("contém ' de '", () => {
    expect(dataEmissaoPtBR()).toContain(" de ");
  });
  test("contém o ano atual", () => {
    expect(dataEmissaoPtBR()).toContain(String(new Date().getFullYear()));
  });
  test("contém nome de mês em português", () => {
    const meses = ["janeiro","fevereiro","março","abril","maio","junho",
                   "julho","agosto","setembro","outubro","novembro","dezembro"];
    const saida = dataEmissaoPtBR();
    expect(meses.some(m => saida.includes(m))).toBe(true);
  });
  test("data específica: 1 de janeiro de 2025", () => {
    expect(dataEmissaoPtBR(new Date(2025, 0, 1))).toBe("1 de janeiro de 2025");
  });
  test("data específica: 15 de julho de 2024", () => {
    expect(dataEmissaoPtBR(new Date(2024, 6, 15))).toBe("15 de julho de 2024");
  });
  test("data específica: 31 de dezembro de 2025", () => {
    expect(dataEmissaoPtBR(new Date(2025, 11, 31))).toBe("31 de dezembro de 2025");
  });
});

// ===========================================================================
// 11. gerarCertificado — /certificado
// ===========================================================================

describe("gerarCertificado() — /certificado", () => {
  test("contém o nome do aluno", () => {
    const saida = gerarCertificado("João Silva", "Java", CATALOGO, { codigo: "DIO-TEST-0001-AAAA" });
    expect(saida).toContain("João Silva");
  });
  test("encontra trilha Java e exibe nome completo", () => {
    const saida = gerarCertificado("Maria Santos", "Java", CATALOGO, { codigo: "DIO-TEST-0002-BBBB" });
    expect(saida).toContain("Desenvolvedor Java Full Stack");
  });
  test("exibe tecnologia correta", () => {
    const saida = gerarCertificado("Ana Lima", "Java", CATALOGO, { codigo: "DIO-TEST-0003-CCCC" });
    expect(saida).toContain("Java");
  });
  test("exibe nível correto", () => {
    const saida = gerarCertificado("Carlos Souza", "Java", CATALOGO, { codigo: "DIO-TEST-0004-DDDD" });
    expect(saida).toContain("Intermediário");
  });
  test("exibe XP total correto", () => {
    const saida = gerarCertificado("Pedro Rocha", "Java", CATALOGO, { codigo: "DIO-TEST-0005-EEEE" });
    expect(saida).toContain("9800");
  });
  test("contém todas as badges da trilha Java", () => {
    const saida = gerarCertificado("Lucia Ferreira", "Java", CATALOGO, { codigo: "DIO-TEST-0006-FFFF" });
    ["Java Developer", "Spring Boot Pro", "Full Stack Hero"].forEach(b =>
      expect(saida).toContain(b)
    );
  });
  test("contém o código de verificação fornecido", () => {
    const saida = gerarCertificado("Roberto Dias", "Java", CATALOGO, { codigo: "DIO-ABCD-1234-XYZW" });
    expect(saida).toContain("DIO-ABCD-1234-XYZW");
  });
  test("contém data de emissão com ' de '", () => {
    const saida = gerarCertificado("Fernanda Cruz", "Java", CATALOGO, {
      codigo: "DIO-TEST-0007-GGGG",
      hoje: new Date(2025, 0, 15),
    });
    expect(saida).toContain("15 de janeiro de 2025");
  });
  test("contém link dio.me", () => {
    const saida = gerarCertificado("Thiago Melo", "Java", CATALOGO, { codigo: "DIO-TEST-0008-HHHH" });
    expect(saida).toContain("dio.me");
  });
  test("trilha não encontrada usa dados do usuário", () => {
    const saida = gerarCertificado("Aluno Teste", "Rust Programming", CATALOGO, { codigo: "DIO-RUST-0000-0001" });
    expect(saida).toContain("Aluno Teste");
    expect(saida).toContain("Rust Programming");
  });
  test("trilha não encontrada: XP = 0", () => {
    const saida = gerarCertificado("Aluno Teste", "Rust Programming", CATALOGO, { codigo: "DIO-RUST-0000-0002" });
    expect(saida).toContain("0 XP");
  });
  test("código gerado automaticamente quando não fornecido", () => {
    const saida = gerarCertificado("Auto Cert", "Python", CATALOGO);
    expect(saida).toMatch(/DIO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  });
  test("busca por tecnologia (não só por nome da trilha)", () => {
    const saida = gerarCertificado("Dev Java", "Java", CATALOGO, { codigo: "DIO-TEST-0009-IIII" });
    expect(saida).toContain("Desenvolvedor Java Full Stack");
  });
  test("end-to-end com arquivo real: Java", () => {
    const trilhas = carregarTrilhas(DATA_FILE);
    const saida = gerarCertificado("Estudante DIO", "Java", trilhas, { codigo: "DIO-REAL-JAVA-2025" });
    expect(saida).toContain("Estudante DIO");
    expect(saida).toContain("Java");
    expect(saida).toContain("DIO-REAL-JAVA-2025");
    expect(saida).toContain("9800");
  });
  test("certificado contém cabeçalho CERTIFICADO DE CONCLUSÃO", () => {
    const saida = gerarCertificado("Dev", "Java", CATALOGO, { codigo: "DIO-HDR-0001-AAAA" });
    expect(saida).toContain("CERTIFICADO DE CONCLUSÃO");
  });
});

// ===========================================================================
// 12. carregarTrilhas
// ===========================================================================

describe("carregarTrilhas()", () => {
  test("carrega o arquivo real e retorna array", () => {
    const trilhas = carregarTrilhas(DATA_FILE);
    expect(Array.isArray(trilhas)).toBe(true);
    expect(trilhas.length).toBeGreaterThan(0);
  });
  test("trilhas possuem campo tecnologia", () => {
    const trilhas = carregarTrilhas(DATA_FILE);
    trilhas.forEach(t => expect(t).toHaveProperty("tecnologia"));
  });
  test("trilhas possuem campo xp_total", () => {
    const trilhas = carregarTrilhas(DATA_FILE);
    trilhas.forEach(t => expect(t).toHaveProperty("xp_total"));
  });
  test("Java está presente no catálogo real", () => {
    const trilhas = carregarTrilhas(DATA_FILE);
    expect(trilhas.some(t => t.tecnologia === "Java")).toBe(true);
  });
  test("carrega arquivo customizado via tmp", () => {
    const fs   = require("fs");
    const os   = require("os");
    const tmp  = path.join(os.tmpdir(), "trilhas_test.json");
    fs.writeFileSync(tmp, JSON.stringify({ trilhas: [TRILHA_JAVA] }), "utf-8");
    const trilhas = carregarTrilhas(tmp);
    expect(trilhas).toHaveLength(1);
    expect(trilhas[0].tecnologia).toBe("Java");
    fs.unlinkSync(tmp);
  });
});

// ===========================================================================
// 13. Fluxo completo do aluno (integração /trilha → /desafio → /certificado)
// ===========================================================================

describe("Fluxo completo do aluno — Java", () => {
  const ALUNO  = "João Dev Silva";
  const TRILHA = "java";
  const NIVEL  = "intermediario";
  let trilhasReais;

  beforeAll(() => {
    trilhasReais = carregarTrilhas(DATA_FILE);
  });

  test("/trilha java retorna a trilha correta", () => {
    const saida = comandoTrilha(TRILHA, trilhasReais);
    expect(saida).toContain("Java");
    expect(saida).toContain("9800");
  });

  test("/trilha java exibe badges", () => {
    const saida = comandoTrilha(TRILHA, trilhasReais);
    expect(saida).toContain("Java Developer");
    expect(saida).toContain("Spring Boot Pro");
  });

  test("/trilha java exibe promoção ativa", () => {
    const saida = comandoTrilha(TRILHA, trilhasReais);
    expect(saida).toContain("JAVA15");
  });

  test("/desafio java intermediario gera conteúdo correto", () => {
    const saida = gerarDesafio("Java", NIVEL);
    expect(saida).toContain("Java");
    expect(saida).toContain("Intermediário");
    expect(saida).toContain("public class");
  });

  test("/desafio java intermediario contém todas as seções", () => {
    const saida = gerarDesafio("Java", NIVEL);
    ["📋","🎯","📥","📤","📌","💡","🧩"].forEach(emoji =>
      expect(saida).toContain(emoji)
    );
  });

  test("/certificado emite com nome do aluno", () => {
    const saida = gerarCertificado(ALUNO, "Java", trilhasReais, { codigo: "DIO-FLOW-TEST-2025" });
    expect(saida).toContain(ALUNO);
  });

  test("/certificado exibe XP correto do arquivo real", () => {
    const saida = gerarCertificado(ALUNO, "Java", trilhasReais, { codigo: "DIO-FLOW-TEST-2025" });
    expect(saida).toContain("9800");
  });

  test("/certificado badges corretas do arquivo real", () => {
    const saida = gerarCertificado(ALUNO, "Java", trilhasReais, { codigo: "DIO-BADGE-FLOW-001" });
    expect(saida).toContain("Java Developer");
    expect(saida).toContain("Spring Boot Pro");
    expect(saida).toContain("Full Stack Hero");
  });

  test("/certificado código de verificação no formato correto", () => {
    const saida = gerarCertificado(ALUNO, "Java", trilhasReais);
    expect(saida).toMatch(/DIO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  });
  
  // ===========================================================================
  // Desafios de novas tecnologias — integração gerarDesafio()
  // ===========================================================================
  
  describe("gerarDesafio() — novas tecnologias", () => {
    test("JavaScript Iniciante contém JavaScript e Iniciante", () => {
      const saida = gerarDesafio("JavaScript", "iniciante");
      expect(saida).toContain("JavaScript");
      expect(saida).toContain("Iniciante");
    });
    test("JavaScript Iniciante tem template ```javascript", () => {
      expect(gerarDesafio("JavaScript", "iniciante")).toContain("```javascript");
    });
    test("JavaScript Intermediário contém descricao real do banco (não genérica)", () => {
      const saida = gerarDesafio("JavaScript", "intermediario");
      // A descricao genérica seria "Implemente uma solução em JavaScript" — o banco tem conteúdo específico
      expect(saida).not.toContain("para o problema proposto no nível");
    });
    test("TypeScript Iniciante contém TypeScript e Iniciante", () => {
      const saida = gerarDesafio("TypeScript", "iniciante");
      expect(saida).toContain("TypeScript");
      expect(saida).toContain("Iniciante");
    });
    test("TypeScript Iniciante tem template ```typescript", () => {
      expect(gerarDesafio("TypeScript", "iniciante")).toContain("```typescript");
    });
    test("React Iniciante tem template ```tsx", () => {
      expect(gerarDesafio("React", "iniciante")).toContain("```tsx");
    });
    test("Node.js Iniciante tem template com use strict", () => {
      expect(gerarDesafio("Node.js", "iniciante")).toContain("use strict");
    });
    test("SQL Iniciante tem template ```sql", () => {
      expect(gerarDesafio("SQL", "iniciante")).toContain("```sql");
    });
    test("Rust (sem banco) usa fallback genérico", () => {
      const saida = gerarDesafio("Rust", "iniciante");
      expect(saida).toContain("Rust");
      expect(saida).toContain("Iniciante");
      // fallback genérico sempre presente
      expect(saida).toContain("📋");
    });
    test("todas as seções presentes para JavaScript", () => {
      const saida = gerarDesafio("JavaScript", "intermediario");
      ["📋","🎯","📥","📤","📌","💡","🧩"].forEach(e => expect(saida).toContain(e));
    });
  });
});
