/**
 * Options object as provided by the user.
 */
import {
  CacheOptions,
  Context,
  Dependencies,
  DevServer,
  DevTool,
  Entry,
  Experiments,
  Externals,
  ExternalsPresets,
  ExternalsType,
  IgnoreWarnings,
  InfrastructureLogging,
  Loader,
  Mode,
  ModuleOptions,
  Name,
  Node,
  Optimization,
  Output,
  Parallelism,
  Performance,
  Plugins,
  Profile,
  RecordsInputPath,
  RecordsOutputPath,
  RecordsPath,
  Resolve,
  ResolveLoader,
  SnapshotOptions,
  StatsValue, Target, Watch, WatchOptions
} from '../../webpack/webpack/declarations/WebpackOptions'

/**
 * Set the value of `require.amd` and `define.amd`. Or disable AMD support.
 */
export type Amd =
    | false
    | {
  [k: string]: any;
};

/**
 * Report the first error as a hard error instead of tolerating it.
 */
export type Bail = boolean;

export interface WebpackOptions {
  /**
   * Set the value of `require.amd` and `define.amd`. Or disable AMD support.
   */
  amd?: Amd;
  /**
   * Report the first error as a hard error instead of tolerating it.
   */
  bail?: Bail;
  /**
   * Cache generated modules and chunks to improve performance for multiple incremental builds.
   */
  cache?: CacheOptions;
  /**
   * The base directory (absolute path!) for resolving the `entry` option. If `output.pathinfo` is set, the included pathinfo is shortened to this directory.
   */
  context?: Context;
  /**
   * References to other configurations to depend on.
   */
  dependencies?: Dependencies;
  /**
   * Options for the webpack-dev-server.
   */
  devServer?: DevServer;
  /**
   * A developer tool to enhance debugging (false | eval | [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map).
   */
  devtool?: DevTool;
  /**
   * The entry point(s) of the compilation.
   */
  entry?: Entry;
  /**
   * Enables/Disables experiments (experimental features with relax SemVer compatibility).
   */
  experiments?: Experiments;
  /**
   * Specify dependencies that shouldn't be resolved by webpack, but should become dependencies of the resulting bundle. The kind of the dependency depends on `output.libraryTarget`.
   */
  externals?: Externals;
  /**
   * Enable presets of externals for specific targets.
   */
  externalsPresets?: ExternalsPresets;
  /**
   * Specifies the default type of externals ('amd*', 'umd*', 'system' and 'jsonp' depend on output.libraryTarget set to the same value).
   */
  externalsType?: ExternalsType;
  /**
   * Ignore specific warnings.
   */
  ignoreWarnings?: IgnoreWarnings;
  /**
   * Options for infrastructure level logging.
   */
  infrastructureLogging?: InfrastructureLogging;
  /**
   * Custom values available in the loader context.
   */
  loader?: Loader;
  /**
   * Enable production optimizations or development hints.
   */
  mode?: Mode;
  /**
   * Options affecting the normal modules (`NormalModuleFactory`).
   */
  module?: ModuleOptions;
  /**
   * Name of the configuration. Used when loading multiple configurations.
   */
  name?: Name;
  /**
   * Include polyfills or mocks for various node stuff.
   */
  node?: Node;
  /**
   * Enables/Disables integrated optimizations.
   */
  optimization?: Optimization;
  /**
   * Options affecting the output of the compilation. `output` options tell webpack how to write the compiled files to disk.
   */
  output?: Output;
  /**
   * The number of parallel processed modules in the compilation.
   */
  parallelism?: Parallelism;
  /**
   * Configuration for web performance recommendations.
   */
  performance?: Performance;
  /**
   * Add additional plugins to the compiler.
   */
  plugins?: Plugins;
  /**
   * Capture timing information for each module.
   */
  profile?: Profile;
  /**
   * Store compiler state to a json file.
   */
  recordsInputPath?: RecordsInputPath;
  /**
   * Load compiler state from a json file.
   */
  recordsOutputPath?: RecordsOutputPath;
  /**
   * Store/Load compiler state from/to a json file. This will result in persistent ids of modules and chunks. An absolute path is expected. `recordsPath` is used for `recordsInputPath` and `recordsOutputPath` if they left undefined.
   */
  recordsPath?: RecordsPath;
  /**
   * Options for the resolver.
   */
  resolve?: Resolve;
  /**
   * Options for the resolver when resolving loaders.
   */
  resolveLoader?: ResolveLoader;
  /**
   * Options affecting how file system snapshots are created and validated.
   */
  snapshot?: SnapshotOptions;
  /**
   * Stats options object or preset name.
   */
  stats?: StatsValue;
  /**
   * Environment to build for. An array of environments to build for all of them when possible.
   */
  target?: Target;
  /**
   * Enter watch mode, which rebuilds on file change.
   */
  watch?: Watch;
  /**
   * Options for the watcher.
   */
  watchOptions?: WatchOptions;
}