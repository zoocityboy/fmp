import 'dart:convert';
import 'dart:io';
import 'package:gmat/src/constants.dart';
import 'package:path/path.dart' as path;
import 'models/config/config.dart';

class GmaWorkspace {
  GmaWorkspace({required this.config});
  final GmaConfig config;

  factory GmaWorkspace.fromDirectory() {
    final _yaml = Utils.loadSettingsSync(Directory.current);
    return GmaWorkspace(
        config: GmaConfig.fromJson(json.encode(_yaml)));
  }

  static bool isInitialized() =>
      File(path.join(Directory.current.path, Constants.settingsTpl))
          .existsSync();
  @override
  String toString() {
    return '''\n
    GmaWorkspace
      directory: ${Directory.current.path}
      name: ${config.name}
      desciption: ${config.description}
      apps: ${config.apps.map((e) => e).toList().join(', ')}
      folders: ${config.packages.map((e) => e).toList().join(', ')}
    ''';
  }
}
