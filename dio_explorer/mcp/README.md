# DIO Explorer — MCP Server

Servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io) para o projeto **DIO Explorer**.  
Expõe as três capacidades do explorer como ferramentas MCP, permitindo que agentes de IA (Bob, Claude Desktop, etc.) acessem trilhas, desafios e certificados da DIO de forma estruturada.

---

## Ferramentas disponíveis

| Ferramenta | Descrição |
|---|---|
| `trilha` | Consulta trilhas de aprendizado por tecnologia |
| `desafio` | Gera template de desafio de código por tecnologia e nível |
| `certificado` | Gera certificado fictício de conclusão de trilha |

---

## Modos de transporte

### 1. stdio (padrão — uso local com Bob/Claude Desktop)

```bash
node build/index.js
```

### 2. HTTP (acesso remoto, APIs, SSO)

```bash
TRANSPORT=http PORT=3100 node build/index.js
```

Endpoint MCP: `http://localhost:3100/mcp`  
Health check: `http://localhost:3100/health`

---

## Instalação e build

```bash
cd mcp
npm install
npm run build
```

---

## Configuração no Bob (stdio)

Adicione ao arquivo `.bob/mcp.json` do workspace (ou ao `mcp.json` global):

```json
{
  "mcpServers": {
    "dio-explorer": {
      "command": "node",
      "args": ["caminho/absoluto/para/dio_explorer/mcp/build/index.js"]
    }
  }
}
```

---

## Configuração no Bob (HTTP remoto)

Se o servidor já estiver rodando remotamente:

```json
{
  "mcpServers": {
    "dio-explorer-remote": {
      "type": "http",
      "url": "https://seu-servidor.exemplo.com/mcp",
      "headers": {
        "Authorization": "Bearer SUA_API_KEY"
      }
    }
  }
}
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `TRANSPORT` | `stdio` | Modo de transporte: `stdio` ou `http` |
| `PORT` | `3100` | Porta HTTP (apenas modo `http`) |
| `API_KEY` | _(não definida)_ | Chave de acesso. Quando definida, todas as requisições HTTP devem incluir o header `Authorization: Bearer <key>` ou `x-api-key: <key>` |
| `DATA_PATH` | `../data/trilhas_dio.json` | Caminho alternativo para o arquivo de dados |

---

## Autenticação

### API Key

```bash
API_KEY=minha-chave-secreta TRANSPORT=http node build/index.js
```

Requisição autenticada:

```bash
curl -X POST http://localhost:3100/mcp \
  -H "Authorization: Bearer minha-chave-secreta" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### HTTPS / SSO

Para produção com HTTPS ou SSO, posicione um reverse proxy (nginx, Caddy, AWS ALB, etc.) na frente do servidor HTTP, ativando TLS e delegando a autenticação SSO/OAuth ao proxy. O servidor MCP em si não precisa de alteração.

Exemplo com nginx:

```nginx
server {
    listen 443 ssl;
    server_name dio-mcp.exemplo.com;

    ssl_certificate     /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location /mcp {
        proxy_pass http://127.0.0.1:3100/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Exemplos de uso via Bob

Após registrar o servidor, você pode perguntar ao Bob:

- _"Quais trilhas de Python estão disponíveis?"_
- _"Gere um desafio de JavaScript intermediário."_
- _"Emita um certificado de conclusão da trilha React para João Silva."_

---

## Estrutura do projeto

```
mcp/
├── src/
│   └── index.ts       # Servidor MCP principal
├── build/             # Saída compilada (gerada pelo tsc)
├── package.json
├── tsconfig.json
└── README.md
```
