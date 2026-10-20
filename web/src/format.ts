const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function formatMoney(value: number): string {
    return currency.format(value);
}

// "16 de out." vira "16 out", mais curto para a coluna de data do extrato
export function formatDay(iso: string): string {
    return day.format(new Date(iso)).replace(" de ", " ").replace(".", "");
}
