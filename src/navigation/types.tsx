import type {AuthStackParamList} from './AuthNavigator';
import type {MainStackParamList} from './TabNavigator';

export type RootStackParamList = AuthStackParamList & MainStackParamList;

// export type RootStackParamList = AuthStackParamList & XXXStackParamList  &  YYYStackParamList  ;

// very important to type check useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
