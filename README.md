# HTML Webpack Inject Preload
A [HTML Webpack Plugin](https://github.com/jantimon/html-webpack-plugin) for injecting &lt;link rel='preload'>

This plugin allows to add preload links anywhere you want.

# Installation

You need to have HTMLWebpackPlugin v4 to make this plugin work.

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
          match: /.*\.woff2/,
          attributes: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: true },
        },
        {
          match: /vendors\.[a-z-0-9]*.css/,
          attributes: { rel: 'preload', as: 'style' },
        },
      ],
    })
  ]
}
```


**HTML file**

Add `<!-- html-webpack-inject-preload -->` to indicate where to inject preload links.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Webpack App</title>
    <!-- html-webpack-inject-preload -->
    <link href="dist/main.css">
  </head>
  <body>
    <script src="index_bundle.js"></script>
  </body>
</html>
```