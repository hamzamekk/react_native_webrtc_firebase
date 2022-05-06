import React, {useState} from 'react';
import {Image, StyleSheet} from 'react-native';
import {MediaStream, RTCView} from 'react-native-webrtc';
import {View, Text, Pressable} from 'ui';
import {
  audio_Speaker,
  mute,
  no_video,
  power_on,
  rotate,
  video_camera,
} from 'ui/images';

type Props = {
  localStream: MediaStream;
  remoteStream: MediaStream;
  cameraSwitched: boolean;
  cameraTrigged: boolean;
  soundTrigged: boolean;
  onCallDown: () => void;
  switchCamera: (state: boolean) => void;
  triggerCamera: (state: boolean) => void;
  triggerSound: (state: boolean) => void;
};

export const VideoScreen = ({
  localStream,
  remoteStream,
  cameraSwitched,
  cameraTrigged,
  soundTrigged,
  switchCamera,
  triggerCamera,
  triggerSound,
  onCallDown,
}: Props) => {
  const [switchView, setSwitchView] = useState(false);

  return (
    <View flex={1}>
      {!localStream && !remoteStream && (
        <RTCView
          style={{flex: 1}}
          streamURL={localStream && localStream.toURL()}
          mirror
          objectFit={'cover'}
        />
      )}

      {localStream && !remoteStream && (
        <>
          <RTCView
            style={{flex: 1}}
            streamURL={switchView ? localStream.toURL() : localStream.toURL()}
            mirror
            objectFit={'cover'}
          />
          <Pressable
            onPress={() => setSwitchView(!switchView)}
            position={'absolute'}
            top={10}
            right={10}
            height={150}
            width={100}
            // borderRadius={10}
            borderColor={'red'}
            borderWidth={1}>
            <RTCView
              style={{flex: 1, borderRadius: 100}}
              streamURL={
                !switchView ? localStream.toURL() : localStream.toURL()
              }
              mirror
              objectFit={'cover'}
            />
          </Pressable>
        </>
      )}
      <View
        flexDirection={'row'}
        position={'absolute'}
        bottom={10}
        left={0}
        right={0}
        justifyContent={'space-evenly'}>
        <Pressable
          onPress={() => switchCamera(!cameraSwitched)}
          bg={!cameraSwitched ? 'white' : 'grey2'}
          borderWidth={1}
          borderColor={'grey2'}
          width={40}
          height={40}
          justifyContent={'center'}
          alignItems={'center'}
          borderRadius={20}>
          <Image source={rotate} style={styles.icon} />
        </Pressable>
        <Pressable
          onPress={() => triggerCamera(!cameraTrigged)}
          bg={!cameraTrigged ? 'white' : 'grey2'}
          borderWidth={1}
          borderColor={'grey2'}
          width={40}
          height={40}
          justifyContent={'center'}
          alignItems={'center'}
          borderRadius={20}>
          {cameraTrigged ? (
            <Image source={no_video} style={styles.icon} />
          ) : (
            <Image source={video_camera} style={styles.icon} />
          )}
        </Pressable>
        <Pressable
          onPress={() => triggerSound(!soundTrigged)}
          bg={!soundTrigged ? 'white' : 'grey2'}
          borderWidth={1}
          borderColor={'grey2'}
          width={40}
          height={40}
          justifyContent={'center'}
          alignItems={'center'}
          borderRadius={20}>
          {soundTrigged ? (
            <Image source={mute} style={styles.icon} />
          ) : (
            <Image source={audio_Speaker} style={styles.icon} />
          )}
        </Pressable>
        <Pressable
          onPress={onCallDown}
          bg={'red'}
          width={40}
          height={40}
          justifyContent={'center'}
          alignItems={'center'}
          borderRadius={20}>
          <Image source={power_on} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    height: 25,
    width: 25,
  },
});
