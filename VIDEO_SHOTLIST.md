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

The product now opens on a **public homepage**, and the working portals sit behind
sign-in. Set the recording up like this:

1. Open `http://localhost:3002` — you land on the landing page.
2. Set the browser to **1920×1080**, full screen, and hide bookmarks.
3. Use **Windows Game Bar** (`Win+G`), OBS, or ShareX. Record at 30 fps.
4. Move the mouse **slowly**. Let the cursor settle before clicking.

**Sign in before you need to.** Sign in as the Ward Officer
(`officer@jandrishti.in` / `ward12`, or the one-click entry on the sign-in page)
and keep that tab ready. Shot 4 cuts to the officer view, and a login form in the
middle of that cut would interrupt the narration — so either record the sign-in as
part of shot 3's tail, or pre-sign-in and cut.

**Do not** open two tabs. Application state is held per browser, so a second tab
shows different data and your recording will not match the narration.

**To reset between takes:** sign in, then use **Reset demo** in the header. It is
withheld from the public record page on purpose.

---

## Timeline

Total **2:23.26**. Cues are cumulative from 00:00.

| # | Starts | Dur | Audio | Shot |
|---|---|---|---|---|
| 1 | 00:00.0 | 8.1s | `s1_intro.mp3` | Title card |
| 2 | 00:08.1 | 18.8s | `s2_problem.mp3` | The gap, in three numbers |
| 3 | 00:26.8 | 18.2s | `s3_solution.mp3` | Reconciliation, live |
| 4 | 00:45.0 | 18.3s | `s4_dashboard.mp3` | The delivery chart ⚠️ re-record |
| 5 | 01:03.4 | 27.6s | `s5_case_study.mp3` | T Nagar, 500 vs 320 |
| 6 | 01:31.0 | 21.6s | `s6_accountability.mp3` | Evidence chain and citizen view |
| 7 | 01:52.6 | 13.8s | `s7_mvp.mp3` | Scope |
| 8 | 02:06.4 | 17.0s | `s8_close.mp3` | Closing card · ends 02:23.3 |

---

## Shot 1 — Title card · 00:00–00:08

**Narration:** *"This is JanDrishti. A public works verification platform that
makes every infrastructure project traceable, from what was promised to what was
actually delivered."*

Two options, pick one:

**Option A — static card.** Light canvas `#F6F8FA`, ink text `#0F172A`, the
wordmark, and the line *Public Works Verification & Accountability*. Hold still,
fade in over 0.5s.

**Option B — the real homepage.** Worth considering now that the app has a landing
page where it previously opened straight into a dashboard. Open
`http://localhost:3002`, let the hero sit two seconds, then begin a slow scroll
from the headline — *"Did we get what we paid for?"* — into the worked example. It
shows the product rather than describing it, and costs nothing.

Either way, match the app's light theme: a dark card cutting to a white dashboard
is a jarring first second.

---

## Shot 2 — The gap, in three numbers · 00:08–00:27

**Narration:** *"Right now, public project information sits across work orders,
progress reports, and inspection records... there's no systematic way to verify
it matches what was approved and what's actually on the ground."*

**Screen:** **Public record** — no sign-in needed. Use the `Public record` nav
link, or go to `/record`. Expand **T Nagar Main Road Resurfacing**.

- The row itself is the shot: the sentence under the project name — *"Short by
  180 m. Contractor claims 500 m but inspection found only 320 m…"* — states the
  problem in words, and the bar above it shows it as a length. Let the narration
  play over it; do not scroll.
- At *"can't easily compare"*, move the cursor slowly along the short bar, past
  the point where it stops, into the hatched outline.
- At *"no systematic way to verify"*, scroll slowly back to the top so the
  summary metrics are visible.

**If you want the problem stated as prose:** the first paragraph of
[`README.md`](README.md).

---

## Shot 3 — Reconciliation, live · 00:27–00:45

