export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#102A43] z-[9999] select-none pointer-events-auto animate-splash-container">
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm px-4">
        {/* Stockly Logo (Accent Emerald #176B4D + White #FFFFFF) */}
        <div className="animate-splash-logo">
          <svg viewBox="0 0 100 100" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bars (Primary Emerald: #176B4D) */}
            <rect x="12" y="38" width="10" height="40" rx="1.5" fill="#176B4D" />
            <rect x="26" y="26" width="10" height="52" rx="1.5" fill="#176B4D" />
            <rect x="40" y="14" width="10" height="64" rx="1.5" fill="#176B4D" />
            <rect x="54" y="2" width="10" height="76" rx="1.5" fill="#176B4D" />
            
            {/* Arrow Stem (White: #FFFFFF) */}
            <path d="M 8 75 H 44 L 74 45" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="square" strokeLinejoin="miter" />
            
            {/* Arrow Head (White: #FFFFFF) */}
            <polygon points="86,20 62,20 74,32 86,44" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Brand Wordmark & Tagline Lockup */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#F7F6F2] tracking-[0.25em] font-sans leading-none animate-splash-wordmark">
            STOCKLY
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#F7F6F2]/80 tracking-wide font-sans animate-splash-tagline">
            Run your business with clarity
          </p>
        </div>
      </div>
    </div>
  );
}
