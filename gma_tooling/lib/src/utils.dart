import 'dart:io';

import 'package:gmat/src/constants.dart';
import 'package:yaml/yaml.dart';
import 'package:path/path.dart' as path;

class Utils {
  static YamlMap? loadSettingsSync(Directory directory) {
    final file = File(path.join(directory.path, Constants.settingsTpl));
    if (!file.existsSync()) return null;
    return loadYaml(file.readAsStringSync()) as YamlMap;
  }
}
