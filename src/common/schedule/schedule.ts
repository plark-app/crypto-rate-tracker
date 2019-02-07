import Schedule from 'node-schedule';
import { InfluxDB } from 'influx';

import Jobs from './schedule-jobs';


export const startSheduleModule = (influxConnection: InfluxDB) => {
    Schedule.scheduleJob('0 30 * * * *', Jobs.updateFiatTickers(influxConnection));
    Schedule.scheduleJob('0 */10 * * * *', Jobs.updateCryptoTickers(influxConnection));
};
