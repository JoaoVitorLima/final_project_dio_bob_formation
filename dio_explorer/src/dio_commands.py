"""
dio_commands.py
---------------
Módulo com a lógica de negócio dos comandos DIO Explorer:
  /trilha  – consulta trilhas por tecnologia
  /desafio – gera template de desafio por tecnologia e nível
  /certificado – gera certificado de conclusão fictício
"""

import json
import re
import random
import string
from datetime import date
from pathlib import Path

# ---------------------------------------------------------------------------
# Helpers de carregamento de dados
# ---------------------------------------------------------------------------

DATA_FILE = Path(__file__).parent.parent / "data" / "trilhas_dio.json"


def carregar_trilhas(filepath: str | Path = DATA_FILE) -> list[dict]:
    """Lê e retorna a lista de trilhas do arquivo JSON."""
    with open(filepath, encoding="utf-8") as fh:
        data = json.load(fh)
    return data["trilhas"]


# ---------------------------------------------------------------------------
# Normalização de texto para buscas case/acento-insensitive
# ---------------------------------------------------------------------------

def _normalizar(texto: str) -> str:
    """Remove acentos e converte para minúsculas."""
    substituicoes = {
        "á": "a", "à": "a", "â": "a", "ã": "a", "ä": "a",
        "é": "e", "è": "e", "ê": "e", "ë": "e",
        "í": "i", "ì": "i", "î": "i", "ï": "i",
        "ó": "o", "ò": "o", "ô": "o", "õ": "o", "ö": "o",
        "ú": "u", "ù": "u", "û": "u", "ü": "u",
        "ç": "c", "ñ": "n",
    }
    resultado = texto.lower()
    for src, dst in substituicoes.items():
        resultado = resultado.replace(src, dst)
    return resultado


# ---------------------------------------------------------------------------
# Comando /trilha
# ---------------------------------------------------------------------------

def buscar_trilhas(tecnologia: str, trilhas: list[dict]) -> list[dict]:
    """
    Retorna todas as trilhas cujo campo 'tecnologia' contém o termo buscado
    (case-insensitive, sem diferenciação de acentos).
    """
    termo = _normalizar(tecnologia.strip())
    return [
        t for t in trilhas
        if termo in _normalizar(t["tecnologia"])
    ]


def listar_tecnologias_disponiveis(trilhas: list[dict]) -> list[str]:
    """Retorna a lista de tecnologias únicas presentes no catálogo."""
    return sorted({t["tecnologia"] for t in trilhas})


def formatar_trilha(trilha: dict) -> str:
    """Formata uma única trilha no formato de exibição Markdown."""
    vitalicio = "Sim" if trilha["vitalicio"] else "Não"
    promo = trilha["promocoes"]

    badges_str = "\n".join(f"  🏆 {b}" for b in trilha["badges_disponiveis"])

    if promo["desconto_percentual"] > 0:
        promo_str = (
            f"> 🔖 **{promo['desconto_percentual']}% de desconto** "
            f"com o cupom `{promo['cupom']}` · Válido até {promo['validade']}"
        )
    else:
        promo_str = "_Nenhuma promoção ativa no momento._"

    if trilha["lives_ao_vivo"]:
        lives_str = "\n".join(
            f"  - {live['titulo']} — {live['data']} às {live['hora']}"
            for live in trilha["lives_ao_vivo"]
        )
    else:
        lives_str = "  Não há lives agendadas."

    return (
        f"# 🎯 Trilha: {trilha['nome']}\n\n"
        f"| Campo | Detalhe |\n"
        f"|---|---|\n"
        f"| 🖥️ Tecnologia | {trilha['tecnologia']} |\n"
        f"| 📊 Nível | {trilha['nivel']} |\n"
        f"| 📦 Nº de Módulos | {trilha['numero_de_modulos']} |\n"
        f"| ⭐ XP Total | {trilha['xp_total']} XP |\n"
        f"| ♾️ Acesso Vitalício | {vitalicio} |\n\n"
        f"## 🏅 Badges Disponíveis\n{badges_str}\n\n"
        f"## 🎁 Promoção Ativa\n{promo_str}\n\n"
        f"## 📅 Próximas Lives ao Vivo\n{lives_str}\n"
    )


