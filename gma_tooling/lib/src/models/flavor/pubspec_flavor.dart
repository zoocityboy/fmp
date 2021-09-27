import 'package:json_annotation/json_annotation.dart';
import 'package:pubspec/pubspec.dart';

part 'pubspec_flavor.g.dart';

@JsonSerializable()
class Flavor {
  final Map<String, DependencyReference>? dependencies;
  final List<String>? assets;

  Flavor({
    this.dependencies,
    this.assets,
  });

  factory Flavor.fromJson(Map json) => _$FlavorFromJson(json);
  Map<String, dynamic> toJson() => _$FlavorToJson(this);
  @override
  String toString() {
    return '''
  dependencies: 
    $dependencies
''';
  }
}
