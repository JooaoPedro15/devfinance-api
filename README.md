# DevFinance API

API REST para controle de finanças pessoais: cadastra receitas e despesas, faz CRUD completo das transações e devolve o saldo consolidado em uma rota de resumo.

**Ver funcionando:** [devfinance-szqo.onrender.com](https://devfinance-szqo.onrender.com) · [documentação interativa (Swagger)](https://devfinance-szqo.onrender.com/docs/)

> Hospedado no plano gratuito do Render: se o site estiver parado, o primeiro acesso pode levar até um minuto.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat&logo=express&logoColor=white)
![Zod](https://img.shields.io/badge/Zod_4-3E67B1?style=flat&logo=zod&logoColor=white)
![Tests](https://img.shields.io/badge/tests-5_passing-brightgreen?style=flat)

## Destaques

- **Validação na entrada** com Zod: corpo inválido volta `400` com o erro de cada campo, antes de chegar na regra de negócio.
- **Status HTTP corretos**: `201` ao criar, `204` ao remover, `404` para id inexistente, `500` padronizado no handler de erro global.
- **Camadas separadas**: o controller cuida de HTTP e validação, o service cuida da regra e da persistência.
- **Testes isolados**: cada teste roda contra um arquivo JSON temporário, criado e apagado no próprio teste, sem tocar nos dados reais.
- **Identificadores e auditoria**: ids gerados com `crypto.randomUUID()` e campos `createdAt` / `updatedAt` em ISO 8601.

## Arquitetura

```
requisição HTTP
      │
      ▼
src/index.ts                         rotas Express + handler de erro global
      │
      ▼
src/controllers/transactions.controller.ts   valida o corpo com Zod, escolhe o status HTTP
      │
      ▼
src/services/transactions.service.ts         regra de negócio, cálculo do resumo
      │
      ▼
data/transactions.json                        persistência local (criado na primeira escrita)
```

O service recebe o caminho do arquivo como parâmetro opcional. É isso que deixa os testes usarem um arquivo temporário no lugar de `data/transactions.json`.

## Rotas

| Método | Rota | O que faz | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `GET` | `/api` | Health check e lista de rotas | `200` | |
| `GET` | `/transactions` | Lista todas as transações | `200` | |
| `GET` | `/transactions/:id` | Busca uma transação | `200` | `404` |
| `POST` | `/transactions` | Cria uma transação | `201` | `400` |
| `PUT` | `/transactions/:id` | Atualiza campos de uma transação | `200` | `400`, `404` |
| `DELETE` | `/transactions/:id` | Remove uma transação | `204` | `404` |
| `GET` | `/summary` | Total de receitas, despesas e saldo | `200` | |

### Modelo de transação

| Campo | Tipo | Regra |
| --- | --- | --- |
| `title` | string | obrigatório, não vazio |
| `amount` | number | obrigatório, maior que zero |
| `type` | `"income"` ou `"expense"` | obrigatório |
| `category` | string | obrigatório, não vazio |
| `id`, `createdAt`, `updatedAt` | string | gerados pela API |

### Exemplos

Criar uma receita:

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"title": "Salario", "amount": 5000, "type": "income", "category": "Trabalho"}'
```

```json
{
  "id": "0b1ea1da-ba35-44f6-b784-dd4cdfa774a7",
  "title": "Salario",
  "amount": 5000,
  "type": "income",
  "category": "Trabalho",
  "createdAt": "2026-05-19T17:08:08.197Z",
  "updatedAt": "2026-05-19T17:08:08.197Z"
}
```

Corpo inválido (`amount` negativo e `type` fora do enum):

```json
{
  "message": "Validation error",
  "errors": {
    "amount": ["Amount must be greater than zero"],
    "type": ["Invalid option: expected one of \"income\"|\"expense\""]
  }
}
```

Resumo depois de um salário de 5000 e despesas de 1400 e 120:

```bash
curl http://localhost:3000/summary
```

```json
{
  "income": 5000,
  "expense": 1520,
  "balance": 3480
}
```

## Como rodar

Requisito: Node.js 20 ou mais recente.

```bash
npm install
npm run dev        # desenvolvimento com reload (nodemon + ts-node)
npm test           # roda os testes com o test runner nativo do Node
npm run build      # compila para dist/
npm start          # roda a versão compilada
```

A API sobe em `http://localhost:3000`. Para trocar a porta, defina a variável `PORT`.

- `http://localhost:3000/`: interface web (TypeScript sem framework, código em `web/src`)
- `http://localhost:3000/docs/`: documentação interativa (Swagger UI lendo `public/openapi.json`)

Na primeira execução, se `data/transactions.json` não existir, a API copia os dados de exemplo de `seed/transactions.json`.

## Testes

```
✔ creates a transaction and persists it as JSON
✔ lists and finds transactions from the JSON store
✔ updates an existing transaction
✔ removes a transaction
✔ calculates income, expense, and balance summary
ℹ tests 5 · pass 5 · fail 0
```

Os testes cobrem a camada de service. Usam só `node:test` e `node:assert`, sem Jest nem outra dependência.

## Limitações conhecidas

Projeto de estudo, com escopo de MVP. O que eu sei que falta:

- **Persistência em arquivo JSON**: cada operação lê e regrava o arquivo inteiro, então não aguenta escrita concorrente nem volume grande.
- **`PUT` aceita atualização parcial**: na prática se comporta como `PATCH`.
- **Sem autenticação**: todas as transações são de um único usuário.
- **Testes só no service**: as rotas HTTP não têm teste de integração.

## Próximos passos

- [ ] Trocar o JSON por PostgreSQL com Prisma
- [ ] Testes de integração das rotas com Supertest
- [ ] Filtros em `GET /transactions` por tipo, categoria e período
- [ ] Autenticação com JWT e transações por usuário

## Autor

João Pedro Costa e Silva, estudante de Ciência da Computação na PUC Minas.

[LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-pedro-costa-e-silva-41768922b) · [GitHub](https://github.com/JooaoPedro15) · joaopedrocostaesilva15@gmail.com
