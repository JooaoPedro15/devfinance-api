import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Summary, Transaction } from "../types";

export type CreateTransactionData = Omit<Transaction, "id" | "createdAt" | "updatedAt">;
export type UpdateTransactionData = Partial<CreateTransactionData>;

// DATA_FILE permite apontar para outro arquivo (ex.: uma demo) sem mexer no código
export const defaultStorageFile = path.resolve(process.env.DATA_FILE ?? path.join("data", "transactions.json"));

export async function load(storageFile = defaultStorageFile): Promise<Transaction[]> {
    try {
        const content = await readFile(storageFile, "utf-8");
        return JSON.parse(content) as Transaction[];
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;

        if (code === "ENOENT") {
            return [];
        }

        throw error;
    }
}

export async function save(transactions: Transaction[], storageFile = defaultStorageFile): Promise<void> {
    await mkdir(path.dirname(storageFile), { recursive: true });
    await writeFile(storageFile, JSON.stringify(transactions, null, 2));
}

export async function create(data: CreateTransactionData, storageFile = defaultStorageFile): Promise<Transaction> {
    const transactions = await load(storageFile);
    const now = new Date().toISOString();
    const transaction: Transaction = {
        id: randomUUID(),
        title: data.title,
        amount: data.amount,
        type: data.type,
        category: data.category,
        createdAt: now,
        updatedAt: now,
    };

    transactions.push(transaction);
    await save(transactions, storageFile);

    return transaction;
}

// month no formato "YYYY-MM". Compara com o início de createdAt (ISO 8601 em UTC).
function inMonth(transaction: Transaction, month?: string): boolean {
    return !month || transaction.createdAt.startsWith(month);
}

export async function list(storageFile = defaultStorageFile, month?: string): Promise<Transaction[]> {
    const transactions = await load(storageFile);
    return transactions.filter((transaction) => inMonth(transaction, month));
}

export async function findById(id: string, storageFile = defaultStorageFile): Promise<Transaction | null> {
    const transactions = await load(storageFile);
    return transactions.find((transaction) => transaction.id === id) ?? null;
}

export async function update(id: string, data: UpdateTransactionData, storageFile = defaultStorageFile): Promise<Transaction | null> {
    const transactions = await load(storageFile);
    const transactionIndex = transactions.findIndex((transaction) => transaction.id === id);

    if (transactionIndex === -1) {
        return null;
    }

    const current = transactions[transactionIndex];
    const updated: Transaction = {
        ...current,
        ...data,
        updatedAt: new Date().toISOString(),
    };

    transactions[transactionIndex] = updated;
    await save(transactions, storageFile);

    return updated;
}

export async function remove(id: string, storageFile = defaultStorageFile): Promise<boolean> {
    const transactions = await load(storageFile);
    const nextTransactions = transactions.filter((transaction) => transaction.id !== id);

    if (nextTransactions.length === transactions.length) {
        return false;
    }

    await save(nextTransactions, storageFile);
    return true;
}

// Somar decimais em ponto flutuante deixa resto (850 + 341.2 + ... = 1656.1000000000001).
// Dinheiro só tem centavos, então arredonda o resultado final para 2 casas.
function toCents(value: number): number {
    return Math.round(value * 100) / 100;
}

export async function summary(storageFile = defaultStorageFile, month?: string): Promise<Summary> {
    const transactions = await list(storageFile, month);

    const income = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const expense = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    return {
        income: toCents(income),
        expense: toCents(expense),
        balance: toCents(income - expense),
    };
}
