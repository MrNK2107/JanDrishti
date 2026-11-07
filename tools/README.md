# tools/

Small standalone Node scripts. No dependencies — plain `node`, no install step.

These exist because several claims in this project's documentation were wrong,
and the only way to stop guessing was to measure.

## `contrast.mjs` — WCAG 2.1 contrast audit

Checks every palette pairing that carries text against WCAG AA
(4.5:1 normal text, 3:1 large text), using the real token values from
`tailwind.config.cjs`.

```bash
node tools/contrast.mjs               # audit the shipped palette (exits 1 on failure)
node tools/contrast.mjs --candidates  # audit the proposed fix palette
```

The shipped palette is expected to report **5 failing pairings**. That is the
point: it is a regression guard. Run it after touching any color token.

## `pick-palette.mjs` — palette solver

One-off search used to derive the current palette values, kept for provenance
so the chosen colors are reproducible rather than hand-waved.

```bash
node tools/pick-palette.mjs
```

It mixes each brand hue toward white in 5% steps and reports the first value
that clears AA as text on both `midnight-900` and `midnight-800`. It also
confirms that the colored *fills* need no adjustment when paired with dark
text — the original accessibility defect was the text color, not the fill.
