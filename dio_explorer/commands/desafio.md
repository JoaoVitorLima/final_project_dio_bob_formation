---
description: Gera um desafio de código aleatório baseado em nível e tecnologia
argument-hint: <tecnologia> <nivel>
---

Gere um **desafio de código aleatório** para a tecnologia **$1** no nível **$2**.

O nível pode ser: `iniciante`, `intermediário` ou `avançado` (aceite variações de maiúsculas/minúsculas e com/sem acento).

Se o nível informado não for reconhecido, peça ao usuário para escolher entre: `iniciante`, `intermediário` ou `avançado`.

---

Siga rigorosamente o template abaixo para apresentar o desafio:

---

# 💻 Desafio de Código — {tecnologia} · {Nível}

## 📋 Descrição
Escreva 2 a 4 frases descrevendo o problema de forma clara e objetiva.

## 🎯 Objetivo
Liste em bullet points o que o código deve fazer/retornar.

## 📥 Entrada
Descreva o formato de entrada esperado com um exemplo concreto.

## 📤 Saída Esperada
Descreva o formato de saída e mostre um exemplo concreto correspondente à entrada acima.

## 📌 Restrições
Liste de 2 a 4 restrições relevantes para o desafio (ex: complexidade, bibliotecas proibidas, edge cases).

## 💡 Dica
Ofereça uma dica sutil que ajude sem entregar a solução.

## 🧩 Template de Solução
Forneça um bloco de código na linguagem da tecnologia escolhida com a estrutura inicial (função/método com assinatura, docstring e `pass` ou comentários no corpo) — sem implementar a solução.

---

**Regras para geração do desafio:**
- Para `iniciante`: problemas básicos como manipulação de strings, loops simples, operações com listas/arrays.
- Para `intermediário`: estruturas de dados (pilha, fila, dicionários), algoritmos de ordenação, recursão, consumo de API.
- Para `avançado`: algoritmos de grafos, programação dinâmica, concorrência, design patterns, otimização de performance.
- Varie o desafio gerado — escolha um tema diferente a cada chamada (não repita sempre o mesmo padrão).
- Adapte a linguagem/framework do template de solução à tecnologia informada.
