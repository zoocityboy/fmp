import 'dart:core';
import 'dart:io';
import 'dart:math';
import 'dart:convert';
import 'package:collection/collection.dart' show IterableExtension;

final monitoring = Monitoring()..enabled = false;
Future<void> main(List<String> arguments) async {
  var message = '''
Tooling for Koyal apps.

Common commands:

  dart tools/koyal.dart <command> [options]
    Run from root of monorepo

Global commands with options:

  Common
    -h, --help  Print this usage information

  Flavor
    f [fakein, prodin, fakevn, prodvn, fakeph, prodph, fakeid, prodid] [r]
      --flavor                   set flavor for packages

  Flutter
    g [package_directory]        flutter pub get in packages
      --fg
      --get

    a [package_directory]         flutter pub analyze in packages
      --fa
      --analyze

    c [package_directory]         flutter pub clean & get in packages
      --fca
      --clean
      --clear

    r [package_directory]         regenerate models in packages
      --rebuild

  Translations
    tr [package_directory]        generate translation for packages
      --transalte

  Tests
    t [package_directory]         run unit tests in packages
      --test

    d [app] [flavor] [device]     run integration tests example
      --driver                    `drive capp fakein emulator-5544`
  
  Dart Code Metrics
    dcm [package_directory]       run dart-code-metrics (custom lints) in packages
''';
  var packages = Tools('packages');
  var plugins = Tools('plugins');

  if (!packages.isMonoRepoRoot()) {
    print('Run from SelfCare monorepo root');
    return;
  }
  await packages.fetch();
  await plugins.fetchPlugins();
  if (arguments.isEmpty) {
    print(message);
    return;
  }

  if (arguments.isNotEmpty) {
    switch (arguments[0]) {
      case 'tr':
      case '--transalte':
        final event = monitoring.start(message: arguments.join(' '));
        packages.translations(
            package: arguments.length == 2 ? arguments[1] : null,
            afterCallback: () => monitoring
              ..end(event)
              ..report());
        break;
      case 'g':
      case '--fg':
      case '--get':
        final event = monitoring.start(message: arguments.join(' '));
        plugins.fg();
        packages.fg(
            package: arguments.length == 2 ? arguments[1] : null,
            afterCallback: () => monitoring
              ..end(event)
              ..report());

        break;
      case 'a':
      case '--fa':
      case '--analyze':
        final event = monitoring.start(message: arguments.join(' '));
        plugins.fa();
        packages.fa(
            package: arguments.length == 2 ? arguments[1] : null,
            afterCallback: () => monitoring
              ..end(event)
              ..report());

        break;
      case 'c':
      case '--fca':
      case '--clean':
      case '--clear':
        final eventPlugins = monitoring.start(message: arguments.join(' '));
        final event = monitoring.start(message: arguments.join(' '));
        cleanFlavors();
        plugins.fc(
            afterCallback: () => monitoring
              ..end(eventPlugins)
              ..report());
        packages.fc(
            package: arguments.length == 2 ? arguments[1] : null,
            afterCallback: () => monitoring
              ..end(event)
              ..report());

        break;
      case 'r':
      case '--rebuild':
        final event = monitoring.start(message: arguments.join(' '));
        packages.rebuild(
            package: arguments.length == 2 ? arguments[1] : null,
            afterCallback: () => monitoring
              ..end(event)
              ..report());

        break;
      case 't':
      case '--test':
        final event = monitoring.start(message: arguments.join(' '));
        packages.ft(
            package: arguments.length == 2 ? arguments[1] : null,
            afterCallback: () => monitoring
              ..end(event)
              ..report());

        break;
      case 'd':
      case '--driver':
        final event = monitoring.start(message: arguments.join(' '));
        final app = arguments.length > 1 ? arguments[1] : null;
        final flavor = arguments.length > 2 ? arguments[2] : null;
        final platform = arguments.length > 3 ? arguments[3] : null;
        if (app == null) {
          return;
        }
        packages.driver(
            app: app,
            flavor: flavor,
            platform: platform,
            afterCallback: () => monitoring
              ..end(event)
              ..report());
        break;
      case 'f':
      case '--flavor':
        final event = monitoring.start(message: arguments.join(' '));
        final flavor = arguments.length > 1 ? arguments[1] : null;
        final package = arguments.length > 2 ? arguments[2] : null;
        final forced = arguments.length > 3 ? arguments[3] : null;
        var isForced = package == '-r' || forced == '-r';
        packages.flavors(
            package: package,
            flavor: flavor,
            forced: isForced,
            afterCallback: () => monitoring
              ..end(event)
              ..report());

        break;
      case 'dcm':
        final event = monitoring.start(message: arguments.join(' '));

        final result = await packages.dcm(
            package: arguments.length == 2 ? arguments[1] : null,
            afterCallback: () => monitoring
              ..end(event)
              ..report());

        if (result != 0) {
          exitCode = 2;
        }

        return;
      case '-h':
      default:
        print(message);
        return;
    }
  } else {
    print(message);
  }
}

