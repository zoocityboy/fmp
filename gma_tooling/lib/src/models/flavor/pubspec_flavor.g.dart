// GENERATED CODE - DO NOT MODIFY BY HAND

// ignore_for_file: implicit_dynamic_parameter, non_constant_identifier_names, type_annotate_public_apis, omit_local_variable_types, unnecessary_this

part of 'pubspec_flavor.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Flavor _$FlavorFromJson(Map json) => Flavor(
      dependencies: (json['dependencies'] as Map?)?.map(
        (k, e) => MapEntry(k as String, DependencyReference.fromJson(e)),
      ),
      assets:
          (json['assets'] as List<dynamic>?)?.map((e) => e as String).toList(),
    );

Map<String, dynamic> _$FlavorToJson(Flavor instance) {
  final val = <String, dynamic>{};

  void writeNotNull(String key, dynamic value) {
    if (value != null) {
      val[key] = value;
    }
  }

  writeNotNull('dependencies',
      instance.dependencies?.map((k, e) => MapEntry(k, e.toJson())));
  writeNotNull('assets', instance.assets);
  return val;
}
