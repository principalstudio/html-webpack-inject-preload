import HtmlWebpackInjectPreload from '../src/main';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack, { WebpackPluginInstance } from 'webpack';
import path from 'path';
import fs from 'fs';

const options: HtmlWebpackInjectPreload.Options = {
  files: [
    {
      match: /.*\.woff2/,
      attributes: {
        as: 'font',
        type: 'font/woff2',
        crossorigin: true,
      },
    },
    {
      match: /.*\.css/,
      attributes: {as: 'style', href: 'test-alt.css'},
    },
    {
      match: /.*\.null/,
      attributes: {href: false},
    },
  ],
};

describe('HTMLWebpackInjectPreload', () => {
  it('webpack plugin', done => {
    const compiler = webpack({
      entry: path.join(__dirname, 'entry.js'),
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
        path: path.join(__dirname, 'dist'),
        publicPath: path.resolve(__dirname),
      },
      plugins: [
        new MiniCssExtractPlugin() as WebpackPluginInstance,
        new HtmlWebpackPlugin(),
        new HtmlWebpackInjectPreload(options),
      ],
    });
    compiler.run((err, stats) => {
      if (err) expect(err).toBeNull();

      const statsErrors = stats ? stats.compilation.errors : [];
      if (statsErrors.length > 0) {
        console.error(statsErrors);
      }
      expect(statsErrors.length).toBe(0);

      const result = fs.readFileSync(
        path.join(__dirname, 'dist/index.html'),
        'utf8',
      );
      const expected = fs.readFileSync(
        path.join(__dirname, 'expected.html'),
        'utf8',
      );
      expect(expected).toBe(result);
      done();
    });
  });
});
