import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:glob/glob.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/i_abstract_processor.dart';

/// Init processor
class InitProcessor extends AbstractProcessor<List<Package>> {
  InitProcessor(
      {required this.workspace, required this.logger, this.filters});
  final Directory workspace;
  @override
  final Logger logger;
  final List<String>? filters;

  bool where(FileSystemEntity file, {List<Glob>? globs}) {
    final isPuspecFile =
        file.path.endsWith('${Platform.pathSeparator}pubspec.yaml') ||
            file.path.endsWith('${Platform.pathSeparator}pubspec.yml');
    if (globs != null) {
      return globs.any((glob) => glob.matches(file.path)) && isPuspecFile;
    }
    return isPuspecFile;
  }
  FutureOr<List<Package>> execute() async {
    final globList = filters?.map((e) =>
        GlobCreate.create('**/$e', currentDirectoryPath: workspace.path));
    final allPubspecs = await workspace
        .list(recursive: true, followLinks: false)
        .where((file) => where(file, globs: globList?.toList()))
        .toList();
    final _result = await Future.wait<Package>(allPubspecs.map((file) async {
      final _package = Package(file);
      await _package.loadPubspec();
      return _package;
    }));
    return _result;
  }

  @override
  Future<Process> run() {
    throw UnimplementedError();
  }
}
