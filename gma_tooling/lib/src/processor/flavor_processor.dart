import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/exceptions/not_found_pubspec.dart';
import 'package:gmat/src/models/flavor/flavors.dart';
import 'package:gmat/src/models/package.dart';
import 'package:path/path.dart' as path;
import 'i_abstract_processor.dart';

class FlavorProcessor extends AbstractProcessor<void> {
  FlavorProcessor(
      {required this.flavorType, required this.package, required this.logger});
  final Package package;
  final FlavorType flavorType;

  @override
  final Logger logger;

  @override
  Future<Process> run() async {
    checkApp();
    final currentFlavors = package.flavors;
    if (currentFlavors != null) {
      List<String> keys = [];
      currentFlavors.values.map((e) => e.dependencies).forEach((e) {
        keys = [...keys, ...e!.keys.toList()];
      });
      final newFlavorDependencies = currentFlavors[flavorType]!.dependencies;
      final keysx = keys.toSet().toList();
      package.pubSpec.dependencies
        ..removeWhere((key, value) => keysx.any((element) => element == key))
        ..addAll(newFlavorDependencies!);
      await package.pubSpec.save(package.directory);
    }
    return package.process('flutter', ['pub', 'get'], logger: logger);
  }

  void checkApp() {
    ///
    final pubspecYaml =
        File(path.join(package.directory.path, Constants.pubspecYaml));
    final _isAivailablePubspecYml = pubspecYaml.existsSync();

    ///
    final pubspecCoreYaml =
        File(path.join(package.directory.path, Constants.pubspecCoreYaml));
    final _isAivailablePubspecCoreYml = pubspecCoreYaml.existsSync();
    if (!_isAivailablePubspecYml && !_isAivailablePubspecCoreYml) {
      throw NotFoundPubspec();
    }

    ///
    if (!_isAivailablePubspecYml && _isAivailablePubspecCoreYml) {
      pubspecCoreYaml.copySync(pubspecYaml.path);
    }
  }
}
