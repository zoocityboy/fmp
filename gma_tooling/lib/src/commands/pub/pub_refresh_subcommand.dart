import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';

class PubRefreshSubcommand extends GmaCommand {
  @override
  String get description => 'Clean project and get dependencies';

  @override
  String get name => 'refresh';

  @override
  bool get shouldUseFilter => false;
  @override
  String? get command => 'flutter';
  @override
  Set<String> get arguments => {'clean', '&&', 'flutter' 'pub', 'get'};
  @override
  FutureOr<void> run() async {
    await super.run();
    manager.loggerCommandStart(
        command: command, arguments: arguments, description: description);
    final jobs = manager.getWorkerJobs(
      command: command,
      arguments: arguments,
    );
    await manager.processSelectedPackages(
        jobs, (job) => manager.loggerProgress(job));
    manager.loggerCommandResults();
    
  }
}
