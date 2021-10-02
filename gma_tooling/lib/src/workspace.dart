import 'dart:convert';
import 'dart:io';
import 'package:args/args.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/manager.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:path/path.dart' as path;
import 'models/config/config.dart';

class GmaWorkspace {
  GmaWorkspace(this.directory, {required this.config, required this.manager});
  final Directory directory;
  final GmaConfig config;
  final GmaManager manager;
  
  factory GmaWorkspace.fromArgResults(ArgResults results) {
    final _directory =
        Directory(results[Constants.argDirectory] ?? Directory.current.path);
    
    final manager = GmaManager.fromArgResults(results,
        logger: results.wasParsed(Constants.argVerbose)
            ? GmatVerboseLogger()
            : GmatStandardLogger());
    return GmaWorkspace.fromDirectory(_directory, manager: manager);
  }
  factory GmaWorkspace.fromDirectory(Directory directory,
      {required GmaManager manager}) {
    final _yaml = Utils.loadSettingsSync(directory);
    return GmaWorkspace(directory,
        config: GmaConfig.fromJson(json.encode(_yaml)), manager: manager);
  }

  static bool isInitialized(Directory directory) =>
      File(path.join(directory.path, Constants.settingsTpl)).existsSync();
  @override
  String toString() {
    return '''\n
    GmaWorkspace
      directory: ${directory.path}
      name: ${config.name}
      desciption: ${config.description}
      apps: ${config.apps.map((e) => e.name).toList().join(', ')}
      folders: ${config.packages.map((e) => e).toList().join(', ')}
      manager: $manager
    ''';
  }
}
