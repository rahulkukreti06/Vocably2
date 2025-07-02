'use client';

import { useEffect, useRef } from 'react';

export default function BuyMeCoffee() {
  return (
    <a
      href="https://www.buymeacoffee.com/rahulkukreti06"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        marginRight: '1rem',
        transform: 'scale(0.9)',
        transformOrigin: 'center',
      }}
    >
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        style={{ height: '45px', width: '162px' }}
      />
    </a>
  );
} 