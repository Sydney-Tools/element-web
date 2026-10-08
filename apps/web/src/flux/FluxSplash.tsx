/*
Flux (Sydney Tools) — the loading screen shown while the app starts.
*/

import React, { type JSX } from "react";

import { InlineSpinner } from "@vector-im/compound-web";

export default function FluxSplash(): JSX.Element {
    return (
        <div className="mx_MatrixChat_splash fx_Splash">
            <div className="fx_Splash_wordmark" aria-label="Flux">
                Flux
            </div>
            <div className="fx_Splash_spinner">
                <InlineSpinner size={24} role="progressbar" />
            </div>
        </div>
    );
}
