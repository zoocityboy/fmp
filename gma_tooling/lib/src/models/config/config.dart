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
  GmaConfig({
    required this.name,
    required this.description,
    required this.stages,
    required this.countries,
    required this.apps,
    required this.packages,
  });

  // GmaConfig copyWith({
  //   String? name,
  //   String? description,
  //   List<GmaApp>? apps,
  //   List<String>? packages,
  // }) {
  //   return GmaConfig(
  //     name: name ?? this.name,
  //     description: description ?? this.description,
  //     apps: apps ?? this.apps,
  //     packages: packages ?? this.packages,
  //   );
  // }

  // Map<String, dynamic> toMap() {
  //   return {
  //     'name': name,
  //     'description': description,
  //     'apps': apps.map((x) => x.toMap()).toList(),
  //     'packages': packages,
  //   };
  // }

  // factory GmaConfig.fromMap(Map<String, dynamic> map) {
  //   print(List.generate(80, (index) => '-').join(''));
  //   print(map);
  //   print(List.generate(80, (index) => '-').join(''));

  //   final config = GmaConfig(
  //     name: map['name'],
  //     description: map['description'],
  //     apps: List<GmaApp>.from(map['apps']?.map((x) => GmaApp.fromMap(x))),
  //     packages: List<String>.from(map['packages']),
  //   );
  //   print(config);
  //   print(List.generate(80, (index) => '-').join(''));
  //   return config;
  // }

  // String toJson() => json.encode(toMap());

  // factory GmaConfig.fromJson(String source) {
  //   print(source);
  //   return GmaConfig.fromMap(json.decode(source));
  // }

  // @override
  // String toString() {
  //   return '''
  //   Config(
  //     name: $name
  //     description: $description
  //     apps: $apps
  //     packages: $packages
  //   )''';
  // }

  // @override
  // bool operator ==(Object other) {
  //   if (identical(this, other)) return true;
  //   final listEquals = const DeepCollectionEquality().equals;

  //   return other is GmaConfig &&
  //       other.name == name &&
  //       other.description == description &&
  //       listEquals(other.apps, apps) &&
  //       listEquals(other.packages, packages);
  // }

  // @override
  // int get hashCode {
  //   return name.hashCode ^
  //       description.hashCode ^
  //       apps.hashCode ^
  //       packages.hashCode;
  // }

  GmaConfig copyWith({
    String? name,
    String? description,
    List<String>? stages,
    List<String>? countries,
    List<GmaApp>? apps,
    List<String>? packages,
  }) {
    return GmaConfig(
      name: name ?? this.name,
      description: description ?? this.description,
      stages: stages ?? this.stages,
      countries: countries ?? this.countries,
      apps: apps ?? this.apps,
      packages: packages ?? this.packages,
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
    };
  }

  factory GmaConfig.fromMap(Map<String, dynamic> map) {
    return GmaConfig(
      name: map['name'],
      description: map['description'],
      stages: List<String>.from(map['stages']),
      countries: List<String>.from(map['countries']),
      apps: List<GmaApp>.from(map['apps']?.map((x) => GmaApp.fromMap(x))),
      packages: List<String>.from(map['packages']),
    );
  }

  String toJson() => json.encode(toMap());

  factory GmaConfig.fromJson(String source) =>
      GmaConfig.fromMap(json.decode(source));

  @override
  String toString() {
    return 'GmaConfig(name: $name, description: $description, stages: $stages, countries: $countries, apps: $apps, packages: $packages)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;
  
    return other is GmaConfig &&
        other.name == name &&
        other.description == description &&
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
        packages.hashCode;
  }
}
