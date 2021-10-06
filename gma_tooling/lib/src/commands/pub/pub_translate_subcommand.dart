import 'dart:async';
import 'dart:io';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/string_ext.dart';
import 'package:gmat/src/commands/i_command.dart';

class PubTranslateSubcommand extends GmaCommand {
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
    
    manager.loggerCommandStart(
        command: command, arguments: arguments, description: description);
    await executeOnSelected();
    manager.loggerCommandResults();
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }

  @override
  Future<void> executeOnSelected({List<GmaWorker>? addToJobs}) async {
    manager.initPool();
    // final _jobs = manager.getWorkerJobs(command: command, arguments: )
    final jobs = manager.selectedPackages
        .map((package) => package.getWorkerJob(
            package.command,
            [
              ...arguments.toList(),
              '--class-name',
              'L10n${package.directoryName.toPascalCase()}'
            ],
            logger: logger))
        .toList();
    await manager.processSelectedPackages(
        jobs, (job) => manager.loggerProgress(job));
  }
}
