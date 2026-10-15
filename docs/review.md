# Review notes

## Structural checks

`npm run build` checks TypeScript, creates the production bundles, and validates all 14 retained legacy files against `docs/legacy-manifest.json`. This includes the four supplied screenshot files without transcoding or resizing. It checks 102 legacy local URL references, project records and media paths, the seven archive projects in the supplied order with all available paragraphs and images, four interests, and the two explicit missing-content entries. It also confirms root and `dist/` generated output match. The current baseline is main commit `336f4f39cac99500702289333fac3cc1c68173c9`.

## Desktop browser acceptance

Use a desktop browser with WebGL and a viewport at least 1000 px wide.

1. From the seat, move the pointer; head motion should be subtle and limited.
2. Click the physical monitor, then repeat with the visible Use computer button and keyboard Enter.
3. The camera should settle facing the monitor squarely. The screen must remain ordinary selectable HTML with clearly readable text and visible keyboard focus.
4. Open OnTimely, read its text, and scroll its screenshots without moving the room camera. Return to the list, then to the room with the visible outer Return to room control and Escape. Only one room-exit control should be visible.
5. Repeat entry/exit and interrupt a focus transition with Escape. Confirm controls stay inactive during travel and keyboard focus restores to Use computer after returning.
6. Enable Reduce motion. Head movement and camera travel must stop; entry and exit should change pose immediately.
7. Resize the desktop window while focused; the display should fit and text remain usable. Check hash navigation and browser Back.
8. Open a retained legacy page and navigate Back; the room should remain usable after a browser cache restoration.
9. Confirm the direct-archive fallback remains readable if WebGL creation fails. Confirm a genuine load error leaves a usable legacy project index link.

Browser acceptance is reported separately from structural checks. Mobile visual review is outside this desktop-only scope.

## Observed desktop checks

The production preview passed the seated monitor-click / OnTimely reading / list / room loop; visible-button entry and return; Tab, Shift+Tab, Enter and Space; Escape during focus travel; and instant reduced-motion entry/exit. Focus restored to the entry row and then Use computer, with tab containment inside the focused interface. All four sections, the two missing-content entries, and the published Somnasculpt distinction were inspected.

Original OnTimely images (both 1500 × 983), MinEDHelper (2844 × 1602), and HowLong (2682 × 1828) loaded. Entry scrolling stayed inside the display. Browser Back restored the selected row, and Back from the retained project index returned to a usable room. The focused screen fit 1280 × 720, 1440 × 900, and 1920 × 1080 desktop viewports; the 1280-wide archive had no horizontal overflow.

The WebGL-unavailable fallback was reviewed in source and was not forced in a live browser. These local production-preview observations do not establish the state of a later branch deployment.

## Content gaps

No personal photos, videos, captions, dated memories, or unfinished project notes were supplied. Such entries must be marked as needing content; do not invent material. Existing published project descriptions, About facts, and contact links are the only factual source material.
