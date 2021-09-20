import 'dart:io';
import 'package:path/path.dart' as path;
import 'package:yaml/yaml.dart';

abstract class Dir {
  static String toolingFolder = '.gma';
  static String appsFolder = 'apps';
  static String packagesFolder = 'packages';
  static String pluginsFolder = 'plugins';
  static String docsFolder = 'docs';

  ///
  static String templatesFolder = 'templates';
  static String extensionsFolder = 'extensions';

  ///
  static String workspaceTpl = 'gma.code-workspace';
  static String settingsTpl = 'gma.yaml';

  static int defaultConcurency = 6;
}

abstract class Validation {
  static RegExp isValidPackageName =
      RegExp(r'^[a-z][a-z\d_-]*$', caseSensitive: false);
}

class Utils {
  static YamlMap? loadSettingsSync(Directory directory) {
    final file = File(path.join(directory.path, Dir.settingsTpl));
    if (!file.existsSync()) return null;
    return loadYaml(file.readAsStringSync()) as YamlMap;
  }
}
