import Influx, { InfluxDB, FieldType } from 'influx';
import config from 'config';

export enum Measurements {
    FiatRate = 'fiat_rates',
    CryptoRate = 'crypto_rates'
}

export enum Tags {
    Symbol = 'symbol',
    CoinSymbol = 'coin_symbol',
}


const databaseSchema: Influx.ISchemaOptions[] = [
    {
        measurement: Measurements.FiatRate,
        fields: {
            // This rate is only to USD. UAH/USD, EUR/USD, PHP/USD, etc.
            rate: FieldType.FLOAT,
        },
        tags: [
            // We will have currency symbol as EUR, PHP, UAH, RUR, CNY, YAY, etc.
            Tags.Symbol,
        ],
    },
    {
        measurement: Measurements.CryptoRate,
        fields: {
            // This rate of cryptocurrency to .
            rate: FieldType.FLOAT,
        },
        tags: [
            // A tag for cryptocurrency symbols like BTC, ETH, DASH, etc.
            Tags.CoinSymbol,

            // A tag for quote symbols. BTC, EUR, PHP, UAH, RUR, CNY, YAY, etc.
            Tags.Symbol,
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
