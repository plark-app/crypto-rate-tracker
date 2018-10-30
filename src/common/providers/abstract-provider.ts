import { InfluxDB, IPoint } from 'influx';

export default abstract class AbstractProvider {
    protected influxDatabase: InfluxDB;

    public constructor(influxDatabase: InfluxDB) {
        this.influxDatabase = influxDatabase;
    }

    public async writePoints(points: IPoint[]): Promise<void> {
        return await this.influxDatabase.writePoints(points);
    }
}
