import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:gmat/src/commands/ci/ci_command.dart';
import 'package:gmat/src/commands/flavor_command.dart';
import 'package:gmat/src/commands/quality/quality_command.dart';
import 'package:gmat/src/commands/translate_command.dart';
import 'commands/bootstrap/bootstrap_command.dart';
import 'commands/pub/pub_command.dart';
import 'constants.dart';

class KtCommandRunner extends CommandRunner<void> {
  
  KtCommandRunner(this.args)
      : super('gmat', 'Manage GMA multi-package project') {
    argParser.addFlag(
      Constants.argVerbose,
      abbr: 'v',
      negatable: false,
      help: 'Enable verbose logging.',
    );
    argParser.addOption(
      Constants.argDirectory,
      abbr: 'd',
      help: 'Define custom root, default is current directory',
    );
    argParser.addOption(
      Constants.argConcurrency,
      abbr: 'c',
      help: 'How many concurrent processes can run',
      defaultsTo: "6",
    );

    argParser.addFlag(Constants.argFastFail,
        help: 'Fast fail allow finish on first fail',
        negatable: false);
    argParser.addFlag(
      Constants.argDryRun,
      help: 'Run current command with dry run',
      negatable: false,
    );

    argParser.addOption(
      Constants.argFilter,
      abbr: 'f',
      help: 'Filter package by name with Glob pattern',
      valueHelp: 'capp_a**',
    );
    argParser.addOption(Constants.argFilterDependency,
        help: 'Filter package by dependency with Glob pattern',
        valueHelp: 'capp_a**',
        aliases: ['fd']);
    argParser.addOption(Constants.argFilterDevDependency,
        help: 'Filter package by devDependency with Glob pattern',
        valueHelp: 'capp_a**',
        aliases: ['fdd']);
    
    addCommand(BootstrapCommand());
    addCommand(PubCommand());
    addCommand(TranslateCommand());
    addCommand(QualityCommand());
    addCommand(CiCommand());
    addCommand(FlavorCommand());
    
  }
  Iterable<String> args;
  Future<void> init() {
    return run(args);
  }
  @override
  Future<void> runCommand(ArgResults topLevelResults) async {
    await super.runCommand(topLevelResults); 
  }
  @override
  String? get usageFooter => TextConstants.footerUsageKey;
}
