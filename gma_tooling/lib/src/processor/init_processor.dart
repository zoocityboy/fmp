import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/i_abstract_processor.dart';

/// Init processor
class InitProcessor extends AbstractProcessor<List<Package>> {
  InitProcessor(
      {required this.workspace, required this.logger, this.filter = const []});
  final Directory workspace;
  @override
  final Logger logger;

  final List<String> filter;
  @override
  void kill() {}

  FutureOr<List<Package>> execute() async {
    final allPubspecs = await workspace
        .list(recursive: true, followLinks: false)
        .where((file) =>
            (file.path.endsWith('${Platform.pathSeparator}pubspec.yaml') ||
                file.path.endsWith('${Platform.pathSeparator}pubspec.yml')) &&
            !file.path.contains(
                '${Platform.pathSeparator}example${Platform.pathSeparator}'))
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
