// import React, {useEffect, useState} from 'react';

// import {Button, Screen, Text} from 'ui';
// import firestore from '@react-native-firebase/firestore';
// import {Alert, PermissionsAndroid, Platform} from 'react-native';
// import {
//   RTCIceCandidate,
//   RTCPeerConnection,
//   RTCSessionDescription,
//   RTCView,
// } from 'react-native-webrtc';
// import {configuration, init} from 'core';

// export const JoinCall = () => {
//   const name =
//     Platform.OS === 'ios'
//       ? `iphone-${Platform.Version}`
//       : `android-${Platform.Version}`;

//   let pcPeers = {};
//   const users = [];

//   const [localStream, setLocalStream] = useState();
//   const [remoteStream, setRemoteStream] = useState([]);

//   useEffect(() => {
//     // const start = async () => {
//     //   console.log('starting');
//     //   const stream = await initLocalStream();
//     //   setLocalStream(stream);
//     // };
//     // start();
//   }, []);

//   // useEffect(() => {
//   //   firestore()
//   //     .collection('yarn')
//   //     .orderBy('timestamp')
//   //     .limit(1)
//   //     .onSnapshot(data => {
//   //       data.docChanges().forEach(change => {
//   //         if (
//   //           // change.doc.data().type === 'join' &&
//   //           // !users.includes(change.doc.data().name) &&
//   //           change.type === 'added'
//   //         ) {
//   //           console.log('user', users);
//   //           users.push(change.doc.data().name);
//   //           console.log('data added', change.doc.data());
//   //         }
//   //       });
//   //     });
//   // }, []);

//   const checkIfDataExist = async (collection, field, value) => {
//     const usersRef = await firestore()
//       .collection('meet')
//       .doc('yarn')
//       .collection(collection);

//     usersRef
//       .where(field, '==', value)
//       .get()
//       .then(docSnapshot => {
//         if (docSnapshot.empty) {
//           return true;
//         } else {
//           return false;
//         }
//       });
//   };

//   const checkFfCandidateAlreadyExist = async (candidate, from, to) => {
//     const usersRef = await firestore()
//       .collection('meet')
//       .doc('yarn')
//       .collection('candidates');

//     usersRef
//       .where('candidate', '==', candidate)
//       .where('from', '==', from)
//       .where('to', '==', to)
//       .get()
//       .then(docSnapshot => {
//         if (docSnapshot.empty) {
//           return true;
//         } else {
//           return false;
//         }
//       });
//   };

//   const CheckifOfferAlreadyCreated = async (from, to) => {
//     const usersRef = await firestore().collection('yarn');

//     usersRef
//       .where('from', '==', from)
//       .where('to', '==', to)
//       .get()
//       .then(docSnapshot => {
//         // console.log('exist', docSnapshot.empty);
//         if (docSnapshot.empty) {
//           return true;
//         } else {
//           return false;
//         }
//       });
//   };

//   const join = async room => {
//     const roomRef = await firestore().collection('meets').doc('funny');

//     const dataExist = await checkIfDataExist('users', 'name', name);

//     if (!dataExist) {
//       roomRef
//         .collection('users')
//         .add({
//           name,
//           type: 'join',
//         })
//         .then(async () => {
//           // const data = [];

//           await roomRef
//             .collection('users')
//             .get()
//             .then(async querySnapshot => {
//               if (querySnapshot.empty) {
//                 Alert.alert('empty');
//               } else {
//                 querySnapshot.forEach(async snap => {
//                   // data.push(snap.data);
//                   console.log('existing users', snap.data());
//                   if (snap.data().name !== name) {
//                     // users.push(snap.data().name);
//                     await createOffer(snap.data().name);
//                   }
//                 });
//               }
//             });
//         });
//     }

//     // listen on any new user candidates
//     // roomRef.collection('candidates').onSnapshot(data => {
//     //   data.docChanges().forEach(async change => {
//     //     if (change.type === 'added') {
//     //       if (change.doc.data().candidate && change.doc.data().to === name) {
//     //         // await onExchange(change.doc.data().from, change.doc.data());
//     //         console.log(change.doc.data());
//     //         console.log(
//     //           'listen to candidate',
//     //           change.doc.data(),
//     //           'from',
//     //           change.doc.data().from,
//     //           change.doc.data().to,
//     //         );
//     //       }
//     //     }
//     //   });
//     // });

//     // listen on any new user response
//     // roomRef.collection('answers').onSnapshot(data => {
//     //   data.docChanges().forEach(async change => {
//     //     if (change.type === 'added') {
//     //       if (change.doc.data().answer && change.doc.data().to === name) {
//     //         await onExchange(change.doc.data().from, change.doc.data());
//     //       }
//     //     }
//     //   });
//     // });

//     // listen on any new offers
//     roomRef.collection('offers').onSnapshot(data => {
//       data.docChanges().forEach(async change => {
//         if (change.type === 'added') {
//           // if (change.doc.data().offer && change.doc.data().to === name) {
//           console.log('listen to offers', change.doc.data());
//           if (change.doc.data().from !== name) {
//             console.log('create offer');
//             await createAnswer(change.doc.data().from, change.doc.data());
//           }
//           // }
//         }
//       });
//     });
//   };

//   const initLocalStream = async () => {
//     if (Platform.OS === 'android' && Platform.Version > 30) {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//         {
//           title: 'Bluetooth permission required',
//           message:
//             'App needs access to you bluetooth to handel if the phone is close to ur ear so it can turn off ur screen or turn on it',
//           buttonNeutral: 'Ask Me Later',
//           buttonNegative: 'Cancel',
//           buttonPositive: 'OK',
//         },
//       );

