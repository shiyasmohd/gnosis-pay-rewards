import { ReactNode } from 'react';
import styled from 'styled-components';
import { Container } from 'ui/components/Container';
import { borderRadiuses, colors, fontSizes, screenBreakpoints } from 'ui/constants';
import { SectionTitle, SectionWrapper } from '../components/SectionWrapper';
import { CardInnerWrapper, CardTitle as BaseCardTitle, StyledCard } from 'ui/components/Card';

type Gradient = {
  start: string;
  end: string;
};

interface IFeatureEntry {
  title: ReactNode;
  description: ReactNode;
  background?: string | Gradient;
}

const features: IFeatureEntry[] = [
  {
    title: 'forward-looking',
    description: <>nimi.id uses Optimism to provide a seamless experience for ENS names.</>,
    background: {
      start: 'oklch(59.59% 0.24 255.09156059071347)',
      end: '#00c1f2',
    },
  },
  {
    title: 'scales',
    description: <>nimi.id supercharges ENS names with unlimited scale for communities.</>,
    background: {
      start: 'oklch(49.07% 0.272 300.45)',
      end: 'oklch(64.53% 0.292 2.47)',
    },
  },
  {
    title: 'secure',
    description: <>nimi.id scales ENS without comprimising the security on Ethereum.</>,
    background: {
      start: 'oklch(67.3% 0.266 25.039656026515278)',
      end: 'oklch(85.82% 0.201 91.19)',
    },
  },
];

export function KeyFeaturesSection() {
  const firstRow = features.slice(0, 2);
  const secondRow = features.slice(2, 4);

  return (
    <SectionWrapper
      id="key-features"
      style={{
        background: 'transparent',
      }}
    >
      <StyledContainer>
        <SectionTitle>why nimi.id</SectionTitle>
        <FeaturesColumn>
          <FeatureSetRow>
            {firstRow.map((feature, index) => (
              <FeatureCard key={index} $background={feature.background}>
                <FeatureCardInnerWrapper>
                  <CardTitle>{feature.title}</CardTitle>
                  <p>{feature.description}</p>
                </FeatureCardInnerWrapper>
              </FeatureCard>
            ))}
          </FeatureSetRow>
          <FeatureSetRow>
            {secondRow.map((feature, index) => (
              <FeatureCard key={index} $background={feature.background}>
                <FeatureCardInnerWrapper>
                  <CardTitle>{feature.title}</CardTitle>
                  <p>{feature.description}</p>
                </FeatureCardInnerWrapper>
              </FeatureCard>
            ))}
          </FeatureSetRow>
        </FeaturesColumn>
      </StyledContainer>
    </SectionWrapper>
  );
}

const StyledContainer = styled(Container)`
  text-align: center;
  padding-left: 20px;
  padding-right: 20px;
`;

const FeatureCard = styled(StyledCard)<{
  $expand?: boolean;
  $background?: string | Gradient;
}>(
  (props) => `
  background: ${colors.black};
  color: ${colors.white};
  border-radius: ${borderRadiuses.small};
  min-height: 200px;
  ${props.$expand === true ? `flex 1;` : ''}
  p {
    font-size: ${fontSizes.large};
    line-height: 1.5;
  }
  @media (min-width: ${screenBreakpoints.medium}) {
    p {
      font-size: calc(${fontSizes.large} + 0.6vw);
      font-weight: 500;
    }
  }
  
  ${
    typeof props.$background === 'object' && 'start' in props.$background && 'end' in props.$background
      ? `
    background: linear-gradient(90deg, ${props.$background.start}, ${props.$background.end});
  `
      : ''
  }
`,
);

const gap = `20px`;

const FeaturesColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${gap};
`;

const FeatureSetRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${gap};
  // on medium, display as 2 columns
  @media (min-width: ${screenBreakpoints.medium}) {
    flex-direction: row;
    > * {
      flex: 1;
    }
  }
`;

const CardTitle = styled(BaseCardTitle)`
  font-size: ${fontSizes.xlarge};
  @media (min-width: ${screenBreakpoints.medium}) {
    font-size: calc(${fontSizes.xlarge} + 1.5vw);
  }
`;

const FeatureCardInnerWrapper = styled(CardInnerWrapper)`
  justify-content: center;
`;
