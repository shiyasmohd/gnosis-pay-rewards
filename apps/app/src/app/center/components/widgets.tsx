import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import numeral from 'numeral';

export function VolumeThisWeekWidget({ volume }: { volume?: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Volume this week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof volume === 'number' ? numeral(volume).format(`$0,0`) : '-'}</div>
      </CardContent>
    </Card>
  );
}

export function CurrentWeekWidget({ currentWeek }: { currentWeek?: string }) {
  // Current week of the program start

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof currentWeek === 'string' ? `Week ${currentWeek}` : '-'}</div>
      </CardContent>
    </Card>
  );
}

export function CurrentOwlsThisWeekWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Owls This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">-</div>
      </CardContent>
    </Card>
  );
}

export function EstiamtedPayoutThisWeekWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Estimated Payout</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">-</div>
      </CardContent>
    </Card>
  );
}
