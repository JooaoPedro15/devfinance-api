import { formatMoney, formatMonthTitle } from "./format";
import type { Summary } from "./types";

interface Props {
    month: string;
    months: string[];
    summary: Summary | null;
    onChange: (month: string) => void;
}

export function MonthBar({ month, months, summary, onChange }: Props) {
    // months vem em ordem crescente: o anterior fica à esquerda, o próximo à direita
    const index = months.indexOf(month);
    const previous = months[index - 1];
    const next = months[index + 1];

    return (
        <section className="month" aria-label="Resumo do mês">
            <div className="month-nav">
                <button
                    type="button"
                    className="month-step"
                    onClick={() => previous && onChange(previous)}
                    disabled={!previous}
                    aria-label="Mês anterior"
                >
                    ‹
                </button>
                <h2 className="month-title" aria-live="polite">
                    {formatMonthTitle(month)}
                </h2>
                <button
                    type="button"
                    className="month-step"
                    onClick={() => next && onChange(next)}
                    disabled={!next}
                    aria-label="Próximo mês"
                >
                    ›
                </button>
            </div>

            <dl className="month-totals">
                <div>
                    <dt>Entrou</dt>
                    <dd className="income">{summary ? formatMoney(summary.income) : "—"}</dd>
                </div>
                <div>
                    <dt>Saiu</dt>
                    <dd className="expense">{summary ? formatMoney(summary.expense) : "—"}</dd>
                </div>
                <div>
                    <dt>{summary && summary.balance < 0 ? "Faltou" : "Sobrou"}</dt>
                    <dd>{summary ? formatMoney(Math.abs(summary.balance)) : "—"}</dd>
                </div>
            </dl>
        </section>
    );
}
