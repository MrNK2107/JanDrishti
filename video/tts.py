"""
Voiceover for JanDrishti demo video using ElevenLabs.
Based on PACT's tts.py approach.
"""
import argparse, hashlib, json, pathlib, re, urllib.error, urllib.request
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "audio"
API = "https://api.elevenlabs.io/v1"


def get_key():
    """Read ElevenLabs API key from ~/.secrets/elevenlabs.key"""
    key_file = pathlib.Path.home() / ".secrets" / "elevenlabs.key"
    raw = key_file.read_text(encoding="utf-8-sig")
    keys = re.findall(r"sk_[A-Za-z0-9]+|[A-Fa-f0-9]{32}", raw)
    if not keys:
        raise ValueError("No valid API key found in elevenlabs.key")
    return keys[0]


def remaining(key):
    """Check remaining character quota"""
    req = urllib.request.Request(f"{API}/user/subscription", headers={"xi-api-key": key})
    d = json.load(urllib.request.urlopen(req, timeout=30))
    return d["character_limit"] - d["character_count"]


DEFAULT_SETTINGS = {"stability": 0.38, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True}


def synth(key, voice, model, text, dest, settings=DEFAULT_SETTINGS):
    """Generate speech with ElevenLabs"""
    body = json.dumps({"text": text, "model_id": model, "voice_settings": settings}).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=body,
        method="POST",
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"}
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        dest.write_bytes(r.read())


def duration(p):
    """Get audio duration using ffprobe"""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
        capture_output=True, text=True
    ).stdout.strip()
    return float(out or 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Generate only this segment")
    args = ap.parse_args()

    cfg = json.loads((ROOT / "narration.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)

    key = get_key()
    left = remaining(key)
    print(f"Characters available: {left}")

    settings = cfg.get("voice_settings", DEFAULT_SETTINGS)
    durations = {}

    for seg in cfg["segments"]:
        sid, text = seg["id"], seg["text"]
        dest, tag = OUT / f"{sid}.mp3", OUT / f"{sid}.hash"

        # Check if regeneration needed
        h = hashlib.sha256(
            f'{cfg["voice_id"]}|{cfg["model_id"]}|{json.dumps(settings, sort_keys=True)}|{text}'.encode()
        ).hexdigest()

        if (args.only and sid != args.only) or (dest.exists() and tag.exists() and tag.read_text() == h):
            durations[sid] = duration(dest) if dest.exists() else 0
            continue

        if left < len(text) + 20:
            print(f"Insufficient quota for {sid}")
            continue

        try:
            print(f"Generating {sid}... ({len(text)} chars)")
            synth(key, cfg["voice_id"], cfg["model_id"], text, dest, settings)
            left -= len(text)
            tag.write_text(h)
            durations[sid] = duration(dest)
            print(f"  -> {durations[sid]:.2f}s")
        except urllib.error.HTTPError as e:
            print(f"Error: {e.code} {e.read()[:200]}")
            continue

    (OUT / "durations.json").write_text(json.dumps(durations, indent=2))
    print(f"\nTotal voice: {sum(durations.values()):.1f}s")
    print(f"Characters remaining: {left}")


if __name__ == "__main__":
    main()
