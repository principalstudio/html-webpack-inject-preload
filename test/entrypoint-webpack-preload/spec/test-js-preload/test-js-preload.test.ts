import webpack from 'webpack';
import { getWebpackConfig } from '../../webpack-base-config';
import path from 'path';
import fs from 'fs';

describe('HTMLWebpackInjectPreload test entry point webpack preload', () => {
    it('should add preload link tag for js await imported by initial chunk, with \'script\ as attribute', done => {
        const config = getWebpackConfig('./fixtures/entry.js');
        const compiler = webpack(config);

        compiler.run((err, stats) => {
            if (err) expect(err).toBeNull();
            
            const statsErrors = stats ? stats.compilation.errors : [];
            if (statsErrors.length > 0) {
                console.error(statsErrors);
            }
            expect(statsErrors.length).toBe(0);
            const html = fs.readFileSync(
                path.join(__dirname, 'dist/index.html'),
                'utf8',
            );
            // capture 'as' attribute
            const preloadRegex = /<link[^>]+rel=["']preload["'][^>]+as=["']([^"']+)["'][^>]*>/m
            const result = html.match(preloadRegex);
            expect(result).not.toBeNull();
            expect(result![1]).toBe('script')
            done();
        });
    });
});