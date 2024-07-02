import { animate, motion, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { screenBreakpoints } from 'ui/constants';

// from back to front
const colors = ['#5a5ba8', '#df5584', '#fe6742', '#feb944', '#fff8ec'];

const defaultTextBoxShadowColor = '#000000';

const yFactors = [
  0.4, // 0
  0.3, // 1
  0.2, // 2
  0.1, // 3
];

// rotation factor, the layer in the back will rotate more
const rotateFactors = [
  0.04, // 0
  0.03, // 1
  0.02, // 2
  0.01, // 3
];

// Max position is the constrain of the layer's movement, layer further away can move more
// const minPositionYs = yFactors.map((yFactor) => -100 * yFactor - 100);
// const maxPositionYs = yFactors.map((yFactor) => 100 * yFactor);

export function Perspective() {
  const [isMobile, setIsMobile] = useState(false);
  const rotateDegrees = [useMotionValue(0), useMotionValue(0), useMotionValue(0), useMotionValue(0), useMotionValue(0)];
  const positionYs = [useMotionValue(0), useMotionValue(0), useMotionValue(0), useMotionValue(0), useMotionValue(0)];

  // Disable the perspective effect on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // reset the position of the layers
    if (isMobile) {
      positionYs.forEach((positionY) => {
        // positionY.set(0);
        animate(positionY, 0);
      });
      rotateDegrees.forEach((rotateDegree) => {
        rotateDegree.set(0);
        animate(rotateDegree, 0);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isMobile) return;

    // Each layer changes by a different amount
    positionYs.forEach((positionY, i) => {
      // Ignore the last layer
      if (i === positionYs.length - 1) return;

      // y gets smaller as i gets bigger
      const yFactor = yFactors[i];

      // Smoothen the transition with a cubic bezier
      const nextPositionY = (e.clientY - window.innerHeight / 2) * yFactor;

      // rotate the layer according to the x position of the mouse, such that the layer is always facing the mouse
      const nextRotateDegree = (e.clientX - window.innerWidth / 2) * rotateFactors[i];

      rotateDegrees[i].set(nextRotateDegree);
      positionY.set(nextPositionY);
    });
  };

  return (
    <StyledHeroContainer
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        positionYs.forEach((positionY) => {
          animate(positionY, 0, {
            damping: 200,
            bounceDamping: 10,
          });
        });
        rotateDegrees.forEach((rotateDegree) => {
          animate(rotateDegree, 0, {
            damping: 200,
            bounceDamping: 10,
          });
        });
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <TextLayer
          key={i}
          text="Gnosis Pay Rewards"
          color={colors[i]}
          fontSizeMobile={80 + i * 15}
          fontSizeMedium={120 + i * 15}
          fonsSizeDesktop={160 + i * 15}
          zIndex={i + 1}
          positionY={positionYs[i]}
          rotateDegree={rotateDegrees[i]}
        />
      ))}
    </StyledHeroContainer>
  );
}

function TextLayer({
  text,
  color,
  fontSizeMobile,
  fontSizeMedium,
  fonsSizeDesktop,
  zIndex,
  positionY,
  rotateDegree,
}: {
  text: string;
  color: string;
  fontSizeMobile: number;
  fontSizeMedium: number;
  fonsSizeDesktop: number;
  zIndex: number;
  positionY: ReturnType<typeof useMotionValue<number>>;
  rotateDegree: ReturnType<typeof useMotionValue<number>>;
}) {
  return (
    <StyledText
      $color={color}
      $zIndex={zIndex}
      $fontSizeMobile={fontSizeMobile}
      $fontSizeMedium={fontSizeMedium}
      $fonsSizeDesktop={fonsSizeDesktop}
      $textBoxShadowColor={defaultTextBoxShadowColor}
      style={{
        translateY: positionY,
        animationDuration: `${10 + zIndex * 2}s`,
        rotateZ: rotateDegree,
      }}
      transition={{ type: 'inertia', velocity: 0 }}
    >
      {text}
    </StyledText>
  );
}

const StyledHeroContainer = styled(motion.div)`
  position: relative;
  height: 600px;
  width: 100%;
  text-align: center;
  margin: auto;
`;

const StyledText = styled(motion.div)<{
  $zIndex: number;
  $color: string;
  $fontSizeMobile: number;
  $fontSizeMedium?: number;
  $fonsSizeDesktop?: number;
  $textBoxShadowColor?: string;
}>(
  (props) => `
  font-family: 'DM Sans', cursive;
  letter-spacing: 10px;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  color: rgb(25, 25, 25);
  font-weight: bold;
  will-change: transform;
  transform-style: preserve-3d;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: ${props.$zIndex};
  color: ${props.$color};
  font-size: 10vw;
  text-shadow: -1px -1px 0 ${props.$textBoxShadowColor}, 1px -1px 0 ${props.$textBoxShadowColor}, -1px 1px 0 ${props.$textBoxShadowColor}, 1px 1px 0 ${props.$textBoxShadowColor};
  // Font size
  font-size: ${props.$fontSizeMobile}px;
  @media (min-width: ${screenBreakpoints.medium}) {
    font-size: ${props.$fontSizeMedium}px;
  }
  @media (min-width: ${screenBreakpoints.xlarge}) {
    font-size: ${props.$fonsSizeDesktop}px;
  }

  & * {
    font-family: inherit!important;
  }
`,
);
