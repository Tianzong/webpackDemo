import {WebpackOptions} from '../declarations/WebpackOptions'

export class Compiler {
  private hooks: Readonly<{ watchRun: AsyncSeriesHook; afterDone: SyncHook; run: AsyncSeriesHook; normalModuleFactory: SyncHook; assetEmitted: AsyncSeriesHook; beforeCompile: AsyncSeriesHook; compile: SyncHook; watchClose: SyncHook; entryOption: SyncBailHook; afterResolvers: SyncHook; make: AsyncParallelHook; afterEnvironment: SyncHook; additionalPass: AsyncSeriesHook; beforeRun: AsyncSeriesHook; failed: SyncHook; afterCompile: AsyncSeriesHook; done: AsyncSeriesHook; shouldEmit: SyncBailHook; environment: SyncHook; thisCompilation: SyncHook; compilation: SyncHook; afterEmit: AsyncSeriesHook; emitRecords: AsyncSeriesHook; readRecords: AsyncSeriesHook; invalid: SyncHook; initialize: SyncHook; emit: AsyncSeriesHook; contextModuleFactory: SyncHook; infrastructureLog: SyncBailHook; finishMake: AsyncSeriesHook; shutdown: AsyncSeriesHook; afterPlugins: SyncHook }>
  /**
   * @param {string} context the compilation path
   * @param {WebpackOptions} options options
   */
  constructor(context: string, options: WebpackOptions = {}) {
    // 一大堆钩子函数
    this.hooks = Object.freeze({
      /** @type {SyncHook<[]>} */
      initialize: new SyncHook([]),

      /** @type {SyncBailHook<[Compilation], boolean>} */
      shouldEmit: new SyncBailHook(["compilation"]),
      /** @type {AsyncSeriesHook<[Stats]>} */
      done: new AsyncSeriesHook(["stats"]),
      /** @type {SyncHook<[Stats]>} */
      afterDone: new SyncHook(["stats"]),
      /** @type {AsyncSeriesHook<[]>} */
      additionalPass: new AsyncSeriesHook([]),
      /** @type {AsyncSeriesHook<[Compiler]>} */
      beforeRun: new AsyncSeriesHook(["compiler"]),
      /** @type {AsyncSeriesHook<[Compiler]>} */
      run: new AsyncSeriesHook(["compiler"]),
      /** @type {AsyncSeriesHook<[Compilation]>} */
      emit: new AsyncSeriesHook(["compilation"]),
      /** @type {AsyncSeriesHook<[string, AssetEmittedInfo]>} */
      assetEmitted: new AsyncSeriesHook(["file", "info"]),
      /** @type {AsyncSeriesHook<[Compilation]>} */
      afterEmit: new AsyncSeriesHook(["compilation"]),

      /** @type {SyncHook<[Compilation, CompilationParams]>} */
      thisCompilation: new SyncHook(["compilation", "params"]),
      /** @type {SyncHook<[Compilation, CompilationParams]>} */
      compilation: new SyncHook(["compilation", "params"]),
      /** @type {SyncHook<[NormalModuleFactory]>} */
      normalModuleFactory: new SyncHook(["normalModuleFactory"]),
      /** @type {SyncHook<[ContextModuleFactory]>}  */
      contextModuleFactory: new SyncHook(["contextModuleFactory"]),

      /** @type {AsyncSeriesHook<[CompilationParams]>} */
      beforeCompile: new AsyncSeriesHook(["params"]),
      /** @type {SyncHook<[CompilationParams]>} */
      compile: new SyncHook(["params"]),
      /** @type {AsyncParallelHook<[Compilation]>} */
      make: new AsyncParallelHook(["compilation"]),
      /** @type {AsyncParallelHook<[Compilation]>} */
      finishMake: new AsyncSeriesHook(["compilation"]),
      /** @type {AsyncSeriesHook<[Compilation]>} */
      afterCompile: new AsyncSeriesHook(["compilation"]),

      /** @type {AsyncSeriesHook<[]>} */
      readRecords: new AsyncSeriesHook([]),
      /** @type {AsyncSeriesHook<[]>} */
      emitRecords: new AsyncSeriesHook([]),

      /** @type {AsyncSeriesHook<[Compiler]>} */
      watchRun: new AsyncSeriesHook(["compiler"]),
      /** @type {SyncHook<[Error]>} */
      failed: new SyncHook(["error"]),
      /** @type {SyncHook<[string | null, number]>} */
      invalid: new SyncHook(["filename", "changeTime"]),
      /** @type {SyncHook<[]>} */
      watchClose: new SyncHook([]),
      /** @type {AsyncSeriesHook<[]>} */
      shutdown: new AsyncSeriesHook([]),

      /** @type {SyncBailHook<[string, string, any[]], true>} */
      infrastructureLog: new SyncBailHook(["origin", "type", "args"]),

      // TODO the following hooks are weirdly located here
      // TODO move them for webpack 5
      /** @type {SyncHook<[]>} */
      environment: new SyncHook([]),
      /** @type {SyncHook<[]>} */
      afterEnvironment: new SyncHook([]),
      /** @type {SyncHook<[Compiler]>} */
      afterPlugins: new SyncHook(["compiler"]),
      /** @type {SyncHook<[Compiler]>} */
      afterResolvers: new SyncHook(["compiler"]),
      /** @type {SyncBailHook<[string, Entry], boolean>} */
      entryOption: new SyncBailHook(["context", "entry"])
    });
  }
}