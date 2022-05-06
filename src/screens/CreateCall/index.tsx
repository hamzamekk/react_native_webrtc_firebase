// import {configuration, init} from 'core';
// import React, {useEffect, useState} from 'react';
// import {View, Text, Screen, Pressable, Button} from 'ui';
// import {
//   RTCIceCandidate,
//   RTCPeerConnection,
//   RTCSessionDescription,
//   RTCView,
// } from 'react-native-webrtc';
// import firestore from '@react-native-firebase/firestore';
// import InCallManager from 'react-native-incall-manager';
// import {DeviceEventEmitter, PermissionsAndroid, Platform} from 'react-native';

// export const CreateCall = () => {
//   const [localStream, setLocalStream] = useState();
//   const [remoteStream, setRemoteStream] = useState();
//   const [cashedLocalPc, setCachedLocalPC] = useState();

//   useEffect(() => {
//     initLocalStream();
//   }, []);

//   useEffect(() => {
//     DeviceEventEmitter.addListener('Proximity', function (data) {
//       // --- do something with events
//       console.log(data);
//     });
//   }, []);

//   async function initLocalStream() {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//           {
//             title: 'Cool Photo App Camera Permission',
//             message:
//               'Cool Photo App needs access to your camera ' +
//               'so you can take awesome pictures.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           },
//         );
//         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//           const stream = await init();
//           setLocalStream(stream);
//         } else {
//           console.log('Camera permission denied');
//         }
//       } catch (err) {
//         console.warn(err);
//       }
//     } else {
//       const stream = await init();
//       setLocalStream(stream);
//     }
//   }

//   const startCall = async id => {
//     const localPC = new RTCPeerConnection(configuration);
//     localPC.addStream(localStream);

//     const roomRef = await firestore().collection('rooms').doc(id);
//     const callerCandidatesCollection = roomRef.collection('callerCandidates');
//     localPC.onicecandidate = e => {
//       if (e.candidate) {
//         InCallManager.start({media: 'audio', ringback: '_BUNDLE_'}); // or _DEFAULT_ or _DTMF_
//         InCallManager.setSpeakerphoneOn(true);
//         callerCandidatesCollection.add(e.candidate.toJSON());
//       }
//     };

//     localPC.onaddstream = e => {
//       if (e.stream && remoteStream !== e.stream) {
//         console.log('RemotePC received the stream call', e.stream);
//         setRemoteStream(e.stream);
//         // InCallManager.stop({busytone: '_DTMF_'}); // or _BUNDLE_ or _DEFAULT_
//         InCallManager.stopRingback();
//       }
//     };

//     const offer = await localPC.createOffer();
//     await localPC.setLocalDescription(offer);

//     const roomWithOffer = {offer};
//     await roomRef.set(roomWithOffer);

//     roomRef.onSnapshot(async snapshot => {
//       const data = snapshot.data();
//       if (!localPC.currentRemoteDescription && data.answer) {
//         const rtcSessionDescription = new RTCSessionDescription(data.answer);
//         await localPC.setRemoteDescription(rtcSessionDescription);
//       }
//     });

//     roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
//       snapshot.docChanges().forEach(async change => {
//         if (change.type === 'added') {
//           let data = change.doc.data();
//           await localPC.addIceCandidate(new RTCIceCandidate(data));
//         }
//       });
//     });

//     setCachedLocalPC(localPC);
//   };

//   const joinCall = async id => {
//     const roomRef = await firestore().collection('rooms').doc(id);
//     const roomSnapshot = await roomRef.get();

//     if (!roomSnapshot.exists) {
//       return;
//     }
//     const localPC = new RTCPeerConnection(configuration);
//     localPC.addStream(localStream);

//     const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
//     localPC.onicecandidate = e => {
//       if (e.candidate) {
//         InCallManager.setSpeakerphoneOn(true);
//         calleeCandidatesCollection.add(e.candidate.toJSON());
//       }
//     };

//     localPC.onaddstream = e => {
//       if (e.stream && remoteStream !== e.stream) {
//         console.log('RemotePC received the stream join', e.stream);
//         setRemoteStream(e.stream);
//       }
//     };

//     const offer = roomSnapshot.data().offer;

//     if (offer) {
//       await localPC.setRemoteDescription(new RTCSessionDescription(offer));
//     }

//     const answer = await localPC.createAnswer();
//     await localPC.setLocalDescription(answer);

//     const roomWithAnswer = {answer};
//     await roomRef.update(roomWithAnswer);

//     roomRef.collection('callerCandidates').onSnapshot(snapshot => {
//       snapshot.docChanges().forEach(async change => {
//         if (change.type === 'added') {
//           let data = change.doc.data();
//           await localPC.addIceCandidate(new RTCIceCandidate(data));
//         }
//       });
//     });

//     setCachedLocalPC(localPC);
//   };

//   const switchCamera = () => {
//     InCallManager.setFlashOn(true, 10);
//     localStream.getVideoTracks().forEach(track => {
//       track._switchCamera();
//     });
//   };

//   return (
//     <Screen>
//       <View
//         flexDirection={'row'}
//         bg={'background'}
//         alignItems={'center'}
//         justifyContent={'space-between'}>
//         <Button onPress={() => startCall('aspirin')} label={'Start'} />

