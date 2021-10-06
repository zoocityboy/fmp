
import 'dart:async';

import 'package:gmat/src/commands/i_command.dart';

class AnalyzeSubCommand extends GmaCommand {
  @override
  String get description => 'Run analyze command over selected packages.';

  @override
  String get name => 'analyze';
  
  @override
  Set<String> arguments = {'analyze'};
  
  @override
  FutureOr<void> run() async {
    await super.run();
    manager.loggerCommandStart(
        command: command, arguments: arguments, description: description);
    await executeOnSelected();
    manager.loggerCommandResults();
  }
}

