import dayjsCore from 'dayjs';
import dayjsUtcPlugin from 'dayjs/plugin/utc.js';
import updateLocalePlugin from 'dayjs/plugin/updateLocale.js';

dayjsCore.extend(dayjsUtcPlugin);
dayjsCore.extend(updateLocalePlugin);
// dayjsCore.locale('en', {
//   weekStart: 1,
// });

export const dayjs = dayjsCore;
