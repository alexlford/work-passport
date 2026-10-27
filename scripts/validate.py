#!/usr/bin/env python3
"""Validate Work Passport data, relationships and local page assets offline."""
import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {
    "programs": "id status title group place period role narrative media mediaCredit evidence",
    "chapters": "years place title summary",
    "conferences": "id year title where type work description note url",
    "awards": "id awardDate kind displayTitle issuer recognition",
    "recognitions": "id year title detail issuer visibility",
    "roles": "id start title employer location summary",
    "publications": "id year title venue publicationType authors summary url",
    "academic-affiliations": "id start title institution department summary",
    "professional-development": "id title institution year",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text_fields(row, fields, context):
    require(isinstance(row, dict), f"{context}: expected a record object")
    for field in fields.split():
        value = row.get(field)
        require(isinstance(value, (str, int)) and not isinstance(value, bool)
                and str(value).strip(), f"{context}.{field}: missing text or year")


def url(value, context, local=False):
    require(isinstance(value, str) and bool(value), f"{context}: missing URL")
    parts = urlsplit(value)
    if parts.scheme:
        require(parts.scheme in {"http", "https"} and bool(parts.netloc),
                f"{context}: expected an HTTP(S) URL")
    else:
        require(local and not parts.netloc and bool(parts.path),
                f"{context}: expected a public URL")
        target = (ROOT / unquote(parts.path)).resolve()
        require(target.is_relative_to(ROOT) and target.is_file(),
                f"{context}: missing local asset {value}")


def children(row, field, fields, context):
    rows = row.get(field, [])
    require(isinstance(rows, list), f"{context}.{field}: expected an array")
    for i, child in enumerate(rows):
        text_fields(child, fields, f"{context}.{field}[{i}]")
    return rows


def references(rows, field, target_ids, context):
    for row in rows:
        values = row.get(field, [])
        require(isinstance(values, list), f"{context}.{field}: expected an array")
        require(all(isinstance(value, str) and value in target_ids for value in values),
                f"{context} {row.get('id')}.{field}: unknown related record")


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.local_urls = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        for name in ("href", "src"):
            value = attrs.get(name)
            if value and not urlsplit(value).scheme and not value.startswith("//"):
                self.local_urls.append(value)


def main():
    # Parse every JSON file, including interview records that are not rendered.
    files = sorted((ROOT / "data").rglob("*.json"))
    parsed = {str(path.relative_to(ROOT)): json.loads(path.read_text()) for path in files}
    data, ids = {}, {}
    for name, fields in FIELDS.items():
        rows = parsed[f"data/{name}.json"]
        require(isinstance(rows, list), f"{name}: expected a record array")
        for i, row in enumerate(rows):
            context = f"{name}[{i}]"
            text_fields(row, fields, context)
            if "id" in row:
                require(isinstance(row["id"], str)
                        and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", row["id"]),
                        f"{context}: ID must be a stable URL-safe string")
        row_ids = [row["id"] for row in rows if "id" in row]
        require(len(row_ids) == len(set(row_ids)), f"{name}: duplicate IDs")
        data[name], ids[name] = rows, set(row_ids)

    for row in data["programs"]:
        context = f"program {row['id']}"
        require(row["status"] in {"documented", "candidate", "planned"},
                f"{context}: unknown confidence status")
        url(row["media"], context + ".media", local=True)
        require(isinstance(row.get("links"), list), f"{context}.links: expected an array")
        for link in children(row, "links", "label url", context):
            url(link["url"], context + ".links")
        children(row, "phases", "label contribution", context)
        for story in children(row, "travelStories", "sequence title narrative adventureUrl hike hikeRecordDate", context):
            url(story["adventureUrl"], context + ".adventureUrl")
            if story.get("pubMapsUrl"):
                url(story["pubMapsUrl"], context + ".pubMapsUrl")
        if row.get("originalUrl"):
            url(row["originalUrl"], context + ".originalUrl")

    for name in ("conferences", "publications"):
        for row in data[name]:
            url(row["url"], f"{name} {row['id']}.url")

    previous_start = None
    for row in data["roles"]:
        start = date.fromisoformat(row["start"])
        require(previous_start is None or start >= previous_start,
                "roles: keep records in chronological order")
        previous_start = start
        if row.get("end") is not None:
            require(date.fromisoformat(row["end"]) >= start,
                    f"role {row['id']}: end precedes start")
        children(row, "managementThemes", "title detail", f"role {row['id']}")
        children(row, "relatedMapPlaces", "id label", f"role {row['id']}")

    for row in data["awards"]:
        require(row.get("programId") is None or row["programId"] in ids["programs"],
                f"award {row['id']}: unknown programId")
    for source, field, target in (
        ("programs", "awardIds", "awards"),
        ("programs", "relatedRecords", "programs"),
        ("programs", "relatedProfessionalDevelopmentIds", "professional-development"),
        ("professional-development", "relatedProgramIds", "programs"),
        ("publications", "relatedAffiliationIds", "academic-affiliations"),
        ("academic-affiliations", "relatedPublicationIds", "publications"),
    ):
        references(data[source], field, ids[target], source)

    page = Page()
    page.feed((ROOT / "index.html").read_text())
    require(len(page.ids) == len(set(page.ids)), "index.html: duplicate element IDs")
    hosts = {"programs-grid", "conference-list", "chapters-grid", "awards-grid",
             "recognitions-grid", "role-timeline", "publications-list", "academic-affiliations"}
    require(hosts <= set(page.ids), "index.html: missing data section")
    for value in page.local_urls:
        parts = urlsplit(value)
        if parts.path:
            url(value, "index.html", local=True)
        elif parts.fragment:
            require(unquote(parts.fragment) in page.ids,
                    f"index.html: broken section link {value}")
    print(f"Work Passport OK: {len(files)} JSON files, {sum(map(len, data.values()))} rendered-source records; relationships and local assets verified.")


if __name__ == "__main__":
    main()
