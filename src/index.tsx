import type { ToolbarButton, ToolbarItem, ToolbarOptions } from './types';

import { useEffect, useState } from 'react';
import { processColor, useWindowDimensions } from 'react-native';

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
 *
 * Without any button (an empty array, or spacers only) it hides the toolbar, as
 * `hide` does: on iOS an empty bar would still take the bottom band's touches and
 * add its height to the scroll views' insets.
 */
export function show(items: ToolbarItem[], options: ToolbarOptions = {}) {
  if (!NativeBottomToolbar) {
    return;
  }
  if (!items.some(isButton)) {
    hide();
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
  // Once the bar has slid in (and any push has landed), its band is final.
  setTimeout(refreshHeight, SETTLE_MS);
}

/** Longer than UIKit's toolbar and push animations. */
const SETTLE_MS = 600;

/** Hides the toolbar. */
export function hide() {
  buttons = [];
  NativeBottomToolbar?.hide();
}

/**
 * The room the toolbar takes at the bottom of the screen, in points: on iOS the
 * band it adds over the content above the bottom safe area (so not the home
 * indicator; 0 where the bar doesn't sit under the content, e.g. a foldable's side
 * column), on Android above the navigation bar. While hidden, the size it last
 * took, so a list can keep that much room under its last row without jumping when
 * the toolbar comes and goes. 0 without the native module.
 */
export function getHeight(): Promise<number> {
  return NativeBottomToolbar?.getHeight() ?? Promise.resolve(0);
}

let lastHeight = 0;
const heightListeners = new Set<(height: number) => void>();

/** Measures the band again and tells `useBottomToolbarHeight` users if it changed. */
function refreshHeight() {
  getHeight().then((height) => {
    if (height !== lastHeight) {
      lastHeight = height;
      heightListeners.forEach((listener) => listener(height));
    }
  });
}

/**
 * `getHeight`, kept up to date: measured again once a `show` has settled (the band
 * is only exact once the bar is on screen) and when the window changes size (a
 * rotation, a foldable opening). 0 until the first answer.
 */
export function useBottomToolbarHeight(): number {
  const [height, setHeight] = useState(lastHeight);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  useEffect(() => {
    heightListeners.add(setHeight);
    return () => {
      heightListeners.delete(setHeight);
    };
  }, []);
  useEffect(() => {
    refreshHeight();
  }, [windowHeight, windowWidth]);
  return height;
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
