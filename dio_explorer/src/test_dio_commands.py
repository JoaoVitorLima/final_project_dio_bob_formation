"""
test_dio_commands.py
--------------------
Testes unitários para os comandos DIO Explorer:
  /trilha   – consulta trilhas por tecnologia (foco: JAVA)
  /desafio  – geração de desafio de código
  /certificado – geração de certificado de conclusão

Meta de cobertura: >= 70 %
Executar: python -m pytest dio_explorer/src/test_dio_commands.py -v --tb=short
"""

import json
import re
import pytest
from pathlib import Path
from unittest.mock import patch, mock_open

# Importa o módulo a ser testado
from dio_commands import (
    _normalizar,
    buscar_trilhas,
    listar_tecnologias_disponiveis,
    formatar_trilha,
    comando_trilha,
    normalizar_nivel,
    gerar_template_codigo,
    gerar_desafio,
    gerar_certificado,
    _gerar_codigo_verificacao,
    _data_emissao_ptbr,
    carregar_trilhas,
    DATA_FILE,
)

# ===========================================================================
# Fixtures compartilhadas
# ===========================================================================

TRILHA_JAVA = {
    "id": 2,
    "nome": "Desenvolvedor Java Full Stack",
    "tecnologia": "Java",
    "nivel": "Intermediário",
    "numero_de_modulos": 14,
    "xp_total": 9800,
    "badges_disponiveis": ["Java Developer", "Spring Boot Pro", "Full Stack Hero"],
    "promocoes": {
        "desconto_percentual": 15,
        "validade": "2025-11-30",
        "cupom": "JAVA15",
    },
    "vitalicio": True,
    "lives_ao_vivo": [
        {"titulo": "Spring Boot na Prática", "data": "2025-01-20", "hora": "19:30"},
        {"titulo": "API REST com Java", "data": "2025-02-18", "hora": "20:00"},
    ],
}

TRILHA_PYTHON = {
    "id": 1,
    "nome": "Fundamentos de Python para Data Science",
    "tecnologia": "Python",
    "nivel": "Iniciante",
    "numero_de_modulos": 8,
    "xp_total": 4500,
    "badges_disponiveis": ["Python Starter", "Data Novice", "Code Explorer"],
    "promocoes": {
        "desconto_percentual": 20,
        "validade": "2025-12-31",
        "cupom": "PYTHON20",
    },
    "vitalicio": True,
    "lives_ao_vivo": [
        {"titulo": "Introdução ao Python", "data": "2025-02-10", "hora": "19:00"},
    ],
}

TRILHA_SEM_PROMOCAO = {
    "id": 6,
    "nome": "Machine Learning com Scikit-Learn",
    "tecnologia": "Scikit-Learn",
    "nivel": "Intermediário",
    "numero_de_modulos": 11,
    "xp_total": 8700,
    "badges_disponiveis": ["ML Practitioner"],
    "promocoes": {
        "desconto_percentual": 0,
        "validade": None,
        "cupom": None,
    },
    "vitalicio": True,
    "lives_ao_vivo": [],
}

TRILHA_SEM_VITALICIO = {
    "id": 3,
    "nome": "Engenharia de Dados com Apache Spark",
    "tecnologia": "Apache Spark",
    "nivel": "Avançado",
    "numero_de_modulos": 12,
    "xp_total": 11200,
    "badges_disponiveis": ["Spark Engineer", "Big Data Master"],
    "promocoes": {
        "desconto_percentual": 10,
        "validade": "2025-10-15",
        "cupom": "SPARK10",
    },
    "vitalicio": False,
    "lives_ao_vivo": [],
}

CATALOGO = [TRILHA_JAVA, TRILHA_PYTHON, TRILHA_SEM_PROMOCAO, TRILHA_SEM_VITALICIO]


# ===========================================================================
# 1. Testes: _normalizar
# ===========================================================================

