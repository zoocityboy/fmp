import 'dart:io';
import 'package:gmat/src/constants.dart';
import 'package:path/path.dart' as path;
import 'package:gmat/src/models/package.dart';
import 'package:yaml/yaml.dart';

class GmaWorkspace{
  GmaWorkspace(this.directory);
  final Directory directory;
  final List<App> apps = [];
  final List<Package> packages = [];
  final List<Package> filtered = [];
  
  factory GmaWorkspace.fromDirectory(Directory directory) {
    final yaml = Utils.loadSettingsSync(directory);
    print('yaml');
    print(yaml);
    return GmaWorkspace(directory);
  }


  static bool isInitialized(Directory directory) => File(path.join(directory.path, Dir.settingsTpl)).existsSync();
  
}