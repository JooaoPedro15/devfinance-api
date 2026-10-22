import { useState } from "react";

import { formatDay, formatMoney, formatMonthName } from "./format";
import type { Transaction, TransactionType } from "./types";

type Filter = "all" | TransactionType;

export interface StatementRow {
    transaction: Transaction;
    balanceAfter: number;
}

interface Props {
    rows: StatementRow[];
    month: string;
    editingId: string | null;
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => void;
}

const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "Tudo" },
    { value: "income", label: "Entradas" },
    { value: "expense", label: "Saídas" },
];

export function Statement({ rows, month, editingId, onEdit, onDelete }: Props) {
    const [filter, setFilter] = useState<Filter>("all");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const visible = rows
        .filter(({ transaction }) => filter === "all" || transaction.type === filter)
        .reverse();

    // Exclusão em dois cliques: o primeiro pede confirmação, o segundo apaga
    function handleDelete(transaction: Transaction) {
        if (confirmingId === transaction.id) {
            setConfirmingId(null);
            onDelete(transaction);
        } else {
            setConfirmingId(transaction.id);
        }
    }

    return (
        <section className="statement" aria-labelledby="statement-title">
            <div className="statement-head">
                <h2 id="statement-title">Extrato</h2>
                <fieldset className="filter">
                    <legend className="visually-hidden">Mostrar</legend>
                    {filters.map((option) => (
                        <label key={option.value}>
                            <input
                                type="radio"
                                name="filter"
                                value={option.value}
                                checked={filter === option.value}
                                onChange={() => setFilter(option.value)}
                            />
                            {option.label}
                        </label>
                    ))}
                </fieldset>
            </div>

            <div className="columns" aria-hidden="true">
                <span>Data</span>
                <span>Descrição</span>
                <span className="num">Valor</span>
                <span className="num">Saldo</span>
            </div>

            <ol className="rows">
                {visible.map(({ transaction, balanceAfter }) => (
                    <li
                        key={transaction.id}
                        className={`row row--${transaction.type}${transaction.id === editingId ? " row--editing" : ""}`}
                    >
                        <time className="row-date" dateTime={transaction.createdAt}>
                            {formatDay(transaction.createdAt)}
                        </time>
                        {/* O React escapa texto automaticamente: um título com <script> aparece como texto, sem virar HTML */}
                        <div className="row-desc">
                            <span className="row-title">{transaction.title}</span>
                            <span className="row-category">{transaction.category}</span>
                        </div>
                        <span className="row-amount">
                            {transaction.type === "income" ? "+" : "−"} {formatMoney(transaction.amount)}
                        </span>
                        <span className="row-balance" title="Saldo depois deste lançamento">
                            {formatMoney(balanceAfter)}
                        </span>
                        <div className="row-actions">
                            <button type="button" className="link" onClick={() => onEdit(transaction)}>
                                Editar
                            </button>
                            <button
                                type="button"
                                className="link link--danger"
                                onClick={() => handleDelete(transaction)}
                                onBlur={() => setConfirmingId(null)}
                            >
                                {confirmingId === transaction.id ? "Confirmar exclusão" : "Excluir"}
                            </button>
                        </div>
                    </li>
                ))}
            </ol>

            {visible.length === 0 && (
                <p className="empty">
                    Nada por aqui em {formatMonthName(month)}. Use o formulário para registrar um lançamento.
                </p>
            )}
        </section>
    );
}
