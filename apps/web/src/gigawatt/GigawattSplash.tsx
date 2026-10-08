/*
Gigawatt (Sydney Tools) — the loading screen shown while the app starts.
*/

import React, { type JSX } from "react";

import { InlineSpinner } from "@vector-im/compound-web";

export const GIGAWATT_LINE = "Where we're going, we don't need roads.";

export default function GigawattSplash(): JSX.Element {
    return (
        <div className="mx_MatrixChat_splash gw_Splash">
            <img className="gw_Splash_car" src="gigawatt/delorean.svg" alt="" draggable={false} />
            <p className="gw_Splash_line">{GIGAWATT_LINE}</p>
            <div className="gw_Splash_spinner">
                <InlineSpinner size={24} role="progressbar" />
            </div>
        </div>
    );
}
