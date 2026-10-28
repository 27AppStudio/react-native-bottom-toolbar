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
 * returning from a modal (`focus`); and hidden on `blur`. `items` and
 * `options` are read at show time, so a new array (a language change) needs
 * no resubscribe; call `show` to update a toolbar already on screen.
 */
export function useBottomToolbar(
  navigation: NativeStackNavigationProp<ParamListBase>,
  items: ToolbarItem[],
  options?: ToolbarOptions
) {
  const latest = useRef({ items, options });
  latest.current = { items, options };

  useEffect(() => {
    // Back from a pop, both focus and transitionEnd show: the latter comes after
    // the popped screen's unmount, whose `hide` would otherwise win.
    const showLatest = () => show(latest.current.items, latest.current.options);
    // A pushed screen mounts before its push starts, so showing now would put
    // the items on the screen below; the first screen has no push to wait for.
    let arrived = navigation.isFocused() && navigation.getState().index === 0;
    if (arrived) {
      showLatest();
    }

    const offTransitionEnd = navigation.addListener(
      'transitionEnd',
      (event) => {
        if (!event.data.closing) {
          arrived = true;
          showLatest();
        }
      }
    );
    const offFocus = navigation.addListener('focus', () => {
      if (arrived) {
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
}
