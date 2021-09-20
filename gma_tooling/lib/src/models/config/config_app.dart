import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:yaml/yaml.dart';

class ConfigApp {
  String name;
  String folder;
  String? description;
  List<String> stages;
  List<String> countries;
  List<String> exclude;
  ConfigApp({
    required this.name,
    required this.folder,
    this.stages = const [],
    this.countries = const [],
    this.description,
    this.exclude = const [],
  });

  ConfigApp copyWith({
    String? name,
    String? folder,
    String? description,
    List<String>? stages,
    List<String>? countries,
    List<String>? exclude,
  }) {
    return ConfigApp(
      name: name ?? this.name,
      folder: folder ?? this.folder,
      description: description ?? this.description,
      stages: stages ?? this.stages,
      countries: countries ?? this.countries,
      exclude: exclude ?? this.exclude,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'folder': folder,
      'description': description,
      'stages': stages,
      'countries': countries,
      'exclude': exclude,
    };
  }

  factory ConfigApp.fromMap(Map<String, dynamic> map) {
    print(map);
    return ConfigApp(
      name: map['name'],
      folder: map['folder'],
      description: map['description'],
      stages: List<String>.from(map['stages'] ?? []),
      countries: List<String>.from(map['countries'] ?? []),
      exclude: List<String>.from(map['exclude_packages'] ?? []),
    );
  }

  factory ConfigApp.fromYaml(YamlMap map) {
    print(map);
    return ConfigApp(
      name: map['name'],
      folder: map['folder'],
      description: map['description'],
      stages: List<String>.from(map['stages']),
      countries: List<String>.from(map['countries']),
      exclude: List<String>.from(map['exclude_packages']),
    );
  }

  String toJson() => json.encode(toMap());

  factory ConfigApp.fromJson(String source) =>
      ConfigApp.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ConfigApp(name: $name, folder: $folder, description: $description, stages: $stages, countries: $countries, exclude: $exclude)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is ConfigApp &&
        other.name == name &&
        other.folder == folder &&
        other.description == description &&
        listEquals(other.stages, stages) &&
        listEquals(other.countries, countries) &&
        listEquals(other.exclude, exclude);
  }

  @override
  int get hashCode {
    return name.hashCode ^
        folder.hashCode ^
        description.hashCode ^
        stages.hashCode ^
        countries.hashCode ^
        exclude.hashCode;
  }
}
