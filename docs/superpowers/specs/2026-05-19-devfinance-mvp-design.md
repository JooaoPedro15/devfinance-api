# DevFinance API MVP Design

## Goal

Finish DevFinance API as a small portfolio-ready REST API for personal finance transactions.

## Scope

The MVP will expose CRUD endpoints for transactions, persist data in a local JSON file, validate input with Zod, provide a financial summary endpoint, and include scripts, tests, and README examples.

## Data Model

Each transaction has:

- `id`: generated UUID
- `title`: non-empty string
- `amount`: positive number
- `type`: `income` or `expense`
- `category`: non-empty string
- `createdAt`: ISO date string
- `updatedAt`: ISO date string

## Architecture

The project keeps the current simple Express structure:

- `src/index.ts` creates the app, registers routes, and starts the server.
- `src/controllers/transactions.controller.ts` validates HTTP input and maps service results to responses.
- `src/services/transactions.service.ts` owns transaction behavior and JSON persistence.
- `src/types.ts` defines shared types.

The service remains intentionally direct: no database ORM, no dependency-heavy architecture, and no abstractions that do not pay rent in this small project.

## API

- `GET /` returns health/status information.
- `GET /transactions` lists all transactions.
- `GET /transactions/:id` returns one transaction or 404.
- `POST /transactions` creates a transaction.
- `PUT /transactions/:id` updates a transaction.
- `DELETE /transactions/:id` deletes a transaction.
- `GET /summary` returns total income, total expense, and balance.

## Error Handling

Validation errors return `400`. Missing transactions return `404`. Unexpected failures return `500` through a small error handler.

## Testing

Tests focus on service behavior: create, list, find, update, delete, summary, and JSON persistence. They use Node's built-in test runner plus `ts-node`, avoiding extra dependencies.
