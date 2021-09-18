import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:glob/glob.dart';
import 'package:gmat/gmat.dart';
import 'package:gmat/src/extensions/directory_ext.dart';
import 'package:gmat/src/processor/shell_processor.dart';
import 'package:pubspec/pubspec.dart';
import 'package:path/path.dart' as path;
import 'package:pub_semver/pub_semver.dart';

enum PackageType { flutter, dart, plugin }

extension PackageTypeX on PackageType {
  String get value => toString().split('.').last;
}

abstract class IEntity {
  FileSystemEntity get pubspecPath;  
  String? name;
  PackageType packageType = PackageType.flutter;
  Version? version;
  Map<String, DependencyReference> dependencies = {};
  Map<String, DependencyReference> devDependencies = {};
  Map<String, DependencyReference> dependencyOverrides = {};
  Future<Process> process(String command, List<String> args);
  Future<bool> loadPubspec();
  Directory get directory;
  
}

class Entity extends IEntity {
  Entity(this.pubspecPath): directory = pubspecPath.parent;
  @override
  FileSystemEntity pubspecPath;
  @override
  Directory directory;
  
  String get directoryName => directory.directoryName;
  @override
  Future<bool> loadPubspec() async {
    final _exists =
        await File(path.join(directory.path,'pubspec.yaml'))
                .exists() ||
            await File(path.join(directory.path,'pubspec.yml'))
                .exists();
    if (_exists) {
      var pubspec = await PubSpec.load(directory);
      name = pubspec.name ?? directory.directoryName;
      version = pubspec.version;
      dependencies = pubspec.dependencies;
      devDependencies = pubspec.devDependencies;
      dependencyOverrides = pubspec.dependencyOverrides;
      packageType = parsePackageType(pubspec);
      return true;
    } else {
      print('$directoryName pubspec.yaml not exists');
    }

    return false;
  }

  PackageType parsePackageType(PubSpec pubSpec) {
    final isFlutter = dependencies.keys.toList().contains('flutter');
    if (isFlutter) {
      return PackageType.flutter;
    }
    return PackageType.plugin;
  }

  @override
  String toString() {
    return '[${packageType.value}][$directoryName][$version]';
  }

  @override
  Future<Process> process(String command, List<String> args) {
    return AsyncShellProcessor(
      command,
      args,
      workingDirectory: directory.path,
      logger: Logger.verbose()
    ).run();
  }
}

class App extends Entity {
  App(FileSystemEntity pubspecPath): super(pubspecPath);
}

class Package extends Entity {
 Package(FileSystemEntity pubspecPath): super(pubspecPath);
}

class Plugin extends Entity {
  Plugin(FileSystemEntity pubspecPath): super(pubspecPath);
}
