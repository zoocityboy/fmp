import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:glob/glob.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/i_abstract_processor.dart';
import 'package:pool/pool.dart';
import 'package:process_runner/process_runner.dart';

/// Init processor
class InitProcessor extends AbstractProcessor<List<Package>> {
  InitProcessor(
      {required this.workspace, required this.logger, this.filters});
  final Directory workspace;
  @override
  final Logger logger;
  final List<String>? filters;

  bool where(FileSystemEntity file, {List<Glob>? globs}) {
    final dartToolGlob = GlobCreate.create('**/.dart_tool/**',
        currentDirectoryPath: workspace.path);
    final isPuspecFile =
        (
        file.path.endsWith('${Platform.pathSeparator}pubspec.yml') ||
            file.path.endsWith(Constants.pubspecYaml) &&
                !dartToolGlob.matches(file.path));
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
    List<Package> _result = [];
    
    final x = Pool(10, timeout: Duration(seconds: 2));

    await x.forEach<FileSystemEntity, void>(allPubspecs, (file) async {
      final _package = Package(file);
      await _package.loadPubspec();
      _result.add(_package);
    }).drain<void>();

    _result.sort((a, b) => a.name.compareTo(b.name));
    return _result;
  }

  @override
  Future<Process> run() {
    throw UnimplementedError();
  }
}
