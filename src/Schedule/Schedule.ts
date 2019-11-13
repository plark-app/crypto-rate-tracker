import { InfluxDB } from 'influx';
import Schedule from 'node-schedule';
import logger from 'common/logger';
import Jobs from './ScheduleJobs';

function wrapScheduleCallback(key: string, callback: (fireDate: Date) => any): any {
    return async (fireDate: Date) => {
        logger.info(`Start schedule [${key}]`);
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

export function startScheduleModule(influxConnection: InfluxDB): void {
    Schedule.scheduleJob('0 */30 * * * *', wrapScheduleCallback(
        'updateFiatTickers',
        Jobs.UpdateFiatTickersJob(influxConnection),
    ));

    Schedule.scheduleJob('0 */5 * * * *', wrapScheduleCallback(
        'updateCryptoTickers',
        Jobs.UpdateCryptoTickersJob(influxConnection),
    ));
}
