/*
Flux (Sydney Tools) — offers the company's agents in the mention popup even
when they are not in the room yet. Picking one inserts an ordinary user pill;
SendMessageComposer invites the agent before sending (design 007: "mention is
the add"). Agents already in the room come from UserProvider as usual.
*/

import React from "react";
import { type Room } from "matrix-js-sdk/src/matrix";
import { KnownMembership } from "matrix-js-sdk/src/types";

import AutocompleteProvider from "./AutocompleteProvider";
import QueryMatcher from "./QueryMatcher";
import { PillCompletion } from "./Components";
import { type ICompletion, type ISelectionRange } from "./Autocompleter";
import { makeUserPermalink } from "../utils/permalinks/Permalinks";
import { type TimelineRenderingType } from "../contexts/RoomContext";
import BaseAvatar from "../components/views/avatars/BaseAvatar";
import { fetchAgents, type FluxAgent } from "../flux/agents";

const USER_REGEX = /\B@\S*/g;
const FORCED_USER_REGEX = /\S*/g;

export default class AgentProvider extends AutocompleteProvider {
    public matcher: QueryMatcher<FluxAgent>;
    public room: Room;

    public constructor(room: Room, renderingType?: TimelineRenderingType) {
        super({ commandRegex: USER_REGEX, forcedCommandRegex: FORCED_USER_REGEX, renderingType });
        this.room = room;
        this.matcher = new QueryMatcher<FluxAgent>([], {
            keys: ["display_name", "id"],
            funcs: [(a) => a.user_id.slice(1)],
            shouldMatchWordsOnly: false,
        });
    }

    private notInRoom(agents: FluxAgent[]): FluxAgent[] {
        return agents.filter((a) => {
            const m = this.room.getMember(a.user_id);
            const membership = m?.membership;
            return membership !== KnownMembership.Join && membership !== KnownMembership.Invite;
        });
    }

    public async getCompletions(
        rawQuery: string,
        selection: ISelectionRange,
        force = false,
        limit = -1,
    ): Promise<ICompletion[]> {
        const { command, range } = this.getCurrentCommand(rawQuery, selection, force);
        const fullMatch = command?.[0];
        if (!fullMatch || fullMatch === "@") return [];
        const agents = this.notInRoom(await fetchAgents());
        if (!agents.length) return [];
        this.matcher.setObjects(agents);
        const query = fullMatch.startsWith("@") ? fullMatch.substring(1) : fullMatch;
        return this.matcher.match(query, limit).map((agent) => ({
            completion: agent.display_name,
            completionId: agent.user_id,
            type: "user",
            suffix: selection.beginning && range!.start === 0 ? ": " : " ",
            href: makeUserPermalink(agent.user_id),
            component: (
                <PillCompletion title={agent.display_name} description={agent.blurb || "Agent, not in this room yet"}>
                    <BaseAvatar name={agent.display_name} idName={agent.user_id} size="24px" />
                </PillCompletion>
            ),
            range: range!,
        }));
    }

    public getName(): string {
        return "Agents";
    }

    public renderCompletions(completions: React.ReactNode[]): React.ReactNode {
        return (
            <div className="mx_Autocomplete_Completion_container_pill" role="presentation" aria-label="Agents">
                {completions}
            </div>
        );
    }
}
