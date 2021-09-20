import 'dart:convert';
import 'dart:io';
import 'package:gmat/src/constants.dart';
import 'package:path/path.dart' as path;
import 'package:gmat/src/models/package.dart';

import 'models/config/config.dart';

class GmaWorkspace {
  GmaWorkspace(this.directory);
  final Directory directory;
  final List<App> apps = [];
  final List<Package> packages = [];
  final List<Package> filtered = [];

  factory GmaWorkspace.fromDirectory(Directory directory) {
    final _yaml = Utils.loadSettingsSync(directory);

    print('yaml');
    print(_yaml?.keys);
    if (_yaml != null) {
      final _json = json.encode(_yaml);
      print(_json);
      final x = Config.fromJson(_json);
      print(x);
    }
    return GmaWorkspace(directory);
  }

  static bool isInitialized(Directory directory) =>
      File(path.join(directory.path, Dir.settingsTpl)).existsSync();
}
