import { SectionWrapper } from '../components/SectionWrapper';
import { Container } from 'ui/components/Container';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const linearGradientDirection = '0deg';
const backgroundStartPercentage = 20;
const backgroundEndPercentage = 60;

const tiers = [
  {
    id: 'barn-owl',
    name: 'Barn Owl',
    description: 'Earn 1% cashback with a balance of 0.1 GNO',
    color: '#F4A460',
    background: {
      start: `rgba(0,0,0,1) ${backgroundStartPercentage}%`,
      end: `rgba(244,164,96,1) ${backgroundEndPercentage}%`,
    },
  },
  {
    id: 'screech-owl',
    name: 'Screech Owl',
    description: 'Earn 2% cashback with a balance of 1 GNO',
    color: '#FF6347',
    background: {
      start: `rgba(0,0,0,1) ${backgroundStartPercentage}%`,
      end: `rgba(255,99,71,1) ${backgroundEndPercentage}%`,
    },
  },
  {
    id: 'snowy-owl',
    name: 'Snowy Owl',
    description: 'Earn 3% cashback with a balance of 10 GNO',
    color: '#87CEFA',
    background: {
      start: `rgba(0,0,0,1) ${backgroundStartPercentage}%`,
      end: `rgba(139,206,250,1) ${backgroundEndPercentage}%`,
    },
  },
  {
    id: 'great-horned-owl',
    name: 'Hoot Owl',
    description: 'Earn 4% cashback with a balance of 100 GNO',
    color: '#00BFFF',
    background: {
      start: `rgba(0,0,0,1) ${backgroundStartPercentage}%`,
      end: `rgba(0,191,255,1) ${backgroundEndPercentage}%`,
    },
  },
];

export function RewardsTiersSection() {
  return (
    <SectionWrapper
      id="key-features"
      style={{
        background: 'transparent',
      }}
    >
      <header className="py-10">
        <h2 className="text-white scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">Pick an Owl</h2>
      </header>
      <StyledContainer>
        <div className="flex flex-col gap-4 md:flex-row">
          {tiers.map((tier) => {
            return (
              <Card
                key={tier.id}
                style={{
                  // backgroundColor: tier.color,
                  borderColor: 'black',
                  background: `linear-gradient(${linearGradientDirection}, ${tier.background.start}, ${tier.background.end})`,
                  // background: `linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,191,255,1) 30%)`,
                }}
              >
                <CardHeader className="min-h-[200px]">
                  <h3 className="scroll-m-20 text-2xl tracking-tight font-bold">{tier.name.replace('Owl', '')}</h3>
                  <h4>{tier.description}</h4>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full" variant="default">
                    Start earning
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </StyledContainer>
    </SectionWrapper>
  );
}

const StyledContainer = styled(Container)`
  text-align: center;
  padding-bottom: 100px;
`;
