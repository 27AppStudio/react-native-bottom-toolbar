import type { ToolbarButton, ToolbarItem, ToolbarOptions } from './types';

import { processColor } from 'react-native';

import NativeBottomToolbar from './NativeBottomToolbar';

export type {
  ToolbarButton,
  ToolbarItem,
  ToolbarOptions,
  ToolbarSpace,
} from './types';

/** False where the native module is missing: web, Expo Go, an unlinked build. */
export const isAvailable = NativeBottomToolbar != null;

let buttons: ToolbarButton[] = [];

/**
 * Shows the native bottom toolbar with `items`, replacing any shown before.
 *
 * - iOS: UIKit's own toolbar on the visible navigation controller (so the
 *   screen must be in a native stack). Without spacers the items sit at the
 *   trailing edge; on iOS 26 a lone item is drawn as a glass circle, as in
 *   Photos. Waits for a running push or pop, so the items land on the screen
 *   on top.
 * - Android: a Material 3 FAB for one button, a floating toolbar for more,
 *   above the navigation bar. Spacers are ignored.
 */
export function show(items: ToolbarItem[], options: ToolbarOptions = {}) {
  if (!NativeBottomToolbar) {
    return;
  }
  buttons = items.filter(isButton);
  const tintColor = processColor(options.tintColor);
  NativeBottomToolbar.show(
    items.map((item) =>
      isButton(item)
        ? {
            ...item,
            accessibilityLabel: item.accessibilityLabel ?? item.title,
            onPress: undefined,
            type: 'button',
          }
        : item
    ),
    typeof tintColor === 'number' ? { tintColor } : {}
  );
}

/** Hides the toolbar. */
export function hide() {
  buttons = [];
  NativeBottomToolbar?.hide();
}

/**
 * Calls `listener` with the id of each tapped button, in addition to that
 * button's own `onPress`. Returns the unsubscribe function.
 */
export function addPressListener(listener: (id: string) => void) {
  const subscription = NativeBottomToolbar?.onItemPress(listener);
  return () => subscription?.remove();
}

function isButton(item: ToolbarItem): item is ToolbarButton {
  return item.type === undefined || item.type === 'button';
}

NativeBottomToolbar?.onItemPress((id) =>
  buttons.find((button) => button.id === id)?.onPress?.()
);