void cleanFlavors() {
  final rootFolder = Directory.current;
  var cappPubspecFile = File(
      '${rootFolder.path}${Platform.pathSeparator}capp/${Platform.pathSeparator}.flavor');
  cappPubspecFile
      .exists()
      .then((value) => value == true ? cappPubspecFile.deleteSync() : null);
  var mappPubspecFile = File(
      '${rootFolder.path}${Platform.pathSeparator}mapp/${Platform.pathSeparator}.flavor');
  mappPubspecFile
      .exists()
      .then((value) => value == true ? mappPubspecFile.deleteSync() : null);
}

class Tools {
  final Directory sourceDirectory;
  List<FileSystemEntity> directories = <FileSystemEntity>[];
  List<Directory> packageDirectories = <Directory>[];
  Tools(String root) : sourceDirectory = Directory(root);

  bool isMonoRepoRoot() {
    var currentDirectories =
        Directory.current.listSync(recursive: false, followLinks: false);

    return (currentDirectories.firstWhereOrNull((element) =>
                element is Directory && element.path.endsWith('packages')) !=
            null) &&
        (currentDirectories.firstWhereOrNull((element) =>
                element is Directory && element.path.endsWith('plugins')) !=
            null) &&
        (currentDirectories.firstWhereOrNull((element) =>
                element is Directory && element.path.endsWith('capp')) !=
            null) &&
        currentDirectories.firstWhereOrNull((element) =>
                element is Directory && element.path.endsWith('mapp')) !=
            null;
  }

  bool isAppPackageDirectory(Directory directory) {
    var lockFile =
        File('${directory.path}${Platform.pathSeparator}pubspec.yaml');
    return (directory.isRootPackage || directory.isSubPackage) &&
        lockFile.existsSync();
  }

  bool isPackageDirectory(Directory directory) {
    var lockFile =
        File('${directory.path}${Platform.pathSeparator}pubspec.yaml');
    return lockFile.existsSync();
  }

  bool isAppDirectory(Directory directory) => directory.isApp;

  String getPackageName(String path) =>
      path.substring(path.lastIndexOf('${Platform.pathSeparator}') + 1);

  bool shouldGenerateStrings(Directory directory) {
    var lockFile =
        File('${directory.path}${Platform.pathSeparator}pubspec.yaml');
    if (!lockFile.existsSync()) return false;
    var packagesLines = lockFile.readAsLinesSync();
    for (var i = 1; i < packagesLines.length; i++) {
      var line = packagesLines[i];
      if (line.contains('gen_lang:')) {
        return true;
      }
    }
    return false;
  }

  bool shouldGenerateFlavor(Directory directory) {
    var lockFile =
        File('${directory.path}${Platform.pathSeparator}pubspec.core.yaml');
    if (!lockFile.existsSync()) return false;
    var packagesLines = lockFile.readAsLinesSync();
    for (var i = 1; i < packagesLines.length; i++) {
      var line = packagesLines[i];
      if (line.contains('koyal_flavor:')) {
        return true;
      }
    }
    return false;
  }

  bool hasDartCodeMetrics(Directory directory) {
    var lockFile =
        File('${directory.path}${Platform.pathSeparator}pubspec.yaml');
    if (!lockFile.existsSync()) return false;
    var packagesLines = lockFile.readAsLinesSync();
    for (var i = 1; i < packagesLines.length; i++) {
      var line = packagesLines[i];
      if (line.contains('dart_code_metrics:')) {
        return true;
      }
    }
    return false;
  }

