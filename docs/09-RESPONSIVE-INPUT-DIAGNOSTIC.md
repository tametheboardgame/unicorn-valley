# Responsive Canvas and Input Diagnostic

R0-WP0.5 keeps gameplay input independent from raw keyboard codes and keeps the game world at a fixed 1280 × 720 logical resolution.

## Manual diagnostic

1. Run `npm run dev`.
2. Open the local game URL with `?scene=resize-test` appended.
3. Resize the browser through wide, tall and small window shapes.
4. Confirm the contained canvas dimensions remain 16:9 and the pink safe-UI outline remains inside the logical world.
5. Press Escape to return to the title screen.
6. On the title screen, press Enter, Space or E, or tap/click the Coming Soon button.
7. Confirm each method produces the same interaction acknowledgement.

The scenes consume `INTERACT` and `BACK` actions. Raw key codes live only in `KeyboardInputAdapter`; future touch controls can drive the same actions through `PointerTouchInputAdapter`.
