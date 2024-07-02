import styled from 'styled-components';

// import workshopStarsURL from '../images/workshop-stars.svg';
import { Container } from 'ui/components/Container';
import { Perspective } from '../components/Perspective';
import { SectionWrapper } from '../components/SectionWrapper';
import { Header } from '../components/Header';
import { colors, fontSizes, screenBreakpoints } from 'ui/constants';

export function HeroSection() {
  return (
    <SectionWrapper>
      <Header />
      <StyledHeroContainer>
        <StyledHeroText>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Introducing Gnosis Pay Rewards
          </h1>
          <SubPerspective>For the owls living on the chain</SubPerspective>
        </StyledHeroText>
      </StyledHeroContainer>
    </SectionWrapper>
  );
}

const SubPerspective = styled.h3`
  color: ${colors.white};
  font-size: 1.25rem;
  font-weight: 400;
  text-align: center;
  @media (min-width: ${screenBreakpoints.medium}) {
    font-size: calc(5px + 1.6vw);
  }
`;

const StyledHeroText = styled.div`
  color: #f6ebd8;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 4.1875em;
  padding-bottom: 11.4em;
  display: flex;
  position: relative;
  z-index: 3;
  height: 600px;
  @media (min-width: ${screenBreakpoints.medium}) {
    height: 100px;
  }
`;

const StyledHeroContainer = styled(Container)`
  max-width: 1700px;

  & img {
    max-width: 100%;
    vertical-align: middle;
    display: inline-block;
  }

  & .rainbow-l {
    z-index: 2;
    width: 108.938em;
    max-width: none;
    position: absolute;
    top: auto;
    bottom: -19.8em;
    left: -17.5em;
    left: -25.5em;
    right: auto;
  }

  & .rainbow-r {
    width: 73.5625em;
    position: absolute;
    top: -37.4em;
    bottom: auto;
    left: auto;
    right: -11.8em;
    z-index: 2;
  }

  & .stars {
    width: 150.189em;
    max-width: none;
    position: absolute;
    top: 3.7em;
    bottom: auto;
    left: -27.5em;
    right: auto;
  }

  & .orbs {
    width: 149.438em;
    max-width: none;
    position: absolute;
    top: 1.9em;
    bottom: auto;
    left: -29em;
    right: auto;
  }
`;

const StyledLearnMoreButton = styled.button`
  margin-top: 16px;
  background: transparent;
  border: none;
  outline: none;
  user-select: none;
  color: ${colors.white};
  font-size: ${fontSizes.xxlarge};
  font-weight: 600;

  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
`;
