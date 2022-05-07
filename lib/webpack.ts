import { WebpackOptions } from '../declarations/WebpackOptions'
import { Compiler } from './complier'
import {NodeEnvironmentPlugin} from './node/NodeEnvionmentPlugin'

const webpack = (options: WebpackOptions) => {
  const create = () => {
    // 奇怪的校验
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
    // 2. 环境插件
    new NodeEnvironmentPlugin({
      infrastructureLogging: options.infrastructureLogging
    }).apply(compiler)
  }
}

const createCompiler = rawOptions => {
  // 处理参数
  // const options = getNormalizedWebpackOptions(rawOptions);
  // applyWebpackOptionsBaseDefaults(options);

  const compiler = new Compiler(options.context, options);

}