import 'dart:async';

import 'package:gmat/src/commands/ci/ci_refresh_subcommand.dart';
import 'package:gmat/src/commands/i_command.dart';

class CiCommand extends ICommand {
  @override
  final name = 'ci';
  @override
  final description = 'Continious integration';

  CiCommand() {
    addSubcommand(RefreshSubcommand());
  }

  // [run] may also return a Future.
  @override
  FutureOr<void> run() {
    printUsage();
    return Future.value(null);
  }

  @override
  bool get checkRoot => true;
}
