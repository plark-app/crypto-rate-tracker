declare global {
    type ConfigValue = object | string | number | null | undefined;

    type AppConfigUnit = {
        host: string;
        port: number;
        secure: boolean;
    };

    type DatabaseConfigUnit = {
        influx: {
            host: string;
            database: string;
            port?: number;
            protocol?: 'http' | 'https';
        }
    };

    type CurrencyConfigUnit = {
        fiats: string[];
        coins: string[];
        coin_aliases: Record<string, string>;
        currencyconverterapi: {
            apiKey: string;
        };
    };

    type ConfigUnits =
        Record<string, ConfigValue>
        | AppConfigUnit
        | DatabaseConfigUnit
        | CurrencyConfigUnit;

    type ApplicationConfig = Record<string, ConfigUnits>;

    type AnyFunc = (...args: any[]) => any;
}

export {};
