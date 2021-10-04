import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/models/package.dart';

class PubTranslateSubcommand extends GmaCommand with LoggerMixin {
  @override
  final name = 'translate';
  @override
  final description = '''Find all packages with dependency on
  gen_lang package and generate new translations.
  ''';

  @override
  String? get command => 'flutter';

  @override
  bool get shouldUseFilter => false;

  @override
  Set<String> arguments = {
    'pub',
    'run',
    'gen_lang:generate',
    '--source-dir',
    'lib${Platform.pathSeparator}l10n${Platform.pathSeparator}strings',
    '--output-dir',
    'lib${Platform.pathSeparator}l10n',
  };

  @override
  FutureOr<void> run() async {
    await super.run();
    manager.applyAllDependencies(dependsOn: [PubspecKeys.genLangKey]);
    final progress = loggerCommandStart();
    await executeOnSelected();
    loggerCommandResults(failures: failures, progress: progress);
    if (failures.isNotEmpty) {
      exitCode = 1;
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
      final process = await package.process(
          package.command,
          [
            ...arguments.toList(),
            '--class-name',
            'L10n${package.directoryName.toPascalCase()}'
          ],
          dryRun: manager.isDryRun,
          logger: manager.logger);

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
