import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useMemo } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useBottomToolbar } from '@27appstudio/react-native-bottom-toolbar/react-navigation';
import { NOTE, sized, VIEWER } from './showcasePhotos';

// The README screenshots: everyday app screens with the toolbar at the bottom.
//   Viewer  a full-screen photo with one item, the bin, in ink
//   Editor  a note with several items (+ on one side, edit and share on the other) in ink
// The tint (Splitify's default) is used by the screen and passed to the toolbar.
export type ShowcaseParams = { Viewer: undefined; Editor: undefined };

// Splitify's default tint: ink in light mode, cream (its inverse) in dark mode.
const SPLITIFY = { light: '#050F27', dark: '#FAF0D8' };
export const TINTS = { viewer: SPLITIFY, editor: SPLITIFY };

const PALETTE = {
  light: {
    label: '#111114',
    onTint: '#FFFFFF',
    secondary: '#6E6E73',
  },
  dark: {
    label: '#F5F5F7',
    onTint: '#050F27',
    secondary: '#98989F',
  },
};

const CHECKLIST = [
  { text: 'Wetsuit, 4/3 mm', done: true },
  { text: 'Board wax and leash', done: true },
  { text: 'Reef-safe sunscreen', done: false },
  { text: 'The good towel', done: false },
];

export function Viewer({
  navigation,
}: NativeStackScreenProps<ShowcaseParams, 'Viewer'>) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { height, width } = useWindowDimensions();
  const items = useMemo(
    () => [
      {
        id: 'delete',
        systemImage: 'trash',
        androidIcon: 'ic_delete',
        accessibilityLabel: 'Delete',
      },
    ],
    []
  );
  const options = useMemo(
    () => ({ tintColor: TINTS.viewer[scheme] }),
    [scheme]
  );
  useBottomToolbar(navigation, items, options);
  return (
    <View style={styles.viewer}>
      <StatusBar barStyle="light-content" />
      <Image
        source={{
          uri: sized(VIEWER, 1200, Math.round((1200 * height) / width)),
        }}
        style={{ height, width }}
      />
    </View>
  );
}

export function ViewerTitle() {
  return (
    <View style={styles.viewerTitle}>
      <Text style={styles.viewerDate}>3 September</Text>
      <Text style={styles.viewerPlace}>Salt flats · 19:42</Text>
    </View>
  );
}

export function Editor({
  navigation,
}: NativeStackScreenProps<ShowcaseParams, 'Editor'>) {
  const { colors } = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = PALETTE[scheme];
  const tint = TINTS.editor[scheme];
  const { width } = useWindowDimensions();
  const items = useMemo(
    () => [
      {
        id: 'add',
        systemImage: 'plus',
        androidIcon: 'ic_add',
        accessibilityLabel: 'Add',
      },
      { type: 'flexibleSpace' as const },
      {
        id: 'edit',
        systemImage: 'pencil',
        androidIcon: 'ic_edit',
        accessibilityLabel: 'Edit',
      },
      {
        id: 'share',
        systemImage: 'square.and.arrow.up',
        androidIcon: 'ic_share',
        accessibilityLabel: 'Share',
      },
    ],
    []
  );
  const options = useMemo(() => ({ tintColor: tint }), [tint]);
  useBottomToolbar(navigation, items, options);
  return (
    <ScrollView
      contentContainerStyle={styles.editor}
      contentInsetAdjustmentBehavior="automatic"
      // The native stack's own background, as iOS paints it behind the screen.
      style={{ backgroundColor: colors.background }}
    >
      <Text style={[styles.noteDate, { color: c.secondary }]}>
        18 November 2026 at 9:12
      </Text>
      <Text style={[styles.noteTitle, { color: c.label }]}>
        Surf week packing
      </Text>
      <Text style={[styles.noteBody, { color: c.label }]}>
        Five days in Ericeira, first swell of the season. Pack light, the house
        has a washing machine.
      </Text>
      <Image
        source={{ uri: sized(NOTE, 1200, 760) }}
        style={[styles.notePhoto, { height: ((width - 40) * 760) / 1200 }]}
      />
      {CHECKLIST.map((row) => (
        <View key={row.text} style={styles.checkRow}>
          <View
            style={[
              styles.checkbox,
              { borderColor: row.done ? tint : c.secondary },
              row.done && { backgroundColor: tint },
            ]}
          >
            {row.done && (
              <Text style={[styles.checkMark, { color: c.onTint }]}>✓</Text>
            )}
          </View>
          <Text
            style={[
              styles.checkText,
              { color: row.done ? c.secondary : c.label },
            ]}
          >
            {row.text}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkMark: { fontSize: 13, fontWeight: '700' },
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 9,
  },
  checkText: { fontSize: 17 },
  editor: { paddingBottom: 140, paddingHorizontal: 20, paddingTop: 4 },
  noteBody: { fontSize: 17, lineHeight: 24, marginTop: 10 },
  noteDate: { fontSize: 13, textAlign: 'center' },
  notePhoto: { borderRadius: 14, marginBottom: 14, marginTop: 18 },
  noteTitle: {
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '700' : '500',
    marginTop: 14,
  },
  viewer: { backgroundColor: '#000000', flex: 1 },
  viewerDate: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  viewerPlace: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  viewerTitle: { alignItems: 'center' },
});