  Future<void> _fetchRoot() async {
    if (!isMonoRepoRoot()) {
      print('Run from SelfCare monorepo root');
      return;
    }
    var list = Directory.current.listSync(recursive: false, followLinks: false);

    var items = list
        .where((element) => element is Directory && isAppDirectory(element));
    packageDirectories = items.map((e) => e as Directory).toList();
  }

  Future<void> fetch() async {
    if (!sourceDirectory.existsSync() && !isMonoRepoRoot()) {
      print('Run from SelfCare monorepo root');
      return;
    }
    directories = sourceDirectory.listSync(recursive: true, followLinks: false);
    var x = directories
        .where(
            (element) => element is Directory && isAppPackageDirectory(element))
        .toList();

    packageDirectories = x.map((e) => e as Directory).toList();
  }

  Future<void> fetchPlugins() async {
    if (!sourceDirectory.existsSync() && !isMonoRepoRoot()) {
      print('Run from SelfCare monorepo root');
      return;
    }
    directories = sourceDirectory.listSync(recursive: true, followLinks: false);
    var x = directories
        .where((element) => element is Directory && isPackageDirectory(element))
        .toList();

    packageDirectories = x.map((e) => e as Directory).toList();
  }

  Future<ProcessResult> _run(Directory current, Directory directory,
      String command, List<String> arguments) {
    return Process.run(command, arguments,
        workingDirectory:
            '${current.path}${Platform.pathSeparator}${directory.path}',
        runInShell: true,
        stdoutEncoding: utf8,
        stderrEncoding: utf8);
  }

  Future<ProcessResult> _runCurrent(
      Directory current, String command, List<String?> arguments) {
    print('_runCurrent: $command $arguments workingDirectory: ${current.path}');
    return Process.run(command, arguments as List<String>,
        workingDirectory: '${current.path}',
        runInShell: true,
        stdoutEncoding: utf8,
        stderrEncoding: utf8);
  }

  void translations({String? package, Function()? afterCallback}) async {
    var current = Directory.current;
    for (var directory in packageDirectories) {
      final shouldGenerate = shouldGenerateStrings(directory);
      var enableBuild = true;
      if (package != null) {
        enableBuild = directory.directoryName == package;
      }
      if (shouldGenerate && enableBuild) {
        final result = await _run(
          current,
          directory,
          'flutter',
          [
            'pub',
            'run',
            'gen_lang:generate',
            '--source-dir',
            'lib${Platform.pathSeparator}l10n${Platform.pathSeparator}strings',
            '--output-dir',
            'lib${Platform.pathSeparator}l10n',
            '--class-name',
            'L10n${directory.pascalDirectoryName}'
          ],
        );
        print(
            '[L10n${directory.pascalDirectoryFullName}]-> ${result.stdout}${result.stderr}');
        afterCallback!();
      }
    }
  }

  void flavors(
      {String? package,
      String? flavor,
      bool forced = false,
      required Function() afterCallback}) async {
    var command = 'dart';
    var arguments = [
      '..${Platform.pathSeparator}plugins${Platform.pathSeparator}koyal_flavor${Platform.pathSeparator}bin${Platform.pathSeparator}koyal_flavor.dart',
      '-f',
      flavor
    ];
    if (forced) {
      arguments.add('-r');
    }
    print('arguments: $arguments');
    var isInstalled = false;
    var result =
        await _runCurrent(Directory.current, 'dart', ['pub', 'global', 'list']);
    isInstalled = result.stdout?.toString().contains('koyal_flavor') ?? false;
    if (!isInstalled) {
      var installation = await _runCurrent(Directory.current, 'dart', [
        'pub',
        'global',
        'activate',
        '--source',
        'path',
        'plugins${Platform.pathSeparator}koyal_flavor'
      ]);
      print('🧩 koyal_flavor: ${installation.stderr}${installation.stdout}');
    }
    await _fetchRoot();

    for (var directory in packageDirectories) {
      final shouldGenerate = shouldGenerateFlavor(directory);
      var enableBuild = true;
      if (package != null) {
        enableBuild = directory.directoryName == package;
      }
      print(
          'directory: $directory shouldGenerate: $shouldGenerate enableBuild: $enableBuild');
      if (shouldGenerate && enableBuild) {
        var result = await _runCurrent(
          directory,
          command,
          arguments,
        );
        print(
            '👉 RESULT: [${directory.pascalDirectoryFullName}] -> $flavor -> ${result.stdout}${result.stderr}');
      }
    }
    afterCallback();
  }

