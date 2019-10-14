import { InfluxDB } from 'influx';
import Schedule from 'node-schedule';
import logger from 'common/logger';
import Jobs from './ScheduleJobs';

function wrapSheduleCallback(key: string, callback: (fireDate: Date) => any): any {
    return async (fireDate: Date) => {
        try {
            const response = callback(fireDate);

            if (response instanceof Promise) {
                await response;
            }
        } catch (error) {
            logger.info(`Error with ${key} on ${fireDate.toISOString()}: ${error.message}`);
            logger.error(error);
        }
    };
}

export function startSheduleModule(influxConnection: InfluxDB): void {
    Schedule.scheduleJob('0 */30 * * * *', wrapSheduleCallback(
        'updateFiatTickers',
        Jobs.UpdateFiatTickersJob(influxConnection),
    ));

    Schedule.scheduleJob('0 */5 * * * *', wrapSheduleCallback(
        'updateCryptoTickers',
        Jobs.UpdateCryptoTickersJob(influxConnection),
    ));
}
