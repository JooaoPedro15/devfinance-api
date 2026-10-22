import { useEffect, useRef, useState, type FormEvent } from "react";

import { ApiError } from "./api";
import type { FieldErrors, Transaction, TransactionInput, TransactionType } from "./types";

interface Props {
    editing: Transaction | null;
    categories: string[];
    onSubmit: (input: TransactionInput) => Promise<void>;
    onCancelEdit: () => void;
}

const empty = { title: "", amount: "", category: "", type: "expense" as TransactionType };

// A API responde em inglês; o visitante lê em português
const messages: Record<string, string> = {
    "Title is required": "Escreva uma descrição.",
    "Amount must be greater than zero": "Informe um valor maior que zero.",
    "Category is required": "Escolha ou escreva uma categoria.",
};

function translate(message?: string): string {
    if (!message) return "";
    return messages[message] ?? "Valor inválido.";
}

export function EntryForm({ editing, categories, onSubmit, onCancelEdit }: Props) {
    // Formulário controlado: cada campo vive no estado e o input só mostra o valor
    const [values, setValues] = useState(empty);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");
    const titleRef = useRef<HTMLInputElement>(null);

    // Quando muda o lançamento em edição, preenche (ou limpa) o formulário
    useEffect(() => {
        setErrors({});
        if (editing) {
            setValues({
                title: editing.title,
                amount: String(editing.amount),
                category: editing.category,
                type: editing.type,
            });
            titleRef.current?.focus();
        } else {
            setValues(empty);
        }
    }, [editing]);

    // A mensagem de confirmação some sozinha; a função de retorno cancela o timer se ela mudar antes
    useEffect(() => {
        if (!status) return;
        const timer = setTimeout(() => setStatus(""), 4000);
        return () => clearTimeout(timer);
    }, [status]);

    function update(field: keyof typeof empty, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setStatus("");

        try {
            await onSubmit({
                title: values.title.trim(),
                amount: Number(values.amount),
                type: values.type,
                category: values.category.trim(),
            });
            setStatus(editing ? "Lançamento atualizado." : "Lançamento adicionado.");
            setValues(empty);
            setErrors({});
        } catch (error) {
            if (error instanceof ApiError && error.status === 400) {
                // Validação do Zod no backend: mostra a mensagem embaixo de cada campo
                setErrors(error.fieldErrors);
            } else {
                setStatus("Não foi possível salvar. Verifique a conexão e tente de novo.");
            }
        } finally {
            setSaving(false);
        }
    }

    const fieldError = (field: keyof FieldErrors) => translate(errors[field]?.[0]);

    return (
        <aside className="entry" id="entry" aria-labelledby="entry-title">
            <h2 id="entry-title">{editing ? "Editar lançamento" : "Novo lançamento"}</h2>

            <form onSubmit={handleSubmit} noValidate>
                <fieldset className="type-switch">
                    <legend className="visually-hidden">Tipo</legend>
                    <label className="type-option type-option--expense">
                        <input
                            type="radio"
                            name="type"
                            checked={values.type === "expense"}
                            onChange={() => update("type", "expense")}
                        />
                        <span>Saída</span>
                    </label>
                    <label className="type-option type-option--income">
                        <input
                            type="radio"
                            name="type"
                            checked={values.type === "income"}
                            onChange={() => update("type", "income")}
                        />
                        <span>Entrada</span>
                    </label>
                </fieldset>

                <label className="field">
                    <span>Descrição</span>
                    <input
                        ref={titleRef}
                        value={values.title}
                        onChange={(event) => update("title", event.target.value)}
                        autoComplete="off"
                        placeholder="Ex.: Conta de luz"
                        aria-invalid={Boolean(fieldError("title"))}
                    />
                    <small className="field-error">{fieldError("title")}</small>
                </label>

                <label className="field">
                    <span>Valor (R$)</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        value={values.amount}
                        onChange={(event) => update("amount", event.target.value)}
                        placeholder="0,00"
                        aria-invalid={Boolean(fieldError("amount"))}
                    />
                    <small className="field-error">{fieldError("amount")}</small>
                </label>

                <label className="field">
                    <span>Categoria</span>
                    <input
                        list="categories"
                        value={values.category}
                        onChange={(event) => update("category", event.target.value)}
                        autoComplete="off"
                        placeholder="Ex.: Moradia"
                        aria-invalid={Boolean(fieldError("category"))}
                    />
                    <datalist id="categories">
                        {categories.map((category) => (
                            <option key={category} value={category} />
                        ))}
                    </datalist>
                    <small className="field-error">{fieldError("category")}</small>
                </label>

                <div className="form-actions">
                    <button type="submit" className="button" disabled={saving}>
                        {editing ? "Salvar alterações" : "Adicionar lançamento"}
                    </button>
                    {editing && (
                        <button type="button" className="link" onClick={onCancelEdit}>
                            Cancelar edição
                        </button>
                    )}
                </div>
                <p className="status" role="status" aria-live="polite">
                    {status}
                </p>
            </form>
        </aside>
    );
}