//         <Button onPress={switchCamera} label={'SWITCH CAMERA'} />

//         <Button onPress={() => joinCall('aspirin')} label={'join'} />
//       </View>
//       {localStream && (
//         <RTCView
//           streamURL={localStream.toURL()}
//           style={{flex: 1}}
//           objectFit={'cover'}
//         />
//       )}

//       {remoteStream && (
//         <RTCView
//           streamURL={remoteStream.toURL()}
//           style={{flex: 1}}
//           objectFit={'cover'}
//         />
//       )}
//     </Screen>
//   );
// };

import {init} from 'core';
import React, {useEffect, useState} from 'react';
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {Screen, View, Text, VideoScreen} from 'ui';
import firestore from '@react-native-firebase/firestore';
import {RouteProp, useRoute} from '@react-navigation/native';
import {MainStackParamList} from 'navigation/TabNavigator';
import {
  Alert,
  DeviceEventEmitter,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import InCallManager from 'react-native-incall-manager';

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
  offerExtmapAllowMixed: true,
};

export const CreateCall = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cashedLocalPc, setCachedLocalPC] = useState();

  const {params} = useRoute<RouteProp<MainStackParamList, 'CreateCall'>>();

  useEffect(() => {
    // async () => {
    // startCall();

    setTimeout(async () => {
      if (params.calling) {
        startCall();
        console.log('start');
      } else {
        joinCall();
        console.log('join');
      }
    }, 1000);

    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    DeviceEventEmitter.addListener('Proximity', function (data) {
      // --- do something with events
      console.log(data);
    });
  }, []);

  const initLocalStream = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Cool Photo App Camera Permission',
          message:
            'Cool Photo App needs access to your camera ' +
            'so you can take awesome pictures.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      console.log(granted);

      if (granted === 'granted') {
        const stream = await init();
        return stream;
      }
    } else {
      const stream = await init();
      return stream;
    }
  };

  const initializePeer = async (user: string) => {
    const localS = await initLocalStream();

    const localPC = new RTCPeerConnection(configuration);
    localPC.addStream(localS);
    setLocalStream(localS);

    const roomRef = await firestore().collection('calls').doc(params.callId);

    const collection = roomRef.collection(user);

    const isRoomExisted = (await roomRef.get()).exists;

    if (!isRoomExisted && user === 'callee') {
      return;
    }

    localPC.onicecandidate = e => {
      if (!e.candidate) {
        console.log('Got final candidate!');
        return;
      }
      collection.add(e.candidate.toJSON());
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setSpeakerphoneOn(true);
    };

    localPC.onsignalingstatechange = async event => {
      // when the signal state become stable record the data and stop ringback

      if (event.target.signalingState === 'stable') {
        if (Platform.OS === 'ios') {
          localStream.getVideoTracks().forEach(track => {
            //For ios to trigger the camera on
            track._switchCamera();
            track._switchCamera();
          });
        }
      }
    };
    localPC.onaddstream = e => {
      if (e?.stream && remoteStream !== e?.stream) {
        console.log('RemotePC received the stream call', e?.stream);

        setRemoteStream(e?.stream);
        InCallManager.stopRingback();
      }
    };

    return {localPC, roomRef};
  };

  const startCall = async () => {
    try {
      const {localPC, roomRef} = await initializePeer('caller');

      const offer = await localPC.createOffer();
      await localPC.setLocalDescription(offer);

      InCallManager.start({media: 'video', auto: true, ringback: '_BUNDLE_'}); // or _DEFAULT_ or _DTMF_

      const roomWithOffer = {offer};
      await roomRef.set(roomWithOffer);

      roomRef.onSnapshot(async snapshot => {
        const data = snapshot.data();
        if (!localPC.currentRemoteDescription && data.answer) {
          const rtcSessionDescription = new RTCSessionDescription(data.answer);
          if (rtcSessionDescription) {
            await localPC.setRemoteDescription(rtcSessionDescription);
          }
        }
      });

      roomRef.collection('callee').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            let data = change.doc.data();
            await localPC.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });

      setCachedLocalPC(localPC);
    } catch (error) {
      console.log(error);
    }
  };

  const joinCall = async () => {
    try {
      const {localPC, roomRef} = await initializePeer('callee');

      const roomSnapshot = await roomRef.get();

      const offer = await roomSnapshot.data().offer;
      await localPC.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await localPC.createAnswer();
      await localPC.setLocalDescription(answer);

      const roomWithAnswer = {answer};
      await roomRef.update(roomWithAnswer);

      roomRef.collection('caller').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            let data = change.doc.data();
            await localPC.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });

      setCachedLocalPC(localPC);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Screen>
      {localStream && (
        <VideoScreen
          localStream={localStream}
          remoteStream={remoteStream}
          cameraSwitched={false}
          cameraTrigged={false}
          soundTrigged={false}
          onCallDown={startCall}
          switchCamera={joinCall}
          triggerCamera={state => InCallManager.turnScreenOn()}
          triggerSound={function (state: boolean): void {
            throw new Error('Function not implemented.');
          }}
        />
      )}
    </Screen>
  );
};
