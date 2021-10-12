import 'dart:async';
import 'dart:io';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/workspace.dart';
import '../i_command.dart';
import 'flavor_app_command.dart';

class FlavorCommand extends SimpleGmaCommand {
  @override
  final name = 'flavor';

  @override
  final description = 'Change flavor of selected App';

  FlavorCommand() {
    if (GmaWorkspace.isInitialized()) {
        final _apps = workspace?.config.apps
          .where((element) =>
              element.stages.isNotEmpty || element.countries.isNotEmpty)
          .toList();
      for (final item in _apps ?? []) {
        addSubcommand(FlavorAppCommand(item,
            customName: item.name, customDescription: item.description ?? ''));
      }
    }
  }

  @override
  FutureOr<void> run() async {
    final execArgs = argResults!.rest;
    print(execArgs);
    if (execArgs.isEmpty) {
      logger.stdout(description);
      logger.stdout(argParser.usage);
      exit(1);
    }
  }
}
