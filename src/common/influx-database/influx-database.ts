import Influx, { InfluxDB, FieldType } from 'influx';
import config from 'config';

export enum Measurements {
    FiatPrice = 'fiat_prices',
    CryptoPrice = 'crypto_prices'
}

export enum Tags {
    Symbol = 'symbol',
    SymbolQuote = 'symbol_quote',
}


const databaseSchema: Influx.ISchemaOptions[] = [
    {
        measurement: Measurements.FiatPrice,
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
        measurement: Measurements.CryptoPrice,
        fields: {
            // This rate of cryptocurrency to .
            rate: FieldType.FLOAT,
        },
        tags: [
            // A tag for cryptocurrency symbols like BTC, ETH, DASH, etc.
            Tags.Symbol,

            // A tag for quote symbols. BTC, EUR, PHP, UAH, RUR, CNY, YAY, etc.
            Tags.SymbolQuote,
        ],
    },
];


export const configDatabase = async (): Promise<InfluxDB> => {

    const dbConfig = config.get<DatabaseConfigUnit>('database');

    if (!dbConfig || !dbConfig.influx) {
        throw new Error('DatabaseConfig must be deёfined!');
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
