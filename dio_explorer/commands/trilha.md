---
description: Exibe o plano de estudos de uma trilha a partir de data/trilhas_dio.json
argument-hint: <tecnologia>
---

Leia o arquivo `data/trilhas_dio.json` que está na raiz do projeto.

Com base no conteúdo desse arquivo, encontre todas as trilhas cujo campo `tecnologia` contenha **$1** (faça a busca sem diferenciar maiúsculas de minúsculas).

Se nenhuma trilha for encontrada, informe ao usuário quais tecnologias estão disponíveis no arquivo listando os valores únicos do campo `tecnologia`.

Se uma ou mais trilhas forem encontradas, exiba cada uma delas no seguinte formato Markdown:

---

# 🎯 Trilha: {nome}

| Campo            | Detalhe                    |
|------------------|----------------------------|
| 🖥️ Tecnologia    | {tecnologia}               |
| 📊 Nível         | {nivel}                    |
| 📦 Módulos       | {numero_de_modulos}        |
| ⭐ XP Total      | {xp_total} XP              |
| ♾️ Acesso Vitalício | Sim / Não               |

## 🏅 Badges Disponíveis
Liste cada badge como item de lista com o emoji 🏆 na frente.

## 🗂️ Plano de Estudos

Como o JSON não possui detalhamento interno de módulos, gere um plano de estudos coerente e realista para a tecnologia e nível indicados, com exatamente {numero_de_modulos} módulos numerados. Cada módulo deve ter:
- **Número e título** (ex: `Módulo 1 – Fundamentos de X`)
- Uma lista com 3 a 5 tópicos relevantes para aquele módulo

## 🎁 Promoção Ativa
Se `desconto_percentual` for maior que 0, mostre:
> 🔖 **{desconto_percentual}% de desconto** com o cupom `{cupom}` · Válido até {validade}

Caso contrário, escreva: _Nenhuma promoção ativa no momento._

## 📅 Próximas Lives ao Vivo
Liste cada live com data e hora formatadas em pt-BR.

---

Mantenha o tom motivador e use emojis com moderação para deixar a resposta visualmente agradável.
