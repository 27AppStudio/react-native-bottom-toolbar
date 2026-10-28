import type { CodegenTypes, TurboModule } from 'react-native';

import { TurboModuleRegistry } from 'react-native';

type NativeToolbarItem = {
  accessibilityLabel?: string;
  /** Android: the name of a drawable resource, e.g. `ic_delete`. */
  androidIcon?: string;
  disabled?: boolean;
  /** A button's; reported back through `onItemPress` when it is tapped. */
  id?: string;
  /** iOS: an SF Symbol name, e.g. `trash`. */
  systemImage?: string;
  title?: string;
  /** `button`, `flexibleSpace` or `fixedSpace`. */
  type: string;
  /** A fixed space's width in points; the system's when left out. */
  width?: CodegenTypes.Double;
};

type NativeToolbarOptions = {
  /** A `processColor` value; left out for the platform's own. */
  tintColor?: number;
};

export interface Spec extends TurboModule {
  hide(): void;
  readonly onItemPress: CodegenTypes.EventEmitter<string>;
  show(items: NativeToolbarItem[], options: NativeToolbarOptions): void;
}

export default TurboModuleRegistry.get<Spec>('BottomToolbar');
