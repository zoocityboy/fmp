import 'dart:io';

import 'package:glob/glob.dart';
import 'package:gmat/src/extensions/glob.dart';
import 'package:gmat/src/models/package.dart';

extension IterableExtension<T> on Iterable<T> {
  T? firstWhereOrNull(bool Function(T element) test) {
    for (var element in this) {
      if (test(element)) return element;
    }
    return null;
  }
}
extension PackageList on List<Package> {
  Package? firstWhereOrNull(bool Function(Package element) test) {
    for (var element in this) {
      if (test(element)) return element;
    }
    return null;
  }
  List<Package> sortByName() {
    sort((a, b) => a.directoryName.compareTo(b.directoryName));
    return this;
  }

  List<Package> sortByPath() {
    sort((a, b) => a.directory.path.compareTo(b.directory.path));
    return this;
  }
}
final terminalColumns = stdout.hasTerminal ? stdout.terminalColumns : 80;
extension ListString on List {
  static String get divider => '⎼' * terminalColumns;
  static String get dividerTop => '⎺' * terminalColumns;
  static String get dividerBottom => '_' * terminalColumns;
}

extension IterablePackage on Iterable<Package> {
  Iterable<Package> applyDependsOn(List<String> dependsOn) {
    if (dependsOn.isEmpty) return this;

    return where((package) {
      return dependsOn.every((element) {
        return package.dependencies.keys.contains(element) ||
            package.devDependencies.keys.contains(element);
      });
    });
  }
  
  Iterable<Package> sortByName() {
    final list = toList(growable: false);
    list.sort((a, b) => a.directoryName.compareTo(b.directoryName));
    return Iterable.castFrom(list);
  }

  Iterable<Package> sortByPath() {
    final list = toList(growable: false);
    list.sort((a, b) => a.directory.path.compareTo(b.directory.path));
    return Iterable.castFrom(list);
  }
}

extension IterableString on Iterable<String> {
  Iterable<Glob> toGlobList(Directory directory) {
    return map(
        (e) => GlobCreate.create(e, currentDirectoryPath: directory.path));
  }

}
