# WP18K visual-preservation review index

Candidate implementation: `d7cf5f46949e1aec35c994dc00915fe223595305`.

## Current candidate

`wp18k-current-head/geometry.json` records each viewport, canvas, logical-to-CSS
scale, named logical rectangle, calculated rendered CSS rectangle and any DOM
modal companion/action rectangles. The captures use normal HUD entry after the
scene lifecycle settles.

For each of desktop, tablet landscape, phone landscape and phone portrait,
review:

- `*-hud.png`;
- `*-settings.png` and `*-settings-scrolled.png`;
- `*-bag-empty.png` and `*-bag-populated.png`;
- `*-map-before-drag.png` and `*-map-after-drag.png`; and
- `*-book.png`.

Phone portrait additionally has `phone-portrait-book-controls.png`, showing the
scrollable companion's real All adventures, Secrets and cross-only close
controls together.

The Book filter labels remain readable because `ModalConceptPresentationManager`
no longer converts their transparent pointer rectangles into bright surfaces.
The canvas Book close is now the accepted top-right cross over an invisible
82 × 70 logical-pixel target; the old bottom “Close the book” button is absent.

## Evidence-backed inherited phone limitation

`wp18k-baseline-d8f3de6/` captures the accepted pre-consolidation production
baseline through the same normal HUD entry route. Its phone-portrait Bag and
Settings have the same 390 × 219.375 CSS-pixel canvas at the top and no DOM
companion. Therefore WP18K did not remove a Bag/Settings companion or introduce
that canvas scaling.

At 390 × 844, the current Bag category is 60 logical pixels but 18.28125 CSS
pixels high; its 82 × 70 close target is 24.984375 × 21.328125 CSS pixels. The
baseline values were 13.820625 CSS pixels for the category and the same
24.984375 × 21.328125 CSS pixels for close. The current Settings 64-logical-pixel
row is 19.5 CSS pixels high, compared with 17.671875 CSS pixels at baseline.
Neither result proves child-sized phone touch acceptance, and Bag/Settings have
no DOM companion in either capture. This inherited all-modal phone consistency
work belongs to approved WP19F; broad modal redesign is deliberately not folded
into behaviour-preserving WP18K. Delegated manager disposition remains required.

Wonderbook is different: its existing phone companion survives and exposes
58–63.28125 CSS-pixel actions, including real filters and cross close. That is
recorded under `domCompanions` in the current geometry index.
