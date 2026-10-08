/*
Flux (Sydney Tools) — the company's agent directory, as the appservice
publishes it at /_flux/agents (design 007: one directory, the client never
hard-codes agent names). Cached for a minute; failures fall back to the last
good list, then to an empty list.
*/

export interface FluxAgent {
    id: string;
    user_id: string;
    display_name: string;
    blurb: string;
    rooms: "any" | "public-only";
}

const DIRECTORY_URL = "/_flux/agents";
const TTL_MS = 60_000;

let cache: { agents: FluxAgent[]; at: number } = { agents: [], at: 0 };
let inflight: Promise<FluxAgent[]> | null = null;

export async function fetchAgents(): Promise<FluxAgent[]> {
    if (Date.now() - cache.at < TTL_MS) return cache.agents;
    if (inflight) return inflight;
    inflight = (async () => {
        try {
            const res = await fetch(DIRECTORY_URL, { credentials: "same-origin", cache: "no-cache" });
            if (res.ok) {
                const data = (await res.json()) as { agents?: FluxAgent[] };
                cache = { agents: data.agents ?? [], at: Date.now() };
            } else {
                cache = { ...cache, at: Date.now() }; // back off, keep the last good list
            }
        } catch {
            cache = { ...cache, at: Date.now() };
        } finally {
            inflight = null;
        }
        return cache.agents;
    })();
    return inflight;
}

/** Synchronous view of the cache (kicks off a refresh when stale). */
export function knownAgents(): FluxAgent[] {
    if (Date.now() - cache.at >= TTL_MS) void fetchAgents();
    return cache.agents;
}

export function isAgentUserId(userId: string): boolean {
    return knownAgents().some((a) => a.user_id === userId);
}
