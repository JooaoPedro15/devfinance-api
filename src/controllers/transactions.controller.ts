import type { Request, Response } from "express";
import { z } from "zod";

import * as transactionsService from "../services/transactions.service";

const createTransactionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    amount: z.number().positive("Amount must be greater than zero"),
    type: z.enum(["income", "expense"]),
});

export function createTransaction(req: Request, res: Response): Response
{
    const result = createTransactionSchema.safeParse(req.body);

    if (!result.success)
    {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.flatten().fieldErrors,
        });
    }

    const transaction = transactionsService.create(result.data);

    return res.status(201).json(transaction);
}

export function listTransactions(req: Request, res: Response): Response
{
    const transactions = transactionsService.list();

    return res.status(200).json(transactions);
}