import 'dart:async';
import 'dart:io';

import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';
import 'package:gmat/src/manager/manager.dart';
import 'package:gmat/src/models/gma_worker.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:gmat/src/models/package.dart';
import 'package:process_runner/process_runner.dart';

abstract class SimpleGmaCommand<T> extends Command<T> {
  int get concurrency => int.parse(globalResults?[Constants.argConcurrency]);
  bool get isVerbose => globalResults?[Constants.argVerbose] == true;
  bool get isFastFail => globalResults?[Constants.argFastFail] == true;
  bool get isDryRun => globalResults?[Constants.argDryRun] == true;
  bool get isAffectedOnly => globalResults?[Constants.argAffectedOnly] == true;
  Logger get logger => isVerbose ? GmatVerboseLogger() : GmatStandardLogger();
  final failures = <Package, int>{};
  @override
  String get usageFooter => TextConstants.footerUsageKey;
  String? command;
  Set<String> get arguments => customArgs;
  Set<String> customArgs = {};
  Map<Package, Progress> taskProgres = {};
  
  bool get allowTrailingOptions => true;
  @override
  late final ArgParser argParser = ArgParser(
    usageLineLength: terminalColumns,
    allowTrailingOptions: allowTrailingOptions,
  );
}


abstract class GmaCommand extends SimpleGmaCommand<void> {
  bool get shouldUseFilter => true;
  late GmaManager manager;

  Future<void> initialize() async {
    manager = await GmaManager.initialize(globalResults, logger,
        shouldUseFilter: shouldUseFilter);
    return;
  }

  @override
  FutureOr<void> run() async {
    await initialize();
    
  }

  Future<void> executeOnSelected({List<GmaWorker>? addToJobs}) async {
    final jobs = manager.getWorkerJobs(command: command, arguments: arguments);
    if (addToJobs != null && addToJobs.isNotEmpty) {
      jobs.addAll(addToJobs);
    }
    return runJobs(jobs: jobs);
  }

  Future<void> runJobs({List<GmaWorker> jobs = const <GmaWorker>[]}) async {
    try {
      await for (final job in manager.pool.startWorkers(jobs)) {
        if (job is GmaWorker) {
          manager.loggerProgress(job);
          if (job.result.exitCode > 0) {
            if (job.package != null) {
              failures[job.package as Package] = job.result.exitCode;
            } else {
              manager.logError('${job.name} failed: ${job.result.exitCode}');
            }
          }
        }
        
    }
    } on ProcessRunnerException catch (e) {
      if (isFastFail) {
        manager.logError('execution failed: $e');
        exitCode = e.exitCode;
        return;
      }
    } catch (e, s) {
      manager.logError('execution failed: $e');
      print(e);
      print(s);
    }
    return Future.value(null);
  }
}


