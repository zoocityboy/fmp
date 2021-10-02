import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/manager.dart';
import 'package:gmat/src/models/package.dart';

typedef LoggerStatus = Map<Package, String>;
mixin LoggerMixin on GmaCommand {
  GmaManager get gmaManager => workspace.manager;
  StreamController<Map<Package, String>> loggerController =
      StreamController.broadcast();
  Stream<Map<Package, String>> get loggerStatus => loggerController.stream;
  void streamFillWithData(List<Package> packages) {
    for (final element in packages) {
      loggerController.add({element: ''});
    }
  }
  Progress? loggerCommandStart() {
    streamFillWithData(workspace.manager.packages);
    //  final splitDecoded = StreamTransformer<List<int>, String>.fromBind(
    //   (stream) => stream.transform(utf8.decoder).transform(LineSplitter()));
    loggerStatus.listen((event) {
      final _rows =
          event.entries.map((e) => '${e.key.name} ${e.value}').join('\n');
      print(_rows);
      gmaManager.logger.stdout(_rows);
    });
    gmaManager.log(
        '${AnsiStyles.yellow(r'⌾')} ${AnsiStyles.yellow.bold(description)}');
    gmaManager.log(
        '   ⌘ ${AnsiStyles.cyan.bold('${command ?? 'flutter'} ${arguments.join(' ')}')}');
    if (!isVerbose) {
      return logger.progress(
        '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${gmaManager.filtered.length} packages',
      );
    } else {
      gmaManager.log(
          '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${gmaManager.filtered.length} packages');
    }
    return null;
  }

  void loggerCommandFailures({Progress? progress}) {
    loggerController.close();
    if (!isVerbose) {
          gmaManager.log('\n');
        }
    final _message =
        '       ⌙ ${AnsiStyles.red.bold('FAILED')} (in ${failures.length} packages)';
    if (progress != null) {
      progress.finish(message: _message, showTiming: true);
    } else {
      gmaManager.log(_message);
    }
    for (final package in failures.keys) {
      gmaManager.log(
            '           ⌙ ${AnsiStyles.redBright(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.redBright.italic(package.directoryName)} (with exit code ${failures[package]})',
        );
    }
  }

  void loggerCommandSuccess({Progress? progress}) {
    loggerController.close();
    final _message = '       ⌙ ${AnsiStyles.green.bold('SUCCESS')}';
    if (progress != null) {
      progress.finish(showTiming: true);
    }
    logger.stdout(_message);
    
  }

  void logCommandResults(
      {required Map<Package, int> failures, Progress? progress}) {
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }
}
