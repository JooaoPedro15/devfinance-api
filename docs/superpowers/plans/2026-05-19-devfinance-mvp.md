# DevFinance API MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portfolio-ready DevFinance API MVP with JSON persistence, CRUD routes, validation, tests, scripts, and README examples.

**Architecture:** Keep the current Express + TypeScript controller/service shape. Store transactions in a local JSON file from the service layer and keep controllers focused on HTTP validation/responses.

**Tech Stack:** Node.js, Express 5, TypeScript, Zod, Node test runner, ts-node.

---

### Task 1: Service Behavior Tests

**Files:**
- Create: `tests/transactions.service.test.ts`
- Modify: `package.json`

- [ ] Add a `test` script that runs Node's test runner with `ts-node/register`.
- [ ] Write failing tests for create/list/find/update/delete/summary/persistence.
- [ ] Run `npm test` and verify tests fail because service behavior is missing.

### Task 2: JSON-backed Transaction Service

**Files:**
- Modify: `src/types.ts`
- Modify: `src/services/transactions.service.ts`

- [ ] Implement transaction types with `category`, `createdAt`, and `updatedAt` as strings.
- [ ] Implement JSON file creation, reading, and writing.
- [ ] Implement create, list, findById, update, remove, and summary functions.
- [ ] Run `npm test` and verify service tests pass.

### Task 3: API Routes

**Files:**
- Modify: `src/controllers/transactions.controller.ts`
- Modify: `src/index.ts`

- [ ] Add validation schemas for create and update.
- [ ] Add controller handlers for all CRUD endpoints and summary.
- [ ] Register routes in Express.
- [ ] Add a simple global error handler.

### Task 4: Project Polish

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] Add `build` and `start` scripts.
- [ ] Ignore `dist`, `node_modules`, and local data JSON.
- [ ] Document install, dev, build, test, routes, and example requests.
- [ ] Run `npm test` and `npm run build`.
