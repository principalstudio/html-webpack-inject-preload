[![npm](https://img.shields.io/npm/dw/@principalstudio/html-webpack-inject-preload)](https://www.npmjs.com/package/@principalstudio/html-webpack-inject-preload) [![node-current](https://img.shields.io/node/v/@principalstudio/html-webpack-inject-preload)](https://nodejs.org/)



# HTML Webpack Inject Preload
A [HTML Webpack Plugin](https://github.com/jantimon/html-webpack-plugin) for injecting [&lt;link rel='preload'>](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content)

This plugin allows to add preload links anywhere you want.

# Installation

You need to have HTMLWebpackPlugin v4 or v5 to make this plugin work.

```
npm i -D @principalstudio/html-webpack-inject-preload
```

**webpack.config.js**

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInjectPreload = require('@principalstudio/html-webpack-inject-preload');

module.exports = {
  entry: 'index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index_bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new HtmlWebpackInjectPreload({
      files: [
        {
          match: /.*\.woff2$/,
          attributes: {as: 'font', type: 'font/woff2', crossorigin: true },
        },
        {
          match: /vendors\.[a-z-0-9]*.css$/,
          attributes: {as: 'style' },
        },
      ]
    })
  ]
}
```

**Options**

* files: An array of files object
  * match: A regular expression to target files you want to preload
  * attributes: Any attributes you want to use. The plugin will add the attribute `rel="preload"` by default.

**Usage**

The plugin is really simple to use. The plugin injects in `headTags`, before any link, the preload elements.

For example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Webpack App</title>
    <%= htmlWebpackPlugin.tags.headTags %>
  </head>
  <body>
    <script src="index_bundle.js"></script>
  </body>
</html>
```

will generate

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Webpack App</title>
    <link href="dist/fonts/font.woff2" rel="preload" type="font/woff2" crossorigin>
    <link href="dist/css/main.css">
  </head>
  <body>
    <script src="index_bundle.js"></script>
  </body>
</html>
```
