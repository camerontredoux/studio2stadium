# CheckInPass

A dancer's own pass: their bib large, their name, the QR code and their check-in status.
- No event name on the pass: the page header already names the event. Leave `event` unset.
- The bib is `bib-hero` (56px mono). The code sits on an `fg` card with `on-fg` modules, `radius-10`, 153px square.
- Pass the real QR (an SVG from your generator) as `children`. Without it the component draws the mockup's placeholder pattern, which is not scannable.
- Status is mono 12px: `fg` with a check once checked in, `fg-3` before.
- Consumer provides: `bib`, `name`, `checkedIn`, optional `status`, and the QR as `children`.