def comando_trilha(tecnologia: str, trilhas: list[dict]) -> str:
    """
    Ponto de entrada do comando /trilha.
    Retorna o texto formatado de resposta.
    """
    resultados = buscar_trilhas(tecnologia, trilhas)

    if not resultados:
        techs = listar_tecnologias_disponiveis(trilhas)
        lista = "\n".join(f"  - {t}" for t in techs)
        return (
            f"Nenhuma trilha encontrada para '{tecnologia}'.\n\n"
            f"Tecnologias disponíveis:\n{lista}"
        )

    return "\n---\n\n".join(formatar_trilha(t) for t in resultados)


# ---------------------------------------------------------------------------
# Comando /desafio
# ---------------------------------------------------------------------------

NIVEIS_VALIDOS = {"iniciante", "intermediario", "intermediário", "avancado", "avançado"}
NIVEIS_MAPA = {
    "iniciante": "Iniciante",
    "intermediario": "Intermediário",
    "intermediário": "Intermediário",
    "avancado": "Avançado",
    "avançado": "Avançado",
}


def normalizar_nivel(nivel: str) -> str | None:
    """Normaliza o nível aceito e retorna o nome canônico ou None se inválido."""
    chave = _normalizar(nivel.strip())
    return NIVEIS_MAPA.get(chave)


def gerar_template_codigo(tecnologia: str, nivel_canonico: str) -> str:
    """
    Retorna um template de código mínimo adequado à tecnologia e nível.
    """
    tec = tecnologia.lower()

    if "java" in tec:
        return (
            "```java\n"
            "/**\n"
            f" * Desafio {tecnologia} - Nível {nivel_canonico}\n"
            " * Implemente a lógica conforme a descrição acima.\n"
            " */\n"
            "public class Desafio {\n"
            "    public static void main(String[] args) {\n"
            "        // TODO: implemente aqui\n"
            "    }\n"
            "}\n"
            "```"
        )
    if "python" in tec:
        return (
            "```python\n"
            "def solucao():\n"
            f'    """Desafio {tecnologia} - Nível {nivel_canonico}"""\n'
            "    pass  # TODO\n"
            "```"
        )
    # Genérico
    return (
        f"```\n"
        f"// Desafio {tecnologia} - Nível {nivel_canonico}\n"
        f"// TODO: implemente aqui\n"
        f"```"
    )


def gerar_desafio(tecnologia: str, nivel: str) -> str:
    """
    Ponto de entrada do comando /desafio.
    Retorna o texto do desafio formatado ou mensagem de nível inválido.
    """
    nivel_canonico = normalizar_nivel(nivel)

    if nivel_canonico is None:
        return (
            f"Nível '{nivel}' não reconhecido. "
            "Por favor, escolha entre: `iniciante`, `intermediário` ou `avançado`."
        )

    template = gerar_template_codigo(tecnologia, nivel_canonico)

    return (
        f"# 💻 Desafio {tecnologia} — Nível {nivel_canonico}\n\n"
        f"## 📋 Descrição\n"
        f"Implemente uma solução em {tecnologia} para o problema proposto "
        f"no nível {nivel_canonico}. O problema deve demonstrar domínio dos "
        f"conceitos fundamentais da tecnologia.\n\n"
        f"## 🎯 Objetivo\n"
        f"- Resolver o problema dentro das restrições definidas\n"
        f"- Escrever código limpo e bem documentado\n"
        f"- Atingir a complexidade esperada para o nível {nivel_canonico}\n\n"
        f"## 📥 Entrada\n"
        f"Dados de entrada conforme especificação do problema. Exemplo: `[1, 2, 3]`\n\n"
        f"## 📤 Saída Esperada\n"
        f"Resultado esperado conforme especificação. Exemplo: `6`\n\n"
        f"## 📌 Restrições\n"
        f"- Complexidade máxima: O(n²)\n"
        f"- Não utilize bibliotecas externas sem justificativa\n"
        f"- Trate edge cases (lista vazia, valores negativos)\n\n"
        f"## 💡 Dica\n"
        f"Considere a estrutura de dados mais adequada para o problema.\n\n"
        f"## 🧩 Template Inicial\n\n"
        f"{template}\n"
    )


