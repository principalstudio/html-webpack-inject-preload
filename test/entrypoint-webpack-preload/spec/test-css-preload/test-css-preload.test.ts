import webpack from 'webpack';
import { getWebpackConfig } from '../../webpack-base-config';
import path from 'path';
import fs from 'fs';
import { mergeWithCustomize, customizeArray, merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';

describe('HTMLWebpackInjectPreload test entry point webpack preload for css', () => {
    it('should add preload link tag for css await imported by initial chunk, with \'style\ as attribute', done => {
        let config = getWebpackConfig('./fixtures/entry.js');
        const htmlWebpackPlugin = config.plugins?.find(ele => ele.constructor && ele.constructor.name === 'HtmlWebpackPlugin') as HtmlWebpackPlugin;
        htmlWebpackPlugin.userOptions.template = path.join(__dirname, './fixtures/index.html')    
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
            const preloadRegex = /<link[^>]+rel=["']preload["'][^>]+as=["']([^"']+)["'][^>]*>/;
            const globalPreloadRegex = new RegExp(preloadRegex, "gm");
            const result = html.match(globalPreloadRegex);
            expect(result).not.toBeNull();
            expect(result?.length).toBe(2);
            const cssPreload = result![0].match(preloadRegex);
            expect(cssPreload![1]).toBe('style');
            const jsPreload = result![1].match(preloadRegex);
            expect(jsPreload![1]).toBe('script');
            done();
        });
    });
});