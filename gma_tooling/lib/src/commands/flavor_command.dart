import 'dart:async';
import 'dart:io';

import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/flavor/flavors.dart';
import 'i_command.dart';

class FlavorCommand extends GmaCommand with LoggerMixin {
  @override
  final name = 'flavor';
  @override
  final description = 'Change flavor of selected App';
  @override
  String? get command => null;

  @override
  bool get shouldUseFilter => false;

  FlavorCommand() {
    argParser.addOption('change',
        abbr: 'c', allowed: FlavorsString.namedList, help: 'Change app flavor');
    argParser.addMultiOption('app',
        abbr: 'a',
        allowed: ['capp', 'mapp'],
        help: 'Select app SuperCupo[capp], SuperCupo Business[mapp]');
  }

  @override
  FutureOr<void> run() async {
    await super.run();
    gmaManager.applyFlavorFilter();

    final progress = loggerCommandStart();
    await executeOnSelected();
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
      exitCode = 1;
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }

  @override
  Future<void> executeOnSelected() async {}
}
