import 'dart:convert';
import 'dart:io';
import 'package:args/args.dart';
import 'package:gmat/src/constants.dart';
import 'package:path/path.dart' as path;
import 'models/config/config.dart';

class GmaWorkspace {
  GmaWorkspace(this.directory, {required this.config});
  final Directory directory;
  final GmaConfig config;
  
  factory GmaWorkspace.fromArgResults(ArgResults results) {
    final _directory = Directory.current;
    return GmaWorkspace.fromDirectory(_directory);
  }
  factory GmaWorkspace.fromDirectory(Directory directory) {
    final _yaml = Utils.loadSettingsSync(directory);
    return GmaWorkspace(directory,
        config: GmaConfig.fromJson(json.encode(_yaml)));
  }

  static bool isInitialized() =>
      File(path.join(Directory.current.path, Constants.settingsTpl))
          .existsSync();
  @override
  String toString() {
    return '''\n
    GmaWorkspace
      directory: ${directory.path}
      name: ${config.name}
      desciption: ${config.description}
      apps: ${config.apps.map((e) => e).toList().join(', ')}
      folders: ${config.packages.map((e) => e).toList().join(', ')}
    ''';
  }
}
