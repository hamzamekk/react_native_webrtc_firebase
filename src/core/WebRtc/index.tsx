import {mediaDevices} from 'react-native-webrtc';

export const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun.xten.com',
    },
  ],
};

export const init = async () => {
  const isFront = true;
  const devices = await mediaDevices.enumerateDevices();

  console.log('devices', devices);

  const facing = isFront ? 'front' : 'environment';
  const videoSourceId = devices.find(
    device => device.kind === 'videoinput' && device.facing === facing,
  );
  const constraints = {
    audio: {
      autoGainControl: false,
      channelCount: 2,
      echoCancellation: false,
      latency: 0,
      noiseSuppression: false,
      sampleRate: 48000,
      sampleSize: 16,
      volume: 1.0,
    },
    video: {
      mandatory: {
        width: {min: 640, ideal: 1280, max: 1920},
        height: {min: 480, ideal: 720, max: 1080},
        minFrameRate: 30,
        facingMode: isFront ? 'user' : 'environment',
      },
      facingMode: 'user',
      optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
    },
  };

  console.log('videoSourceId', videoSourceId);

  const newStream = await mediaDevices.getUserMedia(constraints);

  console.log('newStream', newStream);

  return newStream;
};
