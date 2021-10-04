import 'dart:async';
import 'dart:io';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/commands/i_command.dart';

class PubCleanSubcommand extends GmaCommand with LoggerMixin {
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
    final progress = loggerCommandStart();
    manager.cleanStorage();
    await executeOnSelected();
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
      exitCode = 1;
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }
}
