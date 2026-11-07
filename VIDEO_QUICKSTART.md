# JanDrishti Demo Video - Quick Start Guide

## Current Status

✅ **Voiceover Complete**: 8 MP3 files generated (143 seconds total)  
📋 **Screen Recording Needed**: Capture app demonstration  
📋 **Assembly Needed**: Combine footage + voiceover

---

## Step 1: Verify App is Running

```bash
cd C:\Users\nanda\Desktop\projects\JanDrishti
npm run dev
```

App should open at: **http://localhost:3002**

You should see:
- Dark blue interface (midnight theme)
- Transit network diagram with colored lines
- Coordinate grid overlay (faint lines)
- Stats panel on the right
- "Ward 12 – Public Works" header

---

## Step 2: Record Screen Footage

### Option A: Windows Game Bar (Built-in)
1. Press `Win + G` to open Game Bar
2. Click **Record** button (or `Win + Alt + R`)
3. Capture these scenes (see below)
4. Press `Win + Alt + R` again to stop
5. Files save to `C:\Users\[YourName]\Videos\Captures`

### Option B: OBS Studio (Recommended for Quality)
1. Download from https://obsproject.com
2. Add **Display Capture** source
3. Set resolution: 1920x1080, 30fps
4. Click **Start Recording**
5. Capture scenes, click **Stop Recording**

### Option C: ShareX (Advanced)
1. Download from https://getsharex.com
2. Capture → Screen Recording
3. Same scene capture as below

---

## Step 3: What to Record

### Scene 1: Dashboard Overview (30 seconds)
**Narration**: s1_intro.mp3 + s2_problem.mp3 (~37s total)

**Actions**:
- Show full dashboard with transit diagram
- Slowly pan across the network
- Hover briefly over each status color:
  - Green line (verified projects)
  - Red line (flagged discrepancies)
  - Amber line (pending inspection)

**Key Elements to Show**:
- Coordinate system in top-left
- North arrow in top-right
- Grid overlay (subtle lines)
- All station markers
- Stats panel on right

---

### Scene 2: Case Study - T Nagar Discrepancy (60 seconds)
**Narration**: s3_solution.mp3 + s4_dashboard.mp3 + s5_case_study.mp3 (~64s total)

**Actions**:
1. **Hover** over T Nagar station (red/flagged, center of screen)
2. **Click** to select it (becomes highlighted)
3. **Show** right panel updating with project details:
   - Project ID: JDT-2026-0143
   - Contractor Reported: 500m
   - Inspector Observed: 320m
   - Red "⚠ QUANTITY MISMATCH" badge
4. **Pause** on this view for 10 seconds (let voiceover explain)
5. **Click** other projects to show comparison:
   - Anna Nagar (green/verified) - no issues
   - Saidapet (amber/pending) - inspection due

**Key Elements to Show**:
- Red glow around flagged station
- Evidence comparison (500m vs 320m)
- Status badge
- Project metadata

---

### Scene 3: System Features (30 seconds)
**Narration**: s6_accountability.mp3 (~22s)

**Actions**:
- Show the recent activity list scrolling
- Hover over multiple stations to show status changes
- Demonstrate the transit line connections between projects
- Show how clicking updates the detail panel instantly

**Key Elements**:
- Real-time interactivity
- Status color consistency
- Audit trail concept (timestamp visible)

---

### Scene 4: Closing View (20 seconds)
**Narration**: s7_mvp.mp3 + s8_close.mp3 (~31s)

**Actions**:
- Zoom out to show full network diagram
- Slowly pan across entire map
- End on clear view of T Nagar flagged station
- Fade to black

**Key Elements**:
- Complete network visible
- Multiple zones shown
- Grid overlay apparent
- Professional government interface aesthetic

---

## Step 4: Assemble Final Video

### Prepare Assets

**Voiceover Files** (already generated in `video/audio/`):
```
s1_intro.mp3        - 18.08s - "This is JanDrishti..."
s2_problem.mp3      - 18.76s - "Right now, public project information..."
s3_solution.mp3     - 18.16s - "JanDrishti addresses this reconciliation gap..."
s4_dashboard.mp3    - 18.34s - "Here's the admin dashboard..."
s5_case_study.mp3   - 27.59s - "Look at this road resurfacing project..."
s6_accountability.mp3 - 21.59s - "Every update retains its source..."
s7_mvp.mp3          - 13.79s - "The MVP targets municipal road repair..."
s8_close.mp3        - 16.95s - "JanDrishti doesn't replace existing systems..."
```

