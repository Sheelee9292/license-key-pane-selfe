export function Seal({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Mr. Shakeel License Bureau seal"
    >
      <defs>
        <path
          id="seal-ring"
          d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
        />
        <path
          id="seal-inner"
          d="M60,60 m-33,0 a33,33 0 1,0 66,0 a33,33 0 1,0 -66,0"
        />
      </defs>

      {/* scalloped outer edge */}
      <g fill="none" stroke="currentColor" strokeWidth="2.4">
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const x = 60 + Math.cos(a) * 55;
          const y = 60 + Math.sin(a) * 55;
          return <circle key={i} cx={x} cy={y} r="3.4" fill="currentColor" stroke="none" />;
        })}
        <circle cx="60" cy="60" r="50" />
        <circle cx="60" cy="60" r="47.5" strokeWidth="1" />
      </g>

      {/* circular legend */}
      <text
        fontSize="7.4"
        letterSpacing="3.1"
        fontWeight="700"
        fill="currentColor"
        fontFamily="var(--font-mono)"
      >
        <textPath href="#seal-ring" startOffset="4%">
          LICENSE BUREAU · MR. SHAKEEL · V2.5.8 ·
        </textPath>
      </text>

      {/* monogram */}
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square">
        <path d="M40 74 L40 46 L52 64 L64 46 L64 74" />
        <path d="M74 46 L74 74" />
        <path d="M74 46 Q90 46 90 56 Q90 65 76 65" />
      </g>
      <path
        d="M46 84 L74 84"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeDasharray="4 3"
      />
      <text
        x="60"
        y="93"
        textAnchor="middle"
        fontSize="6.4"
        letterSpacing="2"
        fontWeight="700"
        fill="currentColor"
        fontFamily="var(--font-mono)"
      >
        AUTHENTIC
      </text>
    </svg>
  );
}
