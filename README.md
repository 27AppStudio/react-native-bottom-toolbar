# @27appstudio/react-native-bottom-toolbar

The platform's own bottom toolbar for React Native screens:

- **iOS**: UIKit's navigation-controller toolbar, so you get what the system draws. On iOS 26 that's Liquid Glass (a lone item becomes a glass circle, like the bin in Photos), and earlier versions get the classic toolbar. Your app follows each iOS redesign without changes.
- **Android**: Material 3 components. One button shows as a FAB; two or more show as the M3 Expressive floating toolbar. Both sit above the navigation bar.

| | iOS 26 | iOS 18 | Android |
|---|---|---|---|
| Several items | <img src="docs/images/ios26-several.png" width="220" alt="iOS 26: a glass plus button on the left, pencil and share grouped in a glass capsule on the right"> | <img src="docs/images/ios18-several.png" width="220" alt="iOS 18: plus on the left, pencil and share on the right of the classic toolbar"> | <img src="docs/images/android-several.png" width="220" alt="Android: plus, pencil and share in a Material 3 floating toolbar"> |
| One item, red `tintColor` | <img src="docs/images/ios26-single.png" width="220" alt="iOS 26: a red bin in a glass circle"> | <img src="docs/images/ios18-single.png" width="220" alt="iOS 18: a red bin at the trailing edge of the toolbar"> | <img src="docs/images/android-single.png" width="220" alt="Android: a Material 3 FAB with a red bin icon"> |

It's a TurboModule with no views of its own in JS, no Expo modules, and no config plugin.

Made by [27AppStudio](https://github.com/27AppStudio) and used in production in [Splitify](https://splitify.cc).

## When to use something else

- **Expo Router**: use [`Stack.Toolbar`](https://docs.expo.dev/router/advanced/stack-toolbar/), which does the iOS side natively.
- **react-native-screens v5**: a per-screen `ios.toolbarItems` option is proposed in [#4690](https://github.com/software-mansion/react-native-screens/pull/4690). Once it ships in a stable release, prefer it for iOS.

This library fills the gap for React Navigation's `native-stack` on react-native-screens v4, and is the only one of the three with an Android side.

## Installation

```sh
npm install @27appstudio/react-native-bottom-toolbar
cd ios && pod install
```

Requirements:

- React Native 0.82+ with the New Architecture
- **iOS**: the screen must be in a native stack (`@react-navigation/native-stack` or another UINavigationController); the JS stack has none.
- **Android**: nothing more. The library ships `com.google.android.material:material` 1.13. Material 3 apps use their own theme colors; AppCompat apps get the default Material 3 DayNight palette.
- **Expo**: works in development builds, not in Expo Go.

## Usage

### With React Navigation

```tsx
import { useBottomToolbar } from '@27appstudio/react-native-bottom-toolbar/react-navigation';

function ExpenseScreen({ navigation }: NativeStackScreenProps<Params, 'Expense'>) {
  useBottomToolbar(navigation, [
    {
      id: 'delete',
      systemImage: 'trash', // SF Symbol (iOS)
      androidIcon: 'ic_delete', // drawable resource (Android)
      accessibilityLabel: 'Delete',
      onPress: confirmDelete,
    },
  ]);
  // ...
}
```

The hook shows the toolbar once the push has landed (or right away on the stack's first screen), hides it when the screen loses focus, and brings it back when a modal over the screen closes.

### Without React Navigation

```ts
import { show, hide } from '@27appstudio/react-native-bottom-toolbar';

show(
  [
    { id: 'add', systemImage: 'plus', androidIcon: 'ic_add', onPress: add },
    { type: 'flexibleSpace' },
    { id: 'share', systemImage: 'square.and.arrow.up', androidIcon: 'ic_share', onPress: share },
  ],
  { tintColor: '#0A7D6E' }
);

hide();
```

On iOS, `show` targets the visible navigation controller's top screen, and waits for a running push or pop to finish first.

## API

### `show(items, options?)`

Replaces the items of any toolbar already shown.

| Item | Fields |
|---|---|
| Button (default) | `id` (required), `onPress`, `systemImage` (iOS SF Symbol), `androidIcon` (drawable name), `title` (used when there's no icon), `accessibilityLabel` (defaults to `title`), `disabled` |
| `{ type: 'flexibleSpace' }` | iOS: pushes the items apart. Android: ignored. |
| `{ type: 'fixedSpace', width? }` | iOS: a fixed gap; on iOS 26 it also splits glass groups. Android: ignored. |

When `items` contains no space, iOS puts the buttons at the trailing edge.

`options.tintColor` sets the icon and title color. iOS defaults to the navigation bar's tint (matching the header buttons); Android defaults to the Material 3 theme.

### `hide()`

### `addPressListener(listener: (id: string) => void): () => void`

Called for every button tap, in addition to that button's own `onPress`.

### `isAvailable: boolean`

`false` where the native module is missing (web, Expo Go). There, `show` and `hide` do nothing.

### `useBottomToolbar(navigation, items, options?)`

Imported from `/react-navigation`. `items` and `options` are read each time the toolbar is shown, so passing a new array doesn't resubscribe. To change a toolbar that's already on screen, call `show` again.

## Platform notes

- **iOS content insets**: UIKit adds the toolbar to the screen's safe area, so a `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` scrolls clear of it.
- **Android content insets**: the FAB and toolbar float over your content. Leave about 88dp of bottom padding in scrolling content so the last row isn't covered.
- **Android icons**: add vector drawables to `android/app/src/main/res/drawable`. A button without a drawable shows its `title` as text in the toolbar; a FAB needs an icon.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
