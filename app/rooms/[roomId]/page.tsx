'use client';

import * as React from 'react';
import PageClientImpl from './PageClientImpl';
import dynamic from 'next/dynamic';
const ScrollToTopBottomButton = dynamic(() => import('../../../components/ScrollToTopBottomButton'), { ssr: false });

export default function Page({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: {
    region?: string;
    hq?: string;
    codec?: string;
  };
}) {
  const allowedCodecs = ['vp8', 'h264', 'vp9', 'av1'] as const;
  type AllowedCodec = typeof allowedCodecs[number];
  const codec =
    typeof searchParams.codec === 'string' && allowedCodecs.includes(searchParams.codec as AllowedCodec)
      ? (searchParams.codec as AllowedCodec)
      : 'vp9';
  const hq = searchParams.hq === 'true';

  // State to track if user is in pre-join (not yet joined room)
  const [showPreJoin, setShowPreJoin] = React.useState(true);

  return (
    <>
      <PageClientImpl
        roomId={params.roomId}
        region={searchParams.region}
        hq={hq}
        codec={codec}
        onJoin={() => setShowPreJoin(false)}
        onPreJoin={() => setShowPreJoin(true)}
      />
      {showPreJoin && <ScrollToTopBottomButton />}
    </>
  );
}
