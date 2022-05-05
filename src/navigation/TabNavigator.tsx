import * as React from 'react';
import {Home} from 'screens';
import {createStackNavigator} from '@react-navigation/stack';
const Root = createStackNavigator();

export const MainNavigator = () => {
  return (
    <Root.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Root.Screen name="Home" component={Home} />
    </Root.Navigator>
  );
};
