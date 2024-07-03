import dayjsCore from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjsCore.extend(dayjsUtc);
dayjsCore.extend(updateLocale);
// dayjsCore.locale('en', {
//   weekStart: 1,
// });

export const dayjs = dayjsCore;
