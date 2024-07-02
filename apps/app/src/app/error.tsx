'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Container, ContainerHeader, FlexContainer } from 'ui/components/Container';
import { PageLayout } from 'layout';
import { Card, CardInnerWrapper } from 'ui/components/Card';

export default function ErrorPage({ error }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return <ErrorContent error={error} />;
}

function ErrorContent({ error }: { error: Error | { error: Error } }) {
  let errorDetails = '';

  if (error instanceof Error) {
    errorDetails = error.stack ? error.stack : error.message;
  } else if ((error as any)?.error instanceof Error) {
    errorDetails = error.error.stack ? error.error.stack : error.error.message;
  }

  // If the error is a 404, show a different page
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (error.status === 404) {
    return (
      <PageLayout>
        <Container>
          <ContainerHeader title="Page not found" />
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout contentLayout="flex-center">
      <Container>
        <FlexContainer>
          <ContainerHeader title="Something went wrong" />
          <Card>
            <CardInnerWrapper>
              <p>We&apos;re sorry, something went wrong.</p>
              <code>{errorDetails}</code>
            </CardInnerWrapper>
          </Card>
        </FlexContainer>
      </Container>
    </PageLayout>
  );
}
