export function resolvePressedButtonActions<Action extends string, Key>(
  bindings: Record<Action, readonly Key[]>,
  pressedKeys: ReadonlySet<Key>,
): Set<Action> {
  const actions = new Set<Action>();

  for (const action of Object.keys(bindings) as Action[]) {
    if (bindings[action].some((key) => pressedKeys.has(key))) {
      actions.add(action);
    }
  }

  return actions;
}
