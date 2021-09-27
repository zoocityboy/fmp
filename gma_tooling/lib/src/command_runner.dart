import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:gmat/src/commands/ci/ci_command.dart';
import 'package:gmat/src/commands/flavor_command.dart';
import 'package:gmat/src/commands/quality/quality_command.dart';
import 'package:gmat/src/commands/test_command.dart';
import 'package:gmat/src/commands/translate_command.dart';
import 'commands/bootstrap/bootstrap_command.dart';
import 'commands/pub/pub_command.dart';

class KtCommandRunner extends CommandRunner<void> {
  KtCommandRunner() : super('gma', 'Manage GMA multi-package project') {
    argParser.addFlag(
      'verbose',
      abbr: 'v',
      negatable: false,
      help: 'Enable verbose logging.',
    );
    argParser.addOption('root', abbr: 'r', help: 'Set root of monorepo');
    argParser.addOption('concurrency',
        abbr: 'c', help: 'set process count', defaultsTo: "12");
    argParser.addOption('package', abbr: 'p', help: 'Select package');
    argParser.addOption('filter',
        abbr: 'f', help: 'Glob pattern filter packages', valueHelp: '*capp_a*');
    argParser.addFlag('fast-fail',
        abbr: 'x',
        aliases: ['ff'],
        help: 'stop on first fail',
        negatable: false);

    addCommand(BootstrapCommand());
    addCommand(PubCommand());
    addCommand(TranslateCommand());
    addCommand(TestCommand());
    addCommand(QualityCommand());
    addCommand(CiCommand());
    addCommand(FlavorCommand());
  }
  @override
  Future<void> runCommand(ArgResults topLevelResults) async {
    await super.runCommand(topLevelResults);
  }
}
