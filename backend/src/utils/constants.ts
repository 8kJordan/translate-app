
export const TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,

    // time metric to ms conversions
    msToMs: (n: number) => n,
    sToMs: (n: number) => n * 1000,
    mToMs: (n: number) => n * 60 * 1000,
    hToMs: (n: number) => n * 60 * 60 * 1000,
    dToMs: (n: number) => n * 24 * 60 * 60 * 1000,

    // time metric to s conversions
    msToS: (n: number) => n / 1000,
    sToS: (n: number) => n,
    mToS: (n: number) => n * 60,
    hToS: (n: number) => n * 60 * 60,
    dToS: (n: number) => n * 24 * 60 * 60,
}
