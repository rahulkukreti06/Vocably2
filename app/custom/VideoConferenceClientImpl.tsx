'use client';

import { formatChatMessageLinks, RoomContext, VideoConference } from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoPresets,
  type VideoCodec,
} from 'livekit-client';
import { DebugMode } from '@/lib/Debug';
import { useEffect, useMemo } from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { useRouter } from 'next/navigation';

export function VideoConferenceClientImpl(props: {
  liveKitUrl: string;
  token: string;
  codec: VideoCodec | undefined;
  roomId: string;
}) {
  const worker =
    typeof window !== 'undefined' &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  const keyProvider = new ExternalE2EEKeyProvider();

  const e2eePassphrase =
    typeof window !== 'undefined' ? decodePassphrase(window.location.hash.substring(1)) : undefined;
  const e2eeEnabled = !!(e2eePassphrase && worker);
  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: props.codec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, []);

  const room = useMemo(() => new Room(roomOptions), []);
  if (e2eeEnabled) {
    keyProvider.setKey(e2eePassphrase);
    room.setE2EEEnabled(true);
  }
  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    room.connect(props.liveKitUrl, props.token, connectOptions)
      .then(async () => {
        if (!cancelled) {
          // Enable camera for 0.05s, then disable
          try {
            await room.localParticipant.setCameraEnabled(true);
            setTimeout(() => {
              room.localParticipant.setCameraEnabled(false);
            }, 50);
          } catch (e) {
            console.error('Camera toggle error:', e);
          }
        }
      })
      .catch((error) => {
        console.error(error);
      });
    const handleDisconnect = async () => {
      try {
        await fetch('/api/room-participants/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: props.roomId }),
        });
      } catch (e) {
        console.error('Failed to notify leave:', e);
      }
      router.push('/');
    };
    room.on('disconnected', handleDisconnect);
    return () => {
      cancelled = true;
      room.off('disconnected', handleDisconnect);
    };
  }, [room, props.liveKitUrl, props.token, connectOptions, router]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={
            process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
          }
        />
        <DebugMode logLevel={LogLevel.debug} />
      </RoomContext.Provider>
    </div>
  );
}
