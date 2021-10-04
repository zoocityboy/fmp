import 'dart:async';
import 'dart:convert';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/command_runner.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/manager.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:gmat/src/models/package.dart';
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
    print('GmaManagerinit: $runtimeType ${logger.runtimeType}');
    manager = GmaManager.fromArgResults(globalResults, logger: logger);
    await manager.init(shouldUseFilter: shouldUseFilter);
  }
  // final pluginPrefixTransformer =
  //       StreamTransformer<String, String>.fromHandlers(
  //     handleData: (String data, EventSink sink) {
  //       const lineSplitter = LineSplitter();
  //       var lines = lineSplitter.convert(data);
  //       lines = lines
  //           .map((line) => '$prefix$line${line.contains('\n') ? '' : '\n'}')
  //           .toList();
  //       sink.add(lines.join());
  //     },
  //   );
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
      process.stdout.listen((event) {
        manager.log('${package.name} ${AnsiStyles.yellow(utf8.decode(event))}');
      });
      process.stderr.listen((event) {
        manager.log('${package.name} ${AnsiStyles.red(utf8.decode(event))}');
      });
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
    }, onError: (package, error, stacktrace) {
      print('error on ${package.name} $error');
      return false;
    }).drain<void>();
    print('GmaCommand:executeOnSelected $failures');
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
