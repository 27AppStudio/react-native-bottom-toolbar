import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useBottomToolbar } from '@27appstudio/react-native-bottom-toolbar/react-navigation';

type StackParamList = {
  Detail: { title: string };
  Home: undefined;
  Modal: undefined;
};

const Stack = createNativeStackNavigator<StackParamList>();

function Home({ navigation }: NativeStackScreenProps<StackParamList, 'Home'>) {
  const [log, setLog] = useState('Tap a toolbar item');

  useBottomToolbar(navigation, [
    {
      id: 'add',
      systemImage: 'plus',
      androidIcon: 'ic_add',
      accessibilityLabel: 'Add',
      onPress: () => setLog('Add'),
    },
    { type: 'flexibleSpace' },
    {
      id: 'edit',
      systemImage: 'pencil',
      androidIcon: 'ic_edit',
      accessibilityLabel: 'Edit',
      onPress: () => setLog('Edit'),
    },
    {
      id: 'share',
      systemImage: 'square.and.arrow.up',
      androidIcon: 'ic_share',
      accessibilityLabel: 'Share',
      onPress: () => setLog('Share'),
    },
  ]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.log} testID="log">
        {log}
      </Text>
      <Button
        title="Push a detail screen"
        onPress={() => navigation.push('Detail', { title: 'Detail' })}
      />
      <Button
        title="Open a modal"
        onPress={() => navigation.navigate('Modal')}
      />
    </ScrollView>
  );
}

function Detail({
  navigation,
}: NativeStackScreenProps<StackParamList, 'Detail'>) {
  const [log, setLog] = useState(
    'One item: a glass circle on iOS 26, a FAB on Android'
  );

  useBottomToolbar(
    navigation,
    [
      {
        id: 'delete',
        systemImage: 'trash',
        androidIcon: 'ic_delete',
        accessibilityLabel: 'Delete',
        onPress: () => setLog('Delete'),
      },
    ],
    { tintColor: '#D32F2F' }
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.log} testID="log">
        {log}
      </Text>
      <Button
        title="Push another"
        onPress={() => navigation.push('Detail', { title: 'Another' })}
      />
      <Button
        title="Open a modal"
        onPress={() => navigation.navigate('Modal')}
      />
    </ScrollView>
  );
}

function Modal({
  navigation,
}: NativeStackScreenProps<StackParamList, 'Modal'>) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.log}>No toolbar here; closing brings it back.</Text>
      <Button title="Close" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ title: 'Bottom toolbar' }}
        />
        <Stack.Screen
          name="Detail"
          component={Detail}
          options={({ route }) => ({ title: route.params.title })}
        />
        <Stack.Screen
          name="Modal"
          component={Modal}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  log: { fontSize: 17, margin: 16 },
});
