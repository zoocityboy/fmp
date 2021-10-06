import 'dart:io';
import 'string_ext.dart';

extension DirectoryX on Directory {
  
  String get directoryName => path
      .substring(path.lastIndexOf(Platform.pathSeparator) + 1)
      .replaceAll('_core', '');
  String get pascalDirectoryName => directoryName.toPascalCase();
  String get pascalDirectoryFullName => path
      .substring(path.lastIndexOf(Platform.pathSeparator) + 1)
      .toPascalCase();
}
