import {WebpackOptions} from '../declarations/WebpackOptions'
import {Compilation} from './Compilation'

export class Compiler {
  private hooks: Readonly<{ watchRun: AsyncSeriesHook; afterDone: SyncHook; run: AsyncSeriesHook; normalModuleFactory: SyncHook; assetEmitted: AsyncSeriesHook; beforeCompile: AsyncSeriesHook; compile: SyncHook; watchClose: SyncHook; entryOption: SyncBailHook; afterResolvers: SyncHook; make: AsyncParallelHook; afterEnvironment: SyncHook; additionalPass: AsyncSeriesHook; beforeRun: AsyncSeriesHook; failed: SyncHook; afterCompile: AsyncSeriesHook; done: AsyncSeriesHook; shouldEmit: SyncBailHook; environment: SyncHook; thisCompilation: SyncHook; compilation: SyncHook; afterEmit: AsyncSeriesHook; emitRecords: AsyncSeriesHook; readRecords: AsyncSeriesHook; invalid: SyncHook; initialize: SyncHook; emit: AsyncSeriesHook; contextModuleFactory: SyncHook; infrastructureLog: SyncBailHook; finishMake: AsyncSeriesHook; shutdown: AsyncSeriesHook; afterPlugins: SyncHook }>
  /**
   * @param {string} context the compilation path
   * @param {WebpackOptions} options options
   */
  constructor(context: string, options: WebpackOptions = {}) {
    // 一大堆钩子函数
    //绑定事件到webapck事件流,
    //     hook1.tap('标识符', (arg1, arg2, arg3) => console.log(arg1, arg2, arg3)) //1,2,3
    //执行绑定的事件
    //     hook1.call(1,2,3)
    const hook1 = new SyncHook(["arg1", "arg2", "arg3"]);

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

  // 一些奇怪的参数处理，先不看
  newCompilationParams() {
    const params = {
      // normalModuleFactory: this.createNormalModuleFactory(),
      // contextModuleFactory: this.createContextModuleFactory()
    };
    return params;
  }

  createCompilation(params) {
    this._cleanupLastCompilation();
    return (this._lastCompilation = new Compilation(this, params));
  }

  newCompilation(params) {
    const compilation = this.createCompilation(params);
    compilation.name = this.name;
    compilation.records = this.records;
    this.hooks.thisCompilation.call(compilation, params);
    this.hooks.compilation.call(compilation, params);
    return compilation;
  }

  compile(callback) {
    // ？
    const params = this.newCompilationParams();

    // 编译前的钩子函数
    this.hooks.compile.call(params);

    // 创建一次编译对象. 每次编译都会生成一个
    const compilation = this.newCompilation(params);

    // make 回调函数。 在创建玩编译对象后执行
    this.hooks.make.callAsync(compilation, err => {
      if (err) return callback(err);
      // make 之后的
      this.hooks.finishMake.callAsync
    })

  }
}