import React, { useState, useCallback } from "react";
import { motion, stagger, useAnimate } from "motion/react";

function debounce(fn, wait = 100, options = { leading: true, trailing: true }) {
  let timer = null;
  let lastArgs = null;
  return function(...args) {
    lastArgs = args;
    const callNow = !timer && options.leading;
    if (callNow) {
      fn.apply(this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (options.trailing && !callNow) {
        fn.apply(this, lastArgs);
      }
    }, wait);
  };
}

const VariableFontHoverByLetter = ({
  label = "",
  fromFontVariationSettings = "'wght' 400, 'slnt' 0",
  toFontVariationSettings = "'wght' 900, 'slnt' -10",
  transition = {
    type: "spring",
    duration: 0.7,
  },
  staggerDuration = 0.03,
  staggerFrom = "first",
  className = "",
  style = {},
  onClick,
  ...props
}) => {
  const [scope, animate] = useAnimate();
  const [isHovered, setIsHovered] = useState(false);

  const mergeTransition = useCallback(
    (baseTransition) => ({
      ...baseTransition,
      delay: stagger(staggerDuration, {
        from: staggerFrom,
      }),
    }),
    [staggerDuration, staggerFrom]
  );

  const hoverStart = useCallback(
    debounce(
      () => {
        if (isHovered) return;
        setIsHovered(true);

        animate(
          ".letter",
          { fontVariationSettings: toFontVariationSettings },
          mergeTransition(transition)
        );
      },
      100,
      { leading: true, trailing: true }
    ),
    [isHovered, animate, toFontVariationSettings, mergeTransition, transition]
  );

  const hoverEnd = useCallback(
    debounce(
      () => {
        setIsHovered(false);

        animate(
          ".letter",
          { fontVariationSettings: fromFontVariationSettings },
          mergeTransition(transition)
        );
      },
      100,
      { leading: true, trailing: true }
    ),
    [animate, fromFontVariationSettings, mergeTransition, transition]
  );

  return (
    <motion.span
      className={`inline-block ${className}`.trim()}
      style={{
        position: 'relative',
        fontVariationSettings: fromFontVariationSettings,
        cursor: 'pointer',
        ...style
      }}
      onHoverStart={hoverStart}
      onHoverEnd={hoverEnd}
      onClick={onClick}
      ref={scope}
      {...props}
    >
      <span
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        {label}
      </span>

      {label.split("").map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre letter"
          aria-hidden="true"
          style={{ fontVariationSettings: fromFontVariationSettings }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default VariableFontHoverByLetter;
export { VariableFontHoverByLetter };
