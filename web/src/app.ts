import { api, ApiError } from "./api.js";
import { formatDay, formatMoney } from "./format.js";
import { drawGuilloche } from "./guilloche.js";
import type { Transaction, TransactionInput, TransactionType } from "./types.js";

type Filter = "all" | TransactionType;

// Estado da tela: tudo que muda fica aqui, e render() redesenha a partir dele
const state = {
    transactions: [] as Transaction[],
    filter: "all" as Filter,
    editingId: null as string | null,
    confirmingDeleteId: null as string | null,
};

function $<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Elemento não encontrado: ${selector}`);
    return element;
}

const els = {
    balance: $<HTMLElement>("#balance"),
    income: $<HTMLElement>("#income"),
    expense: $<HTMLElement>("#expense"),
    rows: $<HTMLOListElement>("#rows"),
    empty: $<HTMLElement>("#empty"),
    loadError: $<HTMLElement>("#load-error"),
    form: $<HTMLFormElement>("#entry-form"),
    formTitle: $<HTMLElement>("#entry-title"),
    submit: $<HTMLButtonElement>("#submit"),
    cancel: $<HTMLButtonElement>("#cancel-edit"),
    status: $<HTMLElement>("#status"),
    categories: $<HTMLDataListElement>("#categories"),
};

// Saldo depois de cada lançamento, em ordem cronológica, como numa linha de extrato
function withRunningBalance(transactions: Transaction[]) {
    const chronological = [...transactions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    let running = 0;

    return chronological.map((transaction) => {
        running += transaction.type === "income" ? transaction.amount : -transaction.amount;
        return { transaction, balanceAfter: running };
    });
}

function render(): void {
    const rows = withRunningBalance(state.transactions)
        .filter(({ transaction }) => state.filter === "all" || transaction.type === state.filter)
        .reverse();

    els.rows.replaceChildren(...rows.map(({ transaction, balanceAfter }) => renderRow(transaction, balanceAfter)));
    els.empty.hidden = rows.length > 0;

    const categories = new Set(state.transactions.map((transaction) => transaction.category));
    els.categories.replaceChildren(
        ...[...categories].sort().map((category) => Object.assign(document.createElement("option"), { value: category })),
    );
}

function renderRow(transaction: Transaction, balanceAfter: number): HTMLLIElement {
    const row = document.createElement("li");
    row.className = `row row--${transaction.type}`;
    if (transaction.id === state.editingId) row.classList.add("row--editing");

    const sign = transaction.type === "income" ? "+" : "−";
    const confirming = state.confirmingDeleteId === transaction.id;

    row.innerHTML = `
        <time class="row-date" datetime="${transaction.createdAt}">${formatDay(transaction.createdAt)}</time>
        <div class="row-desc">
            <span class="row-title"></span>
            <span class="row-category"></span>
        </div>
        <span class="row-amount">${sign} ${formatMoney(transaction.amount)}</span>
        <span class="row-balance" title="Saldo depois deste lançamento">${formatMoney(balanceAfter)}</span>
        <div class="row-actions">
            <button type="button" class="link" data-action="edit">Editar</button>
            <button type="button" class="link link--danger" data-action="delete">${confirming ? "Confirmar exclusão" : "Excluir"}</button>
        </div>`;

    // textContent em vez de innerHTML: o título vem do usuário e não pode virar HTML (evita XSS)
    row.querySelector(".row-title")!.textContent = transaction.title;
    row.querySelector(".row-category")!.textContent = transaction.category;
    row.dataset.id = transaction.id;

    return row;
}

async function refresh(): Promise<void> {
    const [transactions, summary] = await Promise.all([api.list(), api.summary()]);
    state.transactions = transactions;

    els.balance.textContent = formatMoney(summary.balance);
    els.balance.classList.toggle("negative", summary.balance < 0);
    els.income.textContent = formatMoney(summary.income);
    els.expense.textContent = formatMoney(summary.expense);

    render();
}

function announce(message: string): void {
    els.status.textContent = message;
}

// ---------- Formulário ----------

function readForm(): TransactionInput {
    const data = new FormData(els.form);
    return {
        title: String(data.get("title") ?? "").trim(),
        amount: Number(data.get("amount")),
        type: data.get("type") as TransactionType,
        category: String(data.get("category") ?? "").trim(),
    };
}

function showFieldErrors(errors: Partial<Record<string, string[]>>): void {
    for (const output of els.form.querySelectorAll<HTMLElement>("[data-error-for]")) {
        const field = output.dataset.errorFor!;
        const message = errors[field]?.[0] ?? "";
        output.textContent = translateError(message);
        els.form.querySelector(`[name="${field}"]`)?.setAttribute("aria-invalid", String(Boolean(message)));
    }
}

// A API responde em inglês; o visitante lê em português
function translateError(message: string): string {
    const known: Record<string, string> = {
        "Title is required": "Escreva uma descrição.",
        "Amount must be greater than zero": "Informe um valor maior que zero.",
        "Category is required": "Escolha ou escreva uma categoria.",
    };
    if (!message) return "";
    return known[message] ?? "Valor inválido.";
}

function startEditing(transaction: Transaction): void {
    state.editingId = transaction.id;
    // form.title seria o atributo title do <form>, não o input; por isso namedItem
    field("title").value = transaction.title;
    field("amount").value = String(transaction.amount);
    field("category").value = transaction.category;
    (els.form.querySelector(`[name="type"][value="${transaction.type}"]`) as HTMLInputElement).checked = true;

    els.formTitle.textContent = "Editar lançamento";
    els.submit.textContent = "Salvar alterações";
    els.cancel.hidden = false;
    showFieldErrors({});
    render();
    field("title").focus();
}

function field(name: string): HTMLInputElement {
    return els.form.elements.namedItem(name) as HTMLInputElement;
}

function stopEditing(): void {
    state.editingId = null;
    els.form.reset();
    els.formTitle.textContent = "Novo lançamento";
    els.submit.textContent = "Adicionar lançamento";
    els.cancel.hidden = true;
    showFieldErrors({});
    render();
}

els.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = readForm();
    els.submit.disabled = true;

    try {
        if (state.editingId) {
            await api.update(state.editingId, input);
            announce("Lançamento atualizado.");
        } else {
            await api.create(input);
            announce("Lançamento adicionado.");
        }
        stopEditing();
        await refresh();
    } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
            // Validação do Zod no backend: mostra a mensagem embaixo de cada campo
            showFieldErrors(error.fieldErrors);
        } else {
            announce("Não foi possível salvar. Verifique a conexão e tente de novo.");
        }
    } finally {
        els.submit.disabled = false;
    }
});

els.cancel.addEventListener("click", stopEditing);

// ---------- Extrato ----------

// Um único listener na lista inteira (delegação de eventos) em vez de um por botão
els.rows.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
    const id = button?.closest<HTMLLIElement>("li")?.dataset.id;
    const transaction = state.transactions.find((item) => item.id === id);
    if (!button || !transaction) return;

    if (button.dataset.action === "edit") {
        startEditing(transaction);
        return;
    }

    // Exclusão em dois cliques: o primeiro pede confirmação, o segundo apaga
    if (state.confirmingDeleteId !== transaction.id) {
        state.confirmingDeleteId = transaction.id;
        render();
        els.rows.querySelector<HTMLButtonElement>(`li[data-id="${id}"] [data-action="delete"]`)?.focus();
        return;
    }

    state.confirmingDeleteId = null;
    if (state.editingId === transaction.id) stopEditing();
    await api.remove(transaction.id);
    announce(`“${transaction.title}” excluído.`);
    await refresh();
});

for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="filter"]')) {
    radio.addEventListener("change", () => {
        state.filter = radio.value as Filter;
        render();
    });
}

// ---------- Início ----------

drawGuilloche($<SVGSVGElement>("#guilloche"));

refresh().catch(() => {
    els.loadError.hidden = false;
});
