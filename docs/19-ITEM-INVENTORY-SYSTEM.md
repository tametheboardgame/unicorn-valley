# Item and Inventory System

## Purpose

R2-WP2.2 provides one reusable inventory system for collectables, quest objects, rewards, decorations, accessories and food. Scene code does not edit raw inventory save fields directly.

## Item definitions

Items retain stable `item:` IDs and can now declare:

- category;
- short description;
- icon;
- discovery link;
- quest-critical protection.

Legacy R0 placeholder definitions remain valid and receive child-friendly presentation fallbacks when shown in the bag.

The first R2 definitions reserve a quest Moonflower, a bakery item and a cottage decoration for later packages.

## Inventory service

`InventoryService` owns quantity operations over the existing versioned save model.

It supports:

- querying quantities;
- checking whether a quantity is owned;
- adding item stacks;
- safely removing quantities;
- listing owned items with their definitions.

All operations validate item IDs through the content registry. Quantities must be positive integers. Removing more than the owned amount fails without changing the save.

Quest-critical items cannot be removed through the ordinary removal path. A quest system must opt in explicitly when consuming one.

## My Bag UI

`InventoryScene` is a read-only first bag view. It shows up to six current stacks using reusable `ItemCard` components with icon, name, category, description and quantity.

Exploration scenes that use the shared `InteractionPrompt` now expose a persistent `Bag` button. Opening the bag pauses the current exploration scene; closing it resumes the same location.

## Validation

Automated tests prove:

- quantities accumulate and survive a fresh `SaveService` instance;
- stack removal and zero-stack cleanup work;
- insufficient removal does not mutate inventory;
- quest-critical protection is enforced;
- explicit quest consumption can override that protection;
- invalid item IDs and invalid quantities are rejected;
- legacy item definitions receive stable presentation fallbacks.
