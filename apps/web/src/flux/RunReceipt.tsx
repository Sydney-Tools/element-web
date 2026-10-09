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
    // provenance (design 017): what witnessed the run; the signed records live in `au.syd.tools.aps`
    observed_by?: "gateway" | "runtime" | "self" | string;
    // a bring-your-own agent (design 025): what served the reply and under whose account
    via?: Via;
}

export interface Via {
    harness?: string;
    model?: string;
    account_class?: string;
    owner?: string;
    agent?: string;
}

const HARNESS_NAMES: Record<string, string> = {
    "claude-code": "Claude Code",
    codex: "Codex",
    goose: "Goose",
    "gemini-cli": "Gemini CLI",
    pi: "Pi",
    shell: "a local harness",
};

const ACCOUNT_NAMES: Record<string, string> = {
    "org-key": "company key",
    "team-seat": "team seat",
    "personal-subscription": "personal subscription",
};

/*
APS (Agent Passport System, design 017): every reply carries `au.syd.tools.aps` with the delegation the
agent ran under and the three draft receipts: intent (agent), policy decision (appservice), result
(appservice issues, agent co-signs). The client shows a quiet mark and the verdict; `!verify` in the
thread or the browser verifier at agent-passport.org checks the signatures.
*/
export interface ApsPayload {
    action_ref?: string;
    action?: { kind?: string; requester?: string; model?: string };
    delegation?: { delegation_id?: string; subject?: string; issuer?: string };
    intent?: { receipt_id?: string };
    decision?: { receipt_id?: string; result?: { verdict?: string; constraints?: string[] } };
    result?: { receipt_id?: string; signatures?: { signer: string }[]; result?: { status?: string } };
    tools?: unknown[];
}

export function apsOf(content: IContent): ApsPayload | undefined {
    const aps = content["au.syd.tools.aps"];
    return aps && typeof aps === "object" ? (aps as ApsPayload) : undefined;
}

export function viaOf(content: IContent): Via | undefined {
    const via = content["au.syd.tools.via"] ?? runInfoOf(content)?.via;
    return via && typeof via === "object" ? (via as Via) : undefined;
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
                      : run.route.reason === "room"
                        ? "room default"
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
    const via = viaOf(content);
    if (via) {
        // "via Claude Code · team seat": the harness and account class, so people and audits know what served it (025 §6)
        const bits = [`via ${HARNESS_NAMES[via.harness ?? ""] ?? via.harness ?? "a harness"}`];
        if (via.account_class) bits.push(ACCOUNT_NAMES[via.account_class] ?? via.account_class);
        parts.push(bits.join(" · "));
        if (via.model) parts.push(via.model);
    } else if (run.model) parts.push(run.model);
    const tin = formatTokens(run.input_tokens);
    const tout = formatTokens(run.output_tokens);
    if (tin || tout) parts.push(`${tin ?? "?"} in · ${tout ?? "?"} out`);
    if (run.duration_ms) parts.push(`${(Number(run.duration_ms) / 1000).toFixed(1)} s`);
    const runId = content["au.syd.tools.run_id"];
    // provenance (017, APS): a reply with a signed action-result receipt shows a quiet mark; the title says the
    // verdict, who witnessed the run, how many signatures and tool receipts there are
    const aps = apsOf(content);
    const signed = Boolean(aps?.result?.receipt_id);
    const verdict = aps?.decision?.result?.verdict;
    const witness =
        run.observed_by === "gateway"
            ? "witnessed by the AI gateway"
            : run.observed_by === "runtime"
              ? "witnessed by the agent runtime"
              : run.observed_by === "self"
                ? "self-reported by the agent"
                : undefined;
    const sigTitle = signed
        ? [
              `APS receipts: intent, ${verdict ?? "decision"}, result (${aps?.result?.signatures?.length ?? 0} signatures)`,
              witness,
              aps?.tools && aps.tools.length > 0 ? `${aps.tools.length} tool receipt${aps.tools.length === 1 ? "" : "s"}` : undefined,
              aps?.action_ref ? `action ${aps.action_ref.slice(0, 12)}` : undefined,
              "verify with !verify in this thread",
          ]
              .filter(Boolean)
              .join(" · ")
        : aps?.decision?.result?.verdict === "deny"
          ? "APS: denied by policy (intent and decision receipts only)"
          : witness;
    return (
        <div className="fx_RunReceipt" title={typeof runId === "string" ? runId : undefined}>
            <span>{parts.join(" · ")}</span>
            {signed || witness ? (
                <span className={signed ? "fx_RunReceipt_sig fx_signed" : "fx_RunReceipt_sig"} title={sigTitle}>
                    {signed ? "✓ signed" : verdict === "deny" ? "✗ denied" : run.observed_by === "self" ? "unverified" : ""}
                </span>
            ) : null}
            {mxEvent ? <Feedback mxEvent={mxEvent} /> : null}
        </div>
    );
}
