import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/version_processor.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:pubspec/pubspec.dart';

class VersionUpdateSubcommand extends GmaCommand with LoggerMixin {
  @override
  String get description =>
      'Find all packages with same package and show current versions';

  @override
  String get name => 'update';

  @override
  bool get shouldUseFilter => false;

  VersionUpdateSubcommand() {
    argParser.addOption(
      Constants.argPackage,
      help: 'Choose name of package',
      valueHelp: 'dartz',
    );

    argParser.addOption(
      Constants.argVersion,
      help: 'Update version of the package with semver',
      valueHelp: '^1.0.0',
    );
  }
  @override
  FutureOr<void> run() async {
    await super.run();
    final _package = argResults?[Constants.argPackage];
    manager.applyAllDependencies(dependsOn: [_package]);
    final progress = loggerCommandStart();
    await executeOnSelected();
    loggerCommandResults(failures: failures, progress: progress);
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }

  @override
  Future<void> executeOnSelected() async {
    final _version = argResults?[Constants.argVersion];
    final _package = argResults?[Constants.argPackage];

    await pool.forEach<Package, void>(manager.selectedPackages,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }

      if (DependencyReference.fromJson(_version) ==
          package.getPackageVersion(_package)) {
        manager.log(
            '         ⌙ ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('depenency')} ${AnsiStyles.dim.bold(_package)} ${AnsiStyles.dim('not changed. current version is same.')}');
        return Future.value();
      }
      loggerVersionProgress(package, _package, _version);
      final process = await VersionProcessor(
              pool: directoryPool,
              package: package,
              updatePackageName: _package,
              version: _version,
              logger: logger)
          .run();
      final _exitCode = await process.exitCode;
      if (_exitCode > 0) {
        failures[package] = _exitCode;
        await process.stderr.transform(utf8.decoder).forEach((value) {
          manager.log(
              '         ⌙ ${AnsiStyles.redBright.bold(package.name)}  ${AnsiStyles.dim.italic(value.stdErrFiltred())}');
        });
        await process.stdout.transform(utf8.decoder).forEach((value) {
          if (value.startsWith('info •') || value.startsWith('warning •')) {
            manager.log(
                '            ${AnsiStyles.dim.italic(value.stdOutFiltred())}');
          }
        });
      }
    }).drain<void>();
    await directoryPool.close();
  }

  void loggerVersionProgress(
      Package onPackage, String nameOfPackage, String toVersion) {
    final _current = onPackage.getPackageVersion(nameOfPackage)?.toJson();
    manager.log(
        '         ⌙  ${AnsiStyles.dim.bold(onPackage.name)} changing dependency $nameOfPackage package...');
    manager.log(
        '           ⌙ ${AnsiStyles.white.bold(_current)} -> ${AnsiStyles.dim(toVersion)}');
  }
}
