
import 'dart:async';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';

class AnalyzeCyclicDependenciesSubCommand extends GmaCommand {
  @override
  String get description => 'Run cyclic dependency checker';

  @override
  String get name => 'cyclic';
  
  @override
  String? get command => '';

  @override
  Set<String> arguments = {'analyze'};
 
  @override
  FutureOr<void> run() async {
    await super.run();
    manager.loggerCommandStart();
    await executeOnSelected();
    manager.loggerCommandResults();
    if (failures.isNotEmpty) {
      exitCode = 1;
    } 
  }
  
  @override
  Future<void> executeOnSelected({List<GmaWorker>? addToJobs}) async {
    for (final item in manager.allPackages) {
        if (isVerbose){
        manager.log(
            '           └> ${AnsiStyles.bold.dim(item.name)} checking ',);
        }
        for (final x in item.dependencies.keys.toList()){
          
          final _foundDependency = manager.allPackages.firstWhereOrNull(
            (element) =>
                element.name == x &&
                element.dependencies.keys.contains(item.name));
          final _isFound = _foundDependency != null;
          if (_isFound){
            failures[item] = 1;
          }
          if (isVerbose){
            manager.log(
            '              └> ${AnsiStyles.dim(x)} ${_isFound ? 'x' : '√'}',);
          }
          
        }
        for (final x in item.devDependencies.keys.toList()){
          final _foundDependency = manager.allPackages.firstWhereOrNull(
            (element) =>
                element.name == x &&
                element.devDependencies.keys.contains(item.name));
          if (_foundDependency != null){
            failures[item] = 1;
          }
        }
    }
    return;
  }
}