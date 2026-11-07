# Video Shot List

Recording guide for the JanDrishti demo. The voiceover already exists — eight
MP3s in [`video/audio/`](video/audio/) totalling **2:23.26**. This document tells you
what the screen should be doing while each one plays.

Open **[`video/storyboard.html`](video/storyboard.html)** in a browser while you
record. It plays the narration, counts down each shot, and shows you the action
for the current moment — you should not be reading a document on a second screen
while capturing.

---

## Before you start

```bash
npm run dev          # http://localhost:3002
```

Then, in the app:

1. Click **Reset demo data** in the sidebar — start from a known state.
2. Set the browser to **1920×1080**, full screen, and hide bookmarks.
3. Use **Windows Game Bar** (`Win+G`), OBS, or ShareX. Record at 30 fps.
4. Move the mouse **slowly**. Let the cursor settle before clicking.

**Do not** open the demo in two tabs. State persists per tab, so a second tab
will show different data and your recording will not match the narration.

---

## Timeline

Total **2:23.26**. Cues are cumulative from 00:00.

| # | Starts | Dur | Audio | Shot |
|---|---|---|---|---|
| 1 | 00:00.0 | 8.1s | `s1_intro.mp3` | Title card |
| 2 | 00:08.1 | 18.8s | `s2_problem.mp3` | The gap, in three numbers |
| 3 | 00:26.8 | 18.2s | `s3_solution.mp3` | Reconciliation, live |
| 4 | 00:45.0 | 18.3s | `s4_dashboard.mp3` | The ward map |
| 5 | 01:03.4 | 27.6s | `s5_case_study.mp3` | T Nagar, 500 vs 320 |
| 6 | 01:31.0 | 21.6s | `s6_accountability.mp3` | Evidence chain and citizen view |
| 7 | 01:52.6 | 13.8s | `s7_mvp.mp3` | Scope |
| 8 | 02:06.4 | 17.0s | `s8_close.mp3` | Closing card · ends 02:23.3 |

---

## Shot 1 — Title card · 00:00–00:08

**Narration:** *"This is JanDrishti. A public works verification platform that
makes every infrastructure project traceable, from what was promised to what was
actually delivered."*

- Static card, no UI yet. Dark ground `#0A1929`, the wordmark, and the line
  *Public Works Verification & Accountability*.
- Hold still. Fade in over 0.5s, no motion otherwise.

---

## Shot 2 — The gap, in three numbers · 00:08–00:27

**Narration:** *"Right now, public project information sits across work orders,
progress reports, and inspection records... there's no systematic way to verify
it matches what was approved and what's actually on the ground."*

**Screen:** Open the **Citizen** portal and expand **T Nagar Main Road
Resurfacing**.

- The three numbered cards — *1 · Sanctioned*, *2 · Contractor reported*,
  *3 · Independently observed* — are the whole shot. Let the narration talk over
  them; do not scroll.
- At *"can't easily compare"*, move the cursor slowly across the three cards.
- Slow scroll to the top so the summary panel is visible at *"no systematic
  way"*.

**If you want the problem stated as prose:** [`README.md`](README.md), first
section.

---

## Shot 3 — Reconciliation, live · 00:27–00:45

**Narration:** *"JanDrishti addresses this reconciliation gap... Every mismatch
gets flagged, tracked, and resolved with full evidence."*

**Screen:** **Inspector** portal → select **Saidapet Bridge Pavement Work**.

This is the strongest 18 seconds available, because here the system *decides*
rather than displaying a stored verdict.

1. Point at the *Contractor claims* figure: **200 m**.
2. Type `90` into the observed-quantity field — type it, do not paste.
3. Click **Submit observation and reconcile**.
4. The verdict panel appears: **−55.0%**, a flag, and the sentence *"A discrepancy
   has been opened and referred to the Ward Officer."*
5. Hold on that panel until the narration ends.

> **Consider a replacement line here.** The narration for this segment says
> "flagged, tracked, and resolved", which is a summary. This shot shows the
> mechanism, and it is the most compelling thing in the product. A ~12-second
> ninth segment — *"An inspector records what is physically on site. The system
> reconciles it against the contractor's claim immediately, and a discrepancy
> opens automatically when they disagree"* — would fit between `s3_solution` and
> `s4_dashboard`. `video/tts.py` regenerates only changed segments. This is
> optional; the demo works without it.

---

## Shot 4 — The ward map · 00:45–01:03

**Narration:** *"Here's the admin dashboard. Projects appear as stations on a
transit network diagram. Status flows as colored lines: green for verified, red
for flagged discrepancies, amber for pending inspection."*