**Screen Recordings**:
- Scene 1: Dashboard overview (30s)
- Scene 2: T Nagar case study (60s)
- Scene 3: System features (30s)
- Scene 4: Closing (20s)

### Option A: Simple Assembly with FFmpeg

**Step 1: Concatenate voiceover**
```bash
cd video/audio

# Create file list
echo "file 's1_intro.mp3'
file 's2_problem.mp3'
file 's3_solution.mp3'
file 's4_dashboard.mp3'
file 's5_case_study.mp3'
file 's6_accountability.mp3'
file 's7_mvp.mp3'
file 's8_close.mp3'" > concat_list.txt

# Merge all audio
ffmpeg -f concat -safe 0 -i concat_list.txt -c copy full_narration.mp3
```

**Step 2: Combine your screen recordings**
```bash
# Put your recorded MP4 files in the same folder
# Assuming you named them: scene1.mp4, scene2.mp4, scene3.mp4, scene4.mp4

echo "file 'scene1.mp4'
file 'scene2.mp4'
file 'scene3.mp4'
file 'scene4.mp4'" > video_list.txt

ffmpeg -f concat -safe 0 -i video_list.txt -c copy combined_video.mp4
```

**Step 3: Add voiceover to video**
```bash
ffmpeg -i combined_video.mp4 -i full_narration.mp3 \
  -c:v copy -c:a aac -b:a 192k \
  -shortest \
  jandrishti_demo_final.mp4
```

### Option B: Video Editor (Easier, More Control)

**DaVinci Resolve (Free)**:
1. Download from https://www.blackmagicdesign.com/products/davinciresolve
2. Create new project (1920x1080, 30fps)
3. Import screen recordings
4. Import all 8 MP3 files
5. **Timeline**:
   - Video track: Place screen recordings in sequence
   - Audio track: Place MP3s in order (s1 → s8)
   - Trim video to match audio timing
6. **Add title card**:
   - First 3 seconds: "JanDrishti - Public Works Accountability"
   - Black background, white text
7. Export → MP4, H.264, 1920x1080, 30fps

**Windows Movie Maker / Clipchamp (Simplest)**:
1. Open Clipchamp (built into Windows 11)
2. Import screen recordings + MP3 files
3. Drag to timeline in order
4. Add text overlay for title
5. Export as MP4

---

## Final Video Specs

**Target Output**:
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080
- **Frame Rate**: 30fps
- **Duration**: ~3-4 minutes (143s voiceover + scene transitions)
- **Audio**: AAC, 192 kbps
- **File Size**: ~50-80 MB

**Title Card**:
```
JanDrishti
Public Works Verification & Accountability Platform

Connecting commitments to evidence
```

---

## Quality Checklist

Before finalizing, verify:

- ✅ Audio is clear and not distorted
- ✅ Video shows all key UI elements:
  - Transit network diagram
  - Status colors (green/red/amber)
  - Coordinate grid
  - T Nagar discrepancy details
  - 500m vs 320m comparison
- ✅ Voiceover syncs with on-screen actions
- ✅ No dead air or awkward pauses
- ✅ Title card is readable
- ✅ Final seconds fade out smoothly
- ✅ Total runtime: 3-4 minutes

---

## Troubleshooting

### "App won't start"
```bash
# Kill existing node processes
taskkill /F /IM node.exe

# Restart
npm run dev
```

### "Screen recorder captures black screen"
- **Fix**: Use windowed mode instead of fullscreen
- **Fix**: In OBS, use Window Capture instead of Display Capture

### "Voiceover doesn't match video length"
- **Fix**: Trim video clips to match audio duration
- **Fix**: Add B-roll or slow-motion sections where needed
- **Fix**: Add 2-3 second pauses between major sections

### "Audio is out of sync"
- **Fix**: In video editor, manually align audio waveform with video action
- **Fix**: Check that video is 30fps (not 24 or 60)

---

## Need Help?

Check these files:
- `README.md` - Full project documentation
- `STATUS.md` - Build status and progress
- `video/narration.json` - Full script text
- `video/audio/durations.json` - Exact timing for each segment

---

**You're almost there!** The hardest part (voiceover generation) is done. Now just capture the app in action and assemble. Good luck! 🎬
