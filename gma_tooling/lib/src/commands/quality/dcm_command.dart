
import 'dart:async';
import 'dart:io';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';

class DcmSubCommand extends GmaCommand with LoggerMixin {
  
  @override
  String get description => '''Run dart code metrics over supported packages.
  run "dart pub global activate dart_code_metrics" before''';
  
  @override
  String get name => 'dcm';
  
  @override
  Set<String> arguments = {'pub', 'run', 'dart_code_metrics:metrics', 'lib'};
  
  @override
  FutureOr<void> run() async {
    await super.run();
    manager.applyDevDependencies(dependsOn: [PubspecKeys.dcmKey]);
    final progress = loggerCommandStart();
    await executeOnSelected();
    loggerCommandResults(failures: failures, progress: progress);
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }
}