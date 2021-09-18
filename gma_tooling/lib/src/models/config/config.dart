import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:gmat/src/models/config/config_app.dart';

class Config {
  List<ConfigApp> apps;
  List<String> packages;
  Config({
    required this.apps,
    required this.packages,
  });

  Config copyWith({
    List<ConfigApp>? apps,
    List<String>? packages,
  }) {
    return Config(
      apps: apps ?? this.apps,
      packages: packages ?? this.packages,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'apps': apps.map((x) => x.toMap()).toList(),
      'packages': packages,
    };
  }

  factory Config.fromMap(Map<String, dynamic> map) {
    return Config(
      apps: List<ConfigApp>.from(map['apps']?.map((x) => ConfigApp.fromMap(x))),
      packages: List<String>.from(map['packages']),
    );
  }

  String toJson() => json.encode(toMap());

  factory Config.fromJson(String source) => Config.fromMap(json.decode(source));

  @override
  String toString() => 'Config(apps: $apps, packages: $packages)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;
  
    return other is Config &&
      listEquals(other.apps, apps) &&
      listEquals(other.packages, packages);
  }

  @override
  int get hashCode => apps.hashCode ^ packages.hashCode;
}
