---
description: Gera um desafio de código aleatório por tecnologia e nível
argument-hint: <tecnologia> <nivel>
---

Gere um **desafio de código aleatório** para a tecnologia **$1** no nível **$2**.

Níveis aceitos: `iniciante`, `intermediário` ou `avançado` (aceite variações de maiúsculas, minúsculas e sem acento, ex: `intermediario`, `avancado`).

Se o nível não for reconhecido, pergunte ao usuário qual dos três níveis ele deseja.

---

Apresente o desafio obrigatoriamente no seguinte formato:

---

# 💻 Desafio $1 — Nível {Nível}

## 📋 Descrição
Descreva o problema de forma clara e objetiva em 2 a 4 frases.

## 🎯 Objetivo
Liste em bullets o que a solução deve fazer ou retornar.

## 📥 Entrada
Descreva o formato de entrada com um exemplo concreto.

## 📤 Saída Esperada
Descreva o formato de saída e mostre o resultado esperado para o exemplo acima.

## 📌 Restrições
Liste 2 a 4 restrições (complexidade máxima, bibliotecas proibidas, edge cases obrigatórios, etc.).

## 💡 Dica
Uma dica sutil que orienta sem entregar a solução.

## 🧩 Template Inicial

Forneça um bloco de código na linguagem nativa de **$1** com:
- Assinatura da função/método principal
- Docstring ou comentário descrevendo o comportamento esperado
- Corpo vazio (`pass`, `// TODO`, etc.) — sem implementar a lógica

---

**Critérios de dificuldade:**
- `iniciante` → manipulação de strings, loops, listas/arrays simples, lógica básica
- `intermediário` → estruturas de dados (pilha, fila, hash map), recursão, ordenação, consumo de API
- `avançado` → grafos, programação dinâmica, concorrência/paralelismo, design patterns, otimização

Varie sempre o tema escolhido. Nunca repita o mesmo tipo de problema em chamadas consecutivas.
Adapte o template à linguagem/framework principal de **$1**.
Responda sempre em português.
