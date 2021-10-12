import 'dart:async';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/package.dart';
import 'package:gmat/src/manager/manager.dart';
import 'package:gmat/src/models/config/config_app.dart';
import 'package:gmat/src/models/flavor/flavors.dart';
import 'package:gmat/src/models/package.dart';
import '../i_command.dart';

class FlavorAppCommand extends GmaCommand {
  final String customName, customDescription;

  @override
  String get description => customDescription;

  @override
  String get name => customName;

  @override
  bool get shouldUseFilter => false;

  FlavorAppCommand(GmaApp app,
      {required this.customName, required this.customDescription}) {
    argParser.addOption(
      Constants.argChange,
      allowed: app.flavors,
      // allowedHelp: app.allowHelp,
        help: 'Select flavor of selected application'
            'example: fakein => stage: fake, country: India'
    );
  }
  @override
  FutureOr<void> run() async {
   
    FlavorType flavorType =
        FlavorTypeConverter.fromJson(argResults![Constants.argChange]);
    final manager = await GmaManager.initialize(globalResults, logger,
        shouldUseFilter: shouldUseFilter);
    manager
      ..applyFlavorFilter(apps: [customName])
      ..loggerCommandStart(
          command: 'flutter',
          arguments: {'pub', 'get'},
          description: customDescription);
    for (final package in manager.selectedPackages) {
      package.updateFlavor(flavorType);
    }
    await manager.runFiltered('flutter', {'pub', 'get'}, cb: (worker) {
      if (worker.result.exitCode == 0) {
        if (worker.package is Package) {
          (worker.package as Package).updateFlavorPubspecLock(flavorType);
        }
      }
    });
    manager
      ..loggerCommandResults()
      ..resolveExit();
  }
}
