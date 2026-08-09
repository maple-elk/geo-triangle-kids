import React from 'react';
import { ExternalLink, Rocket, Sparkles, Compass, Shield } from 'lucide-react';

export default function SlingshotLauncherCard() {
  const liveAppUrl = 'https://maple-elk.github.io/space-slingshot/';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        maxWidth: '720px',
        margin: '40px auto',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        textAlign: 'center',
        gap: '24px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4)',
        }}
      >
        <Rocket size={42} color="#ffffff" />
      </div>

      <div>
        <h2
          style={{
            fontFamily: 'Fredoka',
            fontSize: '2rem',
            color: '#ffffff',
            marginBottom: '8px',
          }}
        >
          Space Gravity Slingshot
        </h2>
        <p
          style={{
            fontSize: '1.05rem',
            color: '#cbd5e1',
            lineHeight: 1.6,
            maxWidth: '560px',
          }}
        >
          Space Slingshot now runs in its own dedicated, standalone application repository! Experience gravitational slingshots, enemy interceptor duels, black holes, wormholes, and real-time physics telemetry.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <a
          href={liveAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            padding: '14px 32px',
            fontSize: '1.05rem',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            boxShadow: '0 6px 20px rgba(56, 189, 248, 0.4)',
          }}
        >
          <span>Launch Space Slingshot App</span>
          <ExternalLink size={18} />
        </a>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginTop: '12px',
          fontSize: '0.85rem',
          color: '#94a3b8',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#fbbf24" /> Dedicated Repository
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={14} color="#38bdf8" /> Fullscreen Parity
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} color="#4ade80" /> GitHub Pages Hosted
        </span>
      </div>
    </div>
  );
}
