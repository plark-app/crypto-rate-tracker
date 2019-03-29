import express from 'express';
import { config } from 'config';
import Routes from 'routes';
import { ConsoleColor } from 'common/console';
import { configDatabase } from 'common/influx-database';
import { startSheduleModule } from 'common/schedule';
import logger from 'common/logger';

const expressApp = express();
expressApp.set('port', config.get('app.port', 5005));
expressApp.set('hostname', config.get('app.host', 'localhost'));

async function startApplication() {
    const influxConnection = await configDatabase();
    expressApp.set('influx', influxConnection);

    expressApp.get('/status', Routes.createStatusRouter());
    expressApp.use('/api', Routes.createApiRouter());
    await startSheduleModule(influxConnection);

    expressApp.listen(expressApp.get('port'), () => {
        logger.info(`${ConsoleColor.FgYellow}Server is listening on port: ${expressApp.get('port')}`, ConsoleColor.Reset);

        logger.info(
            '%sApp is running at http://%s:%d in %s mode %s',
            ConsoleColor.FgGreen,
            expressApp.get('hostname'),
            expressApp.get('port'),
            expressApp.get('env'),
            ConsoleColor.Reset,
        );
    });
}


startApplication().catch((error) => {
    logger.error(error.message);
});
