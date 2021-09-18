
import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';

class AnalyzeSubCommand extends GmaCommand with LoggerMixin {
  @override
  String get description => 'Run analyze command over selected packages.';

  @override
  String get name => 'analyze';
  @override
  String? get command => 'flutter';
  @override
  Set<String> arguments = {'analyze'};
  AnalyzeSubCommand(){
    argParser.addOption('package', abbr: 'p');
    argParser.addOption('filter', abbr: 'f');
  }
  @override
  FutureOr<void> run() async {
    await super.run();
    
    final progress = loggerCommandStart();
    await executeOnSelected();
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
      exitCode = 1;
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }
}