//       if (granted === 'granted') {
//         const stream = await init();

//         return stream;
//       }
//     } else {
//       const stream = await init();
//       return stream;
//     }
//   };

//   const initializePeer = async (to: string) => {
//     let initialStream;

//     if (!localStream) {
//       const initialStream = await initLocalStream();
//       setLocalStream(initialStream);
//     } else {
//       initialStream = localStream;
//     }

//     const peer = new RTCPeerConnection(configuration);
//     peer.addStream(localStream);

//     const roomRef = await firestore().collection('meets').doc('yarn');

//     const collection = roomRef.collection('candidates');

//     peer.onicecandidate = async e => {
//       if (!e.candidate) {
//         console.log('Got final candidate!');
//         return;
//       }

//       if (to !== name) {
//         const exist = await checkFfCandidateAlreadyExist(e.candidate, name, to);

//         if (!exist) {
//           collection.add({from: name, candidate: e.candidate.toJSON(), to});
//         }
//       }
//       // InCallManager.setForceSpeakerphoneOn(true);
//       // InCallManager.setSpeakerphoneOn(true);
//     };

//     peer.onsignalingstatechange = async event => {
//       // when the signal state become stable record the data and stop ringback

//       if (event.target.signalingState === 'stable') {
//         if (Platform.OS === 'ios') {
//           localStream.getVideoTracks().forEach(track => {
//             //For ios to trigger the camera on
//             track._switchCamera();
//             track._switchCamera();
//           });
//         }
//       }
//     };
//     peer.onaddstream = e => {
//       console.log('onAdd stream', e, to);

//       if (e?.stream) {
//         const remot = remoteStream;
//         remot.push(e?.stream);
//         setRemoteStream(remot);

//         // InCallManager.stopRingback();
//       }
//     };

//     return peer;
//   };

//   const createOffer = async to => {
//     try {
//       const peer = await initializePeer(to);

//       const offer = await peer.createOffer();
//       await peer.setLocalDescription(offer);

//       const roomRef = await firestore().collection('meets').doc('yarn');

//       const collection = roomRef.collection('offers');

//       collection.add({from: name, to, offer});

//       roomRef.collection('answers').onSnapshot(snapshot => {
//         snapshot.docChanges().forEach(async change => {
//           if (change.type === 'added') {
//             let data = change.doc.data();

//             if (data.from === to && data.to === name && data.answer) {
//               console.log('onAnswer', Platform.OS, data.answer);

//               const rtcSessionDescription = new RTCSessionDescription(
//                 data.answer,
//               );
//               if (rtcSessionDescription) {
//                 await peer.setRemoteDescription(rtcSessionDescription);
//               }
//             }
//           }
//         });
//       });

//       // if (peer && data && data.answer) {
//       //   const rtcSessionDescription = new RTCSessionDescription(data.answer);
//       //   if (rtcSessionDescription) {
//       //     await pc.setRemoteDescription(rtcSessionDescription);
//       //   }
//       // }

//       pcPeers = {...pcPeers, [to]: peer};
//     } catch (e) {
//       console.log(e, Platform.OS, 'create');
//     }
//   };

//   const createAnswer = async (from, offer) => {
//     try {
//       const peer = await initializePeer(from);

//       // console.log('peer', Platform.OS, peer);

//       const rtcSessionDescription = new RTCSessionDescription(offer.offer);

//       if (rtcSessionDescription) {
//         await peer.setRemoteDescription(rtcSessionDescription);
//       }
//       const answer = await peer.createAnswer();
//       await peer.setLocalDescription(answer);

//       const roomRef = await firestore().collection('meets').doc('yarn');

//       const collection = roomRef.collection('answers');

//       const asnwerExisted = await checkIfDataExist('answers', 'answer', answer);

//       if (!asnwerExisted) {
//         collection.add({from: name, to: from, answer});
//       }

//       roomRef.collection('candidates').onSnapshot(snapshot => {
//         snapshot.docChanges().forEach(async change => {
//           if (change.type === 'added') {
//             let data = change.doc.data();

//             if (data.from === from && data.to === name && data.candidate) {
//               await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
//             }
//           }
//         });
//       });

//       pcPeers = {...pcPeers, [from]: peer};
//     } catch (e) {
//       console.log(e, Platform.OS, 'answer');
//     }
//   };

//   console.log('remote', remoteStream);
//   // console.log('local', localStream);
//   // console.log('peers', pcPeers);

//   return (
//     <Screen>
//       {localStream && (
//         <RTCView
//           style={{flex: 1}}
//           streamURL={localStream && localStream.toURL()}
//           mirror
//           objectFit={'cover'}
//         />
//       )}

//       {remoteStream && remoteStream.length > 0 && (
//         <RTCView
//           // key={index}
//           style={{flex: 1}}
//           streamURL={remoteStream[0].toURL()}
//           mirror
//           objectFit={'cover'}
//         />
//       )}

//       <Button label="join" onPress={async () => await join('funny')} />
//       <Button
//         label="camera"
//         onPress={async () => {
//           const stream = await initLocalStream();
//           setLocalStream(stream);
//         }}
//       />
//     </Screen>
//   );
// };

import React from 'react';
import {Screen, Text} from 'ui';

export const JoinCall = () => {
  return (
    <Screen>
      <Text>working</Text>
    </Screen>
  );
};
