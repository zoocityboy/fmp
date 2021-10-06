import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/models/config/config_app.dart';
import 'package:gmat/src/processor/bootstrap_processor.dart';
import 'package:gmat/src/workspace.dart';
import 'package:path/path.dart' as path;
import '../i_command.dart';

class BootstrapCommand extends GmaCommand {
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
    final _cmd = BootstrapProcessor(
      dir: Directory.current,
      logger: logger,
    );
    await _cmd.run();
    await prepareDefaultFlavors();
    workspace = GmaWorkspace.fromDirectory();
  }

  Future<void> prepareDefaultFlavors() async {
    for (final _app in workspace?.config.apps ?? <GmaApp>[]) {
      final _folder = Directory(path.join(Directory.current.path, _app.folder));
      final pubspec = File(path.join(_folder.path, Constants.pubspecYaml));
      final pubspecExists = pubspec.existsSync();

      final pubspecCore =
          File(path.join(_folder.path, Constants.pubspecCoreYaml));
      final pubspecCoreExists = pubspecCore.existsSync();
     
      if (!pubspecExists && pubspecCoreExists) {
        pubspecCore.copySync(pubspec.path);
      }
    }
  }
}
