import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/manager/manager.dart';
import 'package:path/path.dart' as path;

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/processor/shell_processor.dart';

import 'i_abstract_processor.dart';

class BootstrapProcessor extends AbstractExecutor<void> {
  BootstrapProcessor({Directory? dir, required this.logger}) {
    _root = dir ?? Directory.current;
  }
  @override
  late Logger logger;
  Directory _root = Directory.current;
  
  Future<String> getPackageRoot() async {
    final packageFileUri =
        await Isolate.resolvePackageUri(Uri.parse('package:gmat/gmat.dart'));
    return File(packageFileUri!.toFilePath()).parent.parent.path;
  }
   
  logSubHeader(String message) =>
      logger.stdout('⌘ ${AnsiStyles.cyan.bold(message)}'.spaceLeftCommand());
  logStepContent(String message, {bool styled = true}) => logger.stdout(
      '⌙ ${styled ? AnsiStyles.dim(message) : message}'.spaceLeftProgress());
  void logErr([val0, val1]) {
    final _secondMessage = val1 != null
        ? '${AnsiStyles.dim('~')} ${AnsiStyles.redBright.italic('$val1')}'
        : '';
    logger.stderr(
      '   ⌙ ${AnsiStyles.redBright(val0)} $_secondMessage');
   
  }

  void logStdOut([val0, val1]) {
    logStepContent('$val0 $val1', styled: false
    );
  }


  /// Check if installation exists
  Future<bool> check() async {
    final directory =
        Directory(path.join(_root.path, Constants.toolingFolder));
    return directory.exists();
  }

  Future<void> clear() async {
    try {
      final _value =
          await Directory(path.join(_root.path, Constants.settingsTpl))
              .delete();
      logStdOut(_value.path);
    } catch (e) {
      logErr(e.toString());
    }
    try {
      final _value =
          await Directory(path.join(_root.path, Constants.workspaceTpl))
        .delete();
      logStdOut(_value.path);
    } catch (e) {
      logErr(e.toString());
    }
    try {
      final _value =
          await Directory(path.join(_root.path, Constants.toolingFolder))
        .delete(recursive: true);
      logStdOut(_value.path);
    } catch (e) {
      logErr(e.toString());
    }
  }

  Future<void> create() async {
    final packageRootPath = await getPackageRoot();
    logSubHeader('Generate GMA project structure.');
    final dir = await Directory(_root.path).create();
    
try {
      final _value = await File(path.join(
            packageRootPath, Constants.templatesFolder, Constants.workspaceTpl))
        .copy(path.join(dir.path, Constants.workspaceTpl));
      logStepContent(
        '${AnsiStyles.bold(Constants.workspaceTpl)} in folder ${AnsiStyles.italic(_value.parent.path)}',
      );
    } catch (e) {
      logErr(Constants.workspaceTpl, e);
    }

    try {
      final _value = await File(path.join(
            packageRootPath, Constants.templatesFolder, Constants.settingsTpl))
        .copy(path.join(dir.path, Constants.settingsTpl));
      logStdOut(Constants.settingsTpl, _value.parent);
    } catch (e) {
      logErr(Constants.settingsTpl, e);
    }
    try {
      final _value =
          await Directory(path.join(_root.path, Constants.packagesFolder))
        .create();
      logStdOut(Constants.packagesFolder, _value);
    } catch (e) {
      logErr(Constants.packagesFolder, e);
    }
    try {
      final _value =
          await Directory(path.join(_root.path, Constants.pluginsFolder))
              .create();
      logStdOut(Constants.pluginsFolder, _value);
    } catch (e) {
      logErr(Constants.pluginsFolder, e);
    }
    try {
      final _value =
          await Directory(path.join(_root.path, Constants.docsFolder)).create();
      logStdOut(Constants.docsFolder, _value);
    } catch (e) {
      logErr(Constants.docsFolder, e);
    }

    logger
        .stdout('\n ⌙ ${AnsiStyles.green.bold('SUCCESS')}'.spaceLeftCommand());
    
  }

  Future<void> installExtensions() async {
    final packageRootPath = await getPackageRoot();
    final _extensions =
        Directory(path.join(packageRootPath, Constants.extensionsFolder))
        .listSync(followLinks: false, recursive: false)
        .where((element) => element.path.toLowerCase().endsWith('.vsix'));
    
    logSubHeader('Installing extension for Visual Studio Code');
    for (final ext in _extensions) {
      logStepContent('installing ${ext.path.split('/').last}');
      final process = await AsyncShellProcessor(
        'codex',
        ['--install-extension', ext.path],
        logger: logger,
      ).run();
      process.stdout.transform(utf8.decoder).forEach((element) {
        logStdOut(
          element,
        );
      });
      final ec = await process.exitCode;
      if (ec == 127) {
        logErr(
            'Exntesion is not installed. You don\'t have installed Visual Studio Code download and install: https://code.visualstudio.com/]');
      } else if (ec > 0) {
        logErr('Failed', process.stderr.transform(utf8.decoder).toString());
      } else {
        await ShellProcessor(
          'open',
          [Constants.workspaceTpl],
          workingDirectory: _root.path,
          logger: logger,
        ).run();
      }

    }
  }

  @override
  Future<void> run() async {
    final _exists = await check();
    if (_exists) {
      await clear();
    }
    await GmaInstaller().run();

    // await create();
    // await installExtensions();
    // logSubHeader('Refresh project');
    // final x = await AsyncShellProcessor('gmatt', ['pub', 'get'], logger: logger)
    //     .run();

    // logStdOut(x.stdout.transform(utf8.decoder).toString());
    // logErr(x.stderr.transform(utf8.decoder).toString());
    // await x.exitCode;

  }
}
