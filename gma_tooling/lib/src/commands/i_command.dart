import 'dart:async';
import 'dart:io';

import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/manager/manager.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:gmat/src/models/package.dart';
import 'package:process_runner/process_runner.dart';

abstract class SimpleGmaCommand<T> extends Command<T> {
  int get concurrency => int.parse(globalResults?[Constants.argConcurrency]);
  bool get isVerbose => globalResults?[Constants.argVerbose] == true;
  bool get isFastFail => globalResults?[Constants.argFastFail] == true;
  bool get isDryRun => globalResults?[Constants.argDryRun] == true;
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
    usageLineLength: stdout.terminalColumns,
    allowTrailingOptions: allowTrailingOptions,
  );
}


abstract class GmaCommand extends SimpleGmaCommand<void> {
  bool get shouldUseFilter => true;

  late GmaManager manager;

  @override
  FutureOr<void> run() async {
    manager = await GmaManager.initialize(globalResults, logger,
        shouldUseFilter: shouldUseFilter);
    
  }

  Future<void> executeOnSelected({List<GmaWorker>? addToJobs}) async {
    final jobs = manager.getWorkerJobs(command: command, arguments: arguments);
    if (addToJobs != null && addToJobs.isNotEmpty) {
      jobs.addAll(addToJobs);
    }
    try {
      await for (final job in manager.pool.startWorkers(jobs)) {
        if (job is GmaWorker) {
          manager.loggerProgress(job);
          if (job.result.exitCode > 0) {
            failures[job.package as Package] = job.result.exitCode;
          }
        }
        
    }
    } on ProcessRunnerException catch (e) {
      if (isFastFail) {
        stderr.writeln('execution failed: $e');
        exitCode = e.exitCode;
        return;
      }
    }
    return Future.value(null);
  }
}

abstract class GmaMultipleCommand extends GmaCommand {
  List<MapEntry<String?, List<String>>> commands = [];

  @override
  FutureOr<void> run() async {
    await super.run();
  }
  
  @override
  Future<void> executeOnSelected({List<GmaWorker>? addToJobs}) async {
    for (final item in commands) {
      command = item.key;
      customArgs = item.value.toSet();
      await super.executeOnSelected();
      failures.addAll(super.failures);
    }
  }
}

class GmaWorker extends WorkerJob {
  GmaWorker(
    this.package,
    List<String> command, {
    String? name,
    Directory? workingDirectory,
    bool printOutput = false,
    bool runInShell = true,
    bool isFastFail = false,
  }) : super(command,
            name: name,
            workingDirectory: workingDirectory,
            printOutput: printOutput,
            runInShell: runInShell,
            failOk: !isFastFail);
  final Package? package;
}
