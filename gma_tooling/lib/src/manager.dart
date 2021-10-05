import 'dart:io';

import 'package:args/args.dart';
import 'package:cli_util/cli_logging.dart';

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/exceptions/not_found_packages.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';
import 'package:gmat/src/processor/init_processor.dart';

import 'models/package.dart';

class GmaManager {
  GmaManager._({
    required this.directory,
    required this.logger,
    this.isDryRun = false,
    this.isFastFail = false,
    this.isVerbose = false,
    this.excludeExamples = true,
    this.concurrency = Constants.defaultConcurency,
    this.filters,
    this.dependsOn,
    this.devDependsOn,
  });
  factory GmaManager.fromArgResults(ArgResults? results,
      {required Logger logger}) {
    final _directory = Directory.current;

    return GmaManager._(
      directory: _directory,
      logger: logger,
      concurrency: int.parse(results?[Constants.argConcurrency]),
      excludeExamples: results?[Constants.argExamples] == false,
      isVerbose: results?[Constants.argVerbose] == true,
      isFastFail: results?[Constants.argFastFail] == true,
      isDryRun: results?[Constants.argDryRun] == true,
      filters: results?[Constants.argFilter],
        dependsOn: results?[Constants.argFilterDependency],
        devDependsOn: results?[Constants.argFilterDevDependency]
    );
  }
  final bool isDryRun;

  final bool isFastFail;
  final bool isVerbose;
  final int concurrency;
  final bool excludeExamples;
  final Logger logger;
  
  final Directory directory;
  final String? filters;
  final String? dependsOn;
  final String? devDependsOn;

  List<Package> packagesGlob = [];
  List<Package> selectedPackages = [];
  final List<Package> allPackages = [];
  /// Initialize manager
  ///
  /// will fetch all the necessary packages from root of project
  /// [allPackages] and [selectedPackages] are filled with content
  Future<void> init({bool shouldUseFilter = true}) async {
    final _packages = await InitProcessor(
            workspace: directory, logger: logger, filters: filters?.split(','))
        .execute();
    allPackages.addAll(_packages);
    selectedPackages = allPackages;
    // for (final item in selectedPackages) print(item);
    applyExcludeExamples();
    if (shouldUseFilter) {
      applyDependencies(dependsOn: dependsOn?.split(','));
      applyDevDependencies(dependsOn: devDependsOn?.split(','));
    }
    if (selectedPackages.isEmpty) throw NotFoundPackages();
    
  }


  void applyExcludeExamples() {
    if (!excludeExamples) return;
    final glob =
        GlobCreate.create('**/example**', currentDirectoryPath: directory.path);
    print(glob);
    selectedPackages = allPackages
        .where((element) => !glob.matches(element.directory.path))
        .sortByName()
        .toList();
  }
  /// Apply filter for packages with `koyal_flavor` dependency in pubspec.yaml
  void applyFlavorFilter({List<String>? apps}) {
    print(apps);
    selectedPackages = allPackages.where((p) => p.hasFlavor == true).toList();
    if (apps != null) {
      selectedPackages = selectedPackages
          .where((app) => apps.any((element) => element == app.name))
          .sortByName()
          .toList();
    }
    print(selectedPackages);
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dev_dependencies:`
  void applyDevDependencies({List<String>? dependsOn}) {
    if (dependsOn == null) return;
    selectedPackages = selectedPackages
        .where((element) =>
            dependsOn.any((e) => element.devDependencies.containsKey(e)))
            .sortByName()
        .toList();
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dependencies:`
  void applyDependencies({List<String>? dependsOn}) {
    if (dependsOn == null) return;
    selectedPackages = selectedPackages
        .where((element) =>
            dependsOn.any((e) => element.dependencies.containsKey(e)))
        .sortByName()
        .toList();
    
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dependencies:` or `dev_dependencies:`
  void applyAllDependencies({List<String>? dependsOn}) {
    if (dependsOn == null) return;
    selectedPackages = selectedPackages
        .where((element) => dependsOn.any((e) =>
            element.dependencies.containsKey(e) ||
            element.devDependencies.containsKey(e)))
          .sortByName()
        .toList();
  }
  /// Clean all
  ///
  /// remove all
  void cleanStorage() {
    final globList = Globs.cleanFiles.toGlobList(directory);
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
    
    items.clear();
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
    return 'GmaManager[packages:${allPackages.length} filtred: ${selectedPackages.length} concurrency: $concurrency, isDryRun: $isDryRun, isFastFail: $isFastFail, isVerbose: $isVerbose directory: $directory]';
  }  
}
