# JanDrishti - Public Works Verification & Accountability Platform

**Connecting public project commitments to on-ground evidence.**

## What is JanDrishti?

JanDrishti is a digital accountability platform for tracking publicly funded infrastructure projects. It reconciles three sources of truth:

1. **Approved Commitment** - What was officially approved and budgeted
2. **Contractor Report** - What the contractor claims was delivered  
3. **Independent Observation** - What field inspectors actually observe

When these don't match, the system flags discrepancies, assigns responsibility, tracks resolution, and preserves the complete evidence chain for citizen transparency.

## Design Direction

The UI merges two visual systems:
- **Midnight Transit Diagram**: Projects organized as a network with status-colored lines (green=verified, red=flagged, amber=pending)
- **Survey Cadastral Map**: Official government map aesthetic with coordinate grids and zone overlays

This creates a familiar interface for municipal officials while clearly visualizing project dependencies and status flows.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+ (for video generation)
- ffmpeg (for audio duration checks)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3002`

### Project Structure

```
JanDrishti/
├── src/
│   ├── pages/
│   │   ├── AdminDashboard.jsx      # Main admin interface (COMPLETE)
│   │   ├── ContractorPortal.jsx    # Contractor evidence submission
│   │   ├── InspectorInterface.jsx  # Mobile field verification
│   │   └── CitizenPortal.jsx       # Public transparency view
│   ├── lib/
│   │   └── supabase.js             # Supabase client config
│   ├── App.jsx                     # Main router
│   └── main.jsx                    # Entry point
├── video/
│   ├── narration.json              # Demo video script
│   ├── tts.py                      # ElevenLabs voiceover generator
│   └── audio/                      # Generated MP3 files (143s total)
└── .impeccable/                    # Design artifacts
    ├── surfaces/                   # Surface briefs
    └── mocks/decision/             # UI mockup options
```

## Key Features Implemented

### Admin Dashboard ✅
- Transit network diagram showing projects as stations
- Status-colored flow lines (verified/flagged/pending)
- Cadastral grid overlay with coordinates
- Live stats panel
- Project detail cards showing discrepancy information
- **Demo Case**: T Nagar road resurface - contractor reported 500m, inspector observed 320m (flagged)

### Sample Data ✅
- 3 projects with realistic data
- Quantity mismatch scenario (500m vs 320m) 
- Multiple status states demonstrated
- Geographic zone organization

### Design System ✅
- Midnight blue palette (#0A1929 ground)
- Status colors: verified (#2A9D8F), flagged (#E63946), pending (#F4A261)
- Transit-style station markers
- Cadastral coordinate system overlay
- Tailwind CSS with custom tokens

### Demo Video Assets ✅
- Professional narration script (8 segments, ~143 seconds)
- ElevenLabs voiceover generated (Chris voice, multilingual v2)
- Audio segments stored in `video/audio/`

## Demo Video Production

### Voiceover Generation ✅ COMPLETE

```bash
cd video
python tts.py  # Generates all 8 segments (~143s total)
```

Audio segments are cached - only regenerates if text/voice settings change.

### Recording the Demo (Manual Step Required)

1. **Start the app**: `npm run dev` → Opens at http://localhost:3002
2. **Record screen**:
   - Use OBS Studio, ShareX, or Windows Game Bar
   - Record at 1920x1080, 30fps
   - Capture these scenes:
     - Full dashboard view showing transit diagram
     - Hover over T Nagar station (flagged project)
     - Click to show discrepancy details
     - Show stats panel
     - Demonstrate coordinate grid overlay
3. **Assemble final video**:
   ```bash
   # Use ffmpeg or video editor to:
   # - Trim/sequence screen recordings
   # - Overlay voiceover segments in order (s1_intro → s8_close)
   # - Add title card: "JanDrishti - Public Works Accountability"
   # - Export as MP4 (H.264, 1920x1080)
   ```

## Architecture

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation

### Backend (Configured, Not Implemented)
- **Supabase** for:
  - PostgreSQL + PostGIS (geospatial queries)
  - Authentication (role-based: Admin/Contractor/Inspector/Citizen)
  - File storage (evidence photos/videos)
  - Row Level Security for data access control

### Future Implementation
- Database schema (Projects, Milestones, Evidence, Inspections, Discrepancies)
- Evidence reconciliation engine (automated mismatch detection)
- File hashing and duplicate detection
- Inspector mobile interface (offline-capable)
- Contractor portal (milestone submission)
- Citizen portal (public transparency)

## Product Principles

1. **Evidence before claims**: Completion must be supported by proof
2. **Independent verification**: Contractor and inspector data stay distinguishable  
3. **Traceability**: Full audit trail with timestamps and actors
4. **Explainability**: Show what was expected, submitted, observed, and why it was flagged
5. **Human accountability**: Software flags, humans decide

## MVP Scope

**Target**: Municipal road repair and resurfacing in one ward

**Why**: Observable worksites, mappable locations, measurable quantities, understandable before/after evidence.

**What's Included**:
- Project registry with geospatial data
- Milestone tracking
- Evidence submission workflow
- Independent inspection interface
- Automated reconciliation alerts
- Discrepancy resolution tracking
- Citizen transparency portal

**Explicitly Out of Scope**:
- Replacing GeM, CPGRAMS, or existing procurement systems
- Payment authorization
- Automated fraud determination
- Facial recognition or Aadhaar processing

## Development Status

| Component | Status | Notes |
|-----------|--------|-------|
| Design System | ✅ Complete | Midnight Transit + Cadastral Map merged |
| Admin Dashboard | ✅ Complete | Interactive transit diagram, sample data |
| Database Schema | ⏸️ Designed | Documented in PRODUCT.md |
| Contractor Portal | 📋 Scaffolded | Basic structure, needs implementation |
| Inspector Interface | 📋 Scaffolded | Needs mobile-friendly forms + GPS |
| Citizen Portal | 📋 Scaffolded | Needs public data filtering |
| Evidence Engine | 📋 Planned | File hashing, duplicate detection |
| Reconciliation | 📋 Planned | Automated mismatch detection |
| Demo Video Script | ✅ Complete | 8 segments, professional narration |
| Voiceover Audio | ✅ Complete | ElevenLabs generated, 143s |
| Screen Recording | ⏸️ Manual | Requires user to capture app demo |
| Final Video | ⏸️ Pending | Assembly step |

## Design Artifacts

### UI Mockups Created
Three design directions were presented:
1. **Midnight Transit Diagram** ✅ CHOSEN - Project network with status lines
2. **Survey Cadastral Map** - Official government survey aesthetic  
3. **Split-Flap Concourse** - Airport-style live project board

Final design merged elements from options 1 & 2.

### Design Files
- Mockups: `.impeccable/mocks/decision/*.html`
- Surface brief: `.impeccable/surfaces/public-index-html.md`
- Product context: `PRODUCT.md`

## Testing

```bash
npm test  # Vitest (configured, tests pending)
```

## Environment Setup

Create `.env` with your Supabase credentials:

```bash
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

## Contributing

This is a National Student Ideation Challenge concept submission (Track A - Product/Technology, Theme: Surakshit Bharat - Digital Public Infrastructure).

Current stage: **Prototype with demo video**

Next steps for production:
1. Complete Supabase backend implementation
2. Implement all 4 user interfaces
3. Build evidence reconciliation engine
4. Field test with actual municipal project data
5. Pilot with one municipal ward

## License

ISC

## Contact

For inquiries about deployment or collaboration: [Add contact info]

---

**"JanDrishti connects public project promises to on-ground evidence, helping authorities and citizens verify whether taxpayer-funded infrastructure was actually delivered."**
