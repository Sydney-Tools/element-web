/*
Flux (Sydney Tools) — the loading animation: a stroke that morphs circle → infinity → circle.

After "Morphing Infinity" from loading-ui.com (turbostarter/loading-ui, MIT), whose version animates the
path with the `motion` library. This one uses SVG's own <animate> on the path's `d`, so it needs no
dependency and runs before React has much to do; the three paths share one command structure, which is
what makes the morph smooth. Honours prefers-reduced-motion by showing the infinity sign still.
*/

import React, { type JSX, useEffect, useState } from "react";

const CIRCLE_A =
    "M 12 8 C 14.21 8 16 9.79 16 12 C 16 14.21 14.21 16 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 Z";
const INFINITY =
    "M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z";
const CIRCLE_B =
    "M 12 16 C 14.21 16 16 14.21 16 12 C 16 9.79 14.21 8 12 8 C 9.79 8 8 9.79 8 12 C 8 14.21 9.79 16 12 16 Z";

// ease-in-out between each keyframe, as the original's `easeInOut`
const EASE = "0.42 0 0.58 1";

interface Props {
    /** Rendered width and height in CSS pixels. */
    size?: number;
    className?: string;
    /** Seconds for one full circle → infinity → circle → infinity → circle cycle. */
    durationSeconds?: number;
    "aria-label"?: string;
}

function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function MorphingInfinity({
    size = 40,
    className,
    durationSeconds = 5,
    "aria-label": ariaLabel = "Loading",
}: Props): JSX.Element {
    const [still, setStill] = useState<boolean>(prefersReducedMotion);
    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!mq) return;
        const onChange = (): void => setStill(mq.matches);
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);

    return (
        <svg
            className={["fx_MorphingInfinity", className].filter(Boolean).join(" ")}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            role="progressbar"
            aria-label={ariaLabel}
            data-testid="spinner"
        >
            <path d={still ? INFINITY : CIRCLE_A}>
                {!still && (
                    <animate
                        attributeName="d"
                        dur={`${durationSeconds}s`}
                        repeatCount="indefinite"
                        calcMode="spline"
                        keyTimes="0;0.25;0.5;0.75;1"
                        keySplines={[EASE, EASE, EASE, EASE].join(";")}
                        values={[CIRCLE_A, INFINITY, CIRCLE_B, INFINITY, CIRCLE_A].join(";")}
                    />
                )}
            </path>
        </svg>
    );
}
