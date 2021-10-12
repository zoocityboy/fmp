import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:glob/glob.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/models/package.dart';
import 'package:gmat/src/processor/i_abstract_processor.dart';

/// Init processor
class InitProcessor extends AbstractProcessor<List<Package>> {
  InitProcessor(
      {
    required this.workspace,
    required this.logger,
    this.filters,
    this.isCorePackage = false,
  });
  final Directory workspace;
  @override
  final Logger logger;
  final List<String>? filters;
  final bool isCorePackage;
  bool getIsPubspecFile(
    FileSystemEntity file,
  ) {
    final dartToolGlob = GlobCreate.create('.dart_tool/**',
        currentDirectoryPath: workspace.path);
    if (isCorePackage) {
      return file.path.endsWith(Constants.pubspecCoreYaml) &&
          !dartToolGlob.matches(file.path);
    }

    return ((file.path.endsWith('${Platform.pathSeparator}pubspec.yml') ||
            file.path.endsWith(Constants.pubspecYaml)) &&
        !dartToolGlob.matches(file.path));
  }

  bool where(FileSystemEntity file, {List<Glob>? globs}) {
    final isPuspecFile = getIsPubspecFile(file);
    if (globs != null) {
      return globs.any((glob) => glob.matches(file.path)) && isPuspecFile;
    }
    return isPuspecFile;
  }

  FutureOr<List<Package>> execute() async {
    final globList = filters?.map((e) =>
        GlobCreate.create(
          e,
          currentDirectoryPath: workspace.path,
          recursive: true,
        ));
    final allPubspecs = await workspace
        .list(recursive: true, followLinks: false)
        .where((file) => where(file, globs: globList?.toList()))
        .toList();
        
    List<Package> _result = [];
    _result = await Future.wait(allPubspecs.map((file) async {
      final _package = Package(file);
      if (isCorePackage) {
        await _package.loadPubspec();
      } else {
        await _package.loadPubspec();
      }
      return _package;
    }));
    _result.sort((a, b) => a.name.compareTo(b.name));
    return _result;
  }

  @override
  Future<Process> run() {
    throw UnimplementedError();
  }
}
