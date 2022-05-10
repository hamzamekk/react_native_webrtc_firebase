import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {MainStackParamList} from 'navigation/TabNavigator';
import React, {useCallback} from 'react';
import {Screen, Text, View} from 'ui';
import firestore from '@react-native-firebase/firestore';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {useEffect} from 'react';
import {init} from 'core';
import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {useState} from 'react';
import {RTCView} from 'react-native-webrtc';

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  // iceCandidatePoolSize: 10,
  // offerExtmapAllowMixed: true,
};

export const JoinCall = () => {
  const name = `${Platform.OS}_${Platform.Version}_user`;

  const {params} = useRoute<RouteProp<MainStackParamList, 'JoinCall'>>();
  // const {navigate} = useNavigation();

  let pcPeers = {};

  //streams
  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteStream_, setRemoteStream_] = useState(null);

  useEffect(() => {
    const start = async () => {
      await joinRoom();
    };

    start();
  }, []);

  const joinRoom = async () => {
    const roomRef = await firestore().collection('meets').doc(params.callId);

    roomRef
      .collection('users')
      .add({name, type: 'join'})
      .then(() => {
        roomRef
          .collection('users')
          .get()
          .then(async querySnapshot => {
            if (querySnapshot.empty) {
              console.log('EMPTY');
            } else {
              const users: string[] = [];
              querySnapshot.forEach(async snap => {
                if (snap.data().name !== name && snap.data().type === 'join') {
                  // data.push(snap.data().name);
                  // await creatOffer(snap.data().name);
                  users.push(snap.data().name);
                }

                if (users.length > 0) {
                  Promise.all(
                    users.map(async user => {
                      return await creatOffer(user);
                    }),
                  )
                    .then(data => console.log(data))
                    .catch(e => console.log(e));
                }
              });
            }
          });
      });

    //     // listen on any new offers
    roomRef.collection('offers').onSnapshot(data => {
      data.docChanges().forEach(async change => {
        if (change.type === 'added') {
          // console.log('changes', change.doc.data());
          if (change.doc.data().to === name) {
            await createAnswer(change.doc.data().from, change.doc.data().offer);
          }
        }
      });
    });

    //listen to answers
    roomRef.collection('answers').onSnapshot(async snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const pc = pcPeers[change.doc.data().from];
          if (change.doc.data().to === name) {
            const rtcSessionDescription = new RTCSessionDescription(
              change.doc.data().answer,
            );

            if (pc && rtcSessionDescription) {
              await pc.setRemoteDescription(rtcSessionDescription);
            }
          }
        }
      });
    });

    //listen to candidate change
    roomRef.collection('candidates').onSnapshot(async snapshot => {
      snapshot.docChanges().forEach(async change => {
        // console.log('answers', change.doc.data());
        if (change.type === 'added') {
          console.log('added', Platform.OS);
          if (change.doc.data().to === name) {
            const pc = pcPeers[change.doc.data().from];

            // console.log(pc);

            if (pc) {
              await pc.addIceCandidate(
                new RTCIceCandidate(change.doc.data().candidate),
              );
            }
          }
        }
      });
    });
  };

  const creatOffer = async to => {
    try {
      const {roomRef, localPC} = await initializePeer(to);

      const offer = await localPC.createOffer();
      // console.log('offer', offer);
      if (offer) {
        await localPC.setLocalDescription(offer);

        await roomRef.collection('offers').add({from: name, to, offer});
      }
      pcPeers = {...pcPeers, [to]: localPC};
    } catch (e) {
      console.log(e);
    }
  };

  const initLocalStream = async () => {
    if (Platform.OS === 'android' && Platform.Version > 30) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Bluetooth permission required',
          message:
            'App needs access to you bluetooth to handel if the phone is close to ur ear so it can turn off ur screen or turn on it',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === 'granted') {
        const stream = await init();
        return stream;
      }
    } else {
      const stream = await init();
      return stream;
    }
  };

  const initializePeer = async (to: string) => {
    const initialStream = await initLocalStream();

    const localPC = new RTCPeerConnection(configuration);
    await localPC.addStream(initialStream);
    setLocalStream(initialStream);

    const roomRef = await firestore().collection('meets').doc(params.callId);

    const collection = roomRef.collection('candidates');

    localPC.onicecandidate = async e => {
      if (!e.candidate) {
        return;
      }
      // console.log('canditates', Platform.OS);
      const state = localPC.iceGatheringState;

      if (state !== 'complete') {
        await collection.add({
          from: name,
          candidate: e.candidate.toJSON(),
          to,
          date: new Date(),
        });
      } else {
        Alert.alert('tes');
      }
      // InCallManager.setForceSpeakerphoneOn(true);
      // InCallManager.setSpeakerphoneOn(true);
    };

    localPC.onsignalingstatechange = async event => {
      // when the signal state become stable record the data and stop ringback

      if (event.target.signalingState === 'stable') {
        if (Platform.OS === 'ios') {
          localStream?.getVideoTracks().forEach(track => {
            //For ios to trigger the camera on
            track._switchCamera();
            track._switchCamera();
          });
        }
      }
    };
    localPC.onaddstream = e => {
      if (e?.stream) {
        // console.log(
        //   `RemotePC received the stream call ${Platform.OS}_${Platform.Version}`,
        //   e?.stream,
        // );

        console.log(Platform.OS, ' ', Platform.Version);
        if (remoteStream === null) {
          // Alert.alert('stream 1');
          setRemoteStream(e?.stream);
        } else {
          // Alert.alert('stream 2');

          setRemoteStream_(e?.stream);
        }
      }
    };

    return {localPC, roomRef};
  };

  const setRemoteStreams = useCallback(
    (stream, to) => {
      let remotes = [...remoteStream];
      remotes = [...remotes, {to, stream}];
      setRemoteStream(remotes);
    },
    [remoteStream],
  );

  // const checkIfCandidates = async (from, candidate, to) => {
  //   const roomRef = await firestore().collection(params.callId);

  //   const offers = roomRef.collection('candidates');

  //   await offers
  //     .where('from', '==', from)
  //     .where('to', '==', to)
  //     .where('candidate', '==', candidate)
  //     .get()
  //     .then(docSnapshot => {
  //       console.log('exist', docSnapshot.empty);
  //       if (docSnapshot.empty) {
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     });
  // };

  const createAnswer = async (from, offer) => {
    try {
      const {localPC, roomRef} = await initializePeer(from);

      await localPC.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await localPC.createAnswer();
      await localPC.setLocalDescription(answer);

      // await checkIfAnswerAlreadyCreated(from, name);

      await roomRef.collection('answers').add({from: name, to: from, answer});

      pcPeers = {...pcPeers, [from]: localPC};
    } catch (e) {
      console.log(e);
    }
  };

  // console.log('remote stream', remoteStream);

  return (
    <Screen>
      {localStream && (
        <RTCView
          style={{flex: 1}}
          streamURL={localStream.toURL()}
          mirror
          objectFit={'cover'}
        />
      )}

      <View height={10} bg={'red'} />

      <View flexDirection={'row'} flex={1}>
        <View flex={1} bg={'grey3'}>
          {remoteStream && (
            <RTCView
              style={{flex: 1}}
              streamURL={remoteStream.toURL()}
              mirror
              objectFit={'cover'}
            />
          )}
        </View>

        <View flex={1} bg={'red'}>
          {remoteStream_ && (
            <RTCView
              style={{flex: 1}}
              streamURL={remoteStream_.toURL()}
              mirror
              objectFit={'cover'}
            />
          )}
        </View>
      </View>
    </Screen>
  );
};
