import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { SectionTitle, SectionWrapper } from '../components/SectionWrapper';
import { CardInnerWrapper, CardTitle, StyledCard } from 'ui/components/Card';
import { colors, fontSizes } from 'ui/constants';
import { Container } from 'ui/components/Container';

const faqs = [
  {
    id: 1,
    question: 'What is Gnosis Pay Rewards?',
    answer: 'Rewards are the new way to make most of your Gnosis Pay card.',
  },
  {
    id: 3,
    question: 'How do I earn rewards?',
    answer: 'Rewards are earned by holding GNO in your Gnosis Pay wallet.',
  },
];

export function FAQsSection() {
  return (
    <StyledSectionWrapper
      style={{
        background: 'transparent',
      }}
    >
      <StyledContainer>
        <div
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        >
          <SectionTitle>FAQs</SectionTitle>
        </div>
        <StyledGrid>
          {faqs.map((item) => (
            <FAQEntry key={item.id} faq={item} />
          ))}
        </StyledGrid>
      </StyledContainer>
    </StyledSectionWrapper>
  );
}

function FAQEntry({ faq: { answer, question } }: { faq: (typeof faqs)[number] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <StyledGridItem className="faq-card" onClick={() => setIsOpen((prev) => !prev)}>
      <CardInnerWrapper>
        <CardTitle
          style={{
            margin: '0',
          }}
        >
          {question}
        </CardTitle>
        <AnimatePresence>
          <motion.div
            transition={{ duration: 0.2 }}
            variants={{
              open: { opacity: 1, height: 'auto' },
              closed: { opacity: 0, height: 0 },
            }}
            initial="closed"
            animate={isOpen ? 'open' : 'closed'}
          >
            <p>{answer}</p>
          </motion.div>
        </AnimatePresence>
      </CardInnerWrapper>
    </StyledGridItem>
  );
}

const StyledContainer = styled(Container)`
  padding-left: 20px;
  padding-right: 20px;
`;
const StyledSectionWrapper = styled(SectionWrapper)`
  min-height: 300px;
`;

const StyledGrid = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  gap: 20px;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;

  & p {
    padding-top: 10px;
    font-size: ${fontSizes.large};
  }
`;

const StyledGridItem = styled(StyledCard)`
  position: relative;
  overflow: hidden;
  background: ${colors.white};
  cursor: pointer;
  will-change: transform;
  color: ${colors.black};
  display: flex;
  justify-content: center;
  align-items: center;
`;
