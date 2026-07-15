# Mobile Event Schedule Dialog Design

## Goal

Make the organization event schedule open and scroll correctly in the expanded
dialog on mobile for admin, coach, and dancer views, without changing the
existing desktop experience.

## Design

Extract the duplicated expanded schedule presentation into a shared frontend
component. The component will accept the schedule URL and file type and render
the existing PDF iframe or image preview.

On mobile, the dialog will be bounded by the visible viewport. Its header and
close control will remain available while the schedule region consumes the
remaining height and scrolls independently. On larger screens, the dialog will
retain its current wide layout and approximately 80-viewport-height preview.

The shared component will be used by the admin dashboard and the coach and
dancer event-information pages. The global dialog primitive will not change,
which limits regression risk for unrelated dialogs.

## Verification

- Add a focused regression test for the shared component's viewport-bounded,
  scrollable dialog structure.
- Run the focused frontend test, frontend lint, and frontend build.
- Verify PDF and image schedules in a mobile browser viewport and confirm the
  desktop dialog still renders correctly.

## Out of Scope

- Changes to schedule upload, removal, or URL generation.
- Changes to the inline (non-expanded) schedule preview.
- Changes to the shared dialog primitive.
