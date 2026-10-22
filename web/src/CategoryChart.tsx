import { formatMoney, formatMonthName } from "./format";
import type { Transaction } from "./types";

interface Props {
    transactions: Transaction[];
    month: string;
}

// Soma as saídas do mês por categoria, da maior para a menor
function groupExpenses(transactions: Transaction[]) {
    const totals = new Map<string, number>();

    for (const transaction of transactions) {
        if (transaction.type !== "expense") continue;
        totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
    }

    return [...totals.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}

export function CategoryChart({ transactions, month }: Props) {
    const groups = groupExpenses(transactions);
    const total = groups.reduce((sum, group) => sum + group.amount, 0);
    const largest = groups[0]?.amount ?? 0;
    const name = formatMonthName(month);

    if (groups.length === 0) {
        return (
            <section className="chart" aria-labelledby="chart-title">
                <h2 id="chart-title">Para onde foi o dinheiro</h2>
                <p className="chart-lead">Nenhuma saída registrada em {name}.</p>
            </section>
        );
    }

    const share = (amount: number) => Math.round((amount / total) * 100);

    return (
        <section className="chart" aria-labelledby="chart-title">
            <h2 id="chart-title">Para onde foi o dinheiro</h2>
            <p className="chart-lead">
                {groups[0].category} levou {share(groups[0].amount)}% dos gastos de {name}.
            </p>

            <ul className="chart-bars">
                {groups.map((group) => (
                    <li key={group.category}>
                        <span className="chart-label">{group.category}</span>
                        {/* A barra é proporcional à maior categoria, não ao total: a maior sempre ocupa a largura toda */}
                        <svg className="chart-bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                            <rect width={(group.amount / largest) * 100} height="10" rx="1" />
                        </svg>
                        <span className="chart-value">
                            {formatMoney(group.amount)} <small>{share(group.amount)}%</small>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
