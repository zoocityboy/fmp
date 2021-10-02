import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/command_runner.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/gmat.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/workspace.dart';
import 'package:pool/pool.dart';
final cleanFiles = [
  '**/coverage/',
  '**/build/',
  '**/.dart_tool/',
  '**/.flavor',
  '**/.packages',
  '**/.metadata',
  '**/.flutter-plugins',
  '**/.flutter-plugins-dependencies'
];
abstract class ICommand<T> extends Command<T> {
  Directory? directory;
  bool checkRoot = true;
}
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
  late Pool pool;
  late GmaWorkspace workspace;

  @override
  String? get usageFooter => TextConstants.footerUsageKey;

  @override
  FutureOr<void> run() async {
    workspace = GmaWorkspace.fromArgResults(globalResults!);
    pool = workspace.manager.createPool;
    await workspace.manager.init();
    if (shouldUseFilter) {
      final _patterns = globalResults?[Constants.argFilter] as String?;
      workspace.manager.applyPackage(filterPatterns: _patterns?.split(','));
    }
  }
  Future<void> executeOnSelected() async {
    return await pool.forEach<Package, void>(workspace.manager.filtered,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }
      final commnadName = command ??= (package.command ?? 'flutter');
      loggerProgress(commnadName, package);
      
      final process = await package.process(commnadName, arguments.toList(),
          dryRun: workspace.manager.isDryRun);
      final _exitCode = await process.exitCode;
      if (_exitCode > 0) {
        failures[package] = _exitCode;
       
        await process.stderr.transform(utf8.decoder).forEach((value) {
          workspace.manager.log(
              '         ⌙ ${AnsiStyles.redBright.bold(package.name)}  ${AnsiStyles.dim.italic(value.stdErrFiltred())}');
        });
        await process.stdout.transform(utf8.decoder).forEach((value) {
          if (value.startsWith('info •') || value.startsWith('warning •')) {
            workspace.manager.log(
                '            ${AnsiStyles.dim.italic(value.stdOutFiltred())}');
          }
        });
        
      } 
    }).drain<void>();
    
  }

  void loggerProgress(String commnadName, Package package) {
    if (isVerbose) {
      if (package.name != package.directoryName) {
        workspace.manager.log(
            '         ⌙ ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.dim.italic(package.directoryName)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      } else {
        workspace.manager.log(
            '         ⌙ ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      }
    }
  }
}

abstract class GmaMultipleCommand extends GmaCommand {
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
      await super.executeOnSelected();
    }
  }
}
