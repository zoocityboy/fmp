import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/commands/pub/pub_clean_subcommand.dart';
import 'package:gmat/src/commands/pub/pub_get_subcommand.dart';
import 'package:gmat/src/commands/pub/pub_refresh_subcommand.dart';
import 'package:gmat/src/commands/pub/pub_translate_subcommand.dart';

class PubCommand extends SimpleGmaCommand {
  @override
  final name = 'pub';
  @override
  final description = 'Flutter commands over mono repo';
  
  @override
  bool get allowTrailingOptions => false;

  PubCommand() {
    addSubcommand(PubCleanSubcommand());
    addSubcommand(PubGetSubcommand());
    addSubcommand(PubRefreshSubcommand());
    addSubcommand(PubTranslateSubcommand());
  }
  @override
  Future<void> run() async {
    final execArgs = argResults!.rest;
    if (execArgs.isEmpty) {
      logger.stdout(description);
      logger.stdout(argParser.usage);
      exit(1);
    }
    
  }
}
