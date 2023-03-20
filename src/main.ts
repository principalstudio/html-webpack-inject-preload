import type {
  default as HtmlWebpackPluginInstance,
  HtmlTagObject,
} from 'html-webpack-plugin';
import type { Compilation, Compiler, WebpackPluginInstance } from 'webpack';
import { addLinkForEntryPointWebpackPreload } from './entry-point-webpack-preload';

declare namespace HtmlWebpackInjectPreload {
  interface Options {
    files?: HtmlWebpackInjectPreload.File[];
    /**
     * generate link tag for `import()`s in a entry chunk
     * @defaultValue false
     */
    entryPointWebpackPreload?: boolean;
  }

  interface File {
    match: RegExp;
    attributes: Record<string, string | boolean>;
  }
}

interface HtmlWebpackPluginData {
  headTags: HtmlWebpackPluginInstance.HtmlTagObject[];
  bodyTags: HtmlWebpackPluginInstance.HtmlTagObject[];
  outputName: string;
  publicPath: string;
  plugin: HtmlWebpackPluginInstance;
}

/**
 * Inject preload files before the content of the targeted files
 *
 * @example
 * new HtmlWebpackInjectPreload({
 *  files: [
 *    {
 *      match: /.*\.woff2/$,
 *      attributes: { rel: 'preload', as: 'font', type: 'font/woff2',
 * crossorigin: true },
 *    },
 *    {
 *      match: /vendors\.[a-z-0-9]*.css/$,
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
    entryPointWebpackPreload: false
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
    //Get public path
    //html-webpack-plugin v5
    let publicPath = htmlPluginData.publicPath;

    //html-webpack-plugin v4
    if (typeof publicPath === 'undefined') {
      if (
        htmlPluginData.plugin.options?.publicPath &&
        htmlPluginData.plugin.options?.publicPath !== 'auto'
      ) {
        publicPath = htmlPluginData.plugin.options?.publicPath;
      } else {
        publicPath =
          typeof compilation.options.output.publicPath === 'string'
            ? compilation.options.output.publicPath
            : '/';
      }

      //prevent wrong url
      if (publicPath[publicPath.length - 1] !== '/') {
        publicPath = publicPath + '/';
      }
    }

    // generate link tag for `import()`s in a entry chunk
    if (this.options.entryPointWebpackPreload) {
      addLinkForEntryPointWebpackPreload(compilation, htmlPluginData);
    }

    //Get assets name
    const assets = new Set(Object.keys(compilation.assets));
    compilation.chunks.forEach(chunk => {
      chunk.files.forEach((file: string) => assets.add(file));
    });

    //Find first link index to inject before
    const linkIndex = htmlPluginData.headTags.findIndex(
      tag => tag.tagName === 'link',
    );
    const files = this.options.files;
    if (!files) {
      return;
    }
    assets.forEach(asset => {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        if (file.match.test(asset)) {
          let href =
            file.attributes && file.attributes.href
              ? file.attributes.href
              : false;
          if (href === false || typeof href === 'undefined') {
            href = asset;
          }
          href = href[0] === '/' ? href : publicPath + href;

          const preload: HtmlTagObject = {
            tagName: 'link',
            attributes: Object.assign(
              {
                rel: 'preload',
                href,
              },
              file.attributes,
            ),
            voidTag: true,
            meta: {
              plugin: 'html-webpack-inject-preload',
            },
          };

          if (linkIndex > -1) {
            //before link
            htmlPluginData.headTags.splice(linkIndex, 0, preload);
          } else {
            // before everything
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
          'HtmlWebpackInjectPreload needs to be used with html-webpack-plugin 4 or 5',
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
// exports.default = HtmlWebpackInjectPreload;
// module.exports = HtmlWebpackInjectPreload;