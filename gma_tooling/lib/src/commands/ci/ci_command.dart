import 'dart:async';

import 'package:args/args.dart';
import 'package:gmat/src/commands/ci/ci_refresh_subcommand.dart';
import 'package:gmat/src/commands/i_command.dart';

class CiCommand extends GmaCommand {
  @override
  final name = 'ci';
  @override
  final description = 'Continious integration';
  
  @override
  bool shouldUseFilter = false;

  @override
  ArgParser argParser = ArgParser(
    usageLineLength: 80,
    allowTrailingOptions: true,
  );

  CiCommand() : super() {

    addSubcommand(RefreshSubcommand());
  }

  // [run] may also return a Future.
  @override
  FutureOr<void> run() async {
    await super.run();
    print(argParser.usage);
    printUsage();
    
  }
}
