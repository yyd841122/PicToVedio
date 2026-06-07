# MotionPic AI Homepage Console UAT

Date: 2026-06-07

## Owner Observation

The owner opened the production homepage with Chrome DevTools.

- The visible `Shared Storage API is deprecated` issue points to a browser-extension `content.js` resource and is not emitted by MotionPic AI.
- Chrome reported one incorrect `label for` association and two form-label accessibility suggestions on the homepage.

## Local Fix

- The hidden photo file input now has an associated label.
- The motion prompt textarea keeps its explicit label and now has a stable `name`.
- Template, aspect-ratio, and quality button collections now use labelled `role="group"` containers instead of form labels targeting ordinary `div` elements.
- The smoke suite now checks these semantic associations.

## Remaining Verification

After the updated build reaches production:

1. Open `https://video.cozyguidehub.com`.
2. Open Chrome DevTools.
3. Clear Console and Issues.
4. Refresh the page.
5. Confirm no MotionPic AI form-label issue remains.

Browser-extension warnings may remain and should be distinguished by their `content.js` source.
