import 'dart:async';

import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/constants.dart';

class VersionSearchSubcommand extends GmaCommand {
  @override
  String get description => 'Find all packages with dependency on query';

  @override
  String get name => 'search';

  @override
  bool get shouldUseFilter => false;

  VersionSearchSubcommand() {
    argParser.addOption(Constants.argPackage,
        help: 'Find all packages with same package and show current versions',
        valueHelp: 'dartz',
        mandatory: true);
  }
  @override
  FutureOr<void> run() async {
    await super.run();
    final _query = argResults?[Constants.argPackage] ?? '';
    manager
      ..applyAllDependencies(dependsOn: [_query])
      ..loggerCommandStart(
          command: name, arguments: {_query}, description: description);
    await executeSelected(_query);
    manager
      ..loggerCommandSuccess()
      ..resolveExit();
  }

  Future<void> executeSelected(String query) async {
    for (var package in manager.selectedPackages) {
      final reference = package.getPackageVersion(query);
      if (reference != null) {
        manager.log(manager.formatCaption(
            '${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('$reference ...')}'));
      }
    }
  }
}
