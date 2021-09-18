import 'dart:async';
import 'dart:io';

import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/monitoring/monitoring_mixin.dart';
import 'i_command.dart';

class PubCommand extends GmaCommand {
  // The [name] and [description] properties must be defined by every
  // subclass.
  @override
  final name = 'pub';
  @override
  final description = 'Flutter commands over mono repo';
  @override
  String? get command => null;

  PubCommand() {
    addSubcommand(CleanSubcommand());
    addSubcommand(GetSubcommand());
  }

  @override
  FutureOr<void> run() {
    printUsage();
    return Future.value(null);
  }
}


class CleanSubcommand extends GmaCommand with LoggerMixin {
  @override
  String get description => 'Clean depdencies of packages.';

  @override
  String get name => 'clean';
  @override
  Set<String> arguments = {'clean'};
  @override
  String? get command => 'flutter';

  
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

class GetSubcommand extends GmaCommand with CommandMonitoring, LoggerMixin {
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
