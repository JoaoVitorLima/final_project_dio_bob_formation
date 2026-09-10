---
description: Gera um certificado fictício de conclusão em Markdown
argument-hint: <seu-nome> <trilha-concluida>
---

Gere um **certificado fictício de conclusão** em Markdown para **$1** referente à trilha **$2**.

Leia o arquivo `data/trilhas_dio.json`. Procure uma trilha cujo campo `nome` ou `tecnologia` seja compatível com **$2** (case-insensitive). Se encontrar, use os dados reais da trilha (`tecnologia`, `nivel`, `xp_total`, `badges_disponiveis`) para preencher o certificado. Caso não encontre, preencha com as informações fornecidas pelo usuário.

Use a data atual como data de emissão. Gere um código de verificação fictício no formato `DIO-XXXX-XXXX-XXXX` (letras maiúsculas e dígitos aleatórios).

---

Produza o certificado exatamente no template abaixo, substituindo todos os campos entre `{ }`:

---

<div align="center">

# 🏆 CERTIFICADO DE CONCLUSÃO

---

### *A Digital Innovation One certifica que*

## $1

### *concluiu com êxito a trilha*

# 🎓 {nome completo da trilha}

---

| 🖥️ Tecnologia | 📊 Nível | ⭐ XP Conquistado |
|:---:|:---:|:---:|
| {tecnologia} | {nivel} | {xp_total} XP |

---

### 🏅 Badges Conquistadas

{liste cada badge em uma linha com 🏆 na frente}

---

*Emitido em **{data de emissão formatada em pt-BR}***

*Este certificado confirma que o(a) participante demonstrou domínio dos conteúdos,*
*completou todos os módulos e desafios previstos na trilha.*

---

🔐 **Código de verificação:** `{DIO-XXXX-XXXX-XXXX}`

---

*"O conhecimento é a única riqueza que ninguém pode te tirar."*

**Digital Innovation One — [dio.me](https://dio.me)**

</div>

---

## 🚀 Próximos Passos

Com base na trilha concluída e nas trilhas presentes em `data/trilhas_dio.json`, sugira **3 trilhas complementares** que o usuário pode explorar a seguir. Para cada sugestão inclua:
- Nome da trilha ou tecnologia
- Por que ela complementa o que foi aprendido
- Uma frase motivadora curta

Responda sempre em português.
