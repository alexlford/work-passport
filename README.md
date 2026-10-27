# Work Passport

A public, illustrated, source-backed professional archive of Alex Ford beginning **August 2017**, covering engineering work, career chapters, conferences, papers and public program connections.

## Site

The root `index.html` is a responsive static site requiring no build tools. GitHub Pages can serve this repository from `main` at repository root. **Repository deployment must be enabled separately if not already configured.** No custom domain is committed until DNS and Pages configuration are confirmed.

## Pages and content

- Homepage: three geographic career chapters; dated role progression from the June 2026 CV; verified program cards; seven innovation/engineering award events and professional distinctions; eleven conference/panel/author records; selected publications; and sources.
- Map: **embedded only**, source of truth remains `alexlford/life-map` with `?embed=1&mode=work`. Do not copy map coordinates or map code here.
- `data/programs.json`: documented work plus clear unverified candidate programs, including recognition links.
- `data/awards.json`: seven Northrop Grumman award events: five from the user's CV, plus one earlier 2023 FXR Innovation Award and one 2021 disclosure recognition confirmed by original correspondence: CEM (2020, New Technology), RAPTR (2020, Good Engineering), FXR-related filtering aperture (2023, New Technology), high-shock/high-temperature ultra-wideband antenna (2021, Innovation), and Mass Detection Payload (2023, Innovation). The 2023 FXR Innovation and New Technology awards recognize the same work at different stages; the additional 2021 disclosure subject is withheld from the public repository because its underlying invention is a trade secret.
- `data/recognitions.json`: 2022 Frontiers of Engineering nomination, 2023 initial Technical Fellow selection and 2025 re-nomination/renewal, and 2024 IEEE Senior Member distinction; a 2016 KU award is stored only as pre-archive context, not displayed as a Work Passport chapter-era recognition.
- `data/conferences.json`: papers linked to their venue/session, keeping attendance, authorship, panels, invited talks and organizational roles distinct. The 2020 IEEE AP-S/URSI paper's *virtual attendance* is independently confirmed by a conference-issued attendance certificate; the 2024 GSAW panel is corroborated by its public-release Working Group E outbrief, the 2020 AP-S/URSI antenna paper by the released IEEE paper, and the 2027 session-organizer role by the Conference Call for Papers.
- `data/interviews.json`: public-safe, attributed first-person interview recollections; not a repository for nonpublic implementation details.
- `data/chapters.json`: three geographic post-August-2017 career phases cross-referenced to Life Map, including a separately labeled August-to-October transition before the documented November 2017 Hawkes role.
- `data/roles.json`: exact employment job titles, dates and sanitized summary of responsibilities from the June 5, 2026 curriculum vitae.
- `data/academic-affiliations.json`: parallel University of Kansas Adjunct Industrial Research Associate role since November 2023, linked by the user to the December 2023 Astrophysical Journal article. Not an extra geographic career chapter.
- `data/publications.json`: source-linked publications since August 2017; ApJ appeared online 2023-12-18 in a January 2024 issue, including two physics journal articles and three engineering conference papers.
- `SOURCE-AUDIT.md`: historical URL replacements and image/source provenance.
- `assets/cbf-oyster.webp`: optimized personal photo supplied and explicitly approved for public Work Passport use (October 27, 2026). Its exact event/date and what was occurring are not asserted.

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

9. Uploaded files can contain personal contact details, internal employee rosters, controlled/access information or expressly protected trade-secret material. **Do not commit the raw CV, internal correspondence, private letters, licensed publications or draft files**. Only public-safe derived facts and stable public publisher links belong in the website.
10. An IEEE AP-S industry-panel invitation is not proof of attendance; the 2021 antenna Innovation Award has been explicitly linked to the projectile-tip antenna project by firsthand confirmation; the CBF Oyster photograph's event context and reuse approval remain open.

### Sources
See [SOURCE-AUDIT.md](SOURCE-AUDIT.md).

_Initial editorial seed: 27 October 2026._

## Automated foundation checks

Every pull request and push to `main` runs offline data/reference validation,
JavaScript syntax checks, and loading-recovery tests. A separate Chromium job
checks the rendered site at phone (390px), tablet (768px), and desktop (1440px)
widths, program filters, local anchors, and the actual section retry button.
Screenshots are retained as Actions artifacts for seven days.

Run the dependency-free checks locally with:

```sh
python scripts/validate.py
node --check app.js
node --test scripts/test_loading.cjs
```

Each data section loads and recovers independently. An unavailable or malformed
awards file leaves career history, programs, publications, and the other sections
available. Its retry button requests only that source. Requests time out after
15 seconds. Optional training details update in place and never block program
cards, reset their filter, or close an open field memory.

Browser QA deliberately blocks external images, fonts, and the independent Life
Map to verify that the archive remains usable without those services. It checks
the map's embed URL and full-map fallback link; it does not certify live external
imagery or map-provider availability. This workflow validates changes and does
not deploy the website.

## Archive intake — 2020–2029 ZIP (reviewed October 27, 2026)

The uploaded ZIP contains original letters, conference attendance and paper records, the 2023/2024 Astrophysical Journal paper, a 2025 Technical Fellow re-nomination roster, and a set of approved-for-public-release 2020 Chesapeake Bay oyster-testing photographs. The archive and confidential originals were **not copied to this public repository**. Publications link to publisher DOI pages; award event descriptions exclude trade-secret contents, internal identifiers and compensation information. The CV's 2023 ApJ entry reflects online publication on December 18, 2023; the paper appears in the journal's January 2024 issue. The 2020 AP-S/URSI attendance certificate explicitly states **virtual attendance**, not travel to Montréal.

