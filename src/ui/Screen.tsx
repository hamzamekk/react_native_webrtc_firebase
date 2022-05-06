import React from 'react';
import {View} from './View';
import {SafeAreaView} from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
};

export const Screen = ({children}: Props) => (
  <View flexDirection="column" flex={1} bg="background">
    <SafeAreaView style={{flex: 1}} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  </View>
);
