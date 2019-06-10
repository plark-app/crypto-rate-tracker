import Schedule from 'node-schedule';
import { InfluxDB } from 'influx';
import logger from 'common/logger';
import Jobs from './schedule-jobs';


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


export const startSheduleModule = (influxConnection: InfluxDB) => {
    Schedule.scheduleJob('0 */30 * * * *', wrapSheduleCallback(
        'updateFiatTickers',
        Jobs.updateFiatTickers(influxConnection),
    ));


    Schedule.scheduleJob('0 */5 * * * *', wrapSheduleCallback(
        'updateCryptoTickers',
        Jobs.updateCryptoTickers(influxConnection),
    ));
};
