# Work Passport

A public, illustrated, source-backed professional archive of Alex Ford beginning **August 2017**, covering engineering work, career chapters, conferences, papers and public program connections.

## Site

The root `index.html` is a responsive static site requiring no build tools. GitHub Pages can serve this repository from `main` at repository root. **Repository deployment must be enabled separately if not already configured.** No custom domain is committed until DNS and Pages configuration are confirmed.

## Pages and content

- Homepage: career chapters, verified program cards, a five-award innovation and engineering recognition section plus professional distinctions, evidence labels, publications/conferences and external source links.
- Map: **embedded only**, source of truth remains `alexlford/life-map` with `?embed=1&mode=work`. Do not copy map coordinates or map code here.
- `data/programs.json`: documented work plus clear unverified candidate programs, including recognition links.
- `data/awards.json`: five Northrop Grumman awards from the user-supplied Honors & Awards résumé image: CEM (2020, New Technology), RAPTR (2020, Good Engineering), FXR-related filtering aperture (2023, New Technology), high-shock/high-temperature ultra-wideband antenna (2021, Innovation), and Mass Detection Payload (2023, Innovation). The three project connections were confirmed in interview; the two other award workstream associations are not yet established.
- `data/recognitions.json`: 2022 Frontiers of Engineering nomination, 2023 and 2025 Northrop Grumman Technical Fellow entries, and 2024 IEEE Senior Member distinction; a 2016 KU award is stored only as pre-archive context, not displayed as a Work Passport chapter-era recognition.
- `data/conferences.json`: papers linked to their venue/session, keeping attendance, authorship, panels, invited talks and organizational roles distinct.
- `data/interviews.json`: public-safe, attributed first-person interview recollections; not a repository for nonpublic implementation details.
- `data/chapters.json`: three post-August-2017 career phases cross-referenced to Life Map, including a separately labeled August-to-October transition before the documented November 2017 Hawkes role.
- `SOURCE-AUDIT.md`: historical URL replacements and image/source provenance.

## Archive boundary

**Start: August 2017.** The Work Passport deliberately excludes earlier graduate research employment, undergraduate experiences, and pre-August 2017 conferences. Earlier degrees and research may be cited for context, but they are not rendered as Work Passport career or conference records. The separate Life Map retains its earlier work and education history and is not edited or truncated here. According to the current résumé, the Hawkes Learning role started in **November 2017**, not August; August 2017 marks the beginning of this archive, not a new claimed employment date.

## Career-base correction

Northrop Grumman Boulder remains the **career base from September 2021 through present**, across the Systems Engineering Manager and current Senior Staff Engineer / Lead Systems Engineer roles. **There is no separate Aurora career chapter.** The independent Life Map is the source of truth for career geography.

## Integrity rules

1. The repository is public. Never publish controlled unclassified information, classified/SAP details, nonpublic architecture, specific performance or internal personnel information.
2. Documentary confidence is explicit; employment at an NG site is **not** proof of work on every NG program there.
3. 2020 AP-S/URSI paper authorship is corroborated, but event attendance is not assumed.
4. Where a historical NG page returned 403, preserve its original URL and cite functioning contemporary reporting or an official replacement. **No invented Wayback snapshots.**
5. Photos may be illustrative: captions must say so. Remote CDN image URLs are linked rather than claimed as original owned media.
6. LinkedIn Featured links have not been fully enumerated because the public crawler does not expose the full Featured section.
7. Three distinct technical-project awards are confirmed in interview, and an image of the user's résumé provides the years, title and category: two **New Technology Awards** (2020 CEM, 2023 integrated filtering) and one **Good Engineering Award** (2020 re-scalable aperture associated with RAPTR). Two further **Innovation Awards** appear in the image (2021 antenna, 2023 Mass Detection Payload). These résumé-listed titles/years are first-person evidence rather than independently issuer-verified award certificates; award associations are not evidence of issued patents.
8. A 2022 **Frontiers of Engineering nomination** is not represented as NAE selection/participation. Technical Fellow entries for 2023 and 2025 remain distinct records without assuming two separate appointments.

### Sources
See [SOURCE-AUDIT.md](SOURCE-AUDIT.md).

_Initial editorial seed: 27 October 2026._
