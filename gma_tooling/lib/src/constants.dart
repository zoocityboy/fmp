import 'dart:io'; 
import 'package:path/path.dart' as path;
import 'package:yaml/yaml.dart';

abstract class Constants {
  static const String toolingFolder = '.gma';
  static const String appsFolder = 'apps';
  static const String packagesFolder = 'packages';
  static const String pluginsFolder = 'plugins';
  static const String docsFolder = 'docs';

  ///
  static const String templatesFolder = 'templates';
  static const String extensionsFolder = 'extensions';

  ///
  static const String workspaceTpl = 'gma.code-workspace';
  static const String settingsTpl = 'gma.yaml';
  static const String pubspecYaml = 'pubspec.yaml';
  static const String pubspecCoreYaml = 'pubspec.core.yaml';

  static const int defaultConcurency = 6;

  static const String argConcurrency = 'concurrency';
  static const String argVerbose = 'verbose';
  static const String argFastFail = 'fast-fail';
  static const String argDryRun = 'dry-run';
  static const String argFilter = 'name';
  static const String argFilterDependency = 'depends-on';
  static const String argFilterDevDependency = 'dev-depends-on';
  static const String argDirectory = 'dir';
  static const String argExamples = 'examples';
  static const String argSearch = 'search';

  static const String argPackage = 'package';
  static const String argVersion = 'version';

  static const String argFlavor = 'flavor';
  static const String argApp = 'app';
}

/// [PubspecKeys] defines special keys in pubspec
abstract class PubspecKeys {
  static const String flavorKey = 'koyal_flavor';
  static const String genLangKey = 'gen_lang';
  static const String dcmKey = 'dart_code_metrics';
}

/// Basic Env variables used in GMA
abstract class EnvConstants {
  static const String rootFolder = 'GMA_ROOT_FOLDER';
  static const String apps = 'GMA_APPS';
}

abstract class TextConstants {
  static const String footerUsageKey = '''
HCI Multi-package for Global Mobile App
''';
}

class Utils {
  static YamlMap? loadSettingsSync(Directory directory) {
    final file = File(path.join(directory.path, Constants.settingsTpl));
    if (!file.existsSync()) return null;
    return loadYaml(file.readAsStringSync()) as YamlMap;
  }
}

abstract class Globs {
  static Iterable<String> cleanFiles = [
    '**/coverage/',
    '**/build/',
    '**/.dart_tool/',
    '**/.flavor',
    '**/.packages',
    '**/.metadata',
    '**/.flutter-plugins',
    '**/.flutter-plugins-dependencies'
  ];
}