  void _drive(
      {required String app,
      String? flavor,
      String? platform,
      Function()? afterCallback}) async {
    var current = Directory(app);
    var target = '';
    var driver = '';
    if (flavor == 'fakein') {
      target = 'integration_fake_in';
      driver = 'all_tests_fake';
    } else if (flavor == 'fakevn') {
      target = 'integration_fake_in';
      driver = 'all_tests_fake';
    } else if (flavor == 'prodin') {
      target = 'integration_prod_in';
      driver = 'all_tests_dev';
    } else if (flavor == 'prodvn') {
      target = 'integration_prod_vn';
      driver = 'all_tests_dev';
    }
    var arguments = [
      'drive',
      '--target',
      'test_driver${Platform.pathSeparator}$target.dart',
      '--flavor',
      '$flavor',
      '--driver',
      'test_driver${Platform.pathSeparator}$driver.dart'
    ];
    if (platform != null) {
      arguments.add('-d');
      arguments.add(platform);
    }
    print(
        '[${current.pascalDirectoryFullName}]: flutter ${arguments.join(' ')}');
    final result = await _runCurrent(
      current,
      'flutter',
      arguments,
    );
    print(
        '[${current.pascalDirectoryFullName}]: ${result.stdout}${result.stderr}');
    if (afterCallback != null) {
      afterCallback();
    }
  }

  Future<void> run(String command, List<String> arguments,
      {String? package, Function()? afterCallback}) async {
    var current = Directory.current;
    var maxConcurency = Platform.numberOfProcessors - 2;
    if (maxConcurency < 1) maxConcurency = 1;
    print(
        '$command: Found ${Platform.numberOfProcessors} threads running chunks of $maxConcurency/${packageDirectories.length} in parallel ');
    for (var i = 0; i < packageDirectories.length; i += maxConcurency) {
      await Future.wait(packageDirectories
          .skip(i)
          .take(maxConcurency)
          .where((directory) =>
              package == null || directory.directoryName == package)
          .map((directory) async {
        final result = await _run(current, directory, command, arguments);
        print(
            '[${directory.pascalDirectoryFullName}]: ${result.stdout}${result.stderr}');
      }));
    }
    if (afterCallback != null) {
      afterCallback();
    }
    return null;
  }

  void fa({String? package, Function()? afterCallback}) {
    run('flutter', ['analyze'], package: package)
        .then((value) => afterCallback);
  }

  void fg({String? package, Function()? afterCallback}) {
    run('flutter', ['pub', 'get'], package: package)
        .then((value) => afterCallback);
  }

  void fc({String? package, Function()? afterCallback}) {
    run('flutter', ['clean'], package: package).then((value) {
      run('flutter', ['pub', 'get'], package: package).then((value) {
        if (afterCallback != null) afterCallback();
      });
    });
  }

  void rebuild({String? package, Function()? afterCallback}) async {
    fc(
        package: package,
        afterCallback: () {
          run(
              'flutter',
              [
                'pub',
                'run',
                'build_runner',
                'build',
                '--delete-conflicting-outputs'
              ],
              package: package,
              afterCallback: afterCallback);
        });
  }

  void ft({String? package, Function()? afterCallback}) async {
    await run('flutter', ['test'],
        package: package, afterCallback: afterCallback);
  }

  void driver(
      {required String app,
      String? flavor,
      String? platform,
      Function()? afterCallback}) async {
    _drive(
        app: app,
        flavor: flavor,
        platform: platform,
        afterCallback: afterCallback);
  }

  Future<int> dcm({String? package, Function()? afterCallback}) async {
    var current = Directory.current;
    var exitCode = 0;

    for (var directory in packageDirectories) {
      final metricsEnabled = hasDartCodeMetrics(directory);
      var isPackageRoot = true;

      if (package != null) {
        isPackageRoot = directory.directoryName == package;
      }

      if (metricsEnabled && isPackageRoot) {
        final result = await _run(
          current,
          directory,
          'dart',
          [
            'run',
            'dart_code_metrics:metrics',
            'lib',
          ],
        );

        print(
            '[${directory.pascalDirectoryFullName}]: ${result.stdout}${result.stderr}');

        if (result.stdout != null && (result.stdout as String).isNotEmpty) {
          exitCode += 1;
        } else if (result.stderr != null &&
            (result.stderr as String).isNotEmpty) {
          exitCode += 1;
        }

        afterCallback!();
      }
    }

    return exitCode;
  }
}

