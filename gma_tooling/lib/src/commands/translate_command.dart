import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/gmat.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/package.dart';

import 'i_command.dart';

class TranslateCommand extends GmaCommand with LoggerMixin {
  @override
  final name = 'translate';
  @override
  final description = 'Translate package';

  @override
  String? get command => 'flutter';
  @override
  bool get shouldUseFilter => true;

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
    workspace.manager.applyDependencies(dependsOn: ['gen_lang']);
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
      final process = await package.process(
          commnadName,
          [
            ...arguments.toList(),
            '--class-name',
            'L10n${package.directoryName.toPascalCase()}'
          ],
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
