import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/args.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/i_command.dart';

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/exceptions/not_found_packages.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';
import 'package:gmat/src/extensions/directory_ext.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/processor/init_processor.dart';
import 'package:process_runner/process_runner.dart';

import '../models/package.dart';
part '_logger.dart';
part '_processor.dart';
part '_filters.dart';

abstract class _GmaManager {
  Logger get logger;
  Directory get directory;

  bool get isDryRun;
  bool get isFastFail;
  bool get isVerbose;
  int get concurrency;
  bool get excludeExamples;

  String? get filters;
  String? get dependsOn;
  String? get devDependsOn;

  List<Package> selectedPackages = [];
  final List<Package> allPackages = [];
  late ProcessPool pool;
  void log(String message);
  void logError(String message);
  Progress logProgress(String message);
  Map<Package, MapEntry<int, String>> failures = {};

  Future<void> runFiltered(String command, Set<String> arguments);
}

class GmaManager extends _GmaManager
    with _FiltersMixin, _ProcessorMixin, _LoggerMixin {
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
  }) {
    initPool();
  }
  factory GmaManager.fromArgResults(ArgResults? results,
      {required Logger logger}) {
    return GmaManager._(
      directory: Directory.current,
      logger: logger,
      concurrency: int.parse(results?[Constants.argConcurrency]),
      excludeExamples: results?[Constants.argExamples] == false,
      isVerbose: results?[Constants.argVerbose] == true,
      isFastFail: results?[Constants.argFastFail] == true,
      isDryRun: results?[Constants.argDryRun] == true,
      filters: results?[Constants.argFilter],
      dependsOn: results?[Constants.argFilterDependency],
      devDependsOn: results?[Constants.argFilterDevDependency],
    );
  }
  static Future<GmaManager> initialize(ArgResults? results, Logger logger,
      {bool shouldUseFilter = true}) async {
    final manager = GmaManager.fromArgResults(results, logger: logger);
    await manager.init(shouldUseFilter: shouldUseFilter);
    return manager;
  }

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

    applyExcludeExamples();

    if (shouldUseFilter) {
      applyDependencies(dependsOn: dependsOn?.split(','));
      applyDevDependencies(dependsOn: devDependsOn?.split(','));
    }
    // for (final item in selectedPackages) print(item);
    if (selectedPackages.isEmpty) throw NotFoundPackages();
  }

  /// Clean all
  ///
  /// remove all
  Future<void> cleanStorage() async {
    final globList = Globs.cleanFiles.toGlobList(directory);
    print(globList);
    for (final item in await directory
        .list(recursive: true, followLinks: false)
        .where((file) => globList.any((glob) => glob.matches(file.path)))
        .toList()) {
      print(item.path);
      if (item is Directory) {
        await item.delete(recursive: true);
      } else if (item is File) {
        await item.delete();
      }
    }
  }

  @override
  String toString() {
    return 'GmaManager[packages:${allPackages.length} filtred: ${selectedPackages.length} concurrency: $concurrency, isDryRun: $isDryRun, isFastFail: $isFastFail, isVerbose: $isVerbose directory: $directory]';
  }

  @override
  final int concurrency;

  @override
  final Directory directory;

  @override
  final bool excludeExamples;

  @override
  final bool isDryRun;

  @override
  final bool isFastFail;

  @override
  final bool isVerbose;

  @override
  final Logger logger;

  @override
  String? dependsOn;

  @override
  String? devDependsOn;

  @override
  String? filters;

  @override
  Future<void> runFiltered(String? command, Set<String> arguments,
      {void Function(GmaWorker job)? cb}) async {
    final jobs = getWorkerJobs(command: command, arguments: arguments);
    try {
      await for (final WorkerJob job in pool.startWorkers(jobs)) {
        final worker = job as GmaWorker;
        loggerProgress(job);
        if (worker.result.exitCode > 0) {
          failures[worker.package as Package] =
              MapEntry(worker.result.exitCode, worker.result.stderr);
        }
        cb?.call(job);
      }
    } on ProcessRunnerException catch (e) {
      print(e);
      if (isFastFail) {
        stderr.writeln('execution failed: $e');
        exitCode = e.exitCode;
        return;
      }
    }
    return Future.value(null);
  }
}
