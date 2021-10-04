import 'dart:io';

import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:gmat/src/commands/version/version_command.dart';
import 'package:gmat/src/exceptions/not_initialized_exception.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';
import 'package:gmat/src/commands/flavor/flavor_command.dart';
import 'package:gmat/src/commands/quality/quality_command.dart';
import 'package:gmat/src/commands/translate_command.dart';
import 'package:gmat/src/workspace.dart';
import 'package:pool/pool.dart';
import 'bootstrap/bootstrap_command.dart';
import 'pub/pub_command.dart';
import '../constants.dart';

late GmaWorkspace workspace;
Pool pool = Pool(Constants.defaultConcurency);
final Pool directoryPool = Pool(10);

class KtCommandRunner extends CommandRunner<void> {
  // bool get allowTrailingOptions => true;
  KtCommandRunner() : super('gmat', 'Manage GMA multi-package project') {
    argParser.addFlag(
      Constants.argVerbose,
      abbr: 'v',
      negatable: false,
      help: 'Enable verbose logging.',
    );

    argParser.addOption(
      Constants.argConcurrency,
      abbr: 'c',
      help: 'How many concurrent processes can run',
      defaultsTo: "6",
    );

    argParser.addFlag(Constants.argFastFail,
        help: 'Fast fail allow finish on first fail', negatable: false);

    argParser.addFlag(
      Constants.argDryRun,
      help: 'Run current command with dry run',
      negatable: false,
    );

    argParser.addOption(
      Constants.argFilter,
      abbr: 'f',
      help: 'Filter package by folder name with <Glob>',
      valueHelp: 'capp_[a-b]**',
    );

    argParser.addOption(Constants.argFilterDependency,
        help: 'Filter package by dependency with Glob pattern',
        valueHelp: 'capp_a**',
        aliases: ['fd']);

    argParser.addOption(Constants.argFilterDevDependency,
        help: 'Filter package by devDependency with Glob pattern',
        valueHelp: 'capp_a**',
        aliases: ['fdd']);

    argParser.addFlag(Constants.argExamples,
        help: 'Allow operation in package examples', defaultsTo: false);

    try {
      workspace = GmaWorkspace.fromDirectory(Directory.current);
      print(ListString.divider);
      print('- procesors: ${Platform.numberOfProcessors}');
      print('- maxRss: ${ProcessInfo.maxRss}');
      print('- currentRss: ${ProcessInfo.currentRss}');

      print(ListString.divider);
    } catch (e, s) {}

    addCommand(BootstrapCommand());
    addCommand(PubCommand());
    addCommand(TranslateCommand());
    addCommand(QualityCommand());
    addCommand(FlavorCommand());
    addCommand(VersionCommand());
  }

  @override
  Future<void> runCommand(ArgResults topLevelResults) async {
    pool = Pool(
        int.parse(topLevelResults[Constants.argConcurrency] ??
            Constants.defaultConcurency),
        timeout: Duration(seconds: 1));
    if (!GmaWorkspace.isInitialized() &&
        topLevelResults.command?.name != 'bootstrap') {
      throw NotInitializedException();
    }
    await super.runCommand(topLevelResults);
  }

  @override
  String? get usageFooter => TextConstants.footerUsageKey;
}
