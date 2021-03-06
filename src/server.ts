import express from 'express';
import { config } from 'config';
import Routes from 'routes';
import { startScheduleModule } from 'Schedule';
import { configDatabase } from 'common/influx-database';
import logger from 'common/logger';

const expressApp = express();
expressApp.set('port', config.get('app.port', 5005));
expressApp.set('hostname', config.get('app.host', 'localhost'));

async function startApplication() {
    const influxConnection = await configDatabase();
    expressApp.set('influx', influxConnection);

    expressApp.get('/robots.txt', Routes.robotsRouter);
    expressApp.use('/status', Routes.createStatusRouter());
    expressApp.use('/api', Routes.createApiRouter());
    await startScheduleModule(influxConnection);

    expressApp.listen(expressApp.get('port'), () => {
        logger.info(`Server is listening on port: ${expressApp.get('port')}`);

        logger.info(
            `App is running at http://${expressApp.get('hostname')}:${expressApp.get('port')} in ${expressApp.get('env')} mode`,
        );
    });
}


startApplication().catch((error) => {
    logger.error(error.message);
});
