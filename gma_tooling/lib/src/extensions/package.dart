import 'dart:io';

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/exceptions/not_found_pubspec.dart';
import 'package:gmat/src/models/flavor/flavors.dart';
import 'package:gmat/src/models/package.dart';
import 'package:path/path.dart' as path;

extension PackageX on Package {
  void checkApp() {
    ///
    final pubspecYaml = File(path.join(directory.path, Constants.pubspecYaml));
    final _isAivailablePubspecYml = pubspecYaml.existsSync();

    ///
    final pubspecCoreYaml =
        File(path.join(directory.path, Constants.pubspecCoreYaml));
    final _isAivailablePubspecCoreYml = pubspecCoreYaml.existsSync();
    if (!_isAivailablePubspecYml && !_isAivailablePubspecCoreYml) {
      throw NotFoundPubspec();
    }

    ///
    if (!_isAivailablePubspecYml && _isAivailablePubspecCoreYml) {
      pubspecCoreYaml.copySync(pubspecYaml.path);
    }
  }

  Future<void> updateFlavor(FlavorType flavorType) async {
    final currentFlavors = flavors;
    if (currentFlavors != null) {
      List<String> keys = [];
      currentFlavors.values.map((e) => e.dependencies).forEach((e) {
        keys = [...keys, ...e!.keys.toList()];
      });
      final newFlavorDependencies = currentFlavors[flavorType]!.dependencies;
      final keysx = keys.toSet().toList();
      pubSpec.dependencies
        ..removeWhere((key, value) => keysx.any((element) => element == key))
        ..addAll(newFlavorDependencies!);
      await pubSpec.save(directory);
    }
  }

  Future<void> updateFlavorPubspecLock(FlavorType flavorType) async {
    final pubspecLock = File(path.join(directory.path, Constants.pubspecLock));
    if (!pubspecLock.existsSync()) {
      return;
    }
    final flavorPubspecLock =
        File(path.join(directory.path, 'pubspec.${flavorType.value}.lock'));
    if (flavorPubspecLock.existsSync()) {
      flavorPubspecLock.deleteSync();
    }
    pubspecLock.copySync(flavorPubspecLock.path);
  }
}
