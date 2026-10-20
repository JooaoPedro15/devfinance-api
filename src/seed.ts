import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const seedFile = path.resolve(process.cwd(), "seed", "transactions.json");
const dataFile = path.resolve(process.cwd(), "data", "transactions.json");

// Copia os dados de exemplo para data/ quando ainda não existe arquivo de dados.
// Em hospedagem gratuita o disco é apagado a cada reinício, então a demo sempre volta a este estado.
export async function ensureSeedData(): Promise<void> {
    try {
        await access(dataFile);
    } catch {
        await mkdir(path.dirname(dataFile), { recursive: true });
        await copyFile(seedFile, dataFile);
        console.log("Dados de exemplo copiados para data/transactions.json");
    }
}
