/*
Flux (Sydney Tools) — the loading screen shown while the app starts.
*/

import React, { type JSX } from "react";

import { InlineSpinner } from "@vector-im/compound-web";

export const FLUX_LINE = "Where we're going, we don't need roads.";

export default function FluxSplash(): JSX.Element {
    return (
        <div className="mx_MatrixChat_splash fx_Splash">
            <img className="fx_Splash_car" src="flux/delorean.svg" alt="" draggable={false} />
            <p className="fx_Splash_line">{FLUX_LINE}</p>
            <div className="fx_Splash_spinner">
                <InlineSpinner size={24} role="progressbar" />
            </div>
        </div>
    );
}
