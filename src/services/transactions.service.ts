import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Summary, Transaction } from "../types";

export type CreateTransactionData = Omit<Transaction, "id" | "createdAt" | "updatedAt">;
export type UpdateTransactionData = Partial<CreateTransactionData>;

const defaultStorageFile = path.resolve(process.cwd(), "data", "transactions.json");

async function load(storageFile = defaultStorageFile): Promise<Transaction[]> {
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

async function save(transactions: Transaction[], storageFile = defaultStorageFile): Promise<void> {
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

export async function list(storageFile = defaultStorageFile): Promise<Transaction[]> {
    return load(storageFile);
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

export async function summary(storageFile = defaultStorageFile): Promise<Summary> {
    const transactions = await load(storageFile);

    const income = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const expense = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    return {
        income,
        expense,
        balance: income - expense,
    };
}
