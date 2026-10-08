/*
Flux (Sydney Tools) — the run receipt under an agent's reply: which model
answered, how many tokens it took and how long. Read from the
`au.syd.tools.run` content the appservice attaches (design 002 budgets,
first form). Quiet by design: one small line, no colour.
*/

import React, { type JSX } from "react";
import { type IContent } from "matrix-js-sdk/src/matrix";

export interface RunInfo {
    agent?: string;
    model?: string;
    input_tokens?: number | string | null;
    output_tokens?: number | string | null;
    duration_ms?: number | string;
    route?: { tier?: string; reason?: string; p?: number | string; confidence?: number | string };
    // a team run (design 016): who was asked and what each cost
    members?: { agent?: string; model?: string; input_tokens?: number | string; output_tokens?: number | string; denied?: boolean }[];
}

export function runInfoOf(content: IContent): RunInfo | undefined {
    const run = content["au.syd.tools.run"];
    return run && typeof run === "object" ? (run as RunInfo) : undefined;
}

function formatTokens(raw: number | string | null | undefined): string | null {
    if (raw === null || raw === undefined) return null;
    const n = Number(raw);
    if (Number.isNaN(n)) return null;
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function RunReceipt({ content }: { content: IContent }): JSX.Element | null {
    const run = runInfoOf(content);
    if (!run) return null;
    const parts: string[] = [];
    if (run.route?.tier) {
        const why =
            run.route.reason === "override"
                ? "you chose"
                : run.route.reason === "sticky"
                  ? "kept for this thread"
                  : run.route.reason === "stakes"
                    ? "raised: high stakes"
                    : run.route.reason === "preference"
                      ? "your preference"
                      : run.route.reason === "capped"
                        ? "capped by policy"
                        : run.route.reason === "judge" && run.route.p !== undefined
                          ? `auto ${Math.round(Number(run.route.p) * 100)}%`
                          : "default";
        parts.push(`${run.route.tier} (${why})`);
    }
    if (run.members && run.members.length > 0) {
        const asked = run.members.filter((m) => !m.denied).map((m) => m.agent ?? "?");
        parts.push(`asked ${asked.join(", ")}`);
    }
    if (run.model) parts.push(run.model);
    const tin = formatTokens(run.input_tokens);
    const tout = formatTokens(run.output_tokens);
    if (tin || tout) parts.push(`${tin ?? "?"} in · ${tout ?? "?"} out`);
    if (run.duration_ms) parts.push(`${(Number(run.duration_ms) / 1000).toFixed(1)} s`);
    const runId = content["au.syd.tools.run_id"];
    return (
        <div className="fx_RunReceipt" title={typeof runId === "string" ? runId : undefined}>
            {parts.join(" · ")}
        </div>
    );
}
