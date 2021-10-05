import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/command_runner.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/exceptions/not_found_packages.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/manager.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:gmat/src/models/package.dart';


abstract class SimpleGmaCommand<T> extends Command<T> {
  int get concurrency => int.parse(globalResults?[Constants.argConcurrency]);
  bool get isVerbose => globalResults?[Constants.argVerbose] == true;
  bool get isFastFail => globalResults?[Constants.argFastFail] == true;
  bool get isDryRun => globalResults?[Constants.argDryRun] == true;
  Logger get logger => isVerbose ? GmatVerboseLogger() : GmatStandardLogger();
  final failures = <Package, int>{};
  @override
  String? get usageFooter => TextConstants.footerUsageKey;
  String? command;
  Set<String> get arguments => customArgs;
  Set<String> customArgs = {};
  Map<Package, Progress> taskProgres = {};
  
}

abstract class GmaCommand extends SimpleGmaCommand<void> {
  bool get shouldUseFilter => true;
  
  late GmaManager manager;
  
  @override
  String? get usageFooter => TextConstants.footerUsageKey;
 
  @override
  FutureOr<void> run() async {
    manager = GmaManager.fromArgResults(globalResults, logger: logger);
    try {
    await manager.init(shouldUseFilter: shouldUseFilter);
    } catch (e) {
      if (e is NotFoundPackages) {
        logger.stdout(
          AnsiStyles.gray(
            'Hint: if this is unexpected, '
            'try running the command again with a reduced number of filters applied.',
          ),
        );
        printUsage();
        exit(64);
      }
      rethrow;
    }
  }

  Future<void> executeOnSelected() async { 
     await pool.forEach<Package, void>(manager.selectedPackages,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }
      
      loggerProgress(command ?? package.command, package);

      final process = await package.process(
          command ?? package.command, arguments.toList(),
          dryRun: manager.isDryRun, logger: manager.logger);
      final _exitCode = await process.exitCode;
      if (_exitCode > 0) {
        failures[package] = _exitCode;
        await process.stderr.transform(utf8.decoder).forEach((value) {
          manager.log(
              '         ⌙ ${AnsiStyles.redBright.bold(package.name)}  ${AnsiStyles.dim.italic(value.stdErrFiltred())}');
        });
        await process.stdout.transform(utf8.decoder).forEach((value) {
          if (value.startsWith('info •') || value.startsWith('warning •')) {
            manager.log(
                '            ${AnsiStyles.dim.italic(value.stdOutFiltred())}');
          }
          
        });
        
      } 
    }).drain<void>();
    return Future.value(null);
  }

  void loggerProgress(String commnadName, Package package) {
    if (isVerbose) {
      if (package.name != package.directoryName) {
        manager.log(
            '         ⌙ ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.dim.italic(package.directoryName)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      } else {
        manager.log(
            '         ⌙ ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      }
    }
  }
}

abstract class GmaMultipleCommand extends GmaCommand with LoggerMixin {
  List<MapEntry<String?, List<String>>> commands = [];

  @override
  FutureOr<void> run() async {
    await super.run();
  }

  @override
  Future<void> executeOnSelected() async {
    
    for (final item in commands) {
      command = item.key;
      customArgs = item.value.toSet();
      print('multiple: $command $customArgs');
      await super.executeOnSelected();  
      print('super.failures: ${super.failures}');
      failures.addAll(super.failures);
    }
  }
}
