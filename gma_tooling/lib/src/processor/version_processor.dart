import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/i_abstract_processor.dart';
import 'package:pool/pool.dart';
import 'package:pubspec/pubspec.dart';
/// Version processor
///
/// Get all dependencies from `IEntity` and sync same version of package
/// a cross all packages
///
class VersionProcessor extends AbstractProcessor<String> {
  VersionProcessor(
      {required this.pool,
      required this.package,
      required this.updatePackageName,
      required this.version,
      required this.logger});
  final Pool pool;
  final Package package;
  final String updatePackageName, version;

  @override
  final Logger logger;

  @override
  Future<Process> run() async {
    final dependencies = package.dependencies;

    if (dependencies.containsKey(updatePackageName)) {
      dependencies.update(
          updatePackageName, (value) => DependencyReference.fromJson(version));
      package.dependencies = dependencies;
    }
    final devDependencies = package.devDependencies;

    if (devDependencies.containsKey(updatePackageName)) {
      devDependencies.update(
          updatePackageName, (value) => DependencyReference.fromJson(version));
      package.devDependencies = devDependencies;
    }
    await pool.withResource(() => package.pubSpec
        .copy(dependencies: dependencies, devDependencies: devDependencies)
        .save(package.directory));
    return package.process('flutter', ['pub', 'get'], logger: logger);
  }
}
