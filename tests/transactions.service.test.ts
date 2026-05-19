import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
