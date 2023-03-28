import { Stats } from "webpack";
export function expectSuccessfulBuild(err: Error | null | undefined, stats?: Stats) {
    if (err) expect(err).toBeNull();
    const statsErrors = stats ? stats.compilation.errors : [];
    if (statsErrors.length > 0) {
        console.error(statsErrors);
    }
    expect(statsErrors.length).toBe(0);
}