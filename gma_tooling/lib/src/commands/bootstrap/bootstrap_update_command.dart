import 'dart:async';
import 'dart:io';
import 'package:gmat/src/processor/bootstrap_processor.dart';

import '../i_command.dart';

class BootstrapUpdateSubcommand extends GmaCommand {
  @override
  final name = 'update';
  @override
  final description = 'update from .kt${Platform.pathSeparator}settings.yaml';
  @override
  List<String> get aliases => ['bsu'];

  BootstrapUpdateSubcommand();
  @override
  FutureOr<void> run() async {
    
    final _command = BootstrapProcessor(
        dir: Directory(globalResults?['root'] ?? Directory.current.path),
      logger: manager.logger,
    );
    await _command.run();
    
  }
}
