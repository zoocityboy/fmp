import 'package:json_annotation/json_annotation.dart';

enum Flavors {
  prodin,
  fakein,
  prodvn,
  fakevn,
  prodph,
  fakeph,
  prodid,
  fakeid,
}

extension FlavorsString on Flavors {
  String get value => toString().split('.').last;
  static List<String> get namedList =>
      Flavors.values.map((e) => e.value).toList();
}


enum FlavorType {
  @JsonValue('fakein')
  fakein,
  @JsonValue('fakevn')
  fakevn,
  @JsonValue('fakeph')
  fakeph,
  @JsonValue('fakeid')
  fakeid,
  @JsonValue('prodin')
  prodin,
  @JsonValue('prodvn')
  prodvn,
  @JsonValue('prodph')
  prodph,
  @JsonValue('prodid')
  prodid
}
