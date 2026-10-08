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
    input_tokens?: number | null;
    output_tokens?: number | null;
    duration_ms?: number;
}

export function runInfoOf(content: IContent): RunInfo | undefined {
    const run = content["au.syd.tools.run"];
    return run && typeof run === "object" ? (run as RunInfo) : undefined;
}

function formatTokens(n: number | null | undefined): string | null {
    if (n === null || n === undefined) return null;
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function RunReceipt({ content }: { content: IContent }): JSX.Element | null {
    const run = runInfoOf(content);
    if (!run) return null;
    const parts: string[] = [];
    if (run.model) parts.push(run.model);
    const tin = formatTokens(run.input_tokens);
    const tout = formatTokens(run.output_tokens);
    if (tin || tout) parts.push(`${tin ?? "?"} in · ${tout ?? "?"} out`);
    if (run.duration_ms) parts.push(`${(run.duration_ms / 1000).toFixed(1)} s`);
    const runId = content["au.syd.tools.run_id"];
    return (
        <div className="fx_RunReceipt" title={typeof runId === "string" ? runId : undefined}>
            {parts.join(" · ")}
        </div>
    );
}
