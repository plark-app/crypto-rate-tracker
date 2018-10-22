import Influx, { InfluxDB, FieldType } from 'influx';
import config from 'config';

export enum Measurements {
    FiatRate = 'fiat_rates',
    CryptoRate = 'crypto_rates'
}

export enum Tags {
    Asset = 'asset',
    Quote = 'quote'
}


const databaseSchema: Influx.ISchemaOptions[] = [
    {
        measurement: Measurements.FiatRate,
        fields: {
            usd_rate: FieldType.FLOAT,
        },
        tags: [
            Tags.Asset,
        ],
    },
    {
        measurement: Measurements.CryptoRate,
        fields: {
            rate: FieldType.FLOAT,
        },
        tags: [
            Tags.Asset,
            Tags.Quote,
        ],
    },
];


export const configDatabase = async (): Promise<InfluxDB> => {

    const dbConfig = config.get<DatabaseConfigUnit>('database');

    if (!dbConfig || !dbConfig.influx) {
        throw new Error('DatabaseConfig must be defined!');
    }

    const dbName = dbConfig.influx.database;

    const influxDatabase: InfluxDB = new InfluxDB({
        host: dbConfig.influx.host,
        port: dbConfig.influx.port,
        protocol: dbConfig.influx.protocol,
        database: dbName,

        schema: databaseSchema,
    });

    const actualDatabases: string[] = await influxDatabase.getDatabaseNames();

    if (actualDatabases.indexOf(dbName) < 0) {
        await influxDatabase.createDatabase(dbName);
    }

    return influxDatabase;
};
