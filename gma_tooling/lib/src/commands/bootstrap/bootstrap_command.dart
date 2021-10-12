import 'dart:async';

import 'package:gmat/src/constants.dart';
import 'package:gmat/src/manager/manager.dart';
import '../i_command.dart';

class BootstrapCommand extends SimpleGmaCommand {
  BootstrapCommand() {
    argParser.addFlag(
      Constants.argBootstrapServerBuild,
      defaultsTo: false,
      help: 'Build release version of web app',
    );
    argParser.addFlag(
      Constants.argBootstrapServerRun,
      defaultsTo: false,
      help: 'Run server on custom port defined in gma.yaml',
    );
    argParser.addFlag(
      Constants.argBootstrapInstallExtensions,
      defaultsTo: false,
      help: 'Install GMA Studio extension for Visual Studio Code',
    );
    argParser.addFlag(
      Constants.argBootstrapRefresh,
      defaultsTo: false,
      help: 'run pub get in all packages',
    );
  }
  @override
  final name = 'bootstrap';
  @override
  final description = 'Bootstrap GMA project';
  @override
  bool get takesArguments => true;
  @override
  String? get command => null;
  @override
  FutureOr<void> run() async {
    await GmaInstaller(
            globalResults: globalResults, results: argResults, logger: logger)
        .run();
  }
}
