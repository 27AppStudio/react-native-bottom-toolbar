import type { ColorValue } from 'react-native';

export type ToolbarButton = {
  /** Read by VoiceOver / TalkBack; defaults to `title`. */
  accessibilityLabel?: string;
  /** Android: the name of a drawable resource, e.g. `ic_delete`. */
  androidIcon?: string;
  disabled?: boolean;
  /** Unique among the items; passed to `onPress` listeners. */
  id: string;
  onPress?: () => void;
  /** iOS: an SF Symbol name, e.g. `trash`. */
  systemImage?: string;
  /** Shown when the platform has no icon for the item. */
  title?: string;
  type?: 'button';
};

export type ToolbarSpace =
  | { type: 'flexibleSpace' }
  /** `width` in points; the system's own when left out. */
  | { type: 'fixedSpace'; width?: number };

export type ToolbarItem = ToolbarButton | ToolbarSpace;

export type ToolbarOptions = {
  /**
   * Icon and title color. iOS defaults to the navigation bar's tint (as the
   * header's own buttons), Android to the Material 3 theme.
   */
  tintColor?: ColorValue;
};
