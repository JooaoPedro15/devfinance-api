import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "./api";
import { CategoryChart } from "./CategoryChart";
import { EntryForm } from "./EntryForm";
import { currentMonth, formatMoney, monthOf } from "./format";
import { Guilloche } from "./Guilloche";
import { MonthBar } from "./MonthBar";
import { Statement, type StatementRow } from "./Statement";
import type { Summary, Transaction, TransactionInput } from "./types";

// Saldo depois de cada lançamento, em ordem cronológica, como numa linha de extrato
function withRunningBalance(transactions: Transaction[]): StatementRow[] {
    const chronological = [...transactions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    let running = 0;

    return chronological.map((transaction) => {
        running += transaction.type === "income" ? transaction.amount : -transaction.amount;
        return { transaction, balanceAfter: running };
    });
}

export function App() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [monthSummary, setMonthSummary] = useState<Summary | null>(null);
    const [month, setMonth] = useState(currentMonth());
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [loadError, setLoadError] = useState(false);

    const refresh = useCallback(async () => {
        const [all, total] = await Promise.all([api.list(), api.summary()]);
        setTransactions(all);
        setSummary(total);
    }, []);

    useEffect(() => {
        refresh().catch(() => setLoadError(true));
    }, [refresh]);

    // O resumo do mês vem da API com ?month=YYYY-MM
    useEffect(() => {
        api.summary(month).then(setMonthSummary).catch(() => setMonthSummary(null));
    }, [month, transactions]);

    // useMemo: só recalcula quando a lista muda, não a cada digitação no formulário
    const rows = useMemo(() => withRunningBalance(transactions), [transactions]);
    const monthRows = rows.filter(({ transaction }) => monthOf(transaction.createdAt) === month);
    const months = useMemo(
        () => [...new Set([...transactions.map((t) => monthOf(t.createdAt)), currentMonth()])].sort(),
        [transactions],
    );
    const categories = useMemo(() => [...new Set(transactions.map((t) => t.category))].sort(), [transactions]);

    async function handleSubmit(input: TransactionInput) {
        if (editing) {
            await api.update(editing.id, input);
            setEditing(null);
        } else {
            const created = await api.create(input);
            setMonth(monthOf(created.createdAt));
        }
        await refresh();
    }

    async function handleDelete(transaction: Transaction) {
        if (editing?.id === transaction.id) setEditing(null);
        await api.remove(transaction.id);
        await refresh();
    }

    return (
        <>
            <header className="top">
                <a className="brand" href="/">DevFinance</a>
                <nav className="top-links" aria-label="Sobre o projeto">
                    <a href="#como-foi-feito">Como foi feito</a>
                </nav>
            </header>

            <section className="balance" aria-labelledby="balance-label">
                <Guilloche />
                <div className="balance-inner">
                    <p id="balance-label" className="balance-label">Saldo em conta</p>
                    <p className={`balance-value${summary && summary.balance < 0 ? " negative" : ""}`}>
                        {summary ? formatMoney(summary.balance) : "—"}
                    </p>
                </div>
            </section>

            <div className="about">
                <p>
                    O DevFinance é um controle de gastos pessoal. Você anota o que entra e o que sai, e ele mostra
                    o saldo, o extrato de cada mês e para onde o dinheiro está indo.
                </p>
                <p className="about-note">
                    Projeto de portfólio de João Pedro Costa e Silva. Pode testar à vontade: os dados de exemplo
                    voltam sozinhos depois de um tempo.
                </p>
            </div>

            {loadError && (
                <p className="empty layout-note">
                    O servidor não respondeu. Se ele estava dormindo, espere alguns segundos e recarregue a página.
                </p>
            )}

            <MonthBar month={month} months={months} summary={monthSummary} onChange={setMonth} />

            <main className="layout">
                <div className="main-column">
                    <CategoryChart transactions={monthRows.map((row) => row.transaction)} month={month} />
                    <Statement
                        rows={monthRows}
                        month={month}
                        editingId={editing?.id ?? null}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                    />
                </div>
                <EntryForm
                    editing={editing}
                    categories={categories}
                    onSubmit={handleSubmit}
                    onCancelEdit={() => setEditing(null)}
                />
            </main>

            <footer className="foot" id="como-foi-feito">
                <h2>Como foi feito</h2>
                <p>
                    Por trás desta tela existe uma API REST que eu escrevi em Node.js e TypeScript, com Express e
                    validação de dados com Zod. A interface, em React, só conversa com essa API: cada lançamento que
                    você cria, edita ou exclui passa por ela.
                </p>
                <p className="foot-links">
                    <a href="/docs/">Documentação interativa da API</a>
                    <a href="https://github.com/JooaoPedro15/devfinance-api">Código no GitHub</a>
                </p>
            </footer>
        </>
    );
}
