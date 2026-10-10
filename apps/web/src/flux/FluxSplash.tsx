/*
Flux (Sydney Tools) — the loading screen shown while the app starts.
*/

import React, { type JSX } from "react";

import MorphingInfinity from "./MorphingInfinity";

export default function FluxSplash(): JSX.Element {
    return (
        <div className="mx_MatrixChat_splash fx_Splash">
            <div className="fx_Splash_wordmark" aria-label="Flux">
                Flux
            </div>
            <div className="fx_Splash_spinner">
                <MorphingInfinity size={44} aria-label="Loading Flux" />
            </div>
        </div>
    );
}
