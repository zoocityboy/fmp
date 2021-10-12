import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/args.dart';
import 'package:cli_util/cli_logging.dart';

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/exceptions/not_found_packages.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';
import 'package:gmat/src/extensions/directory_ext.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/models/config/config_app.dart';
import 'package:gmat/src/models/gma_worker.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:gmat/src/processor/init_processor.dart';
import 'package:gmat/src/processor/shell_processor.dart';
import 'package:gmat/src/workspace.dart';
import 'package:process_runner/process_runner.dart';
import 'package:path/path.dart' as path;
import '../models/package.dart';
part '_logger.dart';
part '_processor.dart';
part '_filters.dart';

abstract class _GmaManager {
  Logger get logger;
  Directory get directory;

  bool get isDryRun;
  bool get isFastFail;
  bool get isVerbose;
  int get concurrency;
  bool get includeExamples;

  String? get filters;
  String? get dependsOn;
  String? get devDependsOn;

  Set<Package> selectedPackages = {};
  final Set<Package> allPackages = {};
  late ProcessPool pool;
  void log(String message);
  void logError(String message);
  Progress logProgress(String message);
  Map<Package, MapEntry<int, String>> failures = {};

  Future<void> runFiltered(String command, Set<String> arguments);
}

class GmaManager extends _GmaManager
    with _FiltersMixin, _BaseLoggerMixin, _ProcessorMixin, _LoggerMixin {
  GmaManager._({
    required this.directory,
    required this.logger,
    this.isDryRun = false,
    this.isFastFail = false,
    this.isVerbose = false,
    this.includeExamples = false,
    this.concurrency = Constants.defaultConcurency,
    this.filters,
    this.dependsOn,
    this.devDependsOn,
  }) {
    initPool();
  }
  factory GmaManager.fromArgResults(ArgResults? results,
      {required Logger logger}) {
    return GmaManager._(
      directory: Directory.current,
      logger: logger,
      concurrency: int.tryParse(results?[Constants.argConcurrency] ?? '') ??
          Constants.defaultConcurency,
      includeExamples: results?[Constants.argExamples] ?? false,
      isVerbose: results?[Constants.argVerbose] == true,
      isFastFail: results?[Constants.argFastFail] == true,
      isDryRun: results?[Constants.argDryRun] == true,
      filters: results?[Constants.argFilter],
      dependsOn: results?[Constants.argFilterDependency],
      devDependsOn: results?[Constants.argFilterDevDependency],
    );
  }
  static Future<GmaManager> initialize(ArgResults? results, Logger logger,
      {bool shouldUseFilter = true}) async {
    final manager = GmaManager.fromArgResults(results, logger: logger);
    await manager.init(shouldUseFilter: shouldUseFilter);
    return manager;
  }


  /// Initialize manager
  ///
  /// will fetch all the necessary packages from root of project
  /// [allPackages] and [selectedPackages] are filled with content
  Future<void> init(
      {bool shouldUseFilter = true, bool isPubspecCore = false}) async {
    final _packages = await InitProcessor(
            workspace: directory,
      logger: logger,
      filters: filters?.split(','),
      isCorePackage: isPubspecCore,
    )
        .execute();
    allPackages.addAll(_packages);
    selectedPackages = allPackages;

    applyExcludeExamples();

    if (shouldUseFilter) {
      
      applyDependencies(dependsOn: dependsOn?.split(','));
      applyDevDependencies(dependsOn: devDependsOn?.split(','));
    }
    if (selectedPackages.isEmpty) throw NotFoundPackages();
  }

  /// Clean all
  ///
  /// remove all
  Future<void> cleanStorage() async {
    final globList = Globs.cleanFiles.toGlobList(directory);
    
    for (final item in await directory
        .list(recursive: true, followLinks: false)
        .where((file) => globList.any((glob) => glob.matches(file.path)))
        .toList()) {
      if (item is Directory) {
        await item.delete(recursive: true);
      } else if (item is File) {
        await item.delete();
      }
    }
  }


  Future<void> resolveExit() async {
    if (failures.isEmpty) {
      exit(0);
    } else {
      exit(64);
    }
  }
  @override
  String toString() {
    return 'GmaManager[packages:${allPackages.length} filtred: ${selectedPackages.length} concurrency: $concurrency, isDryRun: $isDryRun, isFastFail: $isFastFail, isVerbose: $isVerbose directory: $directory]';
  }

  @override
  final int concurrency;

  @override
  final Directory directory;

  @override
  final bool includeExamples;

  @override
  final bool isDryRun;

  @override
  final bool isFastFail;

  @override
  final bool isVerbose;

  @override
  final Logger logger;

  @override
  String? dependsOn;

  @override
  String? devDependsOn;

  @override
  String? filters;

  @override
  Future<void> runFiltered(String? command, Set<String> arguments,
      {FutureOr Function(GmaWorker job)? cb}) async {
    final _command = isDryRun ? (Platform.isWindows ? 'dir' : 'ls') : command;
    final _arguments = isDryRun ? <String>{} : arguments;
    final jobs = getWorkerJobs(command: _command, arguments: _arguments);
    try {
      await for (final WorkerJob job in pool.startWorkers(jobs)) {
        final worker = job as GmaWorker;
        loggerProgress(job);
        if (worker.result.exitCode > 0) {
          failures[worker.package as Package] =
              MapEntry(worker.result.exitCode, worker.result.stderr);
        }
        await cb?.call(job);
      }
    } on ProcessRunnerException catch (e) {
      if (isFastFail) {
        stderr.writeln('execution failed: $e');
        exitCode = e.exitCode;
        return;
      }
    } catch (e, s) {
      print(e);
      print(s);
    }
    return Future.value(null);
  }
}

