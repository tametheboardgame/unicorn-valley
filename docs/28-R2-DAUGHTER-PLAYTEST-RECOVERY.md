# R2-WP2.10B - Daughter Playtest and Recovery Pass

Status: **Complete pending merge**

## Playtest result

The first daughter playtest of the R2 vertical slice was overwhelmingly positive. The strongest overall request was not to change the core game, but to add more things to do and keep improving how the world looks.

That is useful design evidence: the unicorn life-adventure direction is working for the target player.

## Recovery items

### Click and tap movement

The target player naturally expected to click or tap a place and have the unicorn move there.

- Click/tap-to-move is now supported in the current exploration scenes.
- Navigation uses collision-aware routing rather than simply pushing into obstacles.
- A small sparkle marks the chosen destination.
- Existing keyboard controls remain available and override pointer navigation when used.

### Activity suggestion dismissal

The suggestion card previously recreated its dismissal state on each scene entry, so it returned after changing location.

- Dismissal is now shared for the current browser play session.
- **Another idea** still deliberately rotates suggestions.
- **Got it**, close and **Hide ideas for now** keep the card hidden while moving between locations.

### Unicorn creator

The creator controls lacked contrast and the HTML name field was positioned against the viewport instead of the scaled game canvas.

- Controls now sit on a high-contrast cream panel with clearer active states.
- Rows have been regrouped and spaced consistently.
- The name field is anchored to logical game coordinates and scales with the canvas, preventing it drifting over other controls.

### Wonderbook

The Wonderbook worked functionally but read visually as a generic panel.

- It is now drawn as an open illustrated book with a cover, two paper pages, centre binding, bookmark, page numbers and sticker-style discovery entries.
- Existing discovery behaviour is retained.

### Invisible wall beside the Glade bridge

The reported position matched an old `collision:east-boulder` region that had no visible boulder. A second unrendered boulder collider had the same problem elsewhere in the Glade.

- Both invisible boulder collision regions have been removed.
- Visible world objects and stream banks remain collidable.

## Design evidence carried forward

- Click/tap navigation is now part of the normal exploration control model.
- Important fantasy objects should visually resemble what they represent.
- Collision should have a visible reason.
- Visual polish should continue incrementally alongside new content.
- The strongest content signal is **more to do**, including activities, characters, secrets, rewards and reasons to revisit places.
- The positive response supports continuing into R3 rather than revisiting the core game concept.

## Next package

After this recovery pass, the planned next package is **R3-WP3.1 - Rainbow Meadow and Race Hub**.
