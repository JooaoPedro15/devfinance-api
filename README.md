# DevFinance API

API REST simples para controle de transacoes financeiras. O projeto usa Express, TypeScript, Zod e persistencia local em JSON.

## Tecnologias

- Node.js
- Express
- TypeScript
- Zod
- JSON local para persistencia
- Node test runner

## Como rodar

Instale as dependencias:

```bash
npm install
```

Rode em desenvolvimento:

```bash
npm run dev
```

Rode os testes:

```bash
npm test
```

Gere o build:

```bash
npm run build
```

Rode o build:

```bash
npm start
```

Por padrao a API sobe em `http://localhost:3000`. Para trocar a porta, use a variavel `PORT`.

## Rotas

### Health

```http
GET /
```

### Criar transacao

```http
POST /transactions
Content-Type: application/json
```

```json
{
  "title": "Salario",
  "amount": 5000,
  "type": "income",
  "category": "Trabalho"
}
```

### Listar transacoes

```http
GET /transactions
```

### Buscar transacao

```http
GET /transactions/:id
```

### Atualizar transacao

```http
PUT /transactions/:id
Content-Type: application/json
```

```json
{
  "title": "Mercado",
  "amount": 280,
  "type": "expense",
  "category": "Casa"
}
```

### Remover transacao

```http
DELETE /transactions/:id
```

### Resumo financeiro

```http
GET /summary
```

Resposta:

```json
{
  "income": 5000,
  "expense": 1520,
  "balance": 3480
}
```

## Persistencia

As transacoes ficam em `data/transactions.json`. O arquivo e criado automaticamente na primeira escrita.
