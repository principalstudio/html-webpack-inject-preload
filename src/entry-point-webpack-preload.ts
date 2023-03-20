import type { Compilation } from 'webpack';
import type {
    default as HtmlWebpackPluginInstance,
    HtmlTagObject,
} from 'html-webpack-plugin';


type AlterAssetTagGroupsHookParam = Parameters<Parameters<HtmlWebpackPluginInstance.Hooks['alterAssetTagGroups']['tapAsync']>[1]>[0];

type EntryName = string;
type File = string;

export function addLinkForEntryPointWebpackPreload(
    compilation: Compilation,
    htmlPluginData: AlterAssetTagGroupsHookParam,
    ) {
    
    // Html can contain multiple entrypoints, entries contains preloaded ChunkGroups, ChunkGroups contains chunks, chunks contains files.
    // Files are what we need.

    const entryFileMap = prepareEntryFileMap(compilation, htmlPluginData);

    // Prepare link tags for HtmlWebpackPlugin
    const publicPath = getPublicPath(compilation, htmlPluginData);
    const entryHtmlTagObjectMap = generateHtmlTagObject(entryFileMap, publicPath);
    
    // Related files's link tags should follow parent script tag (the entries scripts' tag)
    // according to this [blog](https://web.dev/priority-hints/#using-preload-after-chrome-95).
    alterAssetTagGroups(entryHtmlTagObjectMap, compilation, htmlPluginData);
}

function alterAssetTagGroups(entryHtmlTagObjectMap: Map<EntryName, Set<HtmlTagObject>>, compilation: Compilation, htmlPluginData: AlterAssetTagGroupsHookParam) {
    for (const [entryName, linkTags] of entryHtmlTagObjectMap) {
        //Find first link index to inject before, which is the script elemet for the entrypoint.
        let files = compilation.entrypoints.get(entryName)?.getEntrypointChunk().files;
        if (!files || files.size === 0) {
            continue;
        }
        const lastFile = [...files][files.size - 1]
        const findLastFileScriptTagIndex = tag => tag.tagName === 'script' && (tag.attributes.src as string).indexOf(lastFile) !== -1;
        let linkIndex = htmlPluginData.headTags.findIndex(
            findLastFileScriptTagIndex
        );
        if (linkIndex === -1) {
            htmlPluginData.bodyTags.findIndex(findLastFileScriptTagIndex);
        }
        if (linkIndex === -1) {
            console.warn(`cannot find entrypoints\'s script tags for entry: ${entryName}`);
            continue;
        };
        htmlPluginData.headTags.splice(linkIndex, 0, ...linkTags);
    }
}

/**
 * Get entrypoints related preload files' names
 * 
 * Html can contain multiple entrypoints, entries contains preloaded ChunkGroups, ChunkGroups contains chunks, chunks contains files.
 * Files are what we need.
 * @param compilation 
 * @param htmlPluginData 
 */
function prepareEntryFileMap(
    compilation: Compilation,
    htmlPluginData: AlterAssetTagGroupsHookParam) {
    const entryFileMap = new Map<EntryName, Set<File>>;
    
    const entries = htmlPluginData.plugin.options?.chunks ?? 'all';
    let entriesKeys = Array.isArray(entries) ? entries : Array.from(compilation.entrypoints.keys());
    
    for (const key of entriesKeys) {
        const files = new Set<string>();
        const preloaded = compilation.entrypoints.get(key)?.getChildrenByOrders(compilation.moduleGraph, compilation.chunkGraph).preload;
        if (!preloaded) continue;
        entryFileMap.set(key, files);
        // cannot get font files in `preload`
        for (const group of preloaded) { // the order of preloaded is relevant
            for (const chunk of group.chunks)
                for (const file of chunk.files) files.add(file);
        }
    }

    return entryFileMap;
}

/**
 * Generate HtmlTagObjects for HtmlWebpackPlugin
 * @param entryFileMap 
 * @param publicPath 
 * @returns 
 */
function generateHtmlTagObject(entryFileMap: Map<string, Set<string>>, publicPath: string): Map<EntryName, Set<HtmlTagObject>> {
    const map = new Map();
    for (const [key, filesNames] of entryFileMap) {
        map.set(key, [...filesNames].map(fileName => {
            const href = `${publicPath}${fileName}`;
            const as = getTypeOfResource(fileName);
            const crossOrigin = as === 'font';
            let attributes: HtmlTagObject['attributes'] = {
                rel: 'preload',
                href,
                as
            }
            if (crossOrigin) {
                attributes = { ...attributes, crossorigin: undefined }
            }
            return {
                tagName: 'link',
                attributes,
                voidTag: true,
                meta: {
                    plugin: 'html-webpack-inject-preload',
                },
            }
        }));
        
    }
    return map;
}

function getTypeOfResource(fileName: String) {
    if (fileName.match(/.js$/)) {
        return 'script'
    }
    if (fileName.match(/.css$/)) {
        return 'style'
    }
    if (fileName.match(/.(woff2|woff|ttf|otf)$/)) {
        return 'font'
    }
    if (fileName.match(/.(gif|jpeg|png|svg)$/)) {
        return 'image'
    }
}

function getPublicPath(compilation: Compilation, htmlPluginData: AlterAssetTagGroupsHookParam) {
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
    return publicPath;
}