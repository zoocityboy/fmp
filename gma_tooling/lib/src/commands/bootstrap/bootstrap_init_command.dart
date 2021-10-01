
import 'dart:async';
import 'dart:io';

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/processor/bootstrap_processor.dart';
import '../i_command.dart';
class BootstrapInitSubcommand extends SimpleGmaCommand {
  @override
  final name = 'init';
  @override
  final description = 'initialize GMA project ';
  @override
  List<String> get aliases => ['bsi'];
  
  @override
  FutureOr<void> run() async {
    final _cmd = BootstrapProcessor(
        dir: Directory(
          globalResults?[Constants.argDirectory] ?? Directory.current.path),
      logger: logger,
    );
    await _cmd.run();
  }
}
