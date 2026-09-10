---
description: Exibe o plano de estudos formatado de uma trilha DIO
argument-hint: <tecnologia>
---

Leia o arquivo `data/trilhas_dio.json` que está na raiz deste projeto (pasta `dio_explorer`).

Com base no conteúdo desse arquivo, encontre todas as trilhas cujo campo `tecnologia` contenha **$1** (busca case-insensitive, sem diferenciar acentos).

**Se nenhuma trilha for encontrada**, informe ao usuário e liste todas as tecnologias disponíveis no arquivo a partir dos valores únicos do campo `tecnologia`.

**Se uma ou mais trilhas forem encontradas**, exiba cada uma no formato abaixo:

---

# 🎯 Trilha: {nome}

| Campo | Detalhe |
|---|---|
| 🖥️ Tecnologia | {tecnologia} |
| 📊 Nível | {nivel} |
| 📦 Nº de Módulos | {numero_de_modulos} |
| ⭐ XP Total | {xp_total} XP |
| ♾️ Acesso Vitalício | Sim / Não |

## 🏅 Badges Disponíveis
Liste cada badge como item de lista com 🏆 na frente.

## 🗂️ Plano de Estudos

Gere um plano de estudos coerente e realista para a tecnologia e nível encontrados, com exatamente **{numero_de_modulos} módulos** numerados. Para cada módulo inclua:
- **Título** no formato `Módulo N – Nome do Módulo`
- Lista com 3 a 5 tópicos práticos e relevantes para aquele módulo

## 🎁 Promoção Ativa
Se `desconto_percentual > 0`, exiba:
> 🔖 **{desconto_percentual}% de desconto** com o cupom `{cupom}` · Válido até {validade}

Caso contrário: _Nenhuma promoção ativa no momento._

## 📅 Próximas Lives ao Vivo
Liste cada live com título, data e hora formatados em pt-BR. Se a lista estiver vazia, informe que não há lives agendadas.

---

Use tom motivador. Emojis com moderação. Responda sempre em português.
