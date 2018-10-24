export function convertPercent(value: number): number {
    return Math.round(value * 1000000) / 10000;
}

export function floorSatosi(value: number): number {
    return Math.floor(value * 100000000) / 100000000;
}

export function floorUsd(value: number): number {
    return Math.floor(value * 10000) / 10000;
}
