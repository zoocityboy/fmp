import 'dart:async';
import 'dart:io';
import 'package:gmat/gmat.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/directory_ext.dart';
import 'package:gmat/src/models/flavor/pubspec_flavor.dart';
import 'package:gmat/src/models/logger/gmat_logger.dart';
import 'package:gmat/src/processor/shell_processor.dart';
import 'package:pubspec/pubspec.dart';
import 'package:path/path.dart' as path;
import 'package:pub_semver/pub_semver.dart';
import 'package:yaml/yaml.dart';

import 'flavor/flavors.dart';

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
  bool hasFlavor = false;
  bool hasTranslation = false;
  Map<FlavorType, Flavor>? flavors;
  late PubSpec pubSpec;
  String? command;
}

class Entity extends IEntity {
  Entity(this.pubspecPath) : directory = pubspecPath.parent;
  
  @override
  FileSystemEntity pubspecPath;
  
  @override
  Directory directory;

  String get directoryName => directory.directoryName;
  
  @override
  Future<bool> loadPubspec() async {
    final _exists =
        await File(path.join(directory.path, 'pubspec.yaml')).exists() ||
            await File(path.join(directory.path, 'pubspec.yml')).exists();
    if (_exists) {
      pubSpec = await PubSpec.load(directory);
      name = pubSpec.name ?? directory.directoryName;
      version = pubSpec.version;
      dependencies = pubSpec.dependencies;
      devDependencies = pubSpec.devDependencies;
      dependencyOverrides = pubSpec.dependencyOverrides;
      packageType = parsePackageType(pubSpec);
      hasTranslation = containsGenLang(pubSpec);
      hasFlavor = containsFlavor(pubSpec);
      flavors = parseFlavors(pubSpec);
      command = packageType == PackageType.flutter ? 'flutter' : 'dart';

      return true;
    } else {
      print('$directoryName pubspec.yaml not exists');
    }

    return false;
  }

  PackageType parsePackageType(PubSpec pubSpec) {
    
    if (dependencies.keys.toList().contains('flutter')) {
      return PackageType.flutter;
    }
    return pubSpec.environment?.sdkConstraint != null
        ? PackageType.dart
        : PackageType.plugin;
  }
  
  Map<FlavorType, Flavor>? parseFlavors(PubSpec pubSpec) {
    final _containsFlavor = containsFlavor(pubSpec);
    if (_containsFlavor) {
      final items = <FlavorType, Flavor>{};
      YamlMap data = pubSpec.unParsedYaml?[PubspecKeys.flavorKey];
      for (var item in data.keys) {
        final _value = data[item];
        if (_value != null) {
          items.addAll({
            FlavorTypeConverter.fromJson(item as String):
                Flavor.fromJson(_value),
          });
        }
      }
      return items;
    }
    return null;
  }

  bool containsFlavor(PubSpec pubSpec) =>
      pubSpec.unParsedYaml?.containsKey(PubspecKeys.flavorKey) ?? false;
      
  bool containsGenLang(PubSpec pubSpec) =>
      pubSpec.allDependencies.containsKey(PubspecKeys.genLangKey);

  Future<void> changeFlavor(FlavorType type) async {
    final currentFlavors = flavors;
    if (currentFlavors != null) {
      List<String> keys = [];
      currentFlavors.values.map((e) => e.dependencies).forEach((e) {
        keys = [...keys, ...e!.keys.toList()];
      });
      final newFlavorDependencies = currentFlavors[type]!.dependencies;
      final keysx = keys.toSet().toList();
      pubSpec.dependencies
        ..removeWhere((key, value) => keysx.any((element) => element == key))
        ..addAll(newFlavorDependencies!);
      await pubSpec.save(pubspecPath.parent);
    } else {}
    
    
  }

  @override
  String toString() {
    return '$name:$version(type: ${packageType.value},dir: $directoryName, koyal_flavor: $hasFlavor)';
  }

  @override
  Future<Process> process(String command, List<String> args,
      {bool dryRun = false}) async { 
    if (dryRun) {
      await Future.delayed(Duration(milliseconds: 200));
      return AsyncShellProcessor(Platform.isWindows ? 'dir' : 'ls', [],
              workingDirectory: directory.path, logger: GmatVerboseLogger())
          .run();
    }
    return AsyncShellProcessor(command, args,
            workingDirectory: directory.path, logger: GmatVerboseLogger())
        .run();
  }
}

class App extends Entity {
  App(FileSystemEntity pubspecPath) : super(pubspecPath);
}

class Package extends Entity {
  Package(FileSystemEntity pubspecPath) : super(pubspecPath);
}

class Plugin extends Entity {
  Plugin(FileSystemEntity pubspecPath) : super(pubspecPath);
}