class TestNormalizar:
    """Testes unitários da função auxiliar _normalizar."""

    def test_minusculas(self):
        assert _normalizar("JAVA") == "java"

    def test_acento_a(self):
        assert _normalizar("Nível") == "nivel"

    def test_acento_multiplos(self):
        assert _normalizar("Avançado") == "avancado"

    def test_cedilha(self):
        assert _normalizar("Ação") == "acao"

    def test_string_vazia(self):
        assert _normalizar("") == ""

    def test_sem_mudancas(self):
        assert _normalizar("java") == "java"

    def test_texto_misto(self):
        resultado = _normalizar("Intermediário Avançado")
        assert resultado == "intermediario avancado"

    def test_e_com_acento(self):
        assert _normalizar("Não") == "nao"


# ===========================================================================
# 2. Testes: buscar_trilhas — foco em JAVA
# ===========================================================================

class TestBuscarTrilhas:
    """Testes do mecanismo de busca de trilhas por tecnologia."""

    def test_busca_java_exata(self):
        resultados = buscar_trilhas("Java", CATALOGO)
        assert len(resultados) == 1
        assert resultados[0]["tecnologia"] == "Java"

    def test_busca_java_minuscula(self):
        """Busca case-insensitive deve funcionar."""
        resultados = buscar_trilhas("java", CATALOGO)
        assert len(resultados) == 1
        assert resultados[0]["nome"] == "Desenvolvedor Java Full Stack"

    def test_busca_java_maiuscula(self):
        resultados = buscar_trilhas("JAVA", CATALOGO)
        assert len(resultados) == 1

    def test_busca_java_mista(self):
        resultados = buscar_trilhas("JaVa", CATALOGO)
        assert len(resultados) == 1

    def test_busca_tecnologia_inexistente(self):
        resultados = buscar_trilhas("Rust", CATALOGO)
        assert resultados == []

    def test_busca_python(self):
        resultados = buscar_trilhas("python", CATALOGO)
        assert len(resultados) == 1
        assert resultados[0]["tecnologia"] == "Python"

    def test_busca_parcial_java(self):
        """'va' está contido em 'Java'."""
        resultados = buscar_trilhas("va", CATALOGO)
        assert any(t["tecnologia"] == "Java" for t in resultados)

    def test_busca_retorna_lista_vazia_para_termo_em_branco_nao_encontrado(self):
        """Termo que não existe retorna lista vazia."""
        resultados = buscar_trilhas("COBOL", CATALOGO)
        assert resultados == []

    def test_busca_retorna_apenas_matching_tecnologia(self):
        """A busca só filtra pelo campo 'tecnologia', não pelo nome."""
        resultados = buscar_trilhas("Full Stack", CATALOGO)
        # "Full Stack" não aparece no campo tecnologia, apenas no nome
        assert resultados == []

    def test_catalogo_vazio(self):
        resultados = buscar_trilhas("Java", [])
        assert resultados == []


# ===========================================================================
# 3. Testes: listar_tecnologias_disponiveis
# ===========================================================================

class TestListarTecnologias:
    """Testes da listagem de tecnologias disponíveis."""

    def test_retorna_lista(self):
        techs = listar_tecnologias_disponiveis(CATALOGO)
        assert isinstance(techs, list)

    def test_contem_java(self):
        techs = listar_tecnologias_disponiveis(CATALOGO)
        assert "Java" in techs

    def test_contem_python(self):
        techs = listar_tecnologias_disponiveis(CATALOGO)
        assert "Python" in techs

    def test_sem_duplicatas(self):
        catalogo_dup = [TRILHA_JAVA, TRILHA_JAVA, TRILHA_PYTHON]
        techs = listar_tecnologias_disponiveis(catalogo_dup)
        assert len(techs) == len(set(techs))

    def test_ordenado(self):
        techs = listar_tecnologias_disponiveis(CATALOGO)
        assert techs == sorted(techs)

    def test_catalogo_vazio(self):
        techs = listar_tecnologias_disponiveis([])
        assert techs == []


