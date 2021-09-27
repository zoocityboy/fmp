import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/command_runner.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/gmat.dart';
import 'package:gmat/src/manager.dart';
import 'package:gmat/src/models/package.dart';
import 'package:pool/pool.dart';

abstract class ICommand<T> extends Command<T> {
  Directory? directory;
  bool checkRoot = true;
}

abstract class GmaCommand extends Command<void> {
  int get concurrency => int.parse(globalResults?['concurrency']);
  bool get isVerbose => globalResults?['verbose'] == true;
  bool get isFastFail => globalResults?['fast-fail'] == true;
  Logger get logger => isVerbose ? Logger.verbose() : Logger.standard();
  late GmaManager gmaManager;
  final failures = <Package, int>{};
  late Pool pool;
  bool shouldUseFilter = true;

  String? command;
  Set<String> arguments = {};

  @override
  FutureOr<void> run() async {
    pool = Pool(
      max(2, concurrency),
      timeout: Duration(seconds: 30),
    );

    final _filter = globalResults?.wasParsed('filter') == true
        ? globalResults!['filter']
        : null;
    final _directory = globalResults?['root'] ?? Directory.current.path;
    print('+filter: $_filter');
    print('+directory: $_directory');
    gmaManager = GmaManager(directory: Directory(_directory), logger: logger);
    await gmaManager.init();
    if (shouldUseFilter) {
      gmaManager.applyPackage(
          packageFolderName: 'capp_shard', filterPatter: _filter);
    }
  }

  Future<void> executeOnSelected() async {
    return await pool.forEach<Package, void>(gmaManager.filtered,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }
      final commnadName = command ??
          (package.packageType == PackageType.flutter ? 'flutter' : 'dart');
      loggerProgress(commnadName, package);

      final process = await package.process(commnadName, arguments.toList());

      if (await process.exitCode > 0) {
        failures[package] = await process.exitCode;
        if (!isVerbose) {
          gmaManager.log('\n');
        }
        await process.stderr.transform(utf8.decoder).forEach((value) {
          gmaManager.log(
              '         -> ${AnsiStyles.redBright.bold(package.name)}  ${AnsiStyles.dim.italic(value.stdErrFiltred())}');
        });
        await process.stdout.transform(utf8.decoder).forEach((value) {
          if (value.startsWith('info •') || value.startsWith('warning •')) {
            gmaManager.log(
                '            ${AnsiStyles.dim.italic(value.stdOutFiltred())}');
          }
        });
      }
    }).drain<void>();
  }

  void loggerProgress(String commnadName, Package package) {
    if (isVerbose) {
      if (package.name != package.directoryName) {
        gmaManager.log(
            '         -> ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.dim.italic(package.directoryName)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      } else {
        gmaManager.log(
            '         -> ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      }
    }
  }
}

abstract class GmaMultipleCommand extends GmaCommand {
  List<MapEntry<String?, List<String>>> commands = [];

  @override
  FutureOr<void> run() async {
    pool = Pool(
      max(2, concurrency),
      timeout: Duration(seconds: 30),
    );

    final _filter = globalResults?.wasParsed('filter') == true
        ? globalResults!['filter']
        : null;
    final _directory = globalResults?['root'] ?? Directory.current.path;
    print('+root: ${globalResults?['root']}');
    print('+filter: $_filter');
    print('+directory: $_directory');
    gmaManager = GmaManager(directory: Directory(_directory), logger: logger);
    await gmaManager.init();
    if (shouldUseFilter) {
      gmaManager.applyPackage(
          packageFolderName: 'capp_shard', filterPatter: _filter);
    }
  }

  @override
  Future<void> executeOnSelected() async {
    for (final item in commands) {
      command = item.key;
      arguments = item.value.toSet();
      await executeCommandOnSelected();
    }
  }

  Future<void> executeCommandOnSelected() async {
    return await pool.forEach<Package, void>(gmaManager.filtered,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }

      final commnadName = command ??
          (package.packageType == PackageType.flutter ? 'flutter' : 'dart');
      loggerProgress(commnadName, package);

      final process = await package.process(commnadName, arguments.toList());

      if (await process.exitCode > 0) {
        failures[package] = await process.exitCode;
        if (!isVerbose) {
          gmaManager.log('\n');
        }
        await process.stderr.transform(utf8.decoder).forEach((value) {
          gmaManager.log(
              '         -> ${AnsiStyles.redBright.bold(package.name)}  ${AnsiStyles.dim.italic(value.stdErrFiltred())}');
        });
        await process.stdout.transform(utf8.decoder).forEach((value) {
          if (value.startsWith('info •') || value.startsWith('warning •')) {
            gmaManager.log(
                '            ${AnsiStyles.dim.italic(value.stdOutFiltred())}');
          }
        });
      }
    }).drain<void>();
  }
}
