import {WebpackOptions} from '../declarations/WebpackOptions'
import {Compilation} from './Compilation'
import asyncLib from 'neo-async'

export class Compiler {
  private hooks: Readonly<{ watchRun: AsyncSeriesHook; afterDone: SyncHook; run: AsyncSeriesHook; normalModuleFactory: SyncHook; assetEmitted: AsyncSeriesHook; beforeCompile: AsyncSeriesHook; compile: SyncHook; watchClose: SyncHook; entryOption: SyncBailHook; afterResolvers: SyncHook; make: AsyncParallelHook; afterEnvironment: SyncHook; additionalPass: AsyncSeriesHook; beforeRun: AsyncSeriesHook; failed: SyncHook; afterCompile: AsyncSeriesHook; done: AsyncSeriesHook; shouldEmit: SyncBailHook; environment: SyncHook; thisCompilation: SyncHook; compilation: SyncHook; afterEmit: AsyncSeriesHook; emitRecords: AsyncSeriesHook; readRecords: AsyncSeriesHook; invalid: SyncHook; initialize: SyncHook; emit: AsyncSeriesHook; contextModuleFactory: SyncHook; infrastructureLog: SyncBailHook; finishMake: AsyncSeriesHook; shutdown: AsyncSeriesHook; afterPlugins: SyncHook }>
  private running: any
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
    // const hook1 = new SyncHook(["arg1", "arg2", "arg3"]);

    // 生命周期钩子
    this.hooks = Object.freeze({
      /** @type {SyncHook<[]>} */
      initialize: new SyncHook([]), // 当编译器对象被初始化时调用

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


    // make生命周期。将编译对象传入。此时可以拿到编译对象
    this.hooks.make.callAsync(compilation, err => {
      if (err) return callback(err);

      this.hooks.finishMake.callAsync(compilation, err => {
        if (err) return callback(err);

        process.nextTick(() => {
          compilation.finish(err => {
            if (err) return callback(err);

            compilation.seal(err => {
              if (err) return callback(err);

              this.hooks.afterCompile.callAsync(compilation, err => {
                if (err) return callback(err);

                return callback(null, compilation);
              });
            });
          });
        });
      });
    });
  }

  run(callback) {
    if (this.running) {
      //
    }

    this.running = true;

    // 编译结束后得回调函数
    const finalCallback = (err, stats = undefined) => {
      this.running = false;
      if (err) {
        // 出错了 调用错误钩子
        this.hooks.failed.call(err);
      }
      if (callback !== undefined) callback(err, stats);
      // 执行结束后得钩子
      this.hooks.afterDone.call(stats);
    };

    // 编译后得回调函数.
    // onCompiled是在Compiler.run中定义的，传给Compiler.compile的回调函数。在compile过程后调用，主要用于输出构建资源。
    const onCompiled = (err, compilation) => {
      if (err) return finalCallback(err, undefined);

      // 判断是否输出资源的钩子函数
      if (this.hooks.shouldEmit.call(compilation) === false) {
        compilation.startTime = startTime;
        compilation.endTime = Date.now();
        const stats = new Stats(compilation);
        this.hooks.done.callAsync(stats, err => {
          if (err) return finalCallback(err, undefined);
          return finalCallback(null, stats);
        });
        return;
      }

      // todo 输出资源
      process.nextTick(() => {
      });
    };

    // 执行before钩子函数
    const run = () => {
      this.hooks.beforeRun.callAsync(this, err => {
        if (err) return finalCallback(err);

        this.hooks.run.callAsync(this, err => {
          if (err) return finalCallback(err);

          // readRecords用于读取之前的records的方法，关于records，
          this.readRecords(err => {
            if (err) return finalCallback(err);
            // 核心
            this.compile(onCompiled);
          });
        });
      });
    };


    run();
  }

  /**
   * @param {Callback<void>} callback signals when the call finishes
   * @returns {void}
   */
  readRecords(callback) {
    if (this.hooks.readRecords.isUsed()) {
      // recordsInputPath是webpack配置中指定的读取上一组records的文件路径
      if (this.recordsInputPath) {
        asyncLib.parallel([
          cb => this.hooks.readRecords.callAsync(cb),
          this._readRecords.bind(this)
        ]);
      } else {
        this.records = {};
        this.hooks.readRecords.callAsync(callback);
      }
    } else {
      if (this.recordsInputPath) {
        this._readRecords(callback);
      } else {
        this.records = {};
        callback();
      }
    }
  }

  /**
   * @param {Callback<void>} callback signals when the call finishes
   * @returns {void}
   */
  // readRecords用于读取之前的records的方法，关于records，
  // 文档的描述是pieces of data used to store module identifiers across multiple builds
  // （一些数据片段，用于储存多次构建过程中的module的标识）可参考recordsPath。
  _readRecords(callback) {
    if (!this.recordsInputPath) {
      this.records = {};
      return callback();
    }
    this.inputFileSystem.stat(this.recordsInputPath, err => {
      // It doesn't exist
      // We can ignore this.
      if (err) return callback();

      this.inputFileSystem.readFile(this.recordsInputPath, (err, content) => {
        if (err) return callback(err);

        try {
          this.records = parseJson(content.toString("utf-8"));
        } catch (e) {
          e.message = "Cannot parse records: " + e.message;
          return callback(e);
        }

        return callback();
      });
    });
  }

}