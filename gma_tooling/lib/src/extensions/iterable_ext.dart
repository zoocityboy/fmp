import 'dart:io';

import 'package:gmat/src/models/package.dart';

extension IterableExtension<T> on Iterable<T> {
  T? firstWhereOrNull(bool Function(T element) test) {
    for (var element in this) {
      if (test(element)) return element;
    }
    return null;
  }
}
extension on List<Package> {
  Package? firstWhereOrNull(bool Function(Package element) test) {
    for (var element in this) {
      if (test(element)) return element;
    }
    return null;
  }
}

extension ListString on List {
  static String get divider => '⎼' * stdout.terminalColumns;
  static String get dividerTop => '⎺' * stdout.terminalColumns;
  static String get dividerBottom => '_' * stdout.terminalColumns;
}

extension on Iterable<Package> {
  Iterable<Package> applyDependsOn(List<String> dependsOn) {
    if (dependsOn.isEmpty) return this;

    return where((package) {
      return dependsOn.every((element) {
        return package.dependencies.keys.contains(element) ||
            package.devDependencies.keys.contains(element);
      });
    });
  }
}
