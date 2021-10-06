import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/manager/manager.dart';

class PubGetSubcommand extends GmaCommand {
  @override
  String get description => 'Update depdencies of packages.';

  @override
  String get name => 'get';

  @override
  Set<String> arguments = {'pub', 'get'};
  
  
  @override
  FutureOr<void> run() async {
    manager = await GmaManager.initialize(globalResults, logger,
        shouldUseFilter: shouldUseFilter);
    manager.loggerCommandStart(
        command: command, arguments: arguments, description: description);
    if (manager.isDryRun) {
      arguments.add('--dry-run');
    }
    await manager.runFiltered(command, arguments);
    manager.loggerCommandResults();
    if (failures.isNotEmpty) {
      
      exitCode = 1;
    }
  }
}
