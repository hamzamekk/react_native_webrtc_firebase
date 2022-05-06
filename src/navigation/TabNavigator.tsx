import * as React from 'react';
import {Home, CreateCall} from 'screens';
import {createStackNavigator} from '@react-navigation/stack';
const Main = createStackNavigator();

export type MainStackParamList = {
  Home: undefined;
  CreateCall: {callId: string; calling: boolean};
};

export const MainNavigator = () => {
  return (
    <Main.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Main.Screen name="Home" component={Home} />
      <Main.Screen name="CreateCall" component={CreateCall} />
    </Main.Navigator>
  );
};
