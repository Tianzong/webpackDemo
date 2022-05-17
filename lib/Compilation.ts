import util from 'util'
import { AsyncQueue } from './AsyncQueue'
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
  private addModuleQueue: AsyncQueue
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

    // 添加一个 创建模块的任务 到异步队列
    /** @type {AsyncQueue<FactorizeModuleOptions, string, Module | ModuleFactoryResult>} */
    this.factorizeQueue = new AsyncQueue({
      name: "factorize",
      parent: this.addModuleQueue,
      processor: this._factorizeModule.bind(this)
    });

    /** @type {AsyncQueue<Module, string, Module>} */
    this.addModuleQueue = new AsyncQueue({
      name: "addModule",
      parent: this.processDependenciesQueue,
      getKey: module => module.identifier(),
      processor: this._addModule.bind(this)
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

  /**
   * @param {FactorizeModuleOptions} options options object
   * @param {ModuleOrFactoryResultCallback} callback callback
   * @returns {void}
   */
  _factorizeModule(
    {
      currentProfile,
      factory,
      dependencies,
      originModule,
      factoryResult,
      contextInfo,
      context
    },
    callback
  ) {
    // todo: 调用 该文件类型的 模块工厂函数函数创建
    // factory.create()
  }

  /**
   * 添加模块
   * @param {Module} module module to be added that was created
   * @param {ModuleCallback} callback returns the module in the compilation,
   * it could be the passed one (if new), or an already existing in the compilation
   * @returns {void}
   */
  addModule(module, callback) {
    this.addModuleQueue.add(module, callback);
  }

  /**
   * @param {Module} module module to be added that was created
   * @param {ModuleCallback} callback returns the module in the compilation,
   * it could be the passed one (if new), or an already existing in the compilation
   * @returns {void}
   */
  _addModule(module, callback) {

  }

  /**
   * @param {string} context context path for entry
   * @param {Dependency} entry entry dependency that should be followed
   * @param {string | EntryOptions} optionsOrName options or deprecated name of entry
   * @param {ModuleCallback} callback callback function
   * @returns {void} returns
   */
  addEntry(context, entry, optionsOrName, callback) {
    // TODO webpack 6 remove
    const options =
      typeof optionsOrName === "object"
        ? optionsOrName
        : { name: optionsOrName };

    this._addEntryItem(context, entry, "dependencies", options, callback);
  }

  /**
   * @param {string} context context path for entry
   * @param {Dependency} entry entry dependency that should be followed
   * @param {"dependencies" | "includeDependencies"} target type of entry
   * @param {EntryOptions} options options
   * @param {ModuleCallback} callback callback function
   * @returns {void} returns
   */
  // Module：资源在 webpack 内部的映射对象，包含了资源的路径、上下文、依赖、内容等信息
  // Dependency ：在模块中引用其它模块，例如 import "a.js" 语句，webpack 会先将引用关系表述为 Dependency 子类并关联 module 对象，等到当前 module 内容都解析完毕之后，启动下次循环开始将 Dependency 对象转换为适当的 Module 子类。
  // Chunk ：用于组织输出结构的对象，webpack 分析完所有模块资源的内容，构建出完整的 Dependency Graph 之后，会根据用户配置及 Dependency Graph 内容构建出一个或多个 chunk 实例，每个 chunk 与最终输出的文件大致上是一一对应的。
  _addEntryItem(context, entry, target, options, callback) {
    const { name } = options;
    let entryData =
      name !== undefined ? this.entries.get(name) : this.globalEntry;
    // 获取每个entry对应的dependencies, 添加依赖
    if (entryData === undefined) {
      entryData = {
        dependencies: [],
        includeDependencies: [],
        options: {
          name: undefined,
          ...options
        }
      };
      entryData[target].push(entry);
      this.entries.set(name, entryData);
    } else {
      entryData[target].push(entry);
      for (const key of Object.keys(options)) {
        if (options[key] === undefined) continue;
        if (entryData.options[key] === options[key]) continue;
        if (
          Array.isArray(entryData.options[key]) &&
          Array.isArray(options[key]) &&
          arrayEquals(entryData.options[key], options[key])
        ) {
          continue;
        }
        if (entryData.options[key] === undefined) {
          entryData.options[key] = options[key];
        } else {
          return callback(
            new WebpackError(
              `Conflicting entry option ${key} = ${entryData.options[key]} vs ${options[key]}`
            )
          );
        }
      }
    }

    // 钩子
    this.hooks.addEntry.call(entry, options);

    // 构建依赖树
    this.addModuleTree(
      {
        context,
        dependency: entry,
        contextInfo: entryData.options.layer
          ? { issuerLayer: entryData.options.layer }
          : undefined
      },
      (err, module) => {
        if (err) {
          this.hooks.failedEntry.call(entry, options, err);
          return callback(err);
        }
        this.hooks.succeedEntry.call(entry, options, module);
        return callback(null, module);
      }
    );
  }

  /**
   * // 构建依赖树
   * @param {Object} options options
   * @param {string} options.context context string path
   * @param {Dependency} options.dependency dependency used to create Module chain
   * @param {Partial<ModuleFactoryCreateDataContextInfo>=} options.contextInfo additional context info for the root module
   * @param {ModuleCallback} callback callback for when module chain is complete
   * @returns {void} will throw if dependency instance is not a valid Dependency
   */
  addModuleTree({ context, dependency, contextInfo }, callback) {
    if (
      typeof dependency !== "object" ||
      dependency === null ||
      !dependency.constructor
    ) {
      return callback(
        new WebpackError("Parameter 'dependency' must be a Dependency")
      );
    }
    const Dep = /** @type {DepConstructor} */ (dependency.constructor);
    // Todo: 奇怪的 module 工厂函数
    const moduleFactory = this.dependencyFactories.get(Dep);
    if (!moduleFactory) {
      return callback(
        new WebpackError(
          `No dependency factory available for this dependency type: ${dependency.constructor.name}`
        )
      );
    }

    // 调用 handleModuleCreate ，根据文件类型构建 module 子类
    this.handleModuleCreation(
      {
        factory: moduleFactory,
        dependencies: [dependency],
        originModule: null,
        contextInfo,
        context
      },
      (err, result) => {
        // Todo: 回调
      }
    );
  }

  /**
   * @param {HandleModuleCreationOptions} options options object
   * @param {ModuleCallback} callback callback
   * @returns {void}
   */
  handleModuleCreation(
    {
      factory,
      dependencies,
      originModule,
      contextInfo,
      context,
      recursive = true,
      connectOrigin = recursive
    },
    callback
  ) {
    const moduleGraph = this.moduleGraph;

    const currentProfile = this.profile ? new ModuleProfile() : undefined;

    this.factorizeModule(
      {
        currentProfile,
        factory,
        dependencies,
        factoryResult: true,
        originModule,
        contextInfo,
        context
      },
      (err, factoryResult) => {
        const applyFactoryResultDependencies = () => {
          const { fileDependencies, contextDependencies, missingDependencies } =
            factoryResult;
          if (fileDependencies) {
            this.fileDependencies.addAll(fileDependencies);
          }
          if (contextDependencies) {
            this.contextDependencies.addAll(contextDependencies);
          }
          if (missingDependencies) {
            this.missingDependencies.addAll(missingDependencies);
          }
        };
        if (err) {
          if (factoryResult) applyFactoryResultDependencies();
          if (dependencies.every(d => d.optional)) {
            this.warnings.push(err);
            return callback();
          } else {
            this.errors.push(err);
            return callback(err);
          }
        }

        const newModule = factoryResult.module;

        if (!newModule) {
          applyFactoryResultDependencies();
          return callback();
        }

        if (currentProfile !== undefined) {
          moduleGraph.setProfile(newModule, currentProfile);
        }

        this.addModule(newModule, (err, module) => {
          if (err) {
            applyFactoryResultDependencies();
            if (!err.module) {
              err.module = module;
            }
            this.errors.push(err);

            return callback(err);
          }

          if (
            this._unsafeCache &&
            factoryResult.cacheable !== false &&
            /** @type {any} */ (module).restoreFromUnsafeCache &&
            this._unsafeCachePredicate(module)
          ) {
            const unsafeCacheableModule =
              /** @type {Module & { restoreFromUnsafeCache: Function }} */ (
              module
            );
            for (let i = 0; i < dependencies.length; i++) {
              const dependency = dependencies[i];
              moduleGraph.setResolvedModule(
                connectOrigin ? originModule : null,
                dependency,
                unsafeCacheableModule
              );
              unsafeCacheDependencies.set(dependency, unsafeCacheableModule);
            }
            if (!unsafeCacheData.has(unsafeCacheableModule)) {
              unsafeCacheData.set(
                unsafeCacheableModule,
                unsafeCacheableModule.getUnsafeCacheData()
              );
            }
          } else {
            applyFactoryResultDependencies();
            for (let i = 0; i < dependencies.length; i++) {
              const dependency = dependencies[i];
              moduleGraph.setResolvedModule(
                connectOrigin ? originModule : null,
                dependency,
                module
              );
            }
          }

          moduleGraph.setIssuerIfUnset(
            module,
            originModule !== undefined ? originModule : null
          );
          if (module !== newModule) {
            if (currentProfile !== undefined) {
              const otherProfile = moduleGraph.getProfile(module);
              if (otherProfile !== undefined) {
                currentProfile.mergeInto(otherProfile);
              } else {
                moduleGraph.setProfile(module, currentProfile);
              }
            }
          }

          this._handleModuleBuildAndDependencies(
            originModule,
            module,
            recursive,
            callback
          );
        });
      }
    );
  }
}

// Workaround for typescript as it doesn't support function overloading in jsdoc within a class
Compilation.prototype.factorizeModule = /** @type {{
	(options: FactorizeModuleOptions & { factoryResult?: false }, callback: ModuleCallback): void;
	(options: FactorizeModuleOptions & { factoryResult: true }, callback: ModuleFactoryResultCallback): void;
}} */ (
  function (options, callback) {
    this.factorizeQueue.add(options, callback);
  }
);