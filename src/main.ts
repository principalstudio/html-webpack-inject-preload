import HtmlWebpackPlugin from 'html-webpack-plugin';
import {compilation, Compiler, Plugin} from 'webpack';

declare namespace HtmlWebpackInjectPreload {
  interface Options {
    excludeOutputNames: RegExp[];
    files: HtmlWebpackInjectPreload.File[];
  }

  interface File {
    match: RegExp;
    attributes: Record<string, string | boolean>;
  }
}

interface HtmlWebpackPluginData {
  html: string;
  outputName: string;
  plugin: HtmlWebpackPlugin;
}

/**
 * Inject preload files before the content of the targeted files
 *
 * @example
 * new HtmlWebpackInjectPreload({
 *  excludeOutputNames: [/scripts-hashed/],
 *  files: [
 *    {
 *      match: /.*\.woff2/,
 *      attributes: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: true },
 *    },
 *    {
 *      match: /vendors\.[a-z-0-9]*.css/,
 *      attributes: { rel: 'preload', as: 'style' },
 *    },
 *  ],
 * })
 *
 * @class InjectPreloadFiles
 */
class HtmlWebpackInjectPreload implements Plugin {
  options: HtmlWebpackInjectPreload.Options = {
    excludeOutputNames: [],
    files: [],
  };

  /**
   * Creates an instance of HtmlWebpackInjectPreload.
   *
   * @memberof InjectPreloadFiles
   */
  constructor(options: HtmlWebpackInjectPreload.Options) {
    this.options = Object.assign(this.options, options);
  }

  private checkMatch(regexpArray: RegExp[], value: string) {
    return regexpArray.some(function (regexp) {
      return regexp.test(value);
    });
  }

  public generateLink(href: string) {
    const linkAttributes: string[] = [];

    for (let index = 0; index < this.options.files.length; index++) {
      const file = this.options.files[index];

      if (file.match.test(href)) {
        const hasHref = Object.keys(file.attributes).includes('href');
        if (!hasHref) {
          linkAttributes.push(`href="${href}"`);
        }

        for (const attribute in file.attributes) {
          if (
            Object.prototype.hasOwnProperty.call(file.attributes, attribute)
          ) {
            const value = file.attributes[attribute];
            if (value === true) {
              linkAttributes.push(`${attribute}`);
            } else if (value !== false) {
              linkAttributes.push(`${attribute}="${value}"`);
            }
          }
        }

        return linkAttributes.length > 0
          ? `<link ${linkAttributes.join(' ')}>`
          : false;
      }
    }

    return false;
  }

  private addLinks(
    compilation: compilation.Compilation,
    htmlPluginData: HtmlWebpackPluginData,
  ) {
    const options = this.options;
    const links: string[] = [];

    // Bail out early if we're configured to exclude this file.
    if (
      this.checkMatch(
        options.excludeOutputNames,
        // @ts-ignore
        htmlPluginData.plugin.options.filename,
      )
    ) {
      return htmlPluginData;
    }

    const files = new Set(Object.keys(compilation.assets));
    compilation.chunks.forEach(chunk => {
      chunk.files.forEach((file: string) => files.add(file));
    });

    files.forEach(file => {
      const link = this.generateLink(file);
      if (link) links.push(link);
    });

    htmlPluginData.html = htmlPluginData.html.replace(
      '<!-- html-webpack-inject-preload -->',
      links.join(''),
    );

    return htmlPluginData;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('HtmlWebpackInjectPreload', compilation => {
      // @ts-ignore
      const hook = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing
        ? // @ts-ignore
          compilation.hooks.htmlWebpackPluginAfterHtmlProcessing
        : HtmlWebpackPlugin.getHooks(compilation).beforeEmit;

      hook.tapAsync(
        'HtmlWebpackInjectPreload',
        (htmlPluginData: HtmlWebpackPluginData, callback: any) => {
          try {
            callback(null, this.addLinks(compilation, htmlPluginData));
          } catch (error) {
            callback(error);
          }
        },
      );
    });
  }
}

export = HtmlWebpackInjectPreload;
