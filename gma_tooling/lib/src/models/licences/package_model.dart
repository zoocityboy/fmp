class PackageModel {
  String name;
  String? version, repo, licence;
  PackageModel({
    required this.name,
    this.version,
    this.repo,
    this.licence,
  });

  PackageModel copyWith({
    String? name,
    String? version,
    String? repo,
    String? licence,
  }) {
    return PackageModel(
      name: name ?? this.name,
      licence: licence ?? this.licence,
      repo: repo ?? this.repo,
      version: version ?? this.version,
    );
  }

  @override
  String toString() =>
      'PackageModel(name: $name, version: $version, licence: $licence, repo: $repo)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is PackageModel &&
        other.name == name &&
        other.licence == licence;
  }

  @override
  int get hashCode => name.hashCode ^ licence.hashCode;

  List<String> get asCsvRowItem =>
      <String>[name, version ?? '', licence ?? '', repo ?? ''];
}
