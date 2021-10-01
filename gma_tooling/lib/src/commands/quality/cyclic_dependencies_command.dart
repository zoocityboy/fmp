
import 'dart:async';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/gmat.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/package.dart';

class AnalyzeCyclicDependenciesSubCommand extends GmaCommand with LoggerMixin {
  @override
  String get description => 'Run cyclic dependency checker';

  @override
  String get name => 'cyclic';
  
  @override
  String? get command => '';

  @override
  Set<String> arguments = {'analyze'};
 
  AnalyzeCyclicDependenciesSubCommand(){
    argParser.addOption('package', abbr: 'p');
    argParser.addOption('filter', abbr: 'f');
  }
  @override
  FutureOr<void> run() async {
    await super.run();
    final progress = loggerCommandStart();
    await executeOnSelected();
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
      exitCode = 1;
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }
  @override
  void loggerProgress(String commnadName, Package package) {
    if (isVerbose) {
      if (package.name != package.directoryName) {
        workspace.manager.log(
            '         -> ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.dim.italic(package.directoryName)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      } else {
        workspace.manager.log(
            '         -> ${AnsiStyles.dim.bold(package.name)} ${AnsiStyles.dim('$commnadName ${arguments.join(' ')} running ...')}');
      }
    }
  }
  @override
  Future<void> executeOnSelected() async {
    for (final item in workspace.manager.packages) {
        if (isVerbose){
        workspace.manager.log(
            '           └> ${AnsiStyles.bold.dim(item.name)} checking ',);
        }
        for (final x in item.dependencies.keys.toList()){
          final _foundDependency = workspace.manager.packages.firstWhereOrNull(
            (element) =>
                element.name == x &&
                element.dependencies.keys.contains(item.name));
          final _isFound = _foundDependency != null;
          if (_isFound){
            failures[item] = 1;
          }
          if (isVerbose){
            workspace.manager.log(
            '              └> ${AnsiStyles.dim(x)} ${_isFound ? 'x' : '√'}',);
          }
          
        }
        for (final x in item.devDependencies.keys.toList()){
          final _foundDependency = workspace.manager.packages.firstWhereOrNull(
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