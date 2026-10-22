const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const monthAndYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export function formatMoney(value: number): string {
    return currency.format(value);
}

// "16 de out." vira "16 out", mais curto para a coluna de data do extrato
export function formatDay(iso: string): string {
    return day.format(new Date(iso)).replace(" de ", " ").replace(".", "");
}

// Meses no mesmo formato da API: "2026-10". Tudo em UTC, igual ao createdAt.
export function monthOf(iso: string): string {
    return iso.slice(0, 7);
}

export function currentMonth(): string {
    return monthOf(new Date().toISOString());
}

function monthDate(month: string): Date {
    return new Date(`${month}-01T00:00:00.000Z`);
}

// "2026-10" -> "outubro"
export function formatMonthName(month: string): string {
    return monthName.format(monthDate(month));
}

// "2026-10" -> "Outubro de 2026"
export function formatMonthTitle(month: string): string {
    const text = monthAndYear.format(monthDate(month));
    return text.charAt(0).toUpperCase() + text.slice(1);
}
