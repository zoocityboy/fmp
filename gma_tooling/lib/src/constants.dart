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

  static const int defaultConcurency = 6;

  static const String argConcurrency = 'concurrency';
  static const String argVerbose = 'verbose';
  static const String argFastFail = 'fast-fail';
  static const String argDryRun = 'dry-run';
  static const String argFilter = 'name';
  static const String argFilterDependency = 'dependesOn';
  static const String argFilterDevDependency = 'devDependsOn';
  static const String argDirectory = 'dir';

  static const String argFlavor = 'flavor';
  static const String argApp = 'app';
}

/// [PubspecKeys] defines special keys in pubspec
abstract class PubspecKeys {
  static const String flavorKey = 'koyal_flavor';
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
