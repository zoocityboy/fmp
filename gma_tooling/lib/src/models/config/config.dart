import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:gmat/src/models/config/config_app.dart';
import 'package:yaml/yaml.dart';

class Config {
  String name;
  String description;
  List<ConfigApp> apps;
  List<String> packages;
  Config({
    required this.name,
    required this.description,
    required this.apps,
    required this.packages,
  });

  Config copyWith({
    String? name,
    String? description,
    List<ConfigApp>? apps,
    List<String>? packages,
  }) {
    return Config(
      name: name ?? this.name,
      description: description ?? this.description,
      apps: apps ?? this.apps,
      packages: packages ?? this.packages,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'description': description,
      'apps': apps.map((x) => x.toMap()).toList(),
      'packages': packages,
    };
  }

  factory Config.fromMap(Map<String, dynamic> map) {
    print(List.generate(80, (index) => '-').join(''));
    print(map);
    print(List.generate(80, (index) => '-').join(''));

    final apps =
        List<ConfigApp>.from(map['apps']?.map((x) => ConfigApp.fromMap(x)));
    print(List.generate(80, (index) => '-').join(''));
    return Config(
      name: map['name'],
      description: map['description'],
      apps: List<ConfigApp>.from(map['apps']?.map((x) => ConfigApp.fromMap(x))),
      packages: List<String>.from(map['packages']),
    );
  }

  String toJson() => json.encode(toMap());

  factory Config.fromJson(String source) => Config.fromMap(json.decode(source));

  @override
  String toString() {
    return 'Config(name: $name, description: $description, apps: $apps, packages: $packages)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is Config &&
        other.name == name &&
        other.description == description &&
        listEquals(other.apps, apps) &&
        listEquals(other.packages, packages);
  }

  @override
  int get hashCode {
    return name.hashCode ^
        description.hashCode ^
        apps.hashCode ^
        packages.hashCode;
  }
}
