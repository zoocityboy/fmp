import 'dart:async';
import 'dart:io';

import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/commands/i_command.dart';

class GetSubcommand extends GmaCommand with LoggerMixin {
  @override
  String get description => 'Update depdencies of packages.';

  @override
  String get name => 'get';
  @override
  String? get command => null;

  @override
  Set<String> arguments = {'pub', 'get'};
  
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
