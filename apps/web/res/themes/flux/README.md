# Flux theme

Our built-in theme: Element's light theme plus `_flux.pcss` (light first,
since that is where most people land; a dark variant can follow the same
shape). Selected with `default_theme: "flux"` in config.json and listed
first in the theme picker. Change colours here, not in config.json custom
themes.

Feature components (agent runs, approval cards, flux meter) get their CSS
under `res/css/flux/`, registered in `res/css/_components.pcss`; this
directory only decides how Flux looks.
