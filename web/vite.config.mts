import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Em dev o Vite roda na 5173 e repassa as chamadas da API para o Express na 3000.
// No build, gera dist/web, que o próprio Express serve em produção.
const api = "http://localhost:3000";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/transactions": api,
            "/summary": api,
            "/api": api,
        },
    },
    build: {
        outDir: "../dist/web",
        emptyOutDir: true,
    },
});
