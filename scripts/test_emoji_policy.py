"""Protect the public Work Passport from platform-dependent emoji rendering."""
import json
import re
import unittest
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Include emoji-capable arrows, dingbats, emoji presentation selectors and pictographs.
# Ordinary editorial punctuation and the typographic right arrow U+2192 are allowed.
EMOJI_CAPABLE = re.compile(
    r"[\u2194-\u2199\u21A9-\u21AA\u23E9-\u23FA\u25AA-\u25AB"
    r"\u25B6\u25C0\u25FB-\u25FE\u2600-\u27BF\uFE0F\u20E3"
    r"\U0001F000-\U0001FAFF]"
)


class EmojiFreePresentationTests(unittest.TestCase):
    def test_no_emoji_in_public_assets_or_content(self):
        assets = [ROOT / p for p in ("index.html", "app.js", "styles.css", "favicon.svg")]
        assets += sorted((ROOT / "data").rglob("*.json"))
        for path in assets:
            with self.subTest(asset=str(path.relative_to(ROOT))):
                content = path.read_text(encoding="utf-8")
                if path.suffix == ".json":
                    content = json.dumps(json.loads(content), ensure_ascii=False)
                if path.suffix in {".html", ".svg"}:
                    content = unescape(content)
                forbidden = sorted(set(EMOJI_CAPABLE.findall(content)))
                self.assertFalse(forbidden, f"{path.name}: found emoji-capable characters {forbidden!r}")

    def test_favicon_uses_af_monogram_without_legacy_starburst(self):
        svg = (ROOT / "favicon.svg").read_text(encoding="utf-8")
        self.assertIn(">AF</text>", svg)
        self.assertNotIn("M51 13v16", svg)


if __name__ == "__main__":
    unittest.main()
