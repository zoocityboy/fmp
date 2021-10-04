import 'dart:async';
import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/commands/version/version_update_subcommand.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';

class VersionCommand extends GmaCommand with LoggerMixin {
  @override
  String get name => 'version';

  @override
  String get description => 'Allow to manipulate with versions of packages';

  @override
  bool get shouldUseFilter => false;
  // bool get allowTrailingOptions => true;
  VersionCommand() {
    argParser.addOption(
      Constants.argSearch,
      help: 'Find all packages with same package and show current versions',
      valueHelp: 'dartz',
    );

    addSubcommand(VersionUpdateSubcommand());
  }

  @override
  FutureOr<void> run() async {
    try {
      await super.run();
      final _query = argResults?[Constants.argSearch];
      if (argResults?.wasParsed(Constants.argSearch) == true &&
          _query != null) {
        await super.run();
        manager.applyAllDependencies(dependsOn: [_query]);
        final progress = loggerCommandStart();
        await executeSelected(_query);
        loggerCommandResults(failures: failures, progress: progress);
        if (failures.isNotEmpty) {
          exitCode = 1;
        }
      }
      return Future.value(null);
    } catch (e, s) {
      print(e);
      print(s);
    }
  }

  Future<void> executeSelected(String query) async {
    for (var package in manager.selectedPackages) {
      final reference = package.getPackageVersion(query);
      if (reference != null) {
        logger.stdout(
            '         ⌙ ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('$reference ...')}');
      }
    }
  }
}
