import 'dart:io';
import 'dart:math';

import 'package:args/args.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:pool/pool.dart';

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/processor/init_processor.dart';

import 'models/package.dart';

class GmaManager {
  GmaManager({
    required this.directory,
    required this.logger,
    this.filter = const [],
    this.isDryRun = false,
    this.isFastFail = false,
    this.isVerbose = false,
    this.concurrency = Constants.defaultConcurency,
  });
  factory GmaManager.fromArgResults(ArgResults? results,
      {required Logger logger}) {
    final _directory =
        Directory(results?[Constants.argDirectory] ?? Directory.current.path);
    return GmaManager(
      directory: _directory,
      logger: logger,
      concurrency: int.parse(results?[Constants.argConcurrency]),
      isVerbose: results?[Constants.argVerbose] == true,
      isFastFail: results?[Constants.argFastFail] == true,
      isDryRun: results?[Constants.argDryRun] == true,
    );
  }
  final bool isDryRun;

  final bool isFastFail;
  final bool isVerbose;
  final int concurrency;
  final Logger logger;
  final List<Package> packages = [];
  final Directory directory;
  final List<String> filter;
  List<Package> packagesGlob = [];
  List<Package> filtered = [];

  /// Initialize manager
  ///
  /// will fetch all the necessary packages from root of project
  /// [packages] and [filtered] are filled with content
  Future<void> init() async {
    final _packages = await InitProcessor(
            workspace: directory, logger: logger)
        .execute();
    packages.addAll(_packages);
    filtered = packages;
  }

  /// Get max pool concurency jobs with min: `2`
  /// and default concurency value is `6`
  int get maxConcurrency => max(2, concurrency);
  Pool get createPool => Pool(maxConcurrency, timeout: Duration(seconds: 30));

  /// Apply filter for packages with `koyal_flavor` dependency in pubspec.yaml
  void applyFlavorFilter({List<String>? apps}) {
    filtered = packages.where((p) => p.hasFlavor == true).toList();
    if (apps != null) {
      filtered = filtered
          .where((app) => apps.any((element) => element == app.name))
          .toList();
    }
    applySort();
  }

  /// Apply package filters with glob pattern
  ///
  /// example: packages with `capp_` and starts with letters from `A` to `D`
  /// ```
  /// capp_[a-d]**
  /// ```
  void applyPackage({List<String>? filterPatterns}) {
    if (filterPatterns == null || filterPatterns.isEmpty) {
      filtered = packages;
    } else {
      filtered = packages
          .where((element) => filterPatterns.any((pattern) =>
              GlobCreate.create(pattern, currentDirectoryPath: directory.path)
                  .matches(element.name?.trim() ?? '')))
          .toList();
    }
    applySort();
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dev_dependencies:`
  void applyDevDependencies({List<String> dependsOn = const <String>[]}) {
    filtered = filtered
        .where((element) =>
            dependsOn.any((e) => element.devDependencies.keys.contains(e)))
        .toList();
    applySort();
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dependencies:`
  void applyDependencies({List<String> dependsOn = const <String>[]}) {
    filtered = filtered
        .where((element) =>
            dependsOn.any((e) => element.devDependencies.keys.contains(e)))
        .toList();
    applySort();
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dependencies:` or `dev_dependencies:`
  void applyAllDependencies({List<String> dependsOn = const <String>[]}) {
    filtered = filtered
        .where((element) => dependsOn.any((e) =>
            element.dependencies.keys.contains(e) ||
            element.devDependencies.keys.contains(e)))
        .toList();
    applySort();
  }

  /// Sort filtred packages by name and path
  void applySort() {
    filtered.sort((a, b) => a.directoryName.compareTo(b.directoryName));
  }

  /// Clean all
  ///
  /// remove all
  void cleanStorage() {
    final globList = cleanFiles.map((e) => GlobCreate.create(e,
        currentDirectoryPath: directory.path, recursive: true));
    print(globList);
    final items = directory
        .listSync(recursive: true, followLinks: false)
        .where((file) => globList.any((glob) => glob.matches(file.path)))
        .toList();
    for (final item in items) {
      print(item.path);
      if (item is Directory) {
        item.deleteSync(recursive: true);
      } else if (item is File) {
        item.deleteSync();
      }
    }
  }

  /// Simple logger of the [message] to the stdout
  void log(String messsage) {
    logger.stdout(messsage);
  }

  /// Simple error logger of the [message] to the stderr
  void logErrror(String message) {
    logger.stderr(message);
  }

  @override
  String toString() {
    return 'GmaManager[packages:${packages.length} filtred: ${filtered.length} concurrency: $concurrency, isDryRun: $isDryRun, isFastFail: $isFastFail, isVerbose: $isVerbose directory: $directory]';
  }
}
