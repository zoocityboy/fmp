import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:cli_util/cli_logging.dart';
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
  void logHeader([val0]) => logger
      .stdout('${AnsiStyles.blink(r'⌾')} ${AnsiStyles.yellow.bold('$val0')}');
  void logErr([val0, val1]) {
    logger.stderr(
      '   ⌙ ${AnsiStyles.redBright(val0)} ${AnsiStyles.dim('~')} ${AnsiStyles.redBright.italic('$val1')}',
    );
  }

  void logStdOut([val0, val1]) {
    logger.stdout(
      '   ⌙ ${AnsiStyles.dim(val0)} ${AnsiStyles.dim('~')} ${AnsiStyles.dim.italic('$val1')}',
    );
  }


  /// Check if installation exists
  Future<bool> check() async {
    final directory =
        Directory(path.join(_root.path, Constants.toolingFolder));
    final _exists = directory.exists();
    return _exists;
  }

  Future<void> clear() async {
    await Directory(path.join(_root.path, Constants.settingsTpl))
        .delete()
        .then(
        (value) => logStdOut(value),
        onError: (e) => logErr(e.toString()));
    await Directory(path.join(_root.path, Constants.workspaceTpl))
        .delete()
        .then((value) => logStdOut(value),
            onError: (e) => logErr(e.toString()));
    await Directory(path.join(_root.path, Constants.toolingFolder))
        .delete(recursive: true)
        .then((value) => logStdOut(value),
            onError: (e) => logErr(e.toString()));
  }

  Future<void> create() async {
    final packageRootPath = await getPackageRoot();
    logHeader('Generate GMA project');
    final dir = await Directory(_root.path).create();
    await File(path.join(
            packageRootPath, Constants.templatesFolder, Constants.workspaceTpl))
        .copy(path.join(dir.path, Constants.workspaceTpl))
        .then(
            (value) => logger.stdout(
                  '   ⌙ ${AnsiStyles.redBright(Constants.workspaceTpl)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.redBright.italic('$value')}',
                ), onError: (e) {
      logErr(Constants.workspaceTpl, e);
    });
    await File(path.join(
            packageRootPath, Constants.templatesFolder, Constants.settingsTpl))
        .copy(path.join(dir.path, Constants.settingsTpl))
        .then(
            (value) => logStdOut(Constants.settingsTpl, value.parent),
            onError: (e) => logErr(Constants.settingsTpl, e));
    await Directory(path.join(_root.path, Constants.packagesFolder))
        .create()
        .then(
            (value) => logStdOut(Constants.packagesFolder, value),
            onError: (e) => logErr(Constants.packagesFolder, e));
    await Directory(path.join(_root.path, Constants.pluginsFolder))
        .create()
        .then(
            (value) => logStdOut(Constants.pluginsFolder, value),
            onError: (e) => logErr(Constants.pluginsFolder, e));
    await Directory(path.join(_root.path, Constants.docsFolder))
        .create()
        .then(
        (value) => logStdOut(Constants.docsFolder, value),
        onError: (e) => logErr(Constants.docsFolder, e));  

    await installExtensions();
    await ShellProcessor(
      'open',
      [Constants.workspaceTpl],
            workingDirectory: _root.path, logger: logger,)
        .run();
    logger.stdout('\n ⌙ ${AnsiStyles.green.bold('SUCCESS')}');
  }

  Future<void> installExtensions() async {
    final packageRootPath = await getPackageRoot();
    final _extensions =
        Directory(path.join(packageRootPath, Constants.extensionsFolder))
        .listSync(followLinks: false, recursive: false)
        .where((element) => element.path.toLowerCase().endsWith('.vsix'));
    
    logHeader('GMA Extension installer');
    for (final ext in _extensions) {
      final process = await AsyncShellProcessor(
        'code',
        ['--install-extension', ext.path],
        logger: logger,
      ).run();
      process.stdout.transform(utf8.decoder).forEach((element) {
        logger.stdout(
          '   ⌙ ${AnsiStyles.dim(element)}',
        );
      });

    }
  }

  Future<void> checkFlavor() async {
      
  }

  @override
  Future<void> run() async {
    final _exists = await check();
    if (_exists) {
      await clear();
    }
    await create();
  }
}
