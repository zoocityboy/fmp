part of 'manager.dart';

mixin _FiltersMixin on _GmaManager {
  /// Select packages where was something changed.
  void applyAffectedOnly() {}

  ///
  void applyExcludeExamples() {
    if (includeExamples) return;
    final glob =
        GlobCreate.create('**/example**', currentDirectoryPath: directory.path);

    selectedPackages = selectedPackages
        .where((package) => !glob.matches(package.directory.path))
        .sortByName()
        .toSet();
  }

  /// Apply filter for packages with `koyal_flavor` dependency in pubspec.yaml
  void applyFlavorFilter({List<String>? apps}) {
    selectedPackages =
        selectedPackages.where((p) => p.hasFlavor == true).toSet();
    if (apps != null) {
      selectedPackages = selectedPackages
          .where((app) => apps.any((element) => element == app.name))
          .sortByName()
          .toSet();
    }
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dev_dependencies:`
  void applyDevDependencies({List<String>? dependsOn}) {
    if (dependsOn == null) return;
    selectedPackages = selectedPackages
        .where((element) =>
            dependsOn.any((e) => element.devDependencies.containsKey(e)))
        .sortByName()
        .toSet();
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dependencies:`
  void applyDependencies({List<String>? dependsOn}) {
    if (dependsOn == null) return;
    selectedPackages = selectedPackages
        .where((element) =>
            dependsOn.any((e) => element.dependencies.containsKey(e)))
        .sortByName()
        .toSet();
  }

  /// Apply package filter where package contains `dependsOn` in
  /// `dependencies:` or `dev_dependencies:`
  void applyAllDependencies({List<String>? dependsOn}) {
    if (dependsOn == null) return;
    selectedPackages = selectedPackages
        .where((element) => dependsOn.any((e) =>
            element.dependencies.containsKey(e) ||
            element.devDependencies.containsKey(e)))
        .sortByName()
        .toSet();
  }
}
