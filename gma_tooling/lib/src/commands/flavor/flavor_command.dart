import 'dart:async';
import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/workspace.dart';
import '../i_command.dart';
import 'flavor_app_command.dart';

class FlavorCommand extends GmaCommand with LoggerMixin {
  @override
  final name = 'flavor';

  @override
  final description = 'Change flavor of selected App';

  @override
  bool get shouldUseFilter => false;

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

    argParser.addFlag('force-reload',
        abbr: 'r',
        help: 'Force reload flavor even if is same like current',
        negatable: false);
      }
  }

  @override
  FutureOr<void> run() async {}
}
