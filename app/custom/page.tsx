import { VideoConferenceClientImpl } from './VideoConferenceClientImpl';

const allowedCodecs = ['vp8', 'h264', 'vp9', 'av1'] as const;
type AllowedCodec = typeof allowedCodecs[number];

export default async function CustomRoomConnection(props: {
  searchParams: Promise<{
    liveKitUrl?: string;
    token?: string;
    codec?: string;
  }>;
}) {
  const { liveKitUrl, token, codec } = await props.searchParams;
  if (typeof liveKitUrl !== 'string') {
    return <h2>Missing LiveKit URL</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>Missing LiveKit token</h2>;
  }
  if (codec !== undefined && !allowedCodecs.includes(codec as AllowedCodec)) {
    return <h2>Invalid codec, if defined it has to be [{allowedCodecs.join(', ')}].</h2>;
  }

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      <VideoConferenceClientImpl
        liveKitUrl={liveKitUrl}
        token={token}
        codec={codec as AllowedCodec}
        roomId={"custom-room"}
      />
    </main>
  );
}
