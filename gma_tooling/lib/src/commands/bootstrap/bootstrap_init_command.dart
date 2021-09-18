
import 'dart:async';
import 'dart:io';

import 'package:gmat/src/monitoring/monitoring_mixin.dart';
import 'package:gmat/src/processor/bootstrap_processor.dart';
// import 'package:gmat/src/processor/shell_processor.dart';
import '../i_command.dart';
class BootstrapInitSubcommand extends GmaCommand with CommandMonitoring {
  @override
  final name = 'init';
  @override
  final description = 'initialize GMA project ';
  @override
  List<String> get aliases => ['bsi'];
  
  @override
  FutureOr<void> run() async {
    await super.run();
    // await ShellProcessor('dart', ['pub', 'global', 'activate', 'dart_code_metrics'], logger: kt.logger).run();
    final _cmd = BootstrapProcessor(
        dir: Directory(globalResults?['root'] ?? Directory.current.path), logger: gmaManager.logger,);
    await _cmd.run();
  }
}
