/*
Flux (Sydney Tools) — room-scoped instructions for agents (design 007,
Claude Tag's per-channel instructions). Stored as the room state event
`au.syd.tools.agent_instructions` with an empty state key, read by the
appservice on every run and appended to the agent's system prompt.
*/

import React, { type JSX, useContext, useEffect, useState } from "react";
import { type Room, RoomStateEvent } from "matrix-js-sdk/src/matrix";

import MatrixClientContext from "../contexts/MatrixClientContext";
import Field from "../components/views/elements/Field";
import AccessibleButton from "../components/views/elements/AccessibleButton";
import { SettingsSubsection } from "../components/views/settings/shared/SettingsSubsection";
import { useTypedEventEmitter } from "../hooks/useEventEmitter";

export const AGENT_INSTRUCTIONS_EVENT = "au.syd.tools.agent_instructions";

function currentInstructions(room: Room): string {
    const ev = room.currentState.getStateEvents(AGENT_INSTRUCTIONS_EVENT, "");
    const text = ev?.getContent()?.instructions;
    return typeof text === "string" ? text : "";
}

export function AgentInstructionsSettings({ room }: { room: Room }): JSX.Element {
    const client = useContext(MatrixClientContext);
    const canEdit = room.currentState.mayClientSendStateEvent(AGENT_INSTRUCTIONS_EVENT, client);
    const [saved, setSaved] = useState(() => currentInstructions(room));
    const [text, setText] = useState(saved);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useTypedEventEmitter(room.currentState, RoomStateEvent.Events, () => {
        const now = currentInstructions(room);
        setSaved(now);
        setText((t) => (t === saved ? now : t));
    });
    useEffect(() => setText(saved), [saved]);

    const save = async (): Promise<void> => {
        setBusy(true);
        setError(null);
        try {
            await client.sendStateEvent(room.roomId, AGENT_INSTRUCTIONS_EVENT as any, { instructions: text.trim() }, "");
            setSaved(text.trim());
        } catch (e) {
            setError((e as Error).message ?? "Could not save");
        } finally {
            setBusy(false);
        }
    };

    return (
        <SettingsSubsection
            heading="Agents in this room"
            description="What every agent should know when it works here: who the room is for, house rules, tone, what to avoid. Agents read this on every run."
            legacy={false}
        >
            <Field
                id="fx_agent_instructions"
                element="textarea"
                label="Instructions for agents"
                value={text}
                rows={5}
                disabled={!canEdit || busy}
                onChange={(ev: React.ChangeEvent<HTMLTextAreaElement>) => setText(ev.target.value)}
                placeholder={canEdit ? "e.g. This is the Penrith store room. Answer in plain English and keep it short." : "Only room admins can change this."}
            />
            {error && <div className="fx_AgentInstructions_error">{error}</div>}
            {canEdit && (
                <AccessibleButton kind="primary" onClick={save} disabled={busy || text.trim() === saved}>
                    Save
                </AccessibleButton>
            )}
        </SettingsSubsection>
    );
}
