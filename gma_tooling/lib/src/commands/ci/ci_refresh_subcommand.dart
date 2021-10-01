import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';

class RefreshSubcommand extends GmaMultipleCommand with LoggerMixin {
  @override
  String get description => 'Clean project and get dependencies';

  @override
  String get name => 'refresh';

  @override
  bool get shouldUseFilter => false;

  @override
  List<MapEntry<String?, List<String>>> get commands => [
        MapEntry<String?, List<String>>('flutter', ['clean']),
        MapEntry<String?, List<String>>(null, ['pub', 'get']),
      ];
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