**Screen:** **Ward Admin** → **Ward Map**.

- Open on the full map. Do not click anything for the first four seconds.
- At *"green for verified"*, move to the legend and trace the green line.
- At *"red for flagged"*, the T Nagar station is flagged — hover it so its label
  appears.
- At *"amber for pending"*, hover the Saidapet station. Note it now reads as
  **flagged** too, because of shot 3. That is correct and worth keeping — it
  shows the map reacting to what you just did.
- At *"transit diagrams"*, pan slowly across the cadastral grid and the
  coordinate readout, then settle on the north arrow.

---

## Shot 5 — T Nagar, 500 vs 320 · 01:03–01:31

**Narration:** *"Look at this road resurfacing project in T Nagar. Budget: eight
lakh rupees. The contractor reported five hundred meters complete. But the
independent inspector observed only three hundred twenty meters..."*

**Screen:** **Ward Admin** → **Ward Map** → select **T Nagar Main Road
Resurfacing**.

Every number in this narration appears on screen, so the shot choreographs
itself. Follow the narration with the cursor:

1. *"Budget: eight lakh rupees"* → the **₹8,00,000** field.
2. *"reported five hundred meters"* → the **Reported 500 m** cell.
3. *"observed only three hundred twenty"* → the **Observed 320 m** cell. It is
   tinted red.
4. *"flagged the quantity mismatch"* → scroll to **Reconciliation**. The failing
   check is expanded with its arithmetic. This is the money shot: the system
   shows *why*, not just *that*.
5. *"created a discrepancy record"* → the **Findings on record** list, showing
   `DSC-0001`.
6. *"stays in disputed status until..."* → the status badge reads **Flagged**.

> **Small narration inaccuracy.** The line says *"assigned it for resolution"*,
> which implies a person was assigned. The system refers the finding to the Ward
> Officer's queue; it does not support named assignment. Either accept the
> imprecision or re-record that clause.

---

## Shot 6 — Evidence chain and the public view · 01:31–01:52

**Narration:** *"Every update retains its source, timestamp, and history...
And citizens can view the full accountability chain."*

**Screen:** **Ward Admin** → **Audit Trail**, then **Citizen**.

1. Open **Audit Trail**. Scroll slowly — sources, roles, timestamps, and the
   append-only numbering are all visible. This segment's narration is literally a
   description of this screen.
2. At *"And citizens can view"* (around 01:46), cut to the **Citizen** portal and
   expand **Saidapet Bridge Pavement Work** — the one you filed in shot 3.
3. Show its **Discrepancy record**, including the *Disposition* line.

That closing beat is the point of the whole video: a finding raised by an
inspector, closed by an officer, published to the public in under two minutes.

---

## Shot 7 — Scope · 01:52–02:06

**Narration:** *"The MVP targets municipal road repair and resurfacing.
Observable work sites, mappable locations, measurable quantities..."*

**Screen:** Return to the **Ward Map**. No interaction.

- Hold on the wide shot of the ward.
- At *"deliberately narrow"*, scroll to the **Ward register** below the map.
- Do not open other portals — this segment is about restraint.

---

## Shot 8 — Closing card · 02:06–02:13

**Narration:** *"JanDrishti doesn't replace existing systems... Evidence before
claims. Independent verification. Traceability as trust."*

- Card: wordmark, and the three lines of the closing narration appearing as the
  narrator says them.
- End on *"That's JanDrishti."* Hold for one second, then fade out.

---

## Assembly

```bash
# Sequence the audio with 300ms between segments.
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.3 -c:a libmp3lame pad.mp3
# Then concat s1..s8 with pad.mp3 between each, and mux against your capture:
ffmpeg -i screen-recording.mp4 -i voiceover-track.mp3 \
       -c:v copy -c:a aac -shortest jandrishti-demo.mp4
```

Export **H.264, 1920×1080, 30 fps**. Aim for a file under 100 MB.

If you would rather edit by hand, drop the eight MP3s into any editor in
filename order — they are already in narrative sequence and their durations are
in [`video/audio/durations.json`](video/audio/durations.json).

---

## Checklist

- [ ] Reset demo data before recording
- [ ] 1920×1080, 30 fps, bookmarks hidden
- [ ] Cursor moves slowly and settles before each click
- [ ] All eight segments placed in order, none trimmed
- [ ] Shot 3 ends on the verdict panel
- [ ] Shot 6 ends on the citizen disposition — the strongest closing image
- [ ] Exported as H.264, 1920×1080, 30 fps
