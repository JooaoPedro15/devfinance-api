// Mesmo formato de src/types.ts do backend. Fica duplicado de propósito:
// o front compila sozinho para o browser e não depende do código do servidor.
export type TransactionType = "income" | "expense";

export interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    createdAt: string;
    updatedAt: string;
}

export interface Summary {
    income: number;
    expense: number;
    balance: number;
}

export type TransactionInput = Pick<Transaction, "title" | "amount" | "type" | "category">;

export type FieldErrors = Partial<Record<keyof TransactionInput, string[]>>;
