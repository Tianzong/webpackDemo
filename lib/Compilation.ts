import util from 'util'
// 一些发布订阅者钩子函数
// https://juejin.cn/post/7040982789650382855
const {
  HookMap,
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncParallelHook
} = require("tapable");

export class Compilation {
  private hooks: Readonly<{
    afterRuntimeRequirements: any; chunkIds: any; shouldRecord: any; beforeRuntimeRequirements: any; runtimeRequirementInModule: any; beforeChunks: any; optimizeChunkModules: any; afterCodeGeneration: any; additionalModuleRuntimeRequirements: any; succeedModule: any; optimize: any; beforeModuleIds: any; record: any; statsPrinter: any; afterOptimizeModuleIds: any; additionalTreeRuntimeRequirements: any; needAdditionalPass: any; childCompiler: any; optimizeCodeGeneration: any; beforeModuleHash: any; processWarnings: any; optimizeModuleIds: any; runtimeRequirementInChunk: any; afterModuleHash: any; executeModule: any; afterChunks: any; additionalChunkRuntimeRequirements: any; afterHash: any; beforeChunkIds: any; addEntry: any; recordChunks: any; buildModule: any; afterOptimizeChunkModules: any; recordHash: any; optimizeTree: any; afterOptimizeTree: any; beforeCodeGeneration: any; statsPreset: any; optimizeChunkIds: any; shouldGenerateChunkAssets: any; beforeModuleAssets: any; readonly normalModuleLoader: any; additionalAssets: any; moduleAsset: any; log: any; afterSeal: any; failedEntry: any; seal: any; reviveModules: any; beforeHash: any; moduleIds: any; succeedEntry: any; optimizeModules: any; beforeChunkAssets: any; afterOptimizeChunkAssets: any; renderManifest: any; needAdditionalSeal: any; processAssets: any; processAdditionalAssets: any; statsNormalize: any; afterOptimizeAssets: any; assetPath: any; finishRebuildingModule: any; rebuildModule: any; afterProcessAssets: any; afterOptimizeChunkIds: any; prepareModuleExecution: any; stillValidModule: any; additionalChunkAssets: any; statsFactory: any; afterOptimizeChunks: any; optimizeChunkAssets: any; dependencyReferencedExports: any; chunkAsset: any; optimizeChunks: any; runtimeModule: any; optimizeDependencies: any; failedModule: any; fullHash: any; contentHash: any; runtimeRequirementInTree: any; afterOptimizeDependencies: any; processErrors: any; afterOptimizeModules: any; optimizeAssets: any; finishModules: any; unseal: any; reviveChunks: any; chunkHash: any; recordModules: any
  }>
  private assets: {}
  constructor() {
    // 1. ?
    // this._backCompat = compiler._backCompat;
    // const getNormalModuleLoader = () => deprecatedNormalModuleLoaderHook(this);

    // 异步串联回调函数
    const processAssetsHook = new AsyncSeriesHook(["assets"]);

    // 保存的资源
    let savedAssets = new Set();
    const popNewAssets = assets => {
      let newAssets = undefined;
      for (const file of Object.keys(assets)) {
        if (savedAssets.has(file)) continue;
        if (newAssets === undefined) {
          newAssets = Object.create(null);
        }
        newAssets[file] = assets[file];
        savedAssets.add(file);
      }
      return newAssets;
    };
    // 拦截器， 这里会把所有的钩子函数，都用拦截器的register方法处理一遍
    processAssetsHook.intercept({
      name: "Compilation",
      call: () => {
        savedAssets = new Set(Object.keys(this.assets));
      },
      // 处理钩子函数
      register: tap => {
        const { type, name } = tap;
        const { fn, additionalAssets, ...remainingTap } = tap;

        // 如果带有资源的回调函数 进行处理
        const additionalAssetsFn =
          additionalAssets === true ? fn : additionalAssets;
        // 存储处理过的函数
        const processedAssets = additionalAssetsFn ? new WeakSet() : undefined;

        // 根据钩子函数类型处理
        switch (type) {
          case "sync":
            if (additionalAssetsFn) {
              this.hooks.processAdditionalAssets.tap(name, assets => {
                if (processedAssets.has(this.assets))
                  additionalAssetsFn(assets);
              });
            }
            // 向外暴漏一个函数
            return {
              ...remainingTap,
              type: "async",
              fn: (assets, callback) => {
                try {
                  fn(assets);
                } catch (e) {
                  return callback(e);
                }
                if (processedAssets !== undefined)
                  processedAssets.add(this.assets);
                const newAssets = popNewAssets(assets);
                if (newAssets !== undefined) {
                  this.hooks.processAdditionalAssets.callAsync(
                    newAssets,
                    callback
                  );
                  return;
                }
                callback();
              }
            };
          case "async":
            if (additionalAssetsFn) {
              this.hooks.processAdditionalAssets.tapAsync(
                name,
                (assets, callback) => {
                  if (processedAssets.has(this.assets))
                    return additionalAssetsFn(assets, callback);
                  callback();
                }
              );
            }
            return {
              ...remainingTap,
              fn: (assets, callback) => {
                fn(assets, err => {
                  if (err) return callback(err);
                  if (processedAssets !== undefined)
                    processedAssets.add(this.assets);
                  const newAssets = popNewAssets(assets);
                  if (newAssets !== undefined) {
                    this.hooks.processAdditionalAssets.callAsync(
                      newAssets,
                      callback
                    );
                    return;
                  }
                  callback();
                });
              }
            };
          case "promise":
            if (additionalAssetsFn) {
              this.hooks.processAdditionalAssets.tapPromise(name, assets => {
                if (processedAssets.has(this.assets))
                  return additionalAssetsFn(assets);
                return Promise.resolve();
              });
            }
            return {
              ...remainingTap,
              fn: assets => {
                const p = fn(assets);
                if (!p || !p.then) return p;
                return p.then(() => {
                  if (processedAssets !== undefined)
                    processedAssets.add(this.assets);
                  const newAssets = popNewAssets(assets);
                  if (newAssets !== undefined) {
                    return this.hooks.processAdditionalAssets.promise(
                      newAssets
                    );
                  }
                });
              }
            };
        }
      }
    });

    // 各种类型的hooks
    this.hooks = Object.freeze({
      /** @type {SyncHook<[Module]>} */
      buildModule: new SyncHook(["module"]),
      /** @type {SyncHook<[Module]>} */
      rebuildModule: new SyncHook(["module"]),
      /** @type {SyncHook<[Module, WebpackError]>} */
      failedModule: new SyncHook(["module", "error"]),
      /** @type {SyncHook<[Module]>} */
      succeedModule: new SyncHook(["module"]),
      /** @type {SyncHook<[Module]>} */
      stillValidModule: new SyncHook(["module"]),

      /** @type {SyncHook<[Dependency, EntryOptions]>} */
      addEntry: new SyncHook(["entry", "options"]),
      /** @type {SyncHook<[Dependency, EntryOptions, Error]>} */
      failedEntry: new SyncHook(["entry", "options", "error"]),
      /** @type {SyncHook<[Dependency, EntryOptions, Module]>} */
      succeedEntry: new SyncHook(["entry", "options", "module"]),

      /** @type {SyncWaterfallHook<[(string[] | ReferencedExport)[], Dependency, RuntimeSpec]>} */
      dependencyReferencedExports: new SyncWaterfallHook([
        "referencedExports",
        "dependency",
        "runtime"
      ]),

      /** @type {SyncHook<[ExecuteModuleArgument, ExecuteModuleContext]>} */
      executeModule: new SyncHook(["options", "context"]),
      /** @type {AsyncParallelHook<[ExecuteModuleArgument, ExecuteModuleContext]>} */
      prepareModuleExecution: new AsyncParallelHook(["options", "context"]),

      /** @type {AsyncSeriesHook<[Iterable<Module>]>} */
      finishModules: new AsyncSeriesHook(["modules"]),
      /** @type {AsyncSeriesHook<[Module]>} */
      finishRebuildingModule: new AsyncSeriesHook(["module"]),
      /** @type {SyncHook<[]>} */
      unseal: new SyncHook([]),
      /** @type {SyncHook<[]>} */
      seal: new SyncHook([]),

      /** @type {SyncHook<[]>} */
      beforeChunks: new SyncHook([]),
      /** @type {SyncHook<[Iterable<Chunk>]>} */
      afterChunks: new SyncHook(["chunks"]),

      /** @type {SyncBailHook<[Iterable<Module>]>} */
      optimizeDependencies: new SyncBailHook(["modules"]),
      /** @type {SyncHook<[Iterable<Module>]>} */
      afterOptimizeDependencies: new SyncHook(["modules"]),

      /** @type {SyncHook<[]>} */
      optimize: new SyncHook([]),
      /** @type {SyncBailHook<[Iterable<Module>]>} */
      optimizeModules: new SyncBailHook(["modules"]),
      /** @type {SyncHook<[Iterable<Module>]>} */
      afterOptimizeModules: new SyncHook(["modules"]),

      /** @type {SyncBailHook<[Iterable<Chunk>, ChunkGroup[]]>} */
      optimizeChunks: new SyncBailHook(["chunks", "chunkGroups"]),
      /** @type {SyncHook<[Iterable<Chunk>, ChunkGroup[]]>} */
      afterOptimizeChunks: new SyncHook(["chunks", "chunkGroups"]),

      /** @type {AsyncSeriesHook<[Iterable<Chunk>, Iterable<Module>]>} */
      optimizeTree: new AsyncSeriesHook(["chunks", "modules"]),
      /** @type {SyncHook<[Iterable<Chunk>, Iterable<Module>]>} */
      afterOptimizeTree: new SyncHook(["chunks", "modules"]),

      /** @type {AsyncSeriesBailHook<[Iterable<Chunk>, Iterable<Module>]>} */
      optimizeChunkModules: new AsyncSeriesBailHook(["chunks", "modules"]),
      /** @type {SyncHook<[Iterable<Chunk>, Iterable<Module>]>} */
      afterOptimizeChunkModules: new SyncHook(["chunks", "modules"]),
      /** @type {SyncBailHook<[], boolean>} */
      shouldRecord: new SyncBailHook([]),

      /** @type {SyncHook<[Chunk, Set<string>, RuntimeRequirementsContext]>} */
      additionalChunkRuntimeRequirements: new SyncHook([
        "chunk",
        "runtimeRequirements",
        "context"
      ]),
      /** @type {HookMap<SyncBailHook<[Chunk, Set<string>, RuntimeRequirementsContext]>>} */
      runtimeRequirementInChunk: new HookMap(
        () => new SyncBailHook(["chunk", "runtimeRequirements", "context"])
      ),
      /** @type {SyncHook<[Module, Set<string>, RuntimeRequirementsContext]>} */
      additionalModuleRuntimeRequirements: new SyncHook([
        "module",
        "runtimeRequirements",
        "context"
      ]),
      /** @type {HookMap<SyncBailHook<[Module, Set<string>, RuntimeRequirementsContext]>>} */
      runtimeRequirementInModule: new HookMap(
        () => new SyncBailHook(["module", "runtimeRequirements", "context"])
      ),
      /** @type {SyncHook<[Chunk, Set<string>, RuntimeRequirementsContext]>} */
      additionalTreeRuntimeRequirements: new SyncHook([
        "chunk",
        "runtimeRequirements",
        "context"
      ]),
      /** @type {HookMap<SyncBailHook<[Chunk, Set<string>, RuntimeRequirementsContext]>>} */
      runtimeRequirementInTree: new HookMap(
        () => new SyncBailHook(["chunk", "runtimeRequirements", "context"])
      ),

      /** @type {SyncHook<[RuntimeModule, Chunk]>} */
      runtimeModule: new SyncHook(["module", "chunk"]),

      /** @type {SyncHook<[Iterable<Module>, any]>} */
      reviveModules: new SyncHook(["modules", "records"]),
      /** @type {SyncHook<[Iterable<Module>]>} */
      beforeModuleIds: new SyncHook(["modules"]),
      /** @type {SyncHook<[Iterable<Module>]>} */
      moduleIds: new SyncHook(["modules"]),
      /** @type {SyncHook<[Iterable<Module>]>} */
      optimizeModuleIds: new SyncHook(["modules"]),
      /** @type {SyncHook<[Iterable<Module>]>} */
      afterOptimizeModuleIds: new SyncHook(["modules"]),

      /** @type {SyncHook<[Iterable<Chunk>, any]>} */
      reviveChunks: new SyncHook(["chunks", "records"]),
      /** @type {SyncHook<[Iterable<Chunk>]>} */
      beforeChunkIds: new SyncHook(["chunks"]),
      /** @type {SyncHook<[Iterable<Chunk>]>} */
      chunkIds: new SyncHook(["chunks"]),
      /** @type {SyncHook<[Iterable<Chunk>]>} */
      optimizeChunkIds: new SyncHook(["chunks"]),
      /** @type {SyncHook<[Iterable<Chunk>]>} */
      afterOptimizeChunkIds: new SyncHook(["chunks"]),

      /** @type {SyncHook<[Iterable<Module>, any]>} */
      recordModules: new SyncHook(["modules", "records"]),
      /** @type {SyncHook<[Iterable<Chunk>, any]>} */
      recordChunks: new SyncHook(["chunks", "records"]),

      /** @type {SyncHook<[Iterable<Module>]>} */
      optimizeCodeGeneration: new SyncHook(["modules"]),

      /** @type {SyncHook<[]>} */
      beforeModuleHash: new SyncHook([]),
      /** @type {SyncHook<[]>} */
      afterModuleHash: new SyncHook([]),

      /** @type {SyncHook<[]>} */
      beforeCodeGeneration: new SyncHook([]),
      /** @type {SyncHook<[]>} */
      afterCodeGeneration: new SyncHook([]),

      /** @type {SyncHook<[]>} */
      beforeRuntimeRequirements: new SyncHook([]),
      /** @type {SyncHook<[]>} */
      afterRuntimeRequirements: new SyncHook([]),

      /** @type {SyncHook<[]>} */
      beforeHash: new SyncHook([]),
      /** @type {SyncHook<[Chunk]>} */
      contentHash: new SyncHook(["chunk"]),
      /** @type {SyncHook<[]>} */
      afterHash: new SyncHook([]),
      /** @type {SyncHook<[any]>} */
      recordHash: new SyncHook(["records"]),
      /** @type {SyncHook<[Compilation, any]>} */
      record: new SyncHook(["compilation", "records"]),

      /** @type {SyncHook<[]>} */
      beforeModuleAssets: new SyncHook([]),
      /** @type {SyncBailHook<[], boolean>} */
      shouldGenerateChunkAssets: new SyncBailHook([]),
      /** @type {SyncHook<[]>} */
      beforeChunkAssets: new SyncHook([]),
      // TODO webpack 6 remove
      /** @deprecated */
      additionalChunkAssets: createProcessAssetsHook(
        "additionalChunkAssets",
        Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        () => [this.chunks],
        "DEP_WEBPACK_COMPILATION_ADDITIONAL_CHUNK_ASSETS"
      ),

      // TODO webpack 6 deprecate
      /** @deprecated */
      additionalAssets: createProcessAssetsHook(
        "additionalAssets",
        Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        () => []
      ),
      // TODO webpack 6 remove
      /** @deprecated */
      optimizeChunkAssets: createProcessAssetsHook(
        "optimizeChunkAssets",
        Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        () => [this.chunks],
        "DEP_WEBPACK_COMPILATION_OPTIMIZE_CHUNK_ASSETS"
      ),
      // TODO webpack 6 remove
      /** @deprecated */
      afterOptimizeChunkAssets: createProcessAssetsHook(
        "afterOptimizeChunkAssets",
        Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE + 1,
        () => [this.chunks],
        "DEP_WEBPACK_COMPILATION_AFTER_OPTIMIZE_CHUNK_ASSETS"
      ),
      // TODO webpack 6 deprecate
      /** @deprecated */
      optimizeAssets: processAssetsHook,
      // TODO webpack 6 deprecate
      /** @deprecated */
      afterOptimizeAssets: afterProcessAssetsHook,

      processAssets: processAssetsHook,
      afterProcessAssets: afterProcessAssetsHook,
      /** @type {AsyncSeriesHook<[CompilationAssets]>} */
      processAdditionalAssets: new AsyncSeriesHook(["assets"]),

      /** @type {SyncBailHook<[], boolean>} */
      needAdditionalSeal: new SyncBailHook([]),
      /** @type {AsyncSeriesHook<[]>} */
      afterSeal: new AsyncSeriesHook([]),

      /** @type {SyncWaterfallHook<[RenderManifestEntry[], RenderManifestOptions]>} */
      renderManifest: new SyncWaterfallHook(["result", "options"]),

      /** @type {SyncHook<[Hash]>} */
      fullHash: new SyncHook(["hash"]),
      /** @type {SyncHook<[Chunk, Hash, ChunkHashContext]>} */
      chunkHash: new SyncHook(["chunk", "chunkHash", "ChunkHashContext"]),

      /** @type {SyncHook<[Module, string]>} */
      moduleAsset: new SyncHook(["module", "filename"]),
      /** @type {SyncHook<[Chunk, string]>} */
      chunkAsset: new SyncHook(["chunk", "filename"]),

      /** @type {SyncWaterfallHook<[string, object, AssetInfo]>} */
      assetPath: new SyncWaterfallHook(["path", "options", "assetInfo"]),

      /** @type {SyncBailHook<[], boolean>} */
      needAdditionalPass: new SyncBailHook([]),

      /** @type {SyncHook<[Compiler, string, number]>} */
      childCompiler: new SyncHook([
        "childCompiler",
        "compilerName",
        "compilerIndex"
      ]),

      /** @type {SyncBailHook<[string, LogEntry], true>} */
      log: new SyncBailHook(["origin", "logEntry"]),

      /** @type {SyncWaterfallHook<[WebpackError[]]>} */
      processWarnings: new SyncWaterfallHook(["warnings"]),
      /** @type {SyncWaterfallHook<[WebpackError[]]>} */
      processErrors: new SyncWaterfallHook(["errors"]),

      /** @type {HookMap<SyncHook<[Partial<NormalizedStatsOptions>, CreateStatsOptionsContext]>>} */
      statsPreset: new HookMap(() => new SyncHook(["options", "context"])),
      /** @type {SyncHook<[Partial<NormalizedStatsOptions>, CreateStatsOptionsContext]>} */
      statsNormalize: new SyncHook(["options", "context"]),
      /** @type {SyncHook<[StatsFactory, NormalizedStatsOptions]>} */
      statsFactory: new SyncHook(["statsFactory", "options"]),
      /** @type {SyncHook<[StatsPrinter, NormalizedStatsOptions]>} */
      statsPrinter: new SyncHook(["statsPrinter", "options"]),

      get normalModuleLoader() {
        return getNormalModuleLoader();
      }
    });

    /** @type {CompilationAssets} */
    this.assets = {};
  }

  // 各种类型的hooks
}