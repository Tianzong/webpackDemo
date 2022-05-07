

interface WebpackPlugin {
  apply: Function
}

export class NodeEnvironmentPlugin implements WebpackPlugin {
  private options: any
  /**
   * @param {Object} options options
   * @param {InfrastructureLogging} options.infrastructureLogging infrastructure logging options
   */
  constructor(options) {
    this.options = options;
  }

  // 插件必须实现的方法 apply
  apply(compiler) {
    // 这里看起来好像是给webpack的 compiler下挂载了一些属性。输入输出，控制台打印。
    const { infrastructureLogging } = this.options;
    compiler.infrastructureLogger = createConsoleLogger({
      level: infrastructureLogging.level || "info",
      debug: infrastructureLogging.debug || false,
      console:
        infrastructureLogging.console ||
        nodeConsole({
          colors: infrastructureLogging.colors,
          appendOnly: infrastructureLogging.appendOnly,
          stream: infrastructureLogging.stream
        })
    });
    compiler.inputFileSystem = new CachedInputFileSystem(fs, 60000);
    const inputFileSystem = compiler.inputFileSystem;
    compiler.outputFileSystem = fs;
    compiler.intermediateFileSystem = fs;
    compiler.watchFileSystem = new NodeWatchFileSystem(
      compiler.inputFileSystem
    );
    // 指定生命周期注册钩子函数?
    compiler.hooks.beforeRun.tap("NodeEnvironmentPlugin", compiler => {
      if (compiler.inputFileSystem === inputFileSystem) {
        compiler.fsStartTime = Date.now();
        inputFileSystem.purge();
      }
    });
  }
}