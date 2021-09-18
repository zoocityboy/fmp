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
