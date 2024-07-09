'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ExternalLink as ExternalLinkIcon, Edit as EditAddressLabelIcon } from 'react-feather';
import { styled } from 'styled-components';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { colors } from 'ui/constants';
import { ButtonInlineLoader } from 'components/Loader';
import { gnosis } from 'viem/chains';

export type ViewAddressOnExplorerLinkButtonPropsType = {
  href: string;
  title?: string;
  show?: boolean;
  label: string;
  /**
   * The label to show for the address
   */
  addressLabel?: string;
  /**
   * If true, the label will be shown as a suggestion
   */
  allowSuggestLabel?: boolean;
  /**
   * The token logo URI
   */
  tokenLogoURI?: string;
};

export function ViewAddressOnExplorerLinkButton({
  href,
  title,
  label,
  addressLabel,
  allowSuggestLabel = false,
  tokenLogoURI,
}: ViewAddressOnExplorerLinkButtonPropsType) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <StyledHref
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        // Anchor props
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
      >
        <div className="flex items-center content-center gap-2">
          {tokenLogoURI ? <img src={tokenLogoURI} alt={label} className="w-6 h-6 rounded-full" /> : null}
          <span>{label}</span>
          <StyledMotionIconContainer
            // Motion props
            variants={{
              hover: {
                opacity: 1,
                y: 0,
              },
              initial: {
                opacity: 0,
                y: 4,
              },
            }}
            initial="initial"
            animate={isHovered === true ? 'hover' : 'initial'}
          >
            <ExternalLinkIcon size={16} stroke={colors.white} />
          </StyledMotionIconContainer>
        </div>
      </StyledHref>
      {allowSuggestLabel === true ? (
        <UpdateAddressLabelDialogForm address={href} chainId={gnosis.id} label={addressLabel} />
      ) : null}
    </>
  );
}

const UpdateAddressLabelFormSchema = z.object({
  label: z
    .string()
    .min(2, {
      message: 'Label must be at least 3 characters long',
    })
    .max(64, {
      message: 'Label must be at most 64 characters long',
    }),
  address: z.string().min(42, { message: 'Address must be at least 42 characters long' }),
  chainId: z.number().min(1),
});

export function UpdateAddressLabelDialogForm({
  address,
  chainId,
  label,
}: {
  address: string;
  chainId: number;
  label?: string;
  onUpdated?: (newLabel: string) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof UpdateAddressLabelFormSchema>>({
    resolver: zodResolver(UpdateAddressLabelFormSchema),
    defaultValues: {
      label: label ?? '',
      address,
      chainId,
    },
  });

  function onSubmit(data: z.infer<typeof UpdateAddressLabelFormSchema>) {
    console.log(data);

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsDialogOpen(false);
    }, 2000);
  }

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (isOpen === true) {
          form.reset();
        }
      }}
      open={isDialogOpen}
    >
      <DialogTrigger
        title="Suggest a label for this address"
        onClick={() => {
          setIsDialogOpen(true);
        }}
      >
        <EditAddressLabelIcon size={16} stroke={colors.white} />
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Suggest Address Label</DialogTitle>
            </DialogHeader>
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Address label" {...field} />
                  </FormControl>
                  <FormDescription>Label will be available for everyone using this UI.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                <ConnectorButtonInnerLayout>
                  <ButtonInlineLoader show={isLoading} color={colors.black} />
                  <span className="ml-2">Save label</span>
                </ConnectorButtonInnerLayout>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const StyledHref = styled.a`
  &,
  &:hover,
  &:focus,
  &:active,
  &:visited {
    text-decoration: none;
    color: ${colors.white};
  }
`;

const StyledMotionIconContainer = styled(motion.div)`
  display: flex;
  flex-direction: row;
`;

export const ConnectorButtonInnerLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  & > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  & > div[data-content='logo'] {
    width: 20px;
    height: 20px;
  }
`;