**Narration:** *"JanDrishti addresses this reconciliation gap... Every mismatch
gets flagged, tracked, and resolved with full evidence."*

**Screen:** Sign in as the **Field Inspector** (one-click entry on the sign-in
page), then **Assigned inspections** → select **Saidapet Bridge Pavement Work**.
The sign-in itself can be cut, or shown during the tail of shot 2.

This is the strongest 18 seconds available, because here the system *decides*
rather than displaying a stored verdict.

1. Point at the *Contractor claims* figure: **200 m**.
2. Type `90` into the measured-quantity field — type it, do not paste.
3. Click **Submit measurement**.
4. The verdict panel appears: **−55.0%**, and the words *"the work on site is
   110 m short of what was claimed"* followed by *"You have not decided anything;
   you have recorded what is there."*
5. Hold on that panel until the narration ends.

> **Recommend re-recording this segment.** The narration says "flagged, tracked,
> and resolved" — a summary of an outcome. This shot shows the *mechanism*, and
> it is the most compelling thing in the product. A ~14-second replacement —
> *"When a contractor reports completion, the system does not take their word for
> it. An inspector records what is physically on site, and the system compares the
> two immediately. If they disagree beyond a published tolerance, a discrepancy
> opens automatically — and a human decides what happens next."* — would match the
> screen. `video/tts.py` regenerates only changed segments, so this costs one
> segment. Strongly recommended; the demo works without it.

---

## Shot 4 — The delivery chart · 00:45–01:03

**Narration (as recorded):** *"Here's the admin dashboard. Projects appear as
stations on a transit network diagram. Status flows as colored lines: green for
verified, red for flagged discrepancies, amber for pending inspection. Municipal
officials already know transit diagrams, so the metaphor feels immediate."*

> ### ⚠ The narration no longer matches the screen
>
> The transit diagram was **removed**. It encoded sequence and connection, which
> this data does not have, so it explained nothing. The dashboard is now a
> **delivery chart**. Two of the four sentences in this segment describe a UI that
> no longer exists, and *"colored lines"* and *"the metaphor feels immediate"* are
> both now untrue.
>
> **Re-record this segment.** Suggested replacement, ~18 seconds:
>
> *"Here's the ward officer's view. Every project is a bar, measured against what
> was sanctioned. The bar stops where an independent inspection found the work to
> end. The shaded outline beyond it is the distance between what the contractor
> claimed and what was actually measured. A project that delivered in full runs
> the whole length; a project in trouble stops short, and you can see it without
> reading a single number."*
>
> If you would rather not re-record, the shot below still works — but the audio
> will describe a diagram that is not on screen, and a judge who notices will
> discount the whole video. Re-recording is the better trade.

**Screen:** Sign in as the **Ward Officer**, then **Ward overview** (the default
view after sign-in).

1. Open on the chart. Do not move for three seconds — let the bars read.
2. At *"every project is a bar"*, run the cursor slowly down the three rows,
   resting on each bar in turn.
3. At the shaded outline, hover the hatched span on the **T Nagar** row.
4. The three bars are deliberately ordered worst-first: flagged, then awaiting
   inspection, then verified.
5. End on the plain-language sentence under the T Nagar row — *"Short by 180 m.
   Contractor claims 500 m but inspection found only 320 m…"*

**What is on screen:** a shared legend above the rows explains each visual
treatment — solid fill is delivered, the hatched outline is claimed but not
found, grey track is still outstanding. That legend is the honest replacement for
the old status-coloured lines.

---

## Shot 5 — T Nagar, 500 vs 320 · 01:03–01:31

**Narration:** *"Look at this road resurfacing project in T Nagar. Budget: eight
lakh rupees. The contractor reported five hundred meters complete. But the
independent inspector observed only three hundred twenty meters..."*

**Screen:** **Ward overview** → click the **T Nagar** row.

This narration still fits, and every figure it names is on screen.

