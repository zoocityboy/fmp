import 'dart:async';
import 'dart:io';
import 'dart:isolate';

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
        .then((value) {}, onError: (e) => logger.stderr(e.toString()));
    await Directory(path.join(_root.path, Constants.workspaceTpl))
        .delete()
        .then((value) {}, onError: (e) => logger.stderr(e.toString()));
    await Directory(path.join(_root.path, Constants.toolingFolder))
        .delete(recursive: true)
        .then((value) {}, onError: (e) => logger.stderr(e.toString()));
  }

  Future<void> create() async {
    final packageRootPath = await getPackageRoot();
    logger.stdout('package: $packageRootPath');
    // final workspaceFileName = Constants.workspaceTpl;
    // final settingsFileName = Constants.settingsTpl;
    final dir = await Directory(_root.path).create();
    await File(path.join(
            packageRootPath, Constants.templatesFolder, Constants.workspaceTpl))
        .copy(dir.path + Platform.pathSeparator + Constants.workspaceTpl)
        .then(
            (value) => logger.stdout('$Constants.workspaceTpl created: $value'),
            onError: (_) {
      logger.stdout('${Constants.workspaceTpl} create failed: $_');
    });
    await File(path.join(
            packageRootPath, Constants.templatesFolder, Constants.settingsTpl))
        .copy(dir.path + Platform.pathSeparator + Constants.settingsTpl)
        .then(
            (value) =>
                logger.stdout('${Constants.settingsTpl} created: $value'),
            onError: (_) {
      logger.stdout('${Constants.settingsTpl} failed: $_');
    });
    // await Directory(path.join(_root.path, Constants.appsFolder))
    //     .create()
    //     .then(
    //     (value) => logger.stdout('${Constants.appsFolder} created: $value'),
    //         onError: (_) {
    //   logger.stdout('${Constants.appsFolder} failed: $_');
    // });
    await Directory(path.join(_root.path, Constants.packagesFolder))
        .create()
        .then(
            (value) =>
                logger.stdout('${Constants.packagesFolder} created: $value'),
            onError: (_) {
      logger.stdout('${Constants.packagesFolder} failed: $_');
    });
    await Directory(path.join(_root.path, Constants.pluginsFolder))
        .create()
        .then(
            (value) =>
                logger.stdout('${Constants.pluginsFolder} created: $value'),
            onError: (_) {
      logger.stdout('${Constants.pluginsFolder} failed: $_');
    });
    await Directory(path.join(_root.path, Constants.docsFolder))
        .create()
        .then(
        (value) => logger.stdout('${Constants.docsFolder} created: $value'),
            onError: (_) {
      logger.stdout('${Constants.docsFolder} failed: $_');
    });
    await File(path.join(_root.path, 'CHANGELOG.md'))
        .create()
        .then((value) => logger.stdout('CHANGELOG created: $value'),
            onError: (_) {
      logger.stdout('CHANGELOG failed: $_');
    });
    await File(path.join(_root.path, 'README.md')).create().then(
        (value) => logger.stdout('README.md created: $value'), onError: (_) {
      logger.stdout('README.md failed: $_');
    });

    await installExtensions();
    await ShellProcessor(
      'open',
      [Constants.workspaceTpl],
            workingDirectory: _root.path, logger: logger,)
        .run();
  }

  Future<void> installExtensions() async {
    final packageRootPath = await getPackageRoot();
    final _extensions =
        Directory(path.join(packageRootPath, Constants.extensionsFolder))
        .listSync(followLinks: false, recursive: false)
        .where((element) => element.path.toLowerCase().endsWith('.vsix'));
    logger.stdout(_extensions.join(','));
    for (final ext in _extensions) {
      await AsyncShellProcessor(
        'code',
        ['--install-extension', ext.path],
        logger: logger,
      ).run();
    }
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
