#!/usr/bin/env python3
"""Check the independent Passport destinations without fetching other sites."""
import argparse
from html.parser import HTMLParser
from pathlib import Path

DESTINATIONS = {
    "sports": "https://sports.alexlford.com",
    "adventures": "https://adventures.alexlford.com",
    "atlas": "https://alexlford.github.io/life-map/atlas.html",
}
PAGES = {
    "work": ("index.html",),
    "culture": ("index.html", "explore.html", "timeline.html", "map.html",
                "record.html", "interview.html", "performance-interview.html"),
}


class Navigation(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.count = 0
        self.items = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "nav" and attrs.get("aria-label") == "Passports":
            self.active = True
            self.count += 1
        if self.active and "data-passport" in attrs:
            self.items.append((tag, attrs))

    def handle_endtag(self, tag):
        if tag == "nav":
            self.active = False


def audit(root, pages, current):
    for page in pages:
        nav = Navigation()
        nav.feed((root / page).read_text(encoding="utf-8"))
        def require(condition, message):
            if not condition:
                raise ValueError(f"{page}: {message}")
        require(nav.count == 1, "expected one named Passport navigation")
        by_id = {attrs["data-passport"]: (tag, attrs) for tag, attrs in nav.items}
        require(len(nav.items) == 5 and set(by_id) == {"work", "culture", *DESTINATIONS},
                "missing or duplicate Passport destinations")
        active = [attrs["data-passport"] for _, attrs in nav.items if attrs.get("aria-current") == "true"]
        require(active == [current], "current Passport is not identified correctly")
        for key, url in DESTINATIONS.items():
            tag, attrs = by_id[key]
            require(tag == "a" and attrs.get("href") == url,
                    f"{key}: destination changed without updating the navigation contract")
        for key in ("work", "culture"):
            tag, attrs = by_id[key]
            require(tag == "span" and "href" not in attrs,
                    f"{key}: public destination requires a separate verified launch change")
            if key != current:
                require("passport-pending" in attrs.get("class", "").split(),
                        f"{key}: unpublished destination must be labeled pending")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("current", choices=PAGES)
    args = parser.parse_args()
    audit(Path(__file__).resolve().parents[1], PAGES[args.current], args.current)
    print(f"Passport navigation passes on {len(PAGES[args.current])} {args.current} pages.")
