/** Soft, slowly drifting colour fields behind the app. Purely decorative. */
export function OceanBackdrop() {
  return (
    <div className="ocean-backdrop" aria-hidden="true">
      <div className="ocean-blob ocean-blob-a" />
      <div className="ocean-blob ocean-blob-b" />
      <div className="ocean-blob ocean-blob-c" />
    </div>
  );
}

/** Two layered waves that roll along the bottom of the page banner. */
export function HeroWaves() {
  const wave = "M0 32 C120 8 240 56 360 32 S600 8 720 32 S960 56 1080 32 S1320 8 1440 32 V64 H0 Z";
  return (
    <div className="hero-waves" aria-hidden="true">
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="hero-wave-back" aria-hidden="true">
        <path d={wave} transform="translate(0 6)" />
      </svg>
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="hero-wave-front" aria-hidden="true">
        <path d={wave} transform="translate(0 18)" />
      </svg>
    </div>
  );
}

export function WaveMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 10l3-4 3 3 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
