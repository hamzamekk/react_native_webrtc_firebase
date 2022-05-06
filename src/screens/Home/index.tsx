import React, {useState} from 'react';
import {View, Text, Pressable, Screen, Button} from 'ui';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, TextInput} from 'react-native';

export const Home = () => {
  const {navigate} = useNavigation();

  const [callId, setCallId] = useState('');

  return (
    <Screen>
      <View
        borderWidth={1}
        width={'90%'}
        alignSelf={'center'}
        my={'m'}
        borderRadius={10}>
        <TextInput
          placeholder="place a call id"
          style={styles.input}
          onChangeText={setCallId}
        />
      </View>

      <Button
        disabled={!callId}
        label="Start a call"
        onPress={() => navigate('CreateCall', {callId})}
        marginHorizontal={'xl'}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  input: {
    fontFamily: 'Inter',
    fontSize: 20,
  },
});
