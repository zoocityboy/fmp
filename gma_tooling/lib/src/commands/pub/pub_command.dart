import 'dart:async';

import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/commands/pub/pub_clean_subcommand.dart';
import 'package:gmat/src/commands/pub/pub_get_subcommand.dart';

class PubCommand extends GmaCommand {
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
