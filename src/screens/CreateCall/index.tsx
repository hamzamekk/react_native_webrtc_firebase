import {init} from 'core';
import React, {useEffect, useState} from 'react';
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {Screen, VideoScreen} from 'ui';
import firestore from '@react-native-firebase/firestore';
import {RouteProp, useRoute} from '@react-navigation/native';
import {MainStackParamList} from 'navigation/TabNavigator';
import {DeviceEventEmitter, PermissionsAndroid, Platform} from 'react-native';
import InCallManager from 'react-native-incall-manager';
import {useNavigation} from '@react-navigation/native';

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
  const [cashedLocalPc, setCachedLocalPC] =
    useState<RTCPeerConnection | null>();

  //controle media
  const [cameraSwitched, setCameraSwitched] = useState(false);
  const [soundTrigged, setSoundTrigged] = useState(true);
  const [cameraTrigged, setCameraTrigged] = useState(true);

  const {params} = useRoute<RouteProp<MainStackParamList, 'CreateCall'>>();
  const {navigate} = useNavigation();

  useEffect(() => {
    if (params.calling) {
      startCall();
    } else {
      joinCall();
    }

    return () => onCallDown(false);
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    DeviceEventEmitter.addListener('Proximity', function (data) {
      // --- do something with events
      console.log(data);
      if (data.isNear) {
        InCallManager.turnScreenOff();
      } else {
        InCallManager.turnScreenOn();
      }
    });
  }, []);

  const initLocalStream = async () => {
    if (Platform.OS === 'android') {
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

  const initializePeer = async (user: string) => {
    const initialStream = await initLocalStream();

    const localPC = new RTCPeerConnection(configuration);
    localPC.addStream(initialStream);
    setLocalStream(initialStream);

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

      InCallManager.start({media: 'video', auto: true, ringback: '_DTMF_'}); // or _DEFAULT_ or _DTMF_

      const roomWithOffer = {offer};
      await roomRef.set(roomWithOffer);

      roomRef.onSnapshot(async snapshot => {
        const data = snapshot.data();
        if (!localPC.currentRemoteDescription && data && data.answer) {
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

      roomRef.collection('caller').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            onCallDown(true);
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

      roomRef.collection('callee').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            onCallDown(true);
          }
        });
      });

      setCachedLocalPC(localPC);
    } catch (error) {
      console.log(error);
    }
  };

  const switchCamera = () => {
    try {
      localStream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });

      setCameraSwitched(!cameraSwitched);
    } catch (e) {
      console.log(e);
    }
  };

  const triggerSound = () => {
    try {
      localStream?.getAudioTracks().forEach(track => {
        track.enabled = !soundTrigged;
      });

      setSoundTrigged(!soundTrigged);
    } catch (e) {
      console.log(e);
    }
  };

  const triggerCamera = () => {
    try {
      localStream?.getVideoTracks().forEach(track => {
        track.enabled = !cameraTrigged;
      });

      setCameraTrigged(!cameraTrigged);
    } catch (e) {
      console.log(e);
    }
  };

  const onCallDown = (shouldGoBack: boolean) => {
    streamCleanup();
    fireStoreCleanup();
    InCallManager.stop();
    if (cashedLocalPc) {
      cashedLocalPc.close();
    }

    if (shouldGoBack) {
      navigate('Home');
    }
  };

  const streamCleanup = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream.release();
    }
  };
  const fireStoreCleanup = async () => {
    const cRef = firestore().collection('calls').doc(params.callId);
    if (cRef) {
      const calleeCandidate = cRef.collection('callee').get();
      (await calleeCandidate).forEach(
        async candidate => await candidate.ref.delete(),
      );

      const callerCandidate = cRef.collection('caller').get();
      (await callerCandidate).forEach(
        async candidate => await candidate.ref.delete(),
      );

      cRef.delete();
    }
  };

  return (
    <Screen>
      {localStream && (
        <VideoScreen
          localStream={localStream}
          remoteStream={remoteStream}
          cameraSwitched={cameraSwitched}
          cameraTrigged={cameraTrigged}
          soundTrigged={soundTrigged}
          onCallDown={() => onCallDown(true)}
          switchCamera={switchCamera}
          triggerCamera={triggerCamera}
          triggerSound={triggerSound}
        />
      )}
    </Screen>
  );
};