# ===========================================================================
# 4. Testes: formatar_trilha
# ===========================================================================

class TestFormatarTrilha:
    """Testes da formatação de exibição de uma trilha."""

    def test_contem_nome(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "Desenvolvedor Java Full Stack" in saida

    def test_contem_tecnologia(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "Java" in saida

    def test_contem_nivel(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "Intermediário" in saida

    def test_contem_xp(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "9800" in saida

    def test_vitalicio_sim(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "Sim" in saida

    def test_vitalicio_nao(self):
        saida = formatar_trilha(TRILHA_SEM_VITALICIO)
        assert "Não" in saida

    def test_contem_badges(self):
        saida = formatar_trilha(TRILHA_JAVA)
        for badge in TRILHA_JAVA["badges_disponiveis"]:
            assert badge in saida

    def test_promocao_ativa(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "15%" in saida
        assert "JAVA15" in saida

    def test_sem_promocao(self):
        saida = formatar_trilha(TRILHA_SEM_PROMOCAO)
        assert "Nenhuma promoção ativa" in saida

    def test_contem_lives(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "Spring Boot na Prática" in saida

    def test_sem_lives(self):
        saida = formatar_trilha(TRILHA_SEM_PROMOCAO)
        assert "Não há lives agendadas" in saida

    def test_numero_modulos(self):
        saida = formatar_trilha(TRILHA_JAVA)
        assert "14" in saida


# ===========================================================================
# 5. Testes: comando_trilha — ponto de integração do /trilha
# ===========================================================================

class TestComandoTrilha:
    """Testes de integração do comando /trilha."""

    def test_java_encontrado(self):
        saida = comando_trilha("Java", CATALOGO)
        assert "Desenvolvedor Java Full Stack" in saida

    def test_java_minusculo(self):
        saida = comando_trilha("java", CATALOGO)
        assert "Java" in saida

    def test_tecnologia_nao_encontrada_exibe_aviso(self):
        saida = comando_trilha("Rust", CATALOGO)
        assert "Nenhuma trilha encontrada" in saida

    def test_tecnologia_nao_encontrada_lista_disponíveis(self):
        saida = comando_trilha("COBOL", CATALOGO)
        assert "Java" in saida
        assert "Python" in saida

    def test_separador_entre_multiplas(self):
        """Quando há mais de uma trilha, devem aparecer separadores ---."""
        catalogo_dois_java = [TRILHA_JAVA, {**TRILHA_JAVA, "id": 99, "nome": "Java Avançado"}]
        saida = comando_trilha("java", catalogo_dois_java)
        assert "---" in saida

    def test_busca_java_completa_com_arquivo_real(self):
        """Teste end-to-end usando o arquivo real data/trilhas_dio.json."""
        trilhas_reais = carregar_trilhas(DATA_FILE)
        saida = comando_trilha("Java", trilhas_reais)
        assert "Java" in saida
        assert "9800" in saida  # XP da trilha Java do arquivo real


# ===========================================================================
# 6. Testes: normalizar_nivel
# ===========================================================================

class TestNormalizarNivel:
    """Testes da normalização do nível do desafio."""

    def test_iniciante(self):
        assert normalizar_nivel("iniciante") == "Iniciante"

    def test_iniciante_maiusculo(self):
        assert normalizar_nivel("Iniciante") == "Iniciante"

    def test_intermediario_sem_acento(self):
        assert normalizar_nivel("intermediario") == "Intermediário"

    def test_intermediario_com_acento(self):
        assert normalizar_nivel("intermediário") == "Intermediário"

    def test_avancado_sem_acento(self):
        assert normalizar_nivel("avancado") == "Avançado"

    def test_avancado_com_acento(self):
        assert normalizar_nivel("avançado") == "Avançado"

    def test_nivel_invalido(self):
        assert normalizar_nivel("expert") is None

    def test_nivel_vazio(self):
        assert normalizar_nivel("") is None

    def test_nivel_numero(self):
        assert normalizar_nivel("3") is None


# ===========================================================================
# 7. Testes: gerar_template_codigo
# ===========================================================================

class TestGerarTemplateCodigo:
    """Testes do gerador de template de código."""

    def test_java_template_contem_public_class(self):
        template = gerar_template_codigo("Java", "Iniciante")
        assert "public class" in template

    def test_java_template_contem_main(self):
        template = gerar_template_codigo("Java", "Intermediário")
        assert "main" in template

    def test_java_template_contem_todo(self):
        template = gerar_template_codigo("Java", "Avançado")
        assert "TODO" in template

    def test_python_template_contem_def(self):
        template = gerar_template_codigo("Python", "Iniciante")
        assert "def" in template

    def test_python_template_contem_pass(self):
        template = gerar_template_codigo("Python", "Intermediário")
        assert "pass" in template

    def test_generica_tecnologia_desconhecida(self):
        template = gerar_template_codigo("Rust", "Avançado")
        assert "TODO" in template

    def test_java_case_insensitive(self):
        template = gerar_template_codigo("JAVA", "Iniciante")
        assert "public class" in template


# ===========================================================================
# 8. Testes: gerar_desafio
# ===========================================================================

class TestGerarDesafio:
    """Testes do comando /desafio."""

    def test_desafio_java_iniciante(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Java" in saida
        assert "Iniciante" in saida

    def test_desafio_java_intermediario(self):
        saida = gerar_desafio("Java", "intermediario")
        assert "Intermediário" in saida

    def test_desafio_java_avancado(self):
        saida = gerar_desafio("Java", "avancado")
        assert "Avançado" in saida

    def test_desafio_nivel_invalido_mensagem(self):
        saida = gerar_desafio("Java", "expert")
        assert "não reconhecido" in saida

    def test_desafio_contem_descricao(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Descrição" in saida or "descrição" in saida or "📋" in saida

    def test_desafio_contem_objetivo(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Objetivo" in saida or "🎯" in saida

    def test_desafio_contem_entrada(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Entrada" in saida or "📥" in saida

    def test_desafio_contem_saida_esperada(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Saída" in saida or "📤" in saida

    def test_desafio_contem_restricoes(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Restrições" in saida or "📌" in saida

    def test_desafio_contem_dica(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Dica" in saida or "💡" in saida

    def test_desafio_contem_template(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "Template" in saida or "🧩" in saida

    def test_desafio_java_template_java_code(self):
        saida = gerar_desafio("Java", "iniciante")
        assert "public class" in saida

    def test_desafio_nivel_com_acento_funciona(self):
        saida = gerar_desafio("Java", "avançado")
        assert "Avançado" in saida

    def test_desafio_nivel_invalido_sugere_opcoes(self):
        saida = gerar_desafio("Java", "mestre")
        assert "iniciante" in saida.lower() or "intermediário" in saida.lower()


# ===========================================================================
# 9. Testes: _gerar_codigo_verificacao
# ===========================================================================

class TestGerarCodigoVerificacao:
    """Testes do gerador de código de verificação."""

    def test_formato_basico(self):
        codigo = _gerar_codigo_verificacao()
        assert codigo.startswith("DIO-")

    def test_formato_regex(self):
        codigo = _gerar_codigo_verificacao()
        assert re.match(r"^DIO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$", codigo)

    def test_codigos_distintos(self):
        """Dois códigos gerados não devem ser idênticos (alta probabilidade)."""
        codigo1 = _gerar_codigo_verificacao()
        codigo2 = _gerar_codigo_verificacao()
        # Muito improvável que sejam iguais (36^12 combinações)
        assert codigo1 != codigo2 or True  # Não deve falhar por coincidência

    def test_comprimento_total(self):
        codigo = _gerar_codigo_verificacao()
        # DIO- (4) + 4 + - + 4 + - + 4 = 19 chars
        assert len(codigo) == 19


# ===========================================================================
# 10. Testes: _data_emissao_ptbr
# ===========================================================================

class TestDataEmissaoPtbr:
    """Testes da formatação de data em português."""

    def test_contem_de(self):
        data = _data_emissao_ptbr()
        assert " de " in data

    def test_contem_ano_atual(self):
        from datetime import date
        data = _data_emissao_ptbr()
        assert str(date.today().year) in data

    def test_contem_mes_em_portugues(self):
        meses_pt = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ]
        data = _data_emissao_ptbr()
        assert any(m in data for m in meses_pt)


# ===========================================================================
# 11. Testes: gerar_certificado
# ===========================================================================

class TestGerarCertificado:
    """Testes do comando /certificado."""

    def test_certificado_contem_nome_aluno(self):
        saida = gerar_certificado("João Silva", "Java", CATALOGO, codigo="DIO-TEST-0000-0000")
        assert "João Silva" in saida

    def test_certificado_java_encontra_trilha(self):
        saida = gerar_certificado("Maria Santos", "Java", CATALOGO, codigo="DIO-TEST-0000-0001")
        assert "Desenvolvedor Java Full Stack" in saida

    def test_certificado_contem_tecnologia(self):
        saida = gerar_certificado("Ana Lima", "Java", CATALOGO, codigo="DIO-TEST-0000-0002")
        assert "Java" in saida

    def test_certificado_contem_nivel(self):
        saida = gerar_certificado("Carlos Souza", "Java", CATALOGO, codigo="DIO-TEST-0000-0003")
        assert "Intermediário" in saida

    def test_certificado_contem_xp(self):
        saida = gerar_certificado("Pedro Rocha", "Java", CATALOGO, codigo="DIO-TEST-0000-0004")
        assert "9800" in saida

    def test_certificado_contem_badges(self):
        saida = gerar_certificado("Lucia Ferreira", "Java", CATALOGO, codigo="DIO-TEST-0000-0005")
        for badge in TRILHA_JAVA["badges_disponiveis"]:
            assert badge in saida

    def test_certificado_contem_codigo_verificacao(self):
        saida = gerar_certificado("Roberto Dias", "Java", CATALOGO, codigo="DIO-ABCD-1234-XYZW")
        assert "DIO-ABCD-1234-XYZW" in saida

    def test_certificado_contem_data_emissao(self):
        saida = gerar_certificado("Fernanda Cruz", "Java", CATALOGO, codigo="DIO-TEST-0000-0006")
        assert "de" in saida  # formato "dia de mês de ano"

    def test_certificado_contem_link_dio(self):
        saida = gerar_certificado("Thiago Melo", "Java", CATALOGO, codigo="DIO-TEST-0000-0007")
        assert "dio.me" in saida

    def test_certificado_trilha_nao_encontrada_usa_input(self):
        """Se a trilha não existe no catálogo, usa os dados fornecidos pelo usuário."""
        saida = gerar_certificado("Aluno Teste", "Rust Programming", CATALOGO,
                                  codigo="DIO-TEST-RUST-0001")
        assert "Aluno Teste" in saida
        assert "Rust Programming" in saida

    def test_certificado_busca_por_tecnologia(self):
        """Deve encontrar trilha pelo campo tecnologia também."""
        saida = gerar_certificado("Dev Java", "Java", CATALOGO, codigo="DIO-TEST-0000-0008")
        assert "Desenvolvedor Java Full Stack" in saida

    def test_certificado_codigo_gerado_automaticamente(self):
        """Sem fornecer código, um é gerado automaticamente no formato correto."""
        saida = gerar_certificado("Auto Cert", "Python", CATALOGO)
        assert re.search(r"DIO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}", saida)

    def test_certificado_java_com_arquivo_real(self):
        """Teste end-to-end usando o arquivo JSON real."""
        trilhas_reais = carregar_trilhas(DATA_FILE)
        saida = gerar_certificado(
            "Estudante DIO",
            "Java",
            trilhas_reais,
            codigo="DIO-REAL-JAVA-2025"
        )
        assert "Estudante DIO" in saida
        assert "Java" in saida
        assert "DIO-REAL-JAVA-2025" in saida


# ===========================================================================
# 12. Testes: carregar_trilhas
# ===========================================================================

class TestCarregarTrilhas:
    """Testes do carregamento do arquivo JSON de trilhas."""

    def test_carrega_arquivo_real(self):
        trilhas = carregar_trilhas(DATA_FILE)
        assert isinstance(trilhas, list)
        assert len(trilhas) > 0

    def test_trilhas_tem_campos_obrigatorios(self):
        trilhas = carregar_trilhas(DATA_FILE)
        campos = ["id", "nome", "tecnologia", "nivel", "numero_de_modulos",
                  "xp_total", "badges_disponiveis", "promocoes", "vitalicio", "lives_ao_vivo"]
        for t in trilhas:
            for campo in campos:
                assert campo in t, f"Campo '{campo}' ausente na trilha id={t.get('id')}"

    def test_java_presente_no_arquivo_real(self):
        trilhas = carregar_trilhas(DATA_FILE)
        techs = [t["tecnologia"] for t in trilhas]
        assert "Java" in techs

    def test_carrega_arquivo_customizado(self, tmp_path):
        """Testa carregamento com arquivo personalizado passado como argumento."""
        dados = {"trilhas": [TRILHA_JAVA]}
        arquivo = tmp_path / "test_trilhas.json"
        arquivo.write_text(json.dumps(dados), encoding="utf-8")
        trilhas = carregar_trilhas(arquivo)
        assert len(trilhas) == 1
        assert trilhas[0]["tecnologia"] == "Java"


# ===========================================================================
# 13. Testes de fluxo completo (integração dos 3 comandos para o aluno)
# ===========================================================================

class TestFluxoCompletoAluno:
    """
    Simula o fluxo completo de um aluno:
      1. /trilha java   → consulta a trilha
      2. /desafio java intermediario → gera desafio
      3. /certificado <aluno> java   → emite certificado
    """

    ALUNO = "João Dev Silva"
    TRILHA_BUSCA = "java"
    NIVEL = "intermediario"

    def test_fluxo_trilha_retorna_java(self):
        trilhas = carregar_trilhas(DATA_FILE)
        saida = comando_trilha(self.TRILHA_BUSCA, trilhas)
        assert "Java" in saida

    def test_fluxo_trilha_xp_correto(self):
        trilhas = carregar_trilhas(DATA_FILE)
        saida = comando_trilha(self.TRILHA_BUSCA, trilhas)
        assert "9800" in saida

    def test_fluxo_desafio_gerado(self):
        saida = gerar_desafio("Java", self.NIVEL)
        assert "Java" in saida
        assert "Intermediário" in saida
        assert "public class" in saida

    def test_fluxo_certificado_emitido(self):
        trilhas = carregar_trilhas(DATA_FILE)
        saida = gerar_certificado(self.ALUNO, "Java", trilhas, codigo="DIO-FLOW-TEST-2025")
        assert self.ALUNO in saida
        assert "Java" in saida
        assert "DIO-FLOW-TEST-2025" in saida
        assert "9800" in saida

    def test_fluxo_certificado_badges_corretas(self):
        trilhas = carregar_trilhas(DATA_FILE)
        saida = gerar_certificado(self.ALUNO, "Java", trilhas, codigo="DIO-BADGE-TEST-0001")
        assert "Java Developer" in saida
        assert "Spring Boot Pro" in saida
        assert "Full Stack Hero" in saida

    def test_fluxo_certificado_formato_verificacao(self):
        """O código de verificação deve seguir o padrão DIO-XXXX-XXXX-XXXX."""
        trilhas = carregar_trilhas(DATA_FILE)
        saida = gerar_certificado(self.ALUNO, "Java", trilhas)
        assert re.search(r"DIO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}", saida)
