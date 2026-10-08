/*
Flux (Sydney Tools) — the approval card (design 002, approvals first form).
The appservice posts an m.room.message carrying `au.syd.tools.approval` when
a run pauses on a tool that needs confirmation; the card shows what the
agent wants to do, and only the person who asked can approve or deny. The
decision is a 👍 / 👎 reaction on the card, which every Matrix client can
send, so phones work too. The appservice edits the card with the outcome.
*/

import React, { type JSX, useContext, useState } from "react";
import { type MatrixEvent } from "matrix-js-sdk/src/matrix";

import MatrixClientContext from "../contexts/MatrixClientContext";
import AccessibleButton from "../components/views/elements/AccessibleButton";

export const APPROVAL_KEY = "au.syd.tools.approval";

interface ApprovalTool {
    tool_call_id?: string;
    tool_name?: string;
    tool_args?: Record<string, unknown>;
}

export interface ApprovalContent {
    action_id?: string;
    agent?: string;
    requested_by?: string;
    tools?: ApprovalTool[];
    summary?: string;
    status?: "pending" | "approved" | "denied" | "timed out";
    by?: string;
}

export function approvalOf(mxEvent: MatrixEvent): ApprovalContent | undefined {
    const content = mxEvent.getContent();
    const a = content?.[APPROVAL_KEY];
    return a && typeof a === "object" ? (a as ApprovalContent) : undefined;
}

function argsText(args?: Record<string, unknown>): string {
    if (!args) return "";
    return Object.entries(args)
        .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join("\n");
}

export function ApprovalCard({ mxEvent }: { mxEvent: MatrixEvent }): JSX.Element | null {
    const client = useContext(MatrixClientContext);
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState<"approve" | "deny" | null>(null);
    const approval = approvalOf(mxEvent);
    if (!approval) return null;
    const me = client.getSafeUserId();
    const mine = approval.requested_by === me;
    const status = approval.status ?? "pending";
    const pending = status === "pending" && !sent;

    const decide = async (approve: boolean): Promise<void> => {
        setBusy(true);
        try {
            await client.sendEvent(mxEvent.getRoomId()!, "m.reaction" as any, {
                "m.relates_to": { rel_type: "m.annotation", event_id: mxEvent.getId(), key: approve ? "👍" : "👎" },
            });
            setSent(approve ? "approve" : "deny");
        } finally {
            setBusy(false);
        }
    };

    const tools = approval.tools ?? [];
    return (
        <div className={`fx_ApprovalCard fx_ApprovalCard_${status.replace(" ", "-")}`}>
            <div className="fx_ApprovalCard_title">
                {status === "pending" ? "Approval needed" : `Approval ${status}`}
                {approval.by && approval.by !== "timeout" ? ` · ${approval.by}` : ""}
            </div>
            <ul className="fx_ApprovalCard_tools">
                {tools.map((t, i) => (
                    <li key={t.tool_call_id ?? i}>
                        <span className="fx_ApprovalCard_tool">{t.tool_name}</span>
                        {t.tool_args && Object.keys(t.tool_args).length > 0 && (
                            <pre className="fx_ApprovalCard_args">{argsText(t.tool_args)}</pre>
                        )}
                    </li>
                ))}
                {tools.length === 0 && <li>{approval.summary}</li>}
            </ul>
            {pending && mine && (
                <div className="fx_ApprovalCard_actions">
                    <AccessibleButton kind="primary" onClick={() => decide(true)} disabled={busy}>
                        Approve
                    </AccessibleButton>
                    <AccessibleButton kind="danger_outline" onClick={() => decide(false)} disabled={busy}>
                        Deny
                    </AccessibleButton>
                </div>
            )}
            {pending && !mine && (
                <div className="fx_ApprovalCard_note">Waiting for {approval.requested_by} to decide.</div>
            )}
            {sent && status === "pending" && <div className="fx_ApprovalCard_note">Sent: {sent === "approve" ? "approved" : "denied"}.</div>}
        </div>
    );
}
