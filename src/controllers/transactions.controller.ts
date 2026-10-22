import type { Request, Response } from "express";
import { z } from "zod";

import * as transactionsService from "../services/transactions.service";

const createTransactionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    amount: z.number().positive("Amount must be greater than zero"),
    type: z.enum(["income", "expense"]),
    category: z.string().min(1, "Category is required"),
});

const updateTransactionSchema = createTransactionSchema.partial();

const monthQuerySchema = z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format").optional(),
});

export async function createTransaction(req: Request, res: Response): Promise<Response> {
    const result = createTransactionSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.flatten().fieldErrors,
        });
    }

    const transaction = await transactionsService.create(result.data);

    return res.status(201).json(transaction);
}

export async function listTransactions(req: Request, res: Response): Promise<Response> {
    const query = monthQuerySchema.safeParse(req.query);

    if (!query.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: query.error.flatten().fieldErrors,
        });
    }

    const transactions = await transactionsService.list(undefined, query.data.month);

    return res.status(200).json(transactions);
}

export async function findTransaction(req: Request, res: Response): Promise<Response> {
    const id = String(req.params.id);
    const transaction = await transactionsService.findById(id);

    if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(200).json(transaction);
}

export async function updateTransaction(req: Request, res: Response): Promise<Response> {
    const result = updateTransactionSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.flatten().fieldErrors,
        });
    }

    const id = String(req.params.id);
    const transaction = await transactionsService.update(id, result.data);

    if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(200).json(transaction);
}

export async function deleteTransaction(req: Request, res: Response): Promise<Response> {
    const id = String(req.params.id);
    const removed = await transactionsService.remove(id);

    if (!removed) {
        return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(204).send();
}

export async function getSummary(req: Request, res: Response): Promise<Response> {
    const query = monthQuerySchema.safeParse(req.query);

    if (!query.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: query.error.flatten().fieldErrors,
        });
    }

    const summary = await transactionsService.summary(undefined, query.data.month);

    return res.status(200).json(summary);
}
