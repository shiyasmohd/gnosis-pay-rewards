import { useWeb3 } from 'hooks/useWeb3';
import { useMemo } from 'react';
import { useEnsAvatar } from 'wagmi';
// @ts-ignore
import Identicon from 'identicon.js';

export function ConnectedAccountImage() {
  const { account } = useWeb3();
  // Attempt to get the user's ENS name and avatar
  const { data: accountENSAvatarImageURL, isLoading } = useEnsAvatar();

  const identiconImageURL = useMemo(() => {
    if (account) {
      const data = new Identicon(account, {
        background: [0, 0, 0, 255], // rgba black
        foreground: [255, 255, 255, 255], // rgba white
        margin: 0.2, // 20% margin
        size: 100, // 420px square
        format: 'png',
      }).toString();
      return `data:image/png;base64,${data}`;
    }
  }, [account]);

  const accountImageURL = useMemo(() => {
    if (accountENSAvatarImageURL !== undefined && accountENSAvatarImageURL !== null && !isLoading) {
      return accountENSAvatarImageURL;
    }

    return identiconImageURL;
  }, [accountENSAvatarImageURL, isLoading]);

  return (
    <img
      style={{
        borderRadius: '999999px',
        width: '40px',
        height: '40px',
      }}
      src={accountImageURL}
      alt="Connected account"
    />
  );
}