# ---------------------------------------------------------------------------
# Comando /certificado
# ---------------------------------------------------------------------------

def _gerar_codigo_verificacao() -> str:
    """Gera um código fictício no formato DIO-XXXX-XXXX-XXXX."""
    def segmento(n: int = 4) -> str:
        chars = string.ascii_uppercase + string.digits
        return "".join(random.choices(chars, k=n))

    return f"DIO-{segmento()}-{segmento()}-{segmento()}"


def _data_emissao_ptbr() -> str:
    """Retorna a data de hoje formatada em português-BR."""
    meses = [
        "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ]
    hoje = date.today()
    return f"{hoje.day} de {meses[hoje.month]} de {hoje.year}"


def gerar_certificado(
    nome_aluno: str,
    trilha_nome: str,
    trilhas: list[dict],
    codigo: str | None = None,
) -> str:
    """
    Ponto de entrada do comando /certificado.
    Gera um certificado fictício em Markdown.
    """
    # Busca a trilha no catálogo
    termo = _normalizar(trilha_nome.strip())
    trilha_encontrada = next(
        (
            t for t in trilhas
            if termo in _normalizar(t["nome"]) or termo in _normalizar(t["tecnologia"])
        ),
        None,
    )

    if trilha_encontrada:
        nome_trilha = trilha_encontrada["nome"]
        tecnologia = trilha_encontrada["tecnologia"]
        nivel = trilha_encontrada["nivel"]
        xp = trilha_encontrada["xp_total"]
        badges = trilha_encontrada["badges_disponiveis"]
    else:
        nome_trilha = trilha_nome
        tecnologia = trilha_nome
        nivel = "N/A"
        xp = 0
        badges = []

    codigo_verif = codigo if codigo else _gerar_codigo_verificacao()
    data_emissao = _data_emissao_ptbr()
    badges_str = "\n".join(f"🏆 {b}" for b in badges) if badges else "Nenhuma badge registrada."

    return (
        f'<div align="center">\n\n'
        f"# 🏆 CERTIFICADO DE CONCLUSÃO\n\n"
        f"---\n\n"
        f"### *A Digital Innovation One certifica que*\n\n"
        f"## {nome_aluno}\n\n"
        f"### *concluiu com êxito a trilha*\n\n"
        f"# 🎓 {nome_trilha}\n\n"
        f"---\n\n"
        f"| 🖥️ Tecnologia | 📊 Nível | ⭐ XP Conquistado |\n"
        f"|:---:|:---:|:---:|\n"
        f"| {tecnologia} | {nivel} | {xp} XP |\n\n"
        f"---\n\n"
        f"### 🏅 Badges Conquistadas\n\n"
        f"{badges_str}\n\n"
        f"---\n\n"
        f"*Emitido em **{data_emissao}***\n\n"
        f"*Este certificado confirma que o(a) participante demonstrou domínio dos conteúdos,*\n"
        f"*completou todos os módulos e desafios previstos na trilha.*\n\n"
        f"---\n\n"
        f"🔐 **Código de verificação:** `{codigo_verif}`\n\n"
        f"---\n\n"
        f'*"O conhecimento é a única riqueza que ninguém pode te tirar."*\n\n'
        f"**Digital Innovation One — [dio.me](https://dio.me)**\n\n"
        f"</div>\n"
    )
