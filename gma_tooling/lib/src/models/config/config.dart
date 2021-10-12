import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:gmat/src/models/config/config_app.dart';

class GmaConfig {
  String name;
  String description;
  List<String> stages;
  List<String> countries;
  List<GmaApp> apps;
  List<String> packages;
  String? executable;
  GmaConfig({
    required this.name,
    required this.description,
    required this.stages,
    required this.countries,
    required this.apps,
    required this.packages,
    this.executable = 'gmat',
  });

  GmaConfig copyWith({
    String? name,
    String? description,
    List<String>? stages,
    List<String>? countries,
    List<GmaApp>? apps,
    List<String>? packages,
    String? executable,
  }) {
    return GmaConfig(
      name: name ?? this.name,
      description: description ?? this.description,
      stages: stages ?? this.stages,
      countries: countries ?? this.countries,
      apps: apps ?? this.apps,
      packages: packages ?? this.packages,
      executable: executable ?? this.executable,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'description': description,
      'stages': stages,
      'countries': countries,
      'apps': apps.map((x) => x.toMap()).toList(),
      'packages': packages,
      'executable': executable,
    };
  }

  factory GmaConfig.fromMap(Map<String, dynamic> map) {
    return GmaConfig(
      name: map['name'],
      description: map['description'],
      stages: [],
      countries: [],
      apps: List<GmaApp>.from(map['apps']?.map((x) => GmaApp.fromMap(x))),
      packages: List<String>.from(map['packages']),
      executable: map['executable'] ?? 'gmat',
    );
  }

  String toJson() => json.encode(toMap());

  factory GmaConfig.fromJson(String source) =>
      GmaConfig.fromMap(json.decode(source));

  @override
  String toString() {
    return 'GmaConfig(name: $name, description: $description, stages: $stages, countries: $countries, apps: $apps, packages: $packages, executable: $executable)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;
  
    return other is GmaConfig &&
        other.name == name &&
        other.description == description &&
        other.executable == executable &&
      listEquals(other.stages, stages) &&
        listEquals(other.countries, countries) &&
      listEquals(other.apps, apps) &&
        listEquals(other.packages, packages);
  }

  @override
  int get hashCode {
    return name.hashCode ^
      description.hashCode ^
      stages.hashCode ^
        countries.hashCode ^
      apps.hashCode ^
        packages.hashCode ^
        executable.hashCode;
  }
}
