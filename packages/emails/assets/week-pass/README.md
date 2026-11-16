# Week Pass email images (NOT YET HOSTED)

Images for the Week Pass emails. Apart from the logo, every one is
decorative (`alt=""`): the emails say everything in live text, so blocked
images lose nothing a reader needs.

| File                      | Source                                                                                                                                                 | Shown at        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `logo-wordmark-white.png` | the app's genuine `MainLogo` vector (`apps/frontend/src/components/shared/main-logo.tsx`), black fill set to white, tan "2" unchanged, on opaque black | 300 / 190 wide  |
| `hero-welcome.jpg`        | welcome reference hero (x 0-1080, y 0-438) with every baked-in text area masked to black                                                               | hero background |
| `hero-expired.jpg`        | expired reference hero (x 0-1080, y 0-444) with every baked-in text area masked to black                                                               | hero background |
| `icon-calendar.png`       | welcome date box                                                                                                                                       | 36x30           |
| `icon-shield.png`         | welcome privacy note                                                                                                                                   | 44x46           |
| `icon-radar.png`          | expired, first benefit                                                                                                                                 | 64x64           |
| `icon-upload.png`         | expired, second benefit                                                                                                                                | 64x64           |
| `icon-gears.png`          | expired, third benefit                                                                                                                                 | 64x64           |

The logo is an image, never set as text; its alt text ("Studio 2 Stadium")
is styled white on black so it still reads when images are blocked. The hero
backgrounds keep only the genuine floor and swoosh pixels in their original
positions; nothing was painted in, and no headline is baked behind the live
text. Outlook desktop gets the same background through VML; every client
without images shows a solid black hero.

Icons were scaled and their near-white JPEG background flattened to white.
Nothing else was redrawn.

## Hosting requirement (before activation)

The templates load these from `WEEK_PASS_EMAIL_ASSET_BASE_URL`, by default
`https://studio2stadium.com/img/week-pass/<file>`. Upload them there (the R2
`/img/` route the other emails use) before switching either email on. Per
the note in `src/components/Layout.tsx`, that zone's hotlink protection 403s
`<img>` requests that carry a cross-origin Referer, so check `/img/week-pass/*`
loads from a mail client before activation.
