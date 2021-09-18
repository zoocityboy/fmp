import 'dart:async';

import 'package:gmat/src/monitoring/monitoring_mixin.dart';
import '../i_command.dart';
import 'bootstrap_init_command.dart';
import 'bootstrap_update_command.dart';

class BootstrapCommand extends GmaCommand with CommandMonitoring {
  @override
  final name = 'bootstrap';
  @override
  final description = 'Bootstrap Koyal tools';

  @override
  String? get command => null;
  BootstrapCommand() {
    addSubcommand(BootstrapInitSubcommand());
    addSubcommand(BootstrapUpdateSubcommand());
  }
  @override
  FutureOr<void> run() {
    return Future(() => null);
  }
}
