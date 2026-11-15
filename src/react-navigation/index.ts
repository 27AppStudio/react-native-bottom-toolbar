import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ToolbarItem, ToolbarOptions } from '../types';

import { useEffect, useRef } from 'react';

import { hide, show } from '../index';

/**
 * Shows `items` in the native bottom toolbar while this screen is on top of a
 * native stack (`@react-navigation/native-stack`: the JS stack has no
 * UINavigationController for iOS to put it in).
 *
 * The toolbar belongs to the whole stack: it is shown once the push has landed
 * (`transitionEnd`), or at once on the stack's first screen; again on
 * returning from a modal (`focus`); and hidden on `blur`. While the screen is
 * on top, new `items` or `options` update the toolbar (an empty array hides
 * it), so memoize them (`useMemo`): a new array on every render would send it
 * to the native side every time.
 */
export function useBottomToolbar(
  navigation: NativeStackNavigationProp<ParamListBase>,
  items: ToolbarItem[],
  options?: ToolbarOptions
) {
  const latest = useRef({ items, options });
  latest.current = { items, options };
  // Whether the push has landed, so `show` reaches this screen and not the one
  // below; and what was last sent, so an update only goes out when it changed.
  const arrived = useRef(false);
  const shown = useRef<
    { items: ToolbarItem[]; options?: ToolbarOptions } | undefined
  >(undefined);

  useEffect(() => {
    // Back from a pop, both focus and transitionEnd show: the latter comes after
    // the popped screen's unmount, whose `hide` would otherwise win.
    const showLatest = () => {
      shown.current = latest.current;
      show(latest.current.items, latest.current.options);
    };
    // A pushed screen mounts before its push starts, so showing now would put
    // the items on the screen below; the first screen has no push to wait for.
    arrived.current =
      navigation.isFocused() && navigation.getState().index === 0;
    if (arrived.current) {
      showLatest();
    }

    const offTransitionEnd = navigation.addListener(
      'transitionEnd',
      (event) => {
        if (!event.data.closing) {
          arrived.current = true;
          showLatest();
        }
      }
    );
    const offFocus = navigation.addListener('focus', () => {
      if (arrived.current) {
        showLatest();
      }
    });
    const offBlur = navigation.addListener('blur', hide);

    return () => {
      offTransitionEnd();
      offFocus();
      offBlur();
      hide();
    };
  }, [navigation]);

  // New items or options on a screen whose toolbar is up: update it in place.
  useEffect(() => {
    const last = shown.current;
    if (
      !arrived.current ||
      !navigation.isFocused() ||
      (last && last.items === items && last.options === options)
    ) {
      return;
    }
    shown.current = { items, options };
    show(items, options);
  }, [items, navigation, options]);
}
