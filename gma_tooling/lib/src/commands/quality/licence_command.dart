import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:ansi_styles/ansi_styles.dart';
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
    argParser.addOption(Constants.argApp, allowed: ['self_care', 'mapp']);
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
    return await pool.forEach<Package, void>(workspace.manager.filtered,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }
      final commnadName = command ??
          (package.packageType == PackageType.flutter ? 'flutter' : 'dart');
      loggerProgress(commnadName, package);
      final process = await package.process(commnadName, arguments.toList(),
          dryRun: workspace.manager.isDryRun);

      if (await process.exitCode > 0) {
        failures[package] = await process.exitCode;
        if (!isVerbose) {
          workspace.manager.log('\n');
        }
        await process.stderr.transform(utf8.decoder).forEach((value) {
          workspace.manager.log(
              '         ⌙ ${AnsiStyles.redBright.bold(package.name)}  ${AnsiStyles.dim.italic(value.stdErrFiltred())}');
        });
        await process.stdout.transform(utf8.decoder).forEach((value) {
          if (value.startsWith('info •') || value.startsWith('warning •')) {
            workspace.manager.log(
                '            ${AnsiStyles.dim.italic(value.stdOutFiltred())}');
          }
        });
      }
    }).drain<void>();
  }
}
