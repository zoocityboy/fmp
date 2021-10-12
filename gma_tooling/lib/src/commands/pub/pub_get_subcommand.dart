import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';

class PubGetSubcommand extends GmaCommand {
  @override
  String get description => 'Update depdencies of packages.';

  @override
  String get name => 'get';

  @override
  Set<String> arguments = {'pub', 'get'};
  
  
  @override
  FutureOr<void> run() async {
   await super.run();
    manager.loggerCommandStart(
        command: command,
      arguments: arguments,
      description: description,
    );
    
    await manager.runFiltered(command, arguments);
    manager.loggerCommandResults();
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }
}
