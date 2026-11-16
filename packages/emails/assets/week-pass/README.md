# Week Pass email images (NOT YET HOSTED)

Decorative crops of Abbey's approved Week Pass designs. Every one is
`alt=""`: the emails say everything in live text, so blocked images lose
nothing a reader needs.

| File                | Source crop (1080x1920 reference)                   | Shown at |
| ------------------- | --------------------------------------------------- | -------- |
| `welcome-band.png`  | welcome, x 0-1080, y 392-440 (floor and tan swoosh) | 600 wide |
| `expired-band.png`  | expired, x 0-1080, y 388-446 (floor and court line) | 600 wide |
| `icon-calendar.png` | welcome date box                                    | 36x30    |
| `icon-shield.png`   | welcome privacy note                                | 44x46    |
| `icon-radar.png`    | expired, first benefit                              | 64x64    |
| `icon-upload.png`   | expired, second benefit                             | 64x64    |
| `icon-gears.png`    | expired, third benefit                              | 64x64    |

Icons were scaled and their near-white JPEG background flattened to white.
Nothing else was redrawn.

## Hosting requirement (before activation)

The templates load these from `WEEK_PASS_EMAIL_ASSET_BASE_URL`, by default
`https://studio2stadium.com/img/week-pass/<file>`. Upload them there (the R2
`/img/` route the other emails use) before switching either email on. Per
the note in `src/components/Layout.tsx`, that zone's hotlink protection 403s
`<img>` requests that carry a cross-origin Referer, so check `/img/week-pass/*`
loads from a mail client before activation.

## Known gap

The design's full-bleed hero photo (dark court floor behind the headline) has
the headline baked into the supplied JPEGs, so it cannot be cropped cleanly.
The emails use a black hero with live text plus the text-free floor band
below it. A text-free export of that artwork from the designer would let the
hero match the reference more closely.
