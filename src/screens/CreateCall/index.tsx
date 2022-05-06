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

import { init } from 'core';
import React, {useEffect, useState} from 'react';
import {Screen, View, Text, VideoScreen} from 'ui';

export const CreateCall = () => {
  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [cashedLocalPc, setCachedLocalPC] = useState();

  useEffect(() => {
    initLocalStream();
  }, []);

  const initLocalStream = async () => {
    const stream = await init();
    setLocalStream(stream);
  };

  return (
    <Screen>
      <VideoScreen localStream={localStream} remoteStream={remoteStream} />
    </Screen>
  );
};
