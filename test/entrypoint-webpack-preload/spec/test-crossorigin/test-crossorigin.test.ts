import { webpack } from "webpack";
import { getWebpackConfig } from "../../webpack-base-config";
import path from 'path';
import fs from 'fs';
import { expectSuccessfulBuild } from "../utils";
describe('HTMLWebpackInjectPreload test entry point webpack preload with cross origin loading', () => { 
    it('should add crossorigin attributions when wepack output crossOriginLoading is \'anonymous\'', done => {
        let config = getWebpackConfig('./fixtures/entry.js');
        if (config.output) {
            config.output.crossOriginLoading = 'anonymous';
        }
        const compiler = webpack(config);

        compiler.run((err, stats) => {
            expectSuccessfulBuild(err, stats);

            const html = fs.readFileSync(
                path.join(__dirname, 'dist/index.html'),
                'utf8',
            );
            const preloadRegex = /<link[^>]+rel=["']preload["'][^>]+as=["']([^"']+)["'][^>]*>/;
            const globalPreloadRegex = new RegExp(preloadRegex, "gm");
            const result = html.match(globalPreloadRegex);
            expect(result).not.toBeNull();
            expect(result?.length).toBe(2);
            
            const corssOriginRegex = /<link[^>]+rel=["']preload["'][^>]+crossorigin=["']([^"']+)["'][^>]*>/;
            const cssPreload = result![0].match(corssOriginRegex);
            expect(cssPreload![1]).toBe('anonymous');
            const jsPreload = result![1].match(corssOriginRegex);
            expect(jsPreload![1]).toBe('anonymous');
            done();
        });
    });

    it('should add crossorigin attributions when wepack output crossOriginLoading is \'use-credentials\'', done => {
        let config = getWebpackConfig('./fixtures/entry.js');
        if (config.output) {
            config.output.crossOriginLoading = 'use-credentials';
        }
        const compiler = webpack(config);

        compiler.run((err, stats) => {
            expectSuccessfulBuild(err, stats);

            const html = fs.readFileSync(
                path.join(__dirname, 'dist/index.html'),
                'utf8',
            );
            const preloadRegex = /<link[^>]+rel=["']preload["'][^>]+as=["']([^"']+)["'][^>]*>/;
            const globalPreloadRegex = new RegExp(preloadRegex, "gm");
            const result = html.match(globalPreloadRegex);
            expect(result).not.toBeNull();
            expect(result?.length).toBe(2);

            const corssOriginRegex = /<link[^>]+rel=["']preload["'][^>]+crossorigin=["']([^"']+)["'][^>]*>/;
            const cssPreload = result![0].match(corssOriginRegex);
            expect(cssPreload![1]).toBe('use-credentials');
            const jsPreload = result![1].match(corssOriginRegex);
            expect(jsPreload![1]).toBe('use-credentials');
            done();
        });
    });
 })