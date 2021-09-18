import 'dart:convert';

import 'package:collection/collection.dart';

class ConfigApp {
  String name;
  String folder;
  String? description;
  bool preSelected;
  List<String> stages;
  List<String> countries;
  List<String> exclude;
  ConfigApp({
    required this.name,
    required this.folder,
    required this.preSelected,
    required this.stages,
    required this.countries,
    this.description,
    this.exclude = const [],
  });


  ConfigApp copyWith({
    String? name,
    String? folder,
    String? description,
    bool? preSelected,
    List<String>? stages,
    List<String>? countries,
    List<String>? exclude,
  }) {
    return ConfigApp(
      name: name ?? this.name,
      folder: folder ?? this.folder,
      description: description ?? this.description,
      preSelected: preSelected ?? this.preSelected,
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
      'preSelected': preSelected,
      'stages': stages,
      'countries': countries,
      'exclude': exclude,
    };
  }

  factory ConfigApp.fromMap(Map<String, dynamic> map) {
    return ConfigApp(
      name: map['name'],
      folder: map['folder'],
      description: map['description'],
      preSelected: map['preSelected'],
      stages: List<String>.from(map['stages']),
      countries: List<String>.from(map['countries']),
      exclude: List<String>.from(map['exclude']),
    );
  }

  String toJson() => json.encode(toMap());

  factory ConfigApp.fromJson(String source) => ConfigApp.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ConfigApp(name: $name, folder: $folder, description: $description, preSelected: $preSelected, stages: $stages, countries: $countries, exclude: $exclude)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;
  
    return other is ConfigApp &&
      other.name == name &&
      other.folder == folder &&
      other.description == description &&
      other.preSelected == preSelected &&
      listEquals(other.stages, stages) &&
      listEquals(other.countries, countries) &&
      listEquals(other.exclude, exclude);
  }

  @override
  int get hashCode {
    return name.hashCode ^
      folder.hashCode ^
      description.hashCode ^
      preSelected.hashCode ^
      stages.hashCode ^
      countries.hashCode ^
      exclude.hashCode;
  }
}
