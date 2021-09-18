import 'dart:async';
import 'dart:io';

import 'package:gmat/src/monitoring/monitoring_mixin.dart';
import 'package:gmat/src/processor/bootstrap_processor.dart';

import '../i_command.dart';

class BootstrapUpdateSubcommand extends GmaCommand with CommandMonitoring {
  @override
  final name = 'update';
  @override
  final description = 'update from .kt${Platform.pathSeparator}settings.yaml';
  @override
  List<String> get aliases => ['bsu'];

  @override
  String? get command => null;

  BootstrapUpdateSubcommand();
  @override
  FutureOr<void> run() async {
    begin('update');
    final _command = BootstrapProcessor(
        dir: Directory(globalResults?['root'] ?? Directory.current.path), logger: gmaManager.logger,);
    await _command.run();
    end();
  }
}
