import 'dart:convert';
import 'dart:core';
import 'package:collection/collection.dart';
import 'package:yaml/yaml.dart';

class GmaApp {
  String name;
  String folder;
  String? flavor;
  String? description;
  List<String> stages;
  List<String> countries;
  List<String> exclude;
  int? expressPort;
  GmaApp({
    required this.name,
    required this.folder,
    this.flavor,
    this.stages = const [],
    this.countries = const [],
    this.description,
    this.exclude = const [],
    this.expressPort,
  });

  List<String>? get flavors => stages
      .map((e) => countries.map((e1) => '$e$e1'))
      .expand((element) => element)
      .toList();
  Map<String, String> get allowHelp => {
        for (var stage in stages)
          stage: countries.map((d) => '$stage$d').join(',')
      };
      
      

  GmaApp copyWith({
    String? name,
    String? folder,
    String? flavor,
    String? description,
    List<String>? stages,
    List<String>? countries,
    List<String>? exclude,
    int? expressPort,
  }) {
    return GmaApp(
      name: name ?? this.name,
      folder: folder ?? this.folder,
      flavor: flavor ?? this.flavor,
      description: description ?? this.description,
      stages: stages ?? this.stages,
      countries: countries ?? this.countries,
      exclude: exclude ?? this.exclude,
      expressPort: expressPort ?? this.expressPort,
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
      'expressPort': expressPort,
    };
  }

  factory GmaApp.fromMap(Map<String, dynamic> map) {
    return GmaApp(
      name: map['name'],
      folder: map['folder'],
      flavor: map['flavor'],
      description: map['description'],
      stages: List<String>.from(map['stages'] ?? []),
      countries: List<String>.from(map['countries'] ?? []),
      exclude: List<String>.from(map['exclude_packages'] ?? []),
      expressPort: map['expressPort']
    );
  }

  factory GmaApp.fromYaml(YamlMap map) {
    return GmaApp(
      name: map['name'],
      folder: map['folder'],
      flavor: map['flavor'],
      description: map['description'],
      stages: List<String>.from(map['stages']),
      countries: List<String>.from(map['countries']),
      exclude: List<String>.from(map['exclude_packages']),
      expressPort: map['expressPort']
    );
  }

  String toJson() => json.encode(toMap());

  factory GmaApp.fromJson(String source) => GmaApp.fromMap(json.decode(source));

  @override
  String toString() {
    return '''
    ConfigApp(
      name: $name
      folder: $folder
      flavor: $flavor
      description: $description
      stages: $stages
      countries: $countries 
      exclude: $exclude,
      expressPort: $expressPort
    )''';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is GmaApp &&
        other.name == name &&
        other.folder == folder &&
        other.flavor == flavor &&
        other.description == description &&
        listEquals(other.stages, stages) &&
        listEquals(other.countries, countries) &&
        listEquals(other.exclude, exclude);
  }

  @override
  int get hashCode {
    return name.hashCode ^
        folder.hashCode ^
        flavor.hashCode ^
        description.hashCode ^
        stages.hashCode ^
        countries.hashCode ^
        exclude.hashCode;
  }
}
