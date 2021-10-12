import 'dart:io';
import 'package:glob/glob.dart';
import 'package:glob/list_local_fs.dart';
import 'package:gmat/src/constants.dart';
import 'package:gmat/src/extensions/glob.dart';

void main() async {
  final workspace =
      Directory('/Users/zoocityboy/Develop/homecredit.eu/self-care-mobile');
  print(workspace.path);
  final test = ['*/capp_**'];
  final globList = test.map((e) => GlobCreate.create(e,
      currentDirectoryPath: workspace.path, recursive: true));
  print('globList: $globList');
  final files = GlobCreate.create('**/packages/**',
          currentDirectoryPath: workspace.path, recursive: true)
      .list();
  await for (final file in files) {
    print(file);
  }

  final isCorePackage = false;
  bool getIsPubspecFile(
    FileSystemEntity file,
  ) {
    final dartToolGlob = GlobCreate.create('**/.dart_tool/**',
        currentDirectoryPath: workspace.path);
    final exampleGlob = GlobCreate.create('**/example/**',
        currentDirectoryPath: workspace.path);
    if (isCorePackage) {
      return file.path.endsWith(Constants.pubspecCoreYaml) &&
          !dartToolGlob.matches(file.path);
    }

    return ((file.path.endsWith('${Platform.pathSeparator}pubspec.yml') ||
            file.path.endsWith(Constants.pubspecYaml)) &&
        !dartToolGlob.matches(file.path) &&
        !exampleGlob.matches(file.path));
  }

  bool where(FileSystemEntity file, {List<Glob>? globs}) {
    final isPuspecFile = getIsPubspecFile(file);

    if (globs != null) {
      // if (isPuspecFile) {
      //   print(
      //       '\nisPuspecFile $isPuspecFile -> $file -> $globs -< ${globs.any((glob) => glob.matches(file.path)) && isPuspecFile}');
      // }
      return globs.any((glob) {
            // if (isPuspecFile) {
            //   print(
            //       ' -> glob: $glob at ${file.path} -> match: ${glob.matches(file.path)}');
            // }
            return glob.matches(file.path);
          }) &&
          isPuspecFile;
    }
    return isPuspecFile;
  }

  final allPubspecs = await workspace
      .list(recursive: true, followLinks: false)
      .where((file) => where(file, globs: globList.toList()))
      .toList();
  print(allPubspecs);
  // var stages = ['fake', 'prod'];
  // var countries = ['in', 'id', 'vn', 'ph'];

  // print(stages
  //     .map((e) => countries.map((e1) => '$e$e1'))
  //     .expand((element) => element));
}
