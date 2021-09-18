import 'dart:async';
import 'dart:io';
import 'dart:isolate';

import 'package:cli_util/cli_logging.dart';
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

  @override
  void kill() {}
  Future<String> getPackageRoot() async {
    final packageFileUri =
        await Isolate.resolvePackageUri(Uri.parse('package:gmat/gmat.dart'));
    return File(packageFileUri!.toFilePath()).parent.parent.path;
  }

  /// Check if installation exists
  Future<bool> check() async {
    final directory =
        Directory(_root.path + Platform.pathSeparator + Dir.toolingFolder);
    final _exists = directory.exists();
    return _exists;
  }

  Future<void> clear() async {
    await Directory(_root.path + Platform.pathSeparator + Dir.settingsTpl)
        .delete()
        .then((value) {}, onError: (e) {})
        .catchError((onError) => print(onError));
    await Directory(_root.path + Platform.pathSeparator + Dir.workspaceTpl)
        .delete()
        .then((value) {}, onError: (e) {})
        .catchError((onError) => print(onError));
    await Directory(_root.path + Platform.pathSeparator + Dir.toolingFolder)
        .delete(recursive: true)
        .then((value) {}, onError: (e) {})
        .catchError((onError) => print(onError));
  }

  Future<void> create() async {
    final packageRootPath = await getPackageRoot();
    logger.stdout('package: $packageRootPath');
    final workspaceFileName = Dir.workspaceTpl;
    final settingsFileName = Dir.settingsTpl;
    final dir = await Directory(_root.path).create();
    await File(packageRootPath +
            Platform.pathSeparator +
            Dir.templatesFolder +
            Platform.pathSeparator +
            Dir.workspaceTpl)
        .copy(dir.path + Platform.pathSeparator + workspaceFileName)
        .then((value) => logger.stdout('$workspaceFileName created: $value'),
            onError: (_) {
      logger.stdout('$workspaceFileName create failed: $_');
    });
    await File(packageRootPath +
            Platform.pathSeparator +
            Dir.templatesFolder +
            Platform.pathSeparator +
            Dir.settingsTpl)
        .copy(dir.path + Platform.pathSeparator + settingsFileName)
        .then((value) => logger.stdout('$settingsFileName created: $value'),
            onError: (_) {
      logger.stdout('$settingsFileName failed: $_');
    });
    await Directory(_root.path + Platform.pathSeparator + Dir.appsFolder)
        .create()
        .then((value) => logger.stdout('${Dir.appsFolder} created: $value'),
            onError: (_) {
      logger.stdout('${Dir.appsFolder} failed: $_');
    });
    await Directory(_root.path + Platform.pathSeparator + Dir.packagesFolder)
        .create()
        .then((value) => logger.stdout('${Dir.packagesFolder} created: $value'),
            onError: (_) {
      logger.stdout('${Dir.packagesFolder} failed: $_');
    });
    await Directory(_root.path + Platform.pathSeparator + Dir.pluginsFolder)
        .create()
        .then((value) => logger.stdout('${Dir.pluginsFolder} created: $value'),
            onError: (_) {
      logger.stdout('${Dir.pluginsFolder} failed: $_');
    });
    await Directory(_root.path + Platform.pathSeparator + Dir.docsFolder)
        .create()
        .then((value) => logger.stdout('${Dir.docsFolder} created: $value'),
            onError: (_) {
      logger.stdout('${Dir.docsFolder} failed: $_');
    });
    await File(_root.path + Platform.pathSeparator + 'CHANGELOG.md')
        .create()
        .then((value) => logger.stdout('CHANGELOG created: $value'),
            onError: (_) {
      logger.stdout('CHANGELOG failed: $_');
    });
    await File(_root.path + Platform.pathSeparator + 'README.md').create().then(
        (value) => logger.stdout('README.md created: $value'), onError: (_) {
      logger.stdout('README.md failed: $_');
    });

    await installExtensions();
    await ShellProcessor('open', [workspaceFileName],
            workingDirectory: _root.path, logger: logger,)
        .run();
  }

  Future<void> installExtensions() async {
    final packageRootPath = await getPackageRoot();
    final _extensions = Directory(
            packageRootPath + Platform.pathSeparator + Dir.extensionsFolder)
        .listSync(followLinks: false, recursive: false)
        .where((element) => element.path.toLowerCase().endsWith('.vsix'));
    logger.stdout(_extensions.join(','));
    for (final ext in _extensions) {
      ShellProcessor('code', ['--install-extension', '$ext'],
          workingDirectory: ext.path, logger: logger,);
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
