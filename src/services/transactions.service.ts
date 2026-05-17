import { randomUUID} from "node:crypto";
import { Transaction } from "../types";
import { date } from "zod";

type CreateTransactionData = Omit<Transaction, "id" | "createdAt">;

const transactions: Transaction[] = [];

export function create(data: CreateTransactionData): Transaction
{
    const transaction: Transaction = {
        id: randomUUID(),
        title: data.title, 
        amount: data.amount,
        type: data.type,
        createdAt : new Date(), 
    };

    transactions.push(transaction);

    return transaction;
}

export function list(): Transaction[]
{
    return transactions;
}