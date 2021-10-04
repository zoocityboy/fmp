import 'dart:async';

import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/commands/pub/pub_clean_subcommand.dart';
import 'package:gmat/src/commands/pub/pub_get_subcommand.dart';
import 'package:gmat/src/commands/pub/pub_refresh_subcommand.dart';
import 'package:gmat/src/commands/pub/pub_translate_subcommand.dart';

class PubCommand extends GmaCommand {
  @override
  final name = 'pub';
  @override
  final description = 'Flutter commands over mono repo';

  PubCommand() : super() {
    addSubcommand(PubCleanSubcommand());
    addSubcommand(PubGetSubcommand());
    addSubcommand(PubRefreshSubcommand());
    addSubcommand(PubTranslateSubcommand());
  }

  @override
  FutureOr<void> run() async {
    await super.run();
    printUsage();
    return Future.value(null);
  }
}
