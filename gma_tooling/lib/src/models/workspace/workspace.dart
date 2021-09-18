import 'package:gmat/src/models/workspace/worksapce_tasks.dart';
import 'package:gmat/src/models/workspace/workspace_extensions.dart';
import 'package:gmat/src/models/workspace/workspace_folder.dart';
import 'package:gmat/src/models/workspace/workspace_launch.dart';
import 'package:gmat/src/models/workspace/workspace_launch_configuration.dart';

class Workspace {
  final List<WorkspaceFolder> folders = [];
  final WorkspaceExtensions extensions = WorkspaceExtensions();
  Map<String, dynamic> settings = {};
  final WorkspaceLaunch launch = WorkspaceLaunch();
  final WorkspaceTasks tasks = WorkspaceTasks();

  void generateWorkspace(String appName, String appFolder,
      {List<String> exclude = const <String>[]}) {
    folders.addAll([
      WorkspaceFolder(name: appName, path: appFolder),
      WorkspaceFolder(name: 'Packages', path: 'packages'),
      WorkspaceFolder(name: 'Plugins', path: 'plugins'),
      WorkspaceFolder(name: 'Docs', path: 'docs'),
      WorkspaceFolder(name: 'Monorepo', path: '.'),
    ]);
    // Settings
    _prepareSettings(exclude: exclude);
    _prepareLauchers(appName);
  }

  void _prepareSettings({List<String> exclude = const <String>[]}) {
    final _exclude = <String, dynamic>{
      '**/build/**': true,
      '**/.git/**': true,
      '**/.idea/**': true,
      '**/.vscode/**': true,
      '**/.dart_tool/**': true,
      '**/.flutter-plugins': true,
      '**/.flutter-plugins-dependencies': true,
      '**/.packages': true,
      '**/.metadata': true,
      '**/*.lock': true,
    };
    for (final item in exclude) {
      _exclude[item] = true;
    }
    settings = {
      'window.zoomLevel': 0,
      'files.autoSave': 'afterDelay',
      'files.exclude': _exclude,
    };
  }

  void _prepareLauchers(String appName) {
    // Fake
    // Prod
    launch.configuration.add(WorkspaceLaunchConfiguration(
        name: 'Debug',
        request: 'launch',
        type: 'dart',
        program: '\${workspaceFolder:$appName}lib/main.dart',
        preLaunchTask: 'change_flavor',
        args: ['--flavor', 'prodin']));
    launch.configuration.add(WorkspaceLaunchConfiguration(
        name: 'Profile',
        request: 'launch',
        type: 'dart',
        program: '\${workspaceFolder:$appName}lib/main.dart',
        preLaunchTask: 'change_flavor',
        args: ['--flavor', 'prodin']));
    launch.configuration.add(WorkspaceLaunchConfiguration(
        name: 'Debug',
        request: 'launch',
        type: 'dart',
        program: '\${workspaceFolder:$appName}lib/main.dart',
        preLaunchTask: 'change_flavor',
        args: ['--flavor', 'prodin']));
  }
}
