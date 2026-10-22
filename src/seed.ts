import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { defaultStorageFile, save } from "./services/transactions.service";
import type { Transaction } from "./types";

const seedFile = path.resolve(process.cwd(), "seed", "transactions.json");

function monthIndex(date: Date): number {
    return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

// Move as datas do seed para que o mês mais recente vire o mês atual.
// Sem isso a demo envelhece: daqui a um ano o visitante abriria num mês vazio.
// Os dias do seed vão até 28, então somar meses nunca estoura o fim do mês.
export function shiftToCurrentMonth(transactions: Transaction[], now = new Date()): Transaction[] {
    const newest = Math.max(...transactions.map((t) => monthIndex(new Date(t.createdAt))));
    const offset = monthIndex(now) - newest;

    return transactions.map((transaction, index) => {
        const date = new Date(transaction.createdAt);
        date.setUTCMonth(date.getUTCMonth() + offset);

        // Lançamento que cairia no futuro (dia 16 quando hoje é dia 5) é puxado para hoje,
        // com alguns minutos de diferença entre eles para manter a ordem do extrato
        if (date > now) {
            date.setTime(now.getTime() - (transactions.length - index) * 60_000);
        }

        const iso = date.toISOString();
        return { ...transaction, createdAt: iso, updatedAt: iso };
    });
}

// Cria o arquivo de dados a partir do seed quando ele ainda não existe.
// Em hospedagem gratuita o disco é apagado a cada reinício, então a demo sempre volta a este estado.
export async function ensureSeedData(): Promise<void> {
    try {
        await access(defaultStorageFile);
    } catch {
        const seed = JSON.parse(await readFile(seedFile, "utf-8")) as Transaction[];
        await save(shiftToCurrentMonth(seed), defaultStorageFile);
        console.log(`Dados de exemplo criados em ${path.relative(process.cwd(), defaultStorageFile)}`);
    }
}
