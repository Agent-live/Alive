import { useMemo } from 'react';
import { AgentStatus } from '../../types';
import { STATUS_THEMES } from './theme';

interface AliveLogoProps {
  /** Agent status drives the dot color and pulse */
  status?: AgentStatus | 'none';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show full wordmark or just the icon (I symbol) */
  variant?: 'wordmark' | 'icon';
  /** Override text color (default: currentColor) */
  textColor?: string;
  /** Additional class names */
  className?: string;
}

const SIZES = {
  sm: { height: 20, fontSize: 16, dotR: 1.8, lineW: 2 },
  md: { height: 28, fontSize: 22, dotR: 2.5, lineW: 2.8 },
  lg: { height: 40, fontSize: 32, dotR: 3.5, lineW: 4 },
  xl: { height: 56, fontSize: 44, dotR: 5, lineW: 5.5 },
};

/** Plus Jakarta Sans 800 cap-height ratio */
const CAP_HEIGHT_RATIO = 0.65;

/**
 * ALIVE Logo — "The Living I"
 *
 * The letter I in ALIVE is replaced with a vertical line + dot.
 * The dot color follows the agent's status.
 * When critical: dot pulses rapidly.
 * When dead: dot disappears, line becomes horizontal (flatline).
 */
export function AliveLogo({
  status = 'none',
  size = 'md',
  variant = 'wordmark',
  textColor,
  className = '',
}: AliveLogoProps) {
  const theme = STATUS_THEMES[status];
  const s = SIZES[size];

  const pulseStyle = useMemo(() => {
    if (theme.logoPulseMs <= 0) return {};
    return {
      animation: `logo-dot-pulse ${theme.logoPulseMs}ms ease-in-out infinite`,
    };
  }, [theme.logoPulseMs]);

  const isDead = status === 'dead';
  const color = textColor || 'currentColor';

  // Icon-only variant: just the I symbol (line + dot)
  if (variant === 'icon') {
    const iconSize = s.height;
    const cx = iconSize / 2;
    const dotTop = s.dotR + 1 - s.dotR; // = 1
    const rawLineBottom = iconSize * 0.65;
    const rawDotCy = s.dotR + 1;
    const rawLineTop = rawDotCy + s.dotR + 3;
    const contentH = rawLineBottom - dotTop;
    const offset = (iconSize - contentH) / 2 - dotTop;
    const dotCy = rawDotCy + offset;
    const lineTop = rawLineTop + offset;
    const lineBottom = rawLineBottom + offset;

    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        fill="none"
        className={className}
        aria-label="ALIVE"
      >
        {/* The dot — life indicator */}
        {theme.logoDotVisible && (
          <circle
            cx={cx}
            cy={dotCy}
            r={s.dotR}
            fill={theme.accent}
            style={pulseStyle}
          />
        )}

        {/* The line — existence */}
        <line
          x1={isDead ? 4 : cx}
          y1={isDead ? iconSize / 2 : lineTop}
          x2={isDead ? iconSize - 4 : cx}
          y2={isDead ? iconSize / 2 : lineBottom}
          stroke={isDead ? '#6B7280' : color}
          strokeWidth={s.lineW}
          strokeLinecap="round"
          style={{
            transition: 'all 0.6s ease',
          }}
        />

        {/* Dead state: flatline indicator */}
        {isDead && (
          <line
            x1={4}
            y1={iconSize / 2}
            x2={iconSize - 4}
            y2={iconSize / 2}
            stroke="#6B7280"
            strokeWidth={s.lineW}
            strokeLinecap="round"
            opacity={0.4}
          />
        )}
      </svg>
    );
  }

  // Wordmark variant: A L [I] V E
  // The I is rendered as SVG inline, the rest as text.
  //
  // Key: the line height must match the font's cap height, and the
  // line bottom must sit on the text baseline. In an inline-flex
  // items-baseline container, a replaced element (SVG) with no text
  // uses its bottom margin edge as the baseline. So with
  // marginBottom=0, the SVG bottom = text baseline. The line
  // extends from (dot + gap) to svgH, spanning exactly capHeight.

  const capHeight = Math.round(s.fontSize * CAP_HEIGHT_RATIO);
  const dotDiam = s.dotR * 2;
  const dotGap = Math.round(s.dotR * 0.5);
  const svgH = dotDiam + dotGap + capHeight;
  const iWidth = Math.max(dotDiam + 4, s.lineW + 6);
  const letterSpacing = s.fontSize * 0.06;

  const dotCy = s.dotR * 0.7;
  const lineY1 = dotDiam + dotGap;
  const lineY2 = svgH;

  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{ lineHeight: 1 }}
      aria-label="ALIVE"
    >
      {/* A L */}
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: s.fontSize,
          letterSpacing,
          color,
          transition: 'color 0.4s ease',
        }}
      >
        AL
      </span>

      {/* I — The Living Letter */}
      <svg
        width={iWidth}
        height={svgH}
        viewBox={`0 0 ${iWidth} ${svgH}`}
        fill="none"
        style={{
          display: 'inline-block',
          verticalAlign: 'baseline',
          marginBottom: 0,
          marginLeft: letterSpacing * 0.5,
          marginRight: letterSpacing * 0.5,
        }}
      >
        {/* Dot */}
        {theme.logoDotVisible && (
          <circle
            cx={iWidth / 2}
            cy={dotCy}
            r={s.dotR}
            fill={theme.accent}
            style={{
              ...pulseStyle,
              transition: 'fill 0.4s ease',
            }}
          />
        )}

        {/* Vertical line or flatline */}
        <line
          x1={isDead ? 1 : iWidth / 2}
          y1={isDead ? svgH * 0.55 : lineY1}
          x2={isDead ? iWidth - 1 : iWidth / 2}
          y2={isDead ? svgH * 0.55 : lineY2}
          stroke={isDead ? '#6B7280' : color}
          strokeWidth={s.lineW}
          strokeLinecap="round"
          style={{ transition: 'all 0.6s ease' }}
        />
      </svg>

      {/* V E */}
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: s.fontSize,
          letterSpacing,
          color: isDead ? '#6B7280' : color,
          transition: 'color 0.4s ease',
        }}
      >
        VE
      </span>
    </span>
  );
}
