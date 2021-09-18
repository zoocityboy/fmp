import 'dart:io';
import 'string_ext.dart';

extension DirectoryX on Directory {
  bool get isPackages => path == 'packages';
  bool get isRootPackage => parent.isPackages && isInternal;
  bool get isSubPackage =>
      parent.isRootPackage && isInternalPath(path.replaceAll(parent.path, ''));
  bool get isApp => path.contains('capp') || path.contains('mapp');
  bool get isInternal =>
      path.contains('capp_') ||
      path.contains('mapp_') ||
      path.contains('koyal_');
  bool isInternalPath(String path) {
    return path.contains('capp_') ||
        path.contains('mapp_') ||
        path.contains('koyal_');
  }

  String get directoryName => path
      .substring(path.lastIndexOf('${Platform.pathSeparator}') + 1)
      .replaceAll('_core', '');
  String get pascalDirectoryName => directoryName.toPascalCase();
  String get pascalDirectoryFullName => path
      .substring(path.lastIndexOf('${Platform.pathSeparator}') + 1)
      .toPascalCase();
}
extension KtExists on Directory{
  // Future<bool> isBootstraped() async {
  //   Directory.current.
  // }
}