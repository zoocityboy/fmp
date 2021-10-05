import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/gmat.dart';

class LicenceSubCommand extends GmaCommand with LoggerMixin {
  @override
  String get description => 'Scrape and save licences of all packages';

  @override
  String get name => 'licence';

  @override
  Set<String> arguments = {'analyze'};

  LicenceSubCommand() {
    final _apps = workspace?.config.apps
        .where((element) =>
            element.stages.isNotEmpty || element.countries.isNotEmpty)
        .toList();
    argParser.addOption(Constants.argApp,
        allowed: _apps?.map((e) => e.name).toList());
  }

  @override
  FutureOr<void> run() async {
    await super.run();
    final progress = loggerCommandStart();
    await executeOnSelected();
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
      exitCode = 1;
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }

  @override
  Future<void> executeOnSelected() async {
    return await pool.forEach<Package, void>(manager.selectedPackages,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }
      loggerProgress(package.command, package);
      final process = await package.process(package.command, arguments.toList(),
          dryRun: manager.isDryRun, logger: manager.logger);

      if (await process.exitCode > 0) {
        failures[package] = await process.exitCode;
        if (!isVerbose) {
          manager.log('\n');
        }
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
  }
}
