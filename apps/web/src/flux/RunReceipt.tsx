/*
Flux (Sydney Tools) — the run receipt under an agent's reply: which model
answered, how many tokens it took and how long. Read from the
`au.syd.tools.run` content the appservice attaches (design 002 budgets,
first form). Quiet by design: one small line, no colour.
*/

import React, { type JSX, useContext, useState } from "react";
import { type IContent, type MatrixEvent } from "matrix-js-sdk/src/matrix";

import MatrixClientContext from "../contexts/MatrixClientContext";

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

/*
Feedback (design 023): 👍 / 👎 send a reaction on the reply (the appservice records it as a
feedback event tied to the run); "Report…" posts `!report <text>` as a reply in the thread,
which also reaches the IT room. One click, nothing else in the thread.
*/
function Feedback({ mxEvent }: { mxEvent: MatrixEvent }): JSX.Element | null {
    const client = useContext(MatrixClientContext);
    const [sent, setSent] = useState<"up" | "down" | "report" | null>(null);
    const [reporting, setReporting] = useState(false);
    const [text, setText] = useState("");
    const roomId = mxEvent.getRoomId();
    const eventId = mxEvent.getId();
    if (!roomId || !eventId) return null;

    const thumb = async (up: boolean): Promise<void> => {
        await client.sendEvent(roomId, "m.reaction" as any, {
            "m.relates_to": { rel_type: "m.annotation", event_id: eventId, key: up ? "👍" : "👎" },
        });
        setSent(up ? "up" : "down");
    };
    const report = async (): Promise<void> => {
        const body = text.trim();
        if (!body) return;
        const threadRoot = mxEvent.threadRootId ?? eventId;
        await client.sendEvent(roomId, "m.room.message" as any, {
            msgtype: "m.text",
            body: `!report ${body}`,
            "m.relates_to": {
                rel_type: "m.thread",
                event_id: threadRoot,
                is_falling_back: false,
                "m.in_reply_to": { event_id: eventId },
            },
        });
        setReporting(false);
        setText("");
        setSent("report");
    };

    if (sent === "report") return <span className="fx_RunReceipt_fb">reported, thanks</span>;
    return (
        <span className="fx_RunReceipt_fb">
            <button type="button" className={sent === "up" ? "fx_on" : ""} title="Good answer" onClick={() => thumb(true)}>
                👍
            </button>
            <button type="button" className={sent === "down" ? "fx_on" : ""} title="Poor answer" onClick={() => thumb(false)}>
                👎
            </button>
            {reporting ? (
                <span className="fx_RunReceipt_report">
                    <input
                        type="text"
                        value={text}
                        placeholder="What was wrong?"
                        autoFocus
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") void report();
                            if (e.key === "Escape") setReporting(false);
                        }}
                    />
                    <button type="button" onClick={() => void report()}>
                        Send
                    </button>
                </span>
            ) : (
                <button type="button" title="Report a problem with this answer" onClick={() => setReporting(true)}>
                    Report…
                </button>
            )}
        </span>
    );
}

export function RunReceipt({ content, mxEvent }: { content: IContent; mxEvent?: MatrixEvent }): JSX.Element | null {
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
            <span>{parts.join(" · ")}</span>
            {mxEvent ? <Feedback mxEvent={mxEvent} /> : null}
        </div>
    );
}
