import 'dart:async';
import 'dart:io';
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
      'choose',
      allowed: app.flavors,
    );
  }
  @override
  FutureOr<void> run() async {
    FlavorType flavorType = FlavorTypeConverter.fromJson(argResults!['choose']);
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
        (worker.package as Package).updateFlavorPubspecLock(flavorType);
      }
    });
    manager.loggerCommandResults();
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }

  // @override
  // Future<void> executeOnSelected() async {
  //   FlavorType flavorType = FlavorTypeConverter.fromJson(argResults!['choose']);
  //   final pool = manager.pool;
    
  //   final jobs =
  //       manager.getWorkerJobs(command: command, arguments: {'pub', 'get'});
    
  //   for (final package in manager.selectedPackages) {
  //     package.updateFlavor(flavorType);
  //   }
  //   await for (final job in pool.startWorkers(jobs)) {
  //     final worker = job as GmaWorker;
  //     manager.loggerProgress(worker);
  //     if (worker.result.exitCode == 0) {
  //       (worker.package as Package).updateFlavorPubspecLock(flavorType);
  //     }
  //   }
  // }
}
