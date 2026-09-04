import React from 'react';
import VariableFontHoverByLetter from './fancy/text/variable-font-hover-by-letter';

/**
 * LMPC Star Icon - Concentric 6-pointed Star Vector Logo
 */
export const LMPCStarIcon = ({
  size = 28,
  color = '#FFFFFF',
  className = '',
  style = {}
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Outer 6-pointed star */}
      <polygon
        points="50.00,4.00 61.50,30.08 89.84,27.00 73.00,50.00 89.84,73.00 61.50,69.92 50.00,96.00 38.50,69.92 10.16,73.00 27.00,50.00 10.16,27.00 38.50,30.08"
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Middle 6-pointed star */}
      <polygon
        points="50.00,17.00 58.25,35.71 78.58,33.50 66.50,50.00 78.58,66.50 58.25,64.29 50.00,83.00 41.75,64.29 21.42,66.50 33.50,50.00 21.42,33.50 41.75,35.71"
        fill="none"
        stroke={color}
        strokeWidth="3.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Inner 6-pointed star */}
      <polygon
        points="50.00,30.00 55.00,41.34 67.32,40.00 60.00,50.00 67.32,60.00 55.00,58.66 50.00,70.00 45.00,58.66 32.68,60.00 40.00,50.00 32.68,40.00 45.00,41.34"
        fill="none"
        stroke={color}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Center 6-pointed star core */}
      <polygon
        points="50.00,40.00 52.50,45.67 58.66,45.00 55.00,50.00 58.66,55.00 52.50,54.33 50.00,60.00 47.50,54.33 41.34,55.00 45.00,50.00 41.34,45.00 47.50,45.67"
        fill={color}
      />
    </svg>
  );
};

/**
 * Full LMPC Vision Logo (Two-Tone Cyan + Sky Typography with Star Icon)
 */
export const LMPCVisionLogo = ({
  iconSize = 26,
  textSize = '1.4rem',
  interactive = true,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`lmpc-vision-brand ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        fontFamily: "'Inter', sans-serif",
        ...style
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: textSize, lineHeight: 1 }}>
        {interactive ? (
          <>
            <span style={{ color: '#38E1D9' }}>
              <VariableFontHoverByLetter
                label="LMPC"
                staggerDuration={0.03}
                fromFontVariationSettings="'wght' 800, 'slnt' 0"
                toFontVariationSettings="'wght' 900, 'slnt' -10"
              />
            </span>
            <span style={{ color: '#93C5FD' }}>
              <VariableFontHoverByLetter
                label="Vision"
                staggerDuration={0.03}
                fromFontVariationSettings="'wght' 800, 'slnt' 0"
                toFontVariationSettings="'wght' 900, 'slnt' -10"
              />
            </span>
          </>
        ) : (
          <>
            <span style={{ color: '#38E1D9' }}>LMPC</span>
            <span style={{ color: '#93C5FD' }}>Vision</span>
          </>
        )}
      </div>

      <LMPCStarIcon size={iconSize} color="#FFFFFF" />
    </div>
  );
};

export default LMPCVisionLogo;
