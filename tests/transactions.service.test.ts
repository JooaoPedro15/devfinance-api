import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import * as transactionsService from "../src/services/transactions.service";

async function withStore(run: (filePath: string) => Promise<void>): Promise<void> {
    const dir = await mkdtemp(path.join(tmpdir(), "devfinance-"));
    const filePath = path.join(dir, "transactions.json");

    try {
        await run(filePath);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
}

test("creates a transaction and persists it as JSON", async () => {
    await withStore(async (filePath) => {
        const transaction = await transactionsService.create({
            title: "Salario",
            amount: 5000,
            type: "income",
            category: "Trabalho",
        }, filePath);

        assert.equal(transaction.title, "Salario");
        assert.equal(transaction.amount, 5000);
        assert.equal(transaction.type, "income");
        assert.equal(transaction.category, "Trabalho");
        assert.ok(transaction.id);
        assert.ok(transaction.createdAt);
        assert.ok(transaction.updatedAt);

        const saved = JSON.parse(await readFile(filePath, "utf-8"));
        assert.equal(saved.length, 1);
        assert.equal(saved[0].id, transaction.id);
    });
});

test("lists and finds transactions from the JSON store", async () => {
    await withStore(async (filePath) => {
        const first = await transactionsService.create({
            title: "Freela",
            amount: 800,
            type: "income",
            category: "Extra",
        }, filePath);

        await transactionsService.create({
            title: "Mercado",
            amount: 250,
            type: "expense",
            category: "Casa",
        }, filePath);

        const transactions = await transactionsService.list(filePath);
        const found = await transactionsService.findById(first.id, filePath);

        assert.equal(transactions.length, 2);
        assert.equal(found?.id, first.id);
    });
});

test("updates an existing transaction", async () => {
    await withStore(async (filePath) => {
        const transaction = await transactionsService.create({
            title: "Conta",
            amount: 100,
            type: "expense",
            category: "Casa",
        }, filePath);

        const updated = await transactionsService.update(transaction.id, {
            title: "Conta de luz",
            amount: 120,
        }, filePath);

        assert.equal(updated?.id, transaction.id);
        assert.equal(updated?.title, "Conta de luz");
        assert.equal(updated?.amount, 120);
        assert.equal(updated?.type, "expense");
        assert.notEqual(updated?.updatedAt, transaction.updatedAt);
    });
});

test("removes a transaction", async () => {
    await withStore(async (filePath) => {
        const transaction = await transactionsService.create({
            title: "Cafe",
            amount: 15,
            type: "expense",
            category: "Alimentacao",
        }, filePath);

        const removed = await transactionsService.remove(transaction.id, filePath);
        const transactions = await transactionsService.list(filePath);

        assert.equal(removed, true);
        assert.equal(transactions.length, 0);
    });
});

test("calculates income, expense, and balance summary", async () => {
    await withStore(async (filePath) => {
        await transactionsService.create({
            title: "Salario",
            amount: 5000,
            type: "income",
            category: "Trabalho",
        }, filePath);

        await transactionsService.create({
            title: "Aluguel",
            amount: 1400,
            type: "expense",
            category: "Casa",
        }, filePath);

        await transactionsService.create({
            title: "Internet",
            amount: 120,
            type: "expense",
            category: "Casa",
        }, filePath);

        const summary = await transactionsService.summary(filePath);

        assert.deepEqual(summary, {
            income: 5000,
            expense: 1520,
            balance: 3480,
        });
    });
});

test("filters list and summary by month (YYYY-MM)", async () => {
    await withStore(async (filePath) => {
        const base = { updatedAt: "2026-10-01T00:00:00.000Z" };
        await writeFile(filePath, JSON.stringify([
            { ...base, id: "a", title: "Bolsa", amount: 2000, type: "income", category: "Trabalho", createdAt: "2026-09-05T12:00:00.000Z" },
            { ...base, id: "b", title: "Aluguel", amount: 800, type: "expense", category: "Moradia", createdAt: "2026-09-10T12:00:00.000Z" },
            { ...base, id: "c", title: "Mercado", amount: 300, type: "expense", category: "Alimentação", createdAt: "2026-10-02T12:00:00.000Z" },
        ]));

        const september = await transactionsService.list(filePath, "2026-09");
        const octoberSummary = await transactionsService.summary(filePath, "2026-10");
        const allTime = await transactionsService.summary(filePath);

        assert.deepEqual(september.map((transaction) => transaction.id), ["a", "b"]);
        assert.deepEqual(octoberSummary, { income: 0, expense: 300, balance: -300 });
        assert.deepEqual(allTime, { income: 2000, expense: 1100, balance: 900 });
    });
});

test("rounds summary totals to cents", async () => {
    await withStore(async (filePath) => {
        for (const amount of [850, 341.2, 99.9, 120, 150, 95]) {
            await transactionsService.create({ title: "Gasto", amount, type: "expense", category: "Teste" }, filePath);
        }

        const summary = await transactionsService.summary(filePath);

        assert.equal(summary.expense, 1656.1);
        assert.equal(summary.balance, -1656.1);
    });
});