class MonitoringEvent {
  final String? id;
  final String? message;
  final DateTime? start;
  final DateTime? end;
  MonitoringEvent({
    this.id,
    this.message,
    this.start,
    this.end,
  });

  MonitoringEvent copyWith({
    String? id,
    String? message,
    DateTime? start,
    DateTime? end,
  }) {
    return MonitoringEvent(
      id: id ?? this.id,
      message: message ?? this.message,
      start: start ?? this.start,
      end: end ?? this.end,
    );
  }

  Duration? get difference => end?.difference(start!);
  int get seconds => difference?.inSeconds ?? 0;

  @override
  String toString() => 'MonitoringEvent(id: $id, start: $start, end: $end)';

  String toReport() =>
      '⚡ [Monitoring] $message -> $this : ${difference?.inSeconds}s';
  void report() {
    print(toReport());
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is MonitoringEvent &&
        other.id == id &&
        other.message == message &&
        other.start == start &&
        other.end == end;
  }

  @override
  int get hashCode => id.hashCode ^ start.hashCode ^ end.hashCode;
}

class Monitoring {
  bool enabled = false;
  final Set<MonitoringEvent> _events = {};
  String _generateId() {
    var rng = Random();
    var l = List.generate(12, (_) => rng.nextInt(99));
    return l.join('');
  }

  MonitoringEvent? start({String? message}) {
    if (!enabled) return null;
    var id = _generateId();
    final event =
        MonitoringEvent(id: id, message: message, start: DateTime.now());

    _events.add(event);
    print('⌛ [Monitoring] start: ${event.toReport()}');
    return event;
  }

  MonitoringEvent? end(MonitoringEvent? event) {
    if (!enabled) return null;
    var eventCopy = event!.copyWith(end: DateTime.now());
    _events.removeWhere((element) => element.id == eventCopy.id);
    _events.add(eventCopy);
    print('⌛ [Monitoring] end: ${eventCopy.toReport()}');
    return eventCopy;
  }

  String? report() {
    if (!enabled) return null;
    var sum = 0;
    print('🕑 [Monitoring] all -> $_events');
    if (_events.isNotEmpty) {
      sum = _events.map((e) => e.seconds).reduce((a, b) => a + b);
    }
    return '🕑 [Monitoring] all -> ${sum}s';
  }
}

extension DirectoryX on Directory {
  bool get isPackages => path == 'packages';
  bool get isRootPackage => parent.isPackages && isInternal;
  bool get isSubPackage =>
      parent.isRootPackage && isInternalPath(path.replaceAll(parent.path, ''));
  bool get isApp => path.contains('capp') || path.contains('mapp');
  bool get isInternal =>
      path.contains('capp_') ||
      path.contains('mapp_') ||
      path.contains('koyal_');
  bool isInternalPath(String path) {
    return path.contains('capp_') ||
        path.contains('mapp_') ||
        path.contains('koyal_');
  }

  String get directoryName => path
      .substring(path.lastIndexOf('${Platform.pathSeparator}') + 1)
      .replaceAll('_core', '');
  String get pascalDirectoryName => directoryName.toPascalCase();
  String get pascalDirectoryFullName => path
      .substring(path.lastIndexOf('${Platform.pathSeparator}') + 1)
      .toPascalCase();
}

extension StringPascal on String {
  String _upperCaseFirstLetter(String word) {
    return '${word.substring(0, 1).toUpperCase()}${word.substring(1).toLowerCase()}';
  }

  String toPascalCase() {
    return split('_').map(_upperCaseFirstLetter).toList().join();
  }
}

class Cycle {
  List<String> path;
  Cycle(this.path);

  @override
  String toString() {
    return path.join(' -> ');
  }

  Cycle getCycleWithSameLastNode() {
    return Cycle(List.from(path)..add(path[0]));
  }

  /// Get cycle starting with the alphabetical first name
  Cycle getNormalizedCycle() {
    var sortedCopy = List.from(path)..sort((a, b) => a.compareTo(b));
    var firstName = sortedCopy.first;
    var firstIndex = path.indexOf(firstName);
    var resultList = <String>[
      ...path.skip(firstIndex),
      ...path.take(firstIndex),
    ];
    return Cycle(resultList);
  }
}
