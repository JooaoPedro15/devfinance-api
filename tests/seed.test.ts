import assert from "node:assert/strict";
import { test } from "node:test";

import { shiftToCurrentMonth } from "../src/seed";
import type { Transaction } from "../src/types";

function make(id: string, createdAt: string): Transaction {
    return { id, title: id, amount: 10, type: "expense", category: "Teste", createdAt, updatedAt: createdAt };
}

test("shifts seed dates so the newest month becomes the current month", () => {
    const seed = [
        make("a", "2026-08-03T12:00:00.000Z"),
        make("b", "2026-10-02T12:00:00.000Z"),
    ];

    const shifted = shiftToCurrentMonth(seed, new Date("2027-01-20T15:00:00.000Z"));

    assert.equal(shifted[0].createdAt, "2026-11-03T12:00:00.000Z");
    assert.equal(shifted[1].createdAt, "2027-01-02T12:00:00.000Z");
    assert.equal(shifted[1].updatedAt, shifted[1].createdAt);
});

test("pulls dates that would land in the future back to now", () => {
    const seed = [make("a", "2026-10-16T22:00:00.000Z")];
    const now = new Date("2026-11-05T10:00:00.000Z");

    const shifted = shiftToCurrentMonth(seed, now);

    assert.ok(new Date(shifted[0].createdAt) <= now);
    assert.equal(shifted[0].createdAt.slice(0, 7), "2026-11");
});
