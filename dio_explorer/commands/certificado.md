---
description: Gera um certificado fictício em Markdown com nome do usuário e trilha concluída
argument-hint: <seu-nome> <trilha-concluida>
---

Gere um **certificado fictício de conclusão** em Markdown para o usuário **$1** referente à trilha **$2**.

Leia o arquivo `data/trilhas_dio.json`. Tente encontrar uma trilha cujo campo `nome` ou `tecnologia` seja compatível com **$2** (busca sem diferenciar maiúsculas/minúsculas). Se encontrar, use os dados reais (tecnologia, nível, xp_total, badges_disponiveis) para enriquecer o certificado. Se não encontrar, gere o certificado normalmente com as informações fornecidas.

Calcule uma data de emissão fictícia plausível (use a data de hoje ou próxima a ela).
Gere um código de verificação fictício no formato `DIO-XXXX-XXXX-XXXX` com letras e números aleatórios.

---

Siga exatamente o template abaixo:

---

<div align="center">

# 🏆 CERTIFICADO DE CONCLUSÃO

---

### *A Digital Innovation One certifica que*

# $1

### *concluiu com êxito a trilha*

## 🎓 {nome completo da trilha}

---

| 🖥️ Tecnologia | 📊 Nível | ⭐ XP Conquistado |
|:---:|:---:|:---:|
| {tecnologia} | {nivel} | {xp_total} XP |

---

### 🏅 Badges Conquistadas

{liste cada badge em uma linha, com emoji 🏆}

---

*Este certificado foi emitido em **{data de emissão}** e confirma que o(a) participante*
*demonstrou domínio dos conteúdos, completou todos os módulos e desafios da trilha.*

---

**Código de verificação:** `{DIO-XXXX-XXXX-XXXX}`

---

*"O conhecimento é a única riqueza que ninguém pode te tirar."*

**Digital Innovation One — dio.me**

</div>

---

Após o certificado, adicione uma seção separada:

## 🚀 Próximos Passos

Sugira 3 trilhas ou tecnologias complementares que o usuário pode explorar após concluir esta trilha, com uma frase motivadora para cada uma. Se o JSON contiver trilhas relacionadas, prefira sugeri-las.
