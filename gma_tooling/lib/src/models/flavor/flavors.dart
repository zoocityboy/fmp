import 'package:json_annotation/json_annotation.dart';

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
extension FlavorTypeConverter on FlavorType {
  String get value => toString().split('.').last;
  static List<String> get namedList =>
      FlavorType.values.map((e) => e.value).toList();
  static FlavorType fromJson(String value) {
    switch (value) {
      case 'fakein':
        return FlavorType.fakein;
      case 'fakevn':
        return FlavorType.fakevn;
      case 'fakeph':
        return FlavorType.fakeph;
      case 'fakeid':
        return FlavorType.fakeid;
      case 'prodin':
        return FlavorType.prodin;
      case 'prodvn':
        return FlavorType.prodvn;
      case 'prodph':
        return FlavorType.prodph;
      case 'prodid':
        return FlavorType.prodid;
      default:
        throw Exception('unknown value');
    }
  }
}
