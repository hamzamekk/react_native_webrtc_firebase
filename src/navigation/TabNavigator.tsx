import * as React from 'react';
import {Home, CreateCall, JoinCall} from 'screens';
import {createStackNavigator} from '@react-navigation/stack';
const Main = createStackNavigator();

export type MainStackParamList = {
  Home: undefined;
  CreateCall: {callId: string; calling: boolean};
  JoinCall: {callId: string};
};

export const MainNavigator = () => {
  return (
    <Main.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={'Home'}>
      <Main.Screen name="Home" component={Home} />
      <Main.Screen name="CreateCall" component={CreateCall} />
      <Main.Screen name="JoinCall" component={JoinCall} />
    </Main.Navigator>
  );
};
