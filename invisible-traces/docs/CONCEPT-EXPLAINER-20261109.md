# Concept explanation polish - 2026-11-09

## Changes
No existing concept movie player was present. Added an optional illustrated three-scene recall section inside research records, honestly labeled as scenes rather than video. Reuses pathlab, comparison and cough-covered-20261108 art. Explains infection routes, cough etiquette/ventilation and controlled comparison.

- No changes to rewards, progress storage, learning judgments, maps or audio logic.
- No new generated bitmap or replacement movie. Existing imagery inspected and reused.
- No endless decorative motion; short transitions and reduced-motion support.

## Verification
- Mac arm64, Node v24.22.2. 36 project tests passed, build passed. Final log: /tmp/explainer-final-12.log.
- Isolated Chrome profile at 1024x768, 873x580 and 1920x1080. No page errors or document horizontal overflow.
- Representative screenshots: output/concept-explainer-20261109/.
- Opened Start > Research records > Concept scenes through the app. Long records retain vertical scrolling. Reduced motion removes scene reveal animation.

## Limits
Representative concept screens were checked at all three sizes, not every clip in full. Physical tablet/whiteboard and human audio listening were not tested. Deployment is separately coordinated by the series release owner.