abstract class _GmaInstaller {
  bool get isVerbose;
  Logger get logger;
  Directory get directory;
  final Map<String, String> failures = {};
}

class GmaInstaller extends _GmaInstaller
    with _BaseLoggerMixin, _BaseLoggerMixin {
  GmaInstaller(
      {Logger? logger,
      Directory? currentDirectory,
      this.globalResults,
      this.results})
      : isVerbose = globalResults?[Constants.argVerbose] == true,
        logger = logger ??= globalResults?[Constants.argVerbose] == true
            ? GmatStandardLogger()
            : GmatVerboseLogger(),
        directory = currentDirectory ??= Directory.current;
  final ArgResults? globalResults;
  final ArgResults? results;
  @override
  final Directory directory;

  @override
  final bool isVerbose;

  @override
  final Logger logger;

  void _log(String message, {bool preLine = false}) {
    if (preLine) logger.stdout('');
    logger.stdout(message);
  }

  void _err(String message) => logger.stderr(message);

  Future<bool> run() async {
    _log(formatTitle('Bootstrap GMA project..'));
    await initialize();
    await prepareProjectStructure();
    if (results?[Constants.argBootstrapInstallExtensions] == true) {
      await prepareVisualStudioExtensions();
    }

    await prepareDefaulFlavors();
    if (results?[Constants.argBootstrapServerBuild] == true ||
        results?[Constants.argBootstrapServerRun] == true) {
      await prepareDartServer();
    }
    if (results?[Constants.argBootstrapRefresh] == true) {
      await refreshProject();
    }
    await openProject();
    if (failures.isNotEmpty) {
      for (var err in failures.keys) {
        _err(formatFailed('$err: ${failures[err]}'));
      }
    }
    return failures.isEmpty;
  }

  Future<String> getPackageRoot() async {
    final packageFileUri =
        await Isolate.resolvePackageUri(Uri.parse('package:gmat/gmat.dart'));
    return File(packageFileUri!.toFilePath()).parent.parent.path;
  }

  Future<void> initialize() async {
    _log(formatSubtitle('Check current status'), preLine: true);
    final _isInitialized =
        await Directory(path.join(directory.path, Constants.settingsTpl))
            .exists();
    _log(formatBody('GMA is initialized: $_isInitialized'));
    _log(formatSuccess(), preLine: true);
  }

  Future<void> prepareProjectStructure() async {
    _log(formatSubtitle('Prepare project structure'), preLine: true);
    Future<void> _clearStroage() async {
      try {
        final _dir =
            Directory(path.join(directory.path, Constants.settingsTpl));
        if (!(await _dir.exists())) return;
        final _value = await _dir.delete();
        _log(formatBody(_value.path));
      } catch (e) {
        _log(formatFailed(e.toString()));
      }
      try {
        final _dir =
            Directory(path.join(directory.path, Constants.workspaceTpl));
        if (!(await _dir.exists())) return;
        final _value = await _dir.delete();
        _log(formatBody(_value.path));
      } catch (e) {
        _err(formatFailed(e.toString()));
      }
      try {
        final _dir =
            Directory(path.join(directory.path, Constants.toolingFolder));
        if (!(await _dir.exists())) return;
        final _value = await _dir.delete(recursive: true);
        _log(formatBody(_value.path));
      } catch (e) {
        _err(formatFailed(e.toString()));
      }
    }

    Future<void> _initStorage() async {
      final packageRootPath = await getPackageRoot();
      final dir = await Directory(directory.path).create();
      try {
        final _folder = Directory(
            path.join(Directory.current.path, Constants.vscodeFolder));
        if (await _folder.exists()) {
          _folder.rename(
              path.join(Directory.current.path, Constants.vscodeRenamedFolder));
          _log(formatBody(
              '${AnsiStyles.bold(Constants.vscodeFolder)} renamed to ${AnsiStyles.italic(_folder.parent.path)}'));
        }
      } catch (e) {
        _err(formatFailed('${Constants.vscodeFolder} $e'));
      }

      try {
        final _value = await File(path.join(packageRootPath,
                Constants.templatesFolder, Constants.workspaceTpl))
            .copy(path.join(dir.path, Constants.workspaceTpl));
        _log(formatBody(
            '${AnsiStyles.bold(Constants.workspaceTpl)} in folder ${AnsiStyles.italic(_value.parent.path)}'));
      } catch (e) {
        _err(formatFailed('${Constants.workspaceTpl} $e'));
      }

      try {
        final _value = await File(path.join(packageRootPath,
                Constants.templatesFolder, Constants.settingsTpl))
            .copy(path.join(dir.path, Constants.settingsTpl));
        _log(formatBody(
            '${AnsiStyles.bold(Constants.settingsTpl)} in folder ${AnsiStyles.italic(_value.parent.path)}'));
      } catch (e) {
        _err(formatFailed('${Constants.settingsTpl} $e'));
      }
      try {
        final _value =
            await Directory(path.join(directory.path, Constants.packagesFolder))
                .create();
        _log(formatBody(
            '${AnsiStyles.bold(Constants.packagesFolder)} in folder ${AnsiStyles.italic(_value.parent.path)}'));
      } catch (e) {
        _err(formatFailed('${Constants.packagesFolder} $e'));
      }
      try {
        final _value =
            await Directory(path.join(directory.path, Constants.pluginsFolder))
                .create();
        _log(formatBody(
            '${AnsiStyles.bold(Constants.pluginsFolder)} in folder ${AnsiStyles.italic(_value.parent.path)}'));
      } catch (e) {
        _err(formatFailed('${Constants.pluginsFolder} $e'));
      }
      try {
        final _value =
            await Directory(path.join(directory.path, Constants.docsFolder))
                .create();
        _log(formatBody(
            '${AnsiStyles.bold(Constants.docsFolder)} in folder ${AnsiStyles.italic(_value.parent.path)}'));
      } catch (e) {
        _err(formatFailed('${Constants.docsFolder} $e'));
      }
    }

    await _clearStroage();
    await _initStorage();
    _log(formatSuccess(), preLine: true);
  }

  Future<void> prepareVisualStudioExtensions() async {
    final packageRootPath = await getPackageRoot();

    final _extensions =
        Directory(path.join(packageRootPath, Constants.extensionsFolder))
            .list(followLinks: false, recursive: false)
            .where((element) => element.path
                .toLowerCase()
                .endsWith(CommandKeys.vscodeExtension));

    _log(formatSubtitle('Installing extension for Visual Studio Code'),
        preLine: true);
    bool _failed = false;
    await for (final ext in _extensions) {
      final _fileName = ext.path.split('/').last;
      _log(formatBody('installing $_fileName'));

      final process = await AsyncShellProcessor(
        CommandKeys.vscodeExec,
        ['--install-extension', ext.path],
        logger: logger,
      ).run();
      _log(formatCaption(process.stdout.transform(utf8.decoder).toString()));

      final ec = await process.exitCode;
      if (ec > 0) {
        _failed = true;
      }
      if (ec == 127) {
        failures['Extension $_fileName'] =
            'Exntesion is not installed. You don\'t have installed\n Visual Studio Code download and install: https://code.visualstudio.com/]';
        _err(formatCaption(
            'Exntesion is not installed. You don\'t have installed\n Visual Studio Code download and install: https://code.visualstudio.com/]'));
      } else if (ec > 0) {
        failures['Extension $_fileName'] =
            process.stderr.transform(utf8.decoder).toString();
        // _err(formatFailed(process.stderr.transform(utf8.decoder).toString()));
      }
    }
    if (!_failed) {
      _log(formatSuccess(), preLine: true);
    }
  }

  Future<void> prepareDefaulFlavors() async {
    _log(
        formatSubtitle(
            'Fix: adding ${Constants.pubspecYaml} from ${Constants.pubspecCoreYaml}'),
        preLine: true);

    final manager = GmaManager.fromArgResults(globalResults, logger: logger);
    await manager.init(shouldUseFilter: false, isPubspecCore: true);
    manager
      ..applyExcludeExamples()
      ..applyFlavorFilter();
    for (final _app in manager.selectedPackages) {
      final pubspec =
          File(path.join(_app.directory.path, Constants.pubspecYaml));
      final pubspecExists = await pubspec.exists();

      final pubspecCore =
          File(path.join(_app.directory.path, Constants.pubspecCoreYaml));
      final pubspecCoreExists = await pubspecCore.exists();
      if (!pubspecExists && pubspecCoreExists) {
        pubspecCore.copySync(pubspec.path);
        _log(formatBody('Core package was copied as pubspec.yaml'));
      } else {
        _log(formatBody('pubspec.yaml exists in ${_app.name}'));
      }
    }
  }

  Future<void> prepareDartServer() async {
    Future<void> prepareServers() async {
      final workspace = GmaWorkspace.fromDirectory();
      final _appsWithServers =
          workspace.config.apps.where((element) => element.expressPort != null);
      final _canInstallServers = _appsWithServers.isNotEmpty;

      if (_canInstallServers) {
        _log(formatSubtitle('Prepare app servers.'), preLine: true);
        ProcessPool pool = ProcessPool(numWorkers: 2);
        if (results?[Constants.argBootstrapServerBuild] == true) {
          final builders = _appsWithServers.map((app) => WorkerJob(
                ['flutter', 'build', 'web', '--web-renderer', 'html'],
                workingDirectory:
                    Directory(path.join(Directory.current.path, app.folder)),
                runInShell: true,
              ));
          await for (final WorkerJob job
              in pool.startWorkers(builders.toList())) {
            _log(formatHeader('${job.name}: build dart server.'));
            _log(formatCaption(
                '\nFinished job ${job.name} ${job.result.stdout}'));
          }
        }
        if (results?[Constants.argBootstrapServerRun] == true) {
          final runners = _appsWithServers.map((app) => WorkerJob(
                [
                  Platform.isWindows ? 'cmd /C dhttpd' : 'dhttpd',
                  '--path',
                  'build/web/',
                  '--port',
                  '${app.expressPort}',
                  Platform.isWindows ? '' : '&'
                ],
                workingDirectory:
                    Directory(path.join(Directory.current.path, app.folder)),
                runInShell: true,
              ));
          await for (final WorkerJob job
              in pool.startWorkers(runners.toList())) {
            _log(formatHeader('${job.name}: run dart server.'));
            _log(formatCaption(
                '\nFinished job ${job.name} ${job.result.stdout} - ${job.result.exitCode}'));
            if (job.result.exitCode > 0) {
              // failures[]
            }
          }
        }
      }
      _log(formatSuccess(message: 'Whole proces is done'));
    }

    await prepareServers();
  }

  Future<void> prepareServers() async {
    Future<void> copyServer(
        GmaApp app, String template, String packageRootPath) async {
      final _file =
          File(path.join(Directory.current.path, app.folder, template));
      if (await _file.exists()) await _file.delete();
      try {
        await File(
                path.join(packageRootPath, Constants.templatesFolder, template))
            .copy(_file.path);
        _log(formatCaption('$template copied to the ${app.name}'));
      } catch (e) {
        _err(formatFailed('$template copy ${app.name} failed: $e'));
      }
    }

    FutureOr<void> installServerDependencies(GmaApp app) async {
      final _appFolder =
          Directory(path.join(Directory.current.path, app.folder));

      final process = await AsyncShellProcessor(
              CommandKeys.npmExec, ['install'],
              workingDirectory: _appFolder.path, logger: logger)
          .run();
      process.stdout
          .listen((event) => _log(formatBody(utf8.decoder.convert(event))));
      process.stderr
          .listen((event) => _err(formatFailed(utf8.decoder.convert(event))));

      final ec = await process.exitCode;
      if (ec > 0) _err(formatFailed('[$ec] Node.js is not available.'));
      if (ec == 127) {
        _err(formatFailed('Node.js is not available.'));
      }

      return null;
    }

    FutureOr<void> runNodeServer(GmaApp app) async {
      final _appFolder =
          Directory(path.join(Directory.current.path, app.folder));

      final process = await AsyncShellProcessor(CommandKeys.nodeJsExec,
              [Constants.expressServerTpl, '--port', '${app.expressPort}'],
              workingDirectory: _appFolder.path, logger: logger)
          .run();
      process.stdout
          .listen((event) => _log(formatBody(utf8.decoder.convert(event))));
      process.stderr
          .listen((event) => _err(formatFailed(utf8.decoder.convert(event))));

      final ec = await process.exitCode;
      if (ec > 0) _err(formatFailed('[$ec] Node.js is not available.'));
      if (ec == 127) {
        _err(formatFailed(
            'Node.js is not installed. You can\'t run server for ${app.name}'));
      }

      return null;
    }

    Future<void> server(GmaApp app, String packageRootPath) async {
      _log(formatHeader('${app.name} adding support for node.js server.'));
      if (app.expressPort != null) {
        await copyServer(app, Constants.expressServerTpl, packageRootPath);
        await copyServer(
            app, Constants.expressServerPackageTpl, packageRootPath);
        _log(formatHeader(
            '${app.name} installation of dependencies from package.json.'));
        await installServerDependencies(app);
        _log(formatHeader('${app.name} run server'));
        await runNodeServer(app);
        _log(formatSuccess(
            message:
                'Successfly finished [http://localhost:${app.expressPort}/]'));
      }
    }

    final workspace = GmaWorkspace.fromDirectory();
    final _appsWithServers =
        workspace.config.apps.where((element) => element.expressPort != null);
    final _canInstallServers = _appsWithServers.isNotEmpty;
    if (_canInstallServers) {
      final packageRootPath = await getPackageRoot();
      _log(formatSubtitle('Prepare support for node.js express servers'),
          preLine: true);
      for (var app in _appsWithServers) {
        await server(app, packageRootPath);
      }
    }
  }

  Future<void> refreshProject() async {
    _log(formatSubtitle('Refresh project dependencies'), preLine: true);
    final manager = GmaManager.fromArgResults(globalResults, logger: logger);
    await manager.init(shouldUseFilter: false);
    await manager.runFiltered(null, {'pub', 'get'});
  }

  Future<void> openProject() async {
    _log(formatSubtitle('openProject'), preLine: true);
    await ShellProcessor(
      'open',
      [Constants.workspaceTpl],
      workingDirectory: directory.path,
      logger: logger,
    ).run();
  }
}
