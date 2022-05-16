import { WebpackOptions } from '../declarations/WebpackOptions'
import { Compiler } from './complier'
import {NodeEnvironmentPlugin} from './node/NodeEnvionmentPlugin'

const webpack = (options: WebpackOptions) => {
  const create = () => {
    // 奇怪的校验. 校验配置
    // if (!asArray(options).every(webpackOptionsSchemaCheck)) {
    //   getValidateSchema()(webpackOptionsSchema, options);
    //   util.deprecate(
    //     () => {},
    //     "webpack bug: Pre-compiled schema reports error while real schema is happy. This has performance drawbacks.",
    //     "DEP_WEBPACK_PRE_COMPILED_SCHEMA_INVALID"
    //   )();
    // }

    let compiler;
    const webpackOptions = /** @type {WebpackOptions} */ (options);

    // 1. 创建编译器
    compiler = createCompiler(webpackOptions);
    // 2. 执行 run
    compiler.run()
  }
}

const createCompiler = rawOptions => {
  // 1. 调用 getNormalizedWebpackOptions + applyWebpackOptionsBaseDefaults 合并出最终配置
  const options = getNormalizedWebpackOptions(rawOptions);
  applyWebpackOptionsBaseDefaults(options);

  const compiler = new Compiler(options.context, options);
  // 2. 环境插件
  new NodeEnvironmentPlugin({
    infrastructureLogging: options.infrastructureLogging
  }).apply(compiler)
  // 3. 注册自定义插件
  if (Array.isArray(options.plugins)) {
    // 遍历用户定义的 plugins 集合，执行插件的 apply 方法
    for (const plugin of options.plugins) {
      // 插件是函数的话， 直接调用
      if (typeof plugin === "function") {
        plugin.call(compiler, compiler);
      } else {
        // 否则，调用他的apply方法
        plugin.apply(compiler);
      }
    }
  }
  // 4. 处理参数？ 不知道干嘛? 前边两个不够吗
  // applyWebpackOptionsDefaults(options);
  // 5. 在加载内部插件之前 执行两个生命周期的回调函数 environment afterEnvironment
  compiler.hooks.environment.call();
  compiler.hooks.afterEnvironment.call();
  // 6. new WebpackOptionsApply().process 方法，加载各种内置插件
  new WebpackOptionsApply().process(options, compiler);
  compiler.hooks.initialize.call();
}