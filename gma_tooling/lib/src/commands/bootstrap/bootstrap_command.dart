import 'dart:async';

import 'package:args/command_runner.dart';

import '../i_command.dart';
import 'bootstrap_init_command.dart';
import 'bootstrap_update_command.dart';

class BootstrapCommand extends GmaCommand {
  @override
  final name = 'bootstrap';
  @override
  final description = 'Bootstrap Koyal tools';
  @override
  bool get takesArguments => true;
  @override
  String? get command => null;
  BootstrapCommand() : super() {
    addSubcommand(BootstrapInitSubcommand());
    addSubcommand(BootstrapUpdateSubcommand());
    
  }
  @override
  FutureOr<void> run() async {
    throw UsageException;
    await super.run();
    printUsage();
    
    return Future(() => null);
  }
}
