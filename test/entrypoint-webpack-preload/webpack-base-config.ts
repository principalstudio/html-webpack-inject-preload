import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack, { WebpackPluginInstance } from 'webpack';
import path from 'path';
import HtmlWebpackInjectPreload from '../../src/main';
export function getWebpackConfig(fixtureEntryPath: string) {
    const fixtureOutputPath = 'dist/';
    const entry = path.join(require.main?.path ?? __dirname, fixtureEntryPath);
    const config: webpack.Configuration = {
        mode: 'production',
        entry,
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: [MiniCssExtractPlugin.loader, 'css-loader'],
                },
                {
                    test: /\.(woff|woff2)$/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                name: '[name].[ext]',
                                limit: 8192,
                            },
                        },
                    ],
                },
            ],
        },
        output: {
            path: path.join(require.main?.path ?? __dirname, fixtureOutputPath),
            publicPath: '',
        },
        plugins: [
            new MiniCssExtractPlugin() as WebpackPluginInstance,
            new HtmlWebpackPlugin(),
            new HtmlWebpackInjectPreload({ entryPointWebpackPreload: true }),
        ],
    };

    return config
}