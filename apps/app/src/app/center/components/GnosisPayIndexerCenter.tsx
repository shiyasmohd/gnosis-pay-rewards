'use client';
import { PendingRewardFieldsTypePopulated } from '@karpatkey/gnosis-pay-rewards-sdk';
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import dayjsrelativeTime from 'dayjs/plugin/relativeTime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from 'ui/components/Container';
import { toast } from 'sonner';
import { gnosisPayRewardsIndexerSocket as socket } from '../socket';

dayjs.extend(dayjsrelativeTime);

export function GnosisPayIndexerCenter() {
  const [recentPendingRewards, setRecentPendingRewards] = useState<PendingRewardFieldsTypePopulated[]>([]);

  const onConnectHandler = useCallback(() => {
    socket.emit('getRecentPendingRewards', 10);
    toast('Connected to the server', {});
  }, []);

  const onDisconnectHandler = useCallback(() => {
    // nothing to do for now
  }, []);

  useEffect(() => {
    socket.on('connect', onConnectHandler);
    socket.on('disconnect', onDisconnectHandler);
    socket.on('recentPendingRewards', (recentPendingRewards) => {
      setRecentPendingRewards(recentPendingRewards);
    });
    socket.on('newPendingReward', (newPendingReward) => {
      // Make sure the new pending reward is not already in the list
      if (recentPendingRewards.some((pendingReward) => pendingReward._id === newPendingReward._id)) {
        return;
      }
      setRecentPendingRewards((prev) => [newPendingReward, ...prev.slice(0, 9)]);
    });

    socket.on('connect_error', (error) => {
      console.error('connect_error', error);
      toast('Error connecting to the server', {});
    });

    return () => {
      socket.off('connect', onConnectHandler);
      socket.off('disconnect', onDisconnectHandler);
    };
  }, [onConnectHandler, onDisconnectHandler]);

  return (
    <Container
      style={{
        marginTop: '20px',
      }}
    >
      <header className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr_1fr] pb-4">
        <PlaceholderMetric />
        <PlaceholderMetric />
        <PlaceholderMetric />
        <PlaceholderMetric />
      </header>
      <section className="flex flex-col lg:flex-row justify-between gap-4"></section>
      {recentPendingRewards.length > 1 ? (
        // Other cycle log entries
        <div className="mb-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Recent Pending Rewards</h3>
          {recentPendingRewards.map((pendingReward) => {
            return <div className="mb-4" key={pendingReward?._id}></div>;
          })}
        </div>
      ) : null}
    </Container>
  );
}

const PlaceholderMetric = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Metric #1</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">Metric #1 Value</div>
    </CardContent>
  </Card>
);
