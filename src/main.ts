import type {
  default as HtmlWebpackPluginInstance,
  HtmlTagObject,
} from 'html-webpack-plugin';
import type {Compilation, Compiler, WebpackPluginInstance} from 'webpack';

declare namespace HtmlWebpackInjectPreload {
  interface Options {
    files: HtmlWebpackInjectPreload.File[];
  }

  interface File {
    match: RegExp;
    attributes: Record<string, string | boolean>;
  }
}

interface HtmlWebpackPluginData {
  headTags: Array<HtmlTagObject | HtmlTagObject>;
  bodyTags: Array<HtmlTagObject | HtmlTagObject>;
  outputName: string;
  plugin: HtmlWebpackPluginInstance;
}

/**
 * Inject preload files before the content of the targeted files
 *
 * @example
 * new HtmlWebpackInjectPreload({
 *  files: [
 *    {
 *      match: /.*\.woff2/,
 *      attributes: { rel: 'preload', as: 'font', type: 'font/woff2',
 * crossorigin: true },
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
class HtmlWebpackInjectPreload implements WebpackPluginInstance {
  private options: HtmlWebpackInjectPreload.Options = {
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

  /**
   * Extract HTMLWebpack Plugin by jahed
   *
   * @param compiler
   */
  private extractHtmlWebpackPluginModule = (
    compiler: Compiler,
  ): typeof HtmlWebpackPluginInstance | null => {
    const htmlWebpackPlugin = (compiler.options.plugins || []).find(plugin => {
      return plugin.constructor.name === 'HtmlWebpackPlugin';
    }) as typeof HtmlWebpackPluginInstance | undefined;
    if (!htmlWebpackPlugin) {
      return null;
    }
    const HtmlWebpackPlugin = htmlWebpackPlugin.constructor;
    if (!HtmlWebpackPlugin || !('getHooks' in HtmlWebpackPlugin)) {
      return null;
    }
    return HtmlWebpackPlugin as typeof HtmlWebpackPluginInstance;
  };

  private addLinks(
    compilation: Compilation,
    htmlPluginData: HtmlWebpackPluginData,
  ) {
    const assets = new Set(Object.keys(compilation.assets));
    compilation.chunks.forEach(chunk => {
      chunk.files.forEach((file: string) => assets.add(file));
    });

    const linkIndex = htmlPluginData.headTags.findIndex(
      tag => tag.tagName === 'link',
    );

    assets.forEach(asset => {
      for (let index = 0; index < this.options.files.length; index++) {
        const file = this.options.files[index];
        let href = file.attributes ? file.attributes.href : false;
        if (!href) {
          href = asset;
        }

        href = href[0] === '/' ? href : '/' + href;

        if (file.match.test(asset)) {
          const preload: HtmlTagObject = {
            tagName: 'link',
            attributes: Object.assign(file.attributes, {rel: 'preload', href}),
            voidTag: true,
            meta: {
              plugin: 'html-webpack-inject-preload'
            }
          };

          if (linkIndex > -1) {
            htmlPluginData.headTags.splice(linkIndex, 0, preload);
          } else {
            htmlPluginData.headTags.unshift(preload);
          }
        }
      }
    });

    return htmlPluginData;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('HtmlWebpackInjectPreload', compilation => {
      const HtmlWebpackPlugin = this.extractHtmlWebpackPluginModule(compiler);
      if (!HtmlWebpackPlugin) {
        throw new Error(
          'HtmlWebpackInjectPreload needs to be used with html-webpack-plugin@4',
        );
      }

      const hooks = HtmlWebpackPlugin.getHooks(compilation);
      hooks.alterAssetTagGroups.tapAsync(
        'HtmlWebpackInjectPreload',
        (htmlPluginData, callback: any) => {
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
