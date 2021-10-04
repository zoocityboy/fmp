import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/models/flavor/flavors.dart';
import 'package:gmat/src/models/package.dart';

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
}
