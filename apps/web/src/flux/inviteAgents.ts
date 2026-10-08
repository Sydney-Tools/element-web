/*
Flux (Sydney Tools) — "mention is the add" (design 007): before a message
that mentions a company agent is sent, invite the agent if it is not in the
room. The appservice joins on the invite and answers in the thread.
*/

import { type IContent, type MatrixClient, type Room } from "matrix-js-sdk/src/matrix";
import { KnownMembership } from "matrix-js-sdk/src/types";
import { logger } from "matrix-js-sdk/src/logger";

import { knownAgents } from "./agents";

export async function inviteMentionedAgents(client: MatrixClient, room: Room, content: IContent): Promise<void> {
    const mentioned: string[] = content["m.mentions"]?.user_ids ?? [];
    if (!mentioned.length) return;
    const agents = knownAgents();
    for (const userId of mentioned) {
        if (!agents.some((a) => a.user_id === userId)) continue;
        const membership = room.getMember(userId)?.membership;
        if (membership === KnownMembership.Join || membership === KnownMembership.Invite) continue;
        try {
            await client.invite(room.roomId, userId);
        } catch (e) {
            logger.warn(`Flux: could not invite ${userId} to ${room.roomId}`, e);
        }
    }
}