1. *"Budget: eight lakh rupees"* → the **Sanctioned budget** field.
2. *"reported five hundred meters"* → the **Contractor reported complete** step in
   the explanation panel.
3. *"observed only three hundred twenty"* → the **Independent inspection** step.
4. *"flagged the quantity mismatch"* → scroll to the **System comparison** step,
   which shows the rule applied, the ±5% tolerance, and the actual **−36.0%**
   variance. **This is the money shot** — the system shows *why* it flagged, not
   merely *that* it did.
5. *"created a discrepancy record"* → **Findings raised against this milestone**,
   showing `DSC-0001`.
6. *"stays in disputed status until..."* → the **Flagged** badge at the top and the
   conclusion sentence: *"Flagged — the claimed work is not on the ground."*

> **Small narration inaccuracy.** The line says *"and assigned it for
> resolution"*, which implies a named person was assigned. The system refers the
> finding to the Ward Officer's queue; it does not support assigning an
> individual. Either accept the imprecision or re-record that clause.

---

## Shot 6 — Evidence chain and the public view · 01:31–01:52

**Narration:** *"Every update retains its source, timestamp, and history...
And citizens can view the full accountability chain."*

**Screen:** **Audit trail** in the top navigation, then the **Public record**.

1. Go to **Audit trail** in the top navigation. Scroll slowly — actor, role, timestamp, and the
   append-only numbering are all visible. This narration is a literal description
   of this screen.
2. At *"And citizens can view"* (~01:46), switch to the **Public record** and
   expand **Saidapet Bridge Pavement Work** — the one you filed in shot 3.
3. Show its discrepancy record, including the *Decision* line.

That closing beat is the argument of the whole video: a finding raised by an
inspector, closed by an officer with a written reason, and published publicly —
in under two minutes.

---

## Shot 7 — Scope · 01:52–02:06

**Narration:** *"The MVP targets municipal road repair and resurfacing.
Observable work sites, mappable locations, measurable quantities..."*

**Screen:** Back to the **Ward overview**. No interaction.

1. Hold on the widest view: the headline, the four summary metrics, and the chart.
2. At *"deliberately narrow"*, scroll to the bottom of the chart and stop at the
   explanatory note about what the bar does and does not claim.
3. Do not open other portals — this segment is about restraint.

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

- [ ] Signed in as Ward Officer, and as Field Inspector when shot 3 needs it
- [ ] 1920×1080, 30 fps, bookmarks hidden
- [ ] Cursor moves slowly and settles before each click
- [ ] **Decide on segments 3 and 4 — both describe a UI that changed**
- [ ] If re-recording: run `python tts.py` from `video/`, then re-check the
      durations and update the timing table above
- [ ] All segments placed in order, none trimmed
- [ ] Shot 3 ends on the inspector's verdict, not the form
- [ ] Shot 5 ends on the **System comparison** step showing −36.0%
- [ ] Shot 6 ends on the public decision — the strongest closing image
- [ ] Exported as H.264, 1920×1080, 30 fps

---

## Two segments describe a UI that no longer exists

Worth deciding before you record, because it is the difference between a demo
that holds up and one that does not.

**Segment 3 (`s3_solution`)** summarises an outcome — *"flagged, tracked, and
resolved"* — while the screen shows the mechanism: an inspector entering a
measurement and the system reaching a verdict in front of the viewer. The shot is
better than the words.

**Segment 4 (`s4_dashboard`)** is the real problem. It describes a transit diagram
with status-coloured lines. That diagram was removed, because it encoded sequence
and connection and this data has neither. Two of its four sentences are now
simply false, including *"Municipal officials already know transit diagrams, so
the metaphor feels immediate."*

Both have suggested replacements in the shots above. `video/tts.py` hashes each
segment and regenerates only what changed, so this is a few minutes of work plus
the cost of two short ElevenLabs calls.

If you would rather not re-record, the earlier shots are self-contained and the
demo still functions — but a judge who notices the audio describing an absent
diagram will discount everything else in the video.
