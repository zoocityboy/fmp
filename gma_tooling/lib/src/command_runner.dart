import 'dart:io';

import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/quality/quality_command.dart';
import 'package:gmat/src/commands/test_command.dart';
import 'package:gmat/src/commands/translate_command.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/init_processor.dart';
import 'package:path/path.dart' as path;
import 'commands/bootstrap/bootstrap_command.dart';
import 'commands/pub_command.dart';

class KtCommandRunner extends CommandRunner<void> {
  KtCommandRunner() : super('gma', 'Manage GMA multi-package project') {
    argParser.addFlag(
      'verbose',
      abbr: 'v',
      negatable: false,
      help: 'Enable verbose logging.',
    );
    argParser.addOption('root', abbr: 'r', help: 'Set root of monorepo');
    argParser.addOption('concurrency', abbr: 'c',  help: 'set process count', defaultsTo: "12");
    argParser.addOption('package', abbr: 'p', help: 'Select package');
    argParser.addOption('filter', abbr: 'f', help: 'Glob pattern filter packages', valueHelp: '*capp_a*');
    argParser.addFlag('fast-fail', abbr: 'x', aliases: ['ff'], help: 'stop on first fail', negatable: false);
    
    addCommand(BootstrapCommand());
    addCommand(PubCommand());
    addCommand(TranslateCommand());
    addCommand(TestCommand());
    addCommand(QualityCommand());
  }
  @override
  Future<void> runCommand(ArgResults topLevelResults) async {
    await super.runCommand(topLevelResults);
  }
}

