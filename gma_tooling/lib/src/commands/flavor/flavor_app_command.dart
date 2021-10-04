import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/config/config_app.dart';
import 'package:gmat/src/models/flavor/flavors.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/flavor_processor.dart';
import '../i_command.dart';

class FlavorAppCommand extends GmaCommand with LoggerMixin {
  final String customName, customDescription;

  @override
  String get description => customDescription;

  @override
  String get name => customName;

  @override
  bool get shouldUseFilter => false;

  FlavorAppCommand(GmaApp app,
      {required this.customName, required this.customDescription}) {
    argParser.addOption(
      'choose',
      allowed: app.flavors,
    );
  }
  @override
  FutureOr<void> run() async {
    await super.run();

    manager.applyFlavorFilter(apps: [customName]);
    final progress = loggerCommandStart();

    await executeOnSelected();
    loggerCommandResults(failures: failures, progress: progress);
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }

  @override
  Future<void> executeOnSelected() async {
    FlavorType flavorType = FlavorTypeConverter.fromJson(argResults!['choose']);
    await pool.forEach<Package, void>(manager.selectedPackages,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }
      loggerProgress(
          'changing flavor to ${AnsiStyles.white.bold(flavorType.value)}',
          package);
      final process = await FlavorProcessor(
              flavorType: flavorType, package: package, logger: logger)
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
  }
}
