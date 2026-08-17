# R3-WP3.1 - Rainbow Meadow and Race Hub

Status: **Complete pending CI**

## Goal

Physically connect Rainbow Run racing to the existing life-sim world before implementing race mechanics.

## Delivered

### Rainbow Meadow

- Added a full Rainbow Meadow exploration scene east of Sunbeam Village.
- The existing village meadow sign now opens the route instead of showing a future-content message.
- Players enter and leave through physical world entrances, with sensible spawn positions on each side.
- The current location is saved so **Continue** can resume directly in Rainbow Meadow.
- Existing keyboard, touch controls and collision-aware click/tap movement work in the new area.

### Rainbow Run hub

The eastern side of the meadow now contains a visible race hub with:

- a Rainbow Run paddock;
- a starting arch and clear lane through the race gate;
- race flags and hub dressing;
- a preparation tent;
- a physical ribbon board placeholder;
- a clear visual identity distinct from Sunbeam Village and Moonflower Glade.

The race entrance is deliberately non-functional beyond interaction in this package. Race movement and the dedicated race scene belong to R3-WP3.2.

### Nova

- Nova is now registered as an R3 character.
- Nova is physically present in the race hub.
- A lightweight greeting establishes her as the race-hub character without implementing her later introductory story early.

### Meadow discoveries

- Entering Rainbow Meadow records the region as a persistent discovery.
- **Prism Bloom** and **Sunshower Feather** are persistent exploration discoveries placed away from the race hub.
- Collected discoveries disappear from the world and are registered for the Wonderbook discovery model.

## Traversal and collision

- The meadow uses the existing traversal-map architecture.
- Visible pond, grove, tent, board and race-post geometry provide the collision boundaries.
- Automated traversal tests verify the village entrance, race hub, Nova and both secrets remain reachable using the standard player clearance.
- The race posts are solid while the central starting lane remains open.

## Acceptance

R3-WP3.1 acceptance is satisfied when the player can reach the Rainbow Run hub naturally from village exploration.

The implemented route is:

**Moonflower Glade → Sunbeam Village → Rainbow Meadow → Rainbow Run hub**

## Next package

**R3-WP3.2 - Race Scene and Core Movement**
