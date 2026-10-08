/*
Flux (Sydney Tools) — "Add an agent" from the room info panel (design 007):
the company's agents from the directory, one click to invite. Agents already
in the room are shown as present.
*/

import React, { type JSX, useContext, useEffect, useState } from "react";
import { type Room } from "matrix-js-sdk/src/matrix";
import { KnownMembership } from "matrix-js-sdk/src/types";

import BaseDialog from "../components/views/dialogs/BaseDialog";
import AccessibleButton from "../components/views/elements/AccessibleButton";
import BaseAvatar from "../components/views/avatars/BaseAvatar";
import MatrixClientContext from "../contexts/MatrixClientContext";
import { fetchAgents, type FluxAgent } from "./agents";

interface Props {
    room: Room;
    onFinished(): void;
}

export default function AddAgentDialog({ room, onFinished }: Props): JSX.Element {
    const client = useContext(MatrixClientContext);
    const [agents, setAgents] = useState<FluxAgent[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [, bump] = useState(0);

    useEffect(() => {
        void fetchAgents().then(setAgents);
    }, []);

    const membership = (userId: string): string | undefined => room.getMember(userId)?.membership;
    const canInvite = room.canInvite(client.getSafeUserId());

    const add = async (agent: FluxAgent): Promise<void> => {
        setBusy(agent.user_id);
        setError(null);
        try {
            await client.invite(room.roomId, agent.user_id);
            bump((n) => n + 1);
        } catch (e) {
            setError((e as Error).message ?? "Could not invite");
        } finally {
            setBusy(null);
        }
    };

    return (
        <BaseDialog title="Add an agent" onFinished={onFinished} className="fx_AddAgentDialog" fixedWidth={false}>
            <p className="fx_AddAgentDialog_intro">
                Agents join like people. Mention one in a message to give it work; replies in its thread continue the
                conversation.
            </p>
            {agents.length === 0 && <p className="fx_AddAgentDialog_empty">No agents are published yet.</p>}
            <ul className="fx_AddAgentDialog_list">
                {agents.map((agent) => {
                    const m = membership(agent.user_id);
                    const present = m === KnownMembership.Join;
                    const invited = m === KnownMembership.Invite;
                    return (
                        <li key={agent.user_id} className="fx_AddAgentDialog_row">
                            <BaseAvatar name={agent.display_name} idName={agent.user_id} size="32px" />
                            <div className="fx_AddAgentDialog_text">
                                <div className="fx_AddAgentDialog_name">
                                    {agent.display_name}
                                    {agent.rooms === "public-only" && <span className="fx_AddAgentDialog_tag">public rooms only</span>}
                                </div>
                                <div className="fx_AddAgentDialog_blurb">{agent.blurb}</div>
                            </div>
                            {present ? (
                                <span className="fx_AddAgentDialog_state">In this room</span>
                            ) : invited ? (
                                <span className="fx_AddAgentDialog_state">Joining…</span>
                            ) : (
                                <AccessibleButton kind="primary_outline" disabled={!canInvite || busy !== null} onClick={() => add(agent)}>
                                    {busy === agent.user_id ? "Adding…" : "Add"}
                                </AccessibleButton>
                            )}
                        </li>
                    );
                })}
            </ul>
            {!canInvite && <p className="fx_AddAgentDialog_note">Only room admins can add agents here.</p>}
            {error && <p className="fx_AddAgentDialog_error">{error}</p>}
        </BaseDialog>
    );
}
