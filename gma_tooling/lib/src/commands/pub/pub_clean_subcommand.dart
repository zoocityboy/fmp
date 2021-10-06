import 'dart:async';
import 'package:gmat/src/commands/i_command.dart';
import 'package:process_runner/process_runner.dart';

class PubCleanSubcommand extends GmaCommand {
  @override
  String get description => 'Clean depdencies of packages.';

  @override
  String get name => 'clean';
  
  @override
  Set<String> get arguments => {'clean'};

  @override
  String? get command => 'flutter';

  @override
  FutureOr<void> run() async {
    await super.run();
    manager.loggerCommandStart(
        command: command, arguments: arguments, description: description);
    await manager.cleanStorage();
    await executeOnSelected(addToJobs: [
      GmaWorker(null, ['git', 'clean', '-x', '-d', '-f', '-q'],
          runInShell: true)
    ]);

    manager.loggerCommandResults();
    
  }
}
