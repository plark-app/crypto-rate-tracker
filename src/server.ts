import express from 'express';
import { config } from 'config';
import { createApiRouter } from 'routes';
import { ConsoleColor } from 'common/console';
import { configDatabase } from 'common/influx-database';

const expressApp = express();
expressApp.set('port', config.get('app.port', 5005));
expressApp.set('hostname', config.get('app.host', 'localhost'));



async function startApplication() {

    const influxConnection = await configDatabase();

    expressApp.use('/api', createApiRouter(influxConnection));

    expressApp.listen(expressApp.get('port'), () => {
        console.log(`${ConsoleColor.FgYellow}Server is listening on port: ${expressApp.get('port')}`, ConsoleColor.Reset);

        console.log(
            '%sApp is running at http://%s:%d in %s mode %s',
            ConsoleColor.FgGreen,
            expressApp.get('hostname'),
            expressApp.get('port'),
            expressApp.get('env'),
            ConsoleColor.Reset,
        );
        console.log();
    });
}


startApplication().catch((error) => {
    console.error(error.message);
    console.log();
});
