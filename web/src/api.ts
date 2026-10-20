import type { FieldErrors, Summary, Transaction, TransactionInput } from "./types.js";

// Erro com os detalhes que a API devolve no 400 do Zod (um array de mensagens por campo).
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly fieldErrors: FieldErrors = {},
    ) {
        super(message);
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
    });

    // 204 No Content não tem corpo para ler
    if (response.status === 204) {
        return undefined as T;
    }

    const body = await response.json();

    if (!response.ok) {
        throw new ApiError(body.message ?? "Erro inesperado", response.status, body.errors);
    }

    return body as T;
}

export const api = {
    list: () => request<Transaction[]>("/transactions"),
    summary: () => request<Summary>("/summary"),
    create: (data: TransactionInput) =>
        request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: TransactionInput) =>
        request<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/transactions/${id}`, { method: "DELETE" }),
};
