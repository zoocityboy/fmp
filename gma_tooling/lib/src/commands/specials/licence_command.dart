import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:gmat/src/commands/command_runner.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/models/licences/fs.dart';
import 'package:gmat/src/models/licences/package_model.dart';
import 'package:gmat/src/scraper.dart';
import 'package:collection/collection.dart';

class LicencesCommand extends GmaCommand {
  @override
  String get description => 'Scrape and save licences of all packages';

  @override
  String get name => 'licences';
  
  @override
  String get command => 'flutter';

  @override
  Set<String> get arguments => {'pub', 'deps', '--no-dev', '--style=compact'};

  @override
  bool get takesArguments => true;

  late FS _fileSystem;
  final Scraper _scraper = Scraper();

  LicencesCommand() {
    final _apps = workspace?.config.apps
        .where((element) =>
            element.stages.isNotEmpty || element.countries.isNotEmpty)
        .toList();
    argParser.addOption(Constants.argApp,
        allowed: _apps?.map((e) => e.name).toList(), mandatory: true);
  }

  @override
  FutureOr<void> run() async {
    await super.run();
    String? packageName = argResults?[Constants.argApp];
    if (packageName == null) return;
    final app = workspace?.config.apps
            .firstWhereOrNull((element) => element.name == packageName)
            ?.folder ??
        '';
    _fileSystem = FS(appFolderName: app);
    manager
      ..applyFlavorFilter(apps: [packageName])
      ..loggerCommandStart(
          command: command, arguments: arguments, description: description);
    await manager.runFiltered(command, arguments, cb: (job) async {
      final path = await operations(job.result.stdout);
      manager.log(manager.formatCaption(path));
    });
    manager
      ..loggerCommandResults()
      ..resolveExit();
  
  }
  
  Future<String> operations(Object? output) async {
    final list = <PackageModel>[];
    final data = await _fileSystem.process(output);
    final maxConcurency = max(1, Platform.numberOfProcessors - 2);
    for (var i = 0; i < data.length; i += maxConcurency) {
      await Future.wait(data.skip(i).take(maxConcurency).map((item) async {
        try {
          final response = await _scraper.scrape(item.key, version: item.value);
          list.add(response);
        } catch (err, s) {
          print('scrape error: ${item.key}, ${item.value}');
          print(err);
          print(s);
        }
      }));
    }
    list.removeWhere((element) => element.licence == null);
    return await _fileSystem.export(items: list);
  }
}
