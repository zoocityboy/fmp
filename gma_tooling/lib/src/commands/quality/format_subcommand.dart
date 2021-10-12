import 'dart:async';
import 'dart:io';

import 'package:glob/glob.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/models/gma_worker.dart';
import 'package:glob/list_local_fs.dart';
import 'package:gmat/src/extensions/string_ext.dart';
class FomatSubcommand extends GmaCommand {
  @override
  String get description => 'Format code of the project.';

  @override
  String get name => 'format';
  @override
  String? get command => 'dart';

  @override
  Set<String> arguments = {'format'};

  @override
  FutureOr<void> run() async {
    await super.run();
    if (manager.isDryRun) {
      arguments.addAll({'-o', 'write'});
    }

    manager.loggerCommandStart(
        description: description, command: command, arguments: arguments);
    final jobs = getWorkerJobs(command: command, arguments: arguments);
    await runJobs(jobs: jobs);
    manager
      ..loggerCommandResults()
      ..resolveExit();
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }
  List<GmaWorker> getWorkerJobs(
          {String? command, Set<String> arguments = const <String>{}}) =>
      manager.selectedPackages.map((package) {
        final allFormatableFiles = Glob('**/*[^.freezed|^.g].dart')
            .listSync(root: package.directory.path, followLinks: false)
            .map((e) => e.toRelativePath(directory: package.directory))
            .toList();
        return package.getWorkerJob(
          command ?? package.command,
          [...arguments.toList(), ...allFormatableFiles],
          logger: logger,
          isFastFail: isFastFail,
        );
      }).toList();
}
