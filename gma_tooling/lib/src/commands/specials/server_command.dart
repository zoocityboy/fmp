import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/server.dart';
import 'package:path/path.dart' as path;

class ServerCommand extends GmaCommand {
  @override
  String get description => 'Run local server';

  @override
  String get name => 'server';

  ServerCommand() {
    argParser.addOption('port', help: 'Start server on port', mandatory: true);
    argParser.addOption('path',
        help: 'Set root folder of your server', mandatory: true);
  }

  @override
  FutureOr<void> run() async {
    final port = int.tryParse(argResults?['port'] ?? '') ?? 9001;
    final _webRoot = path.join(Directory.current.path, argResults?['path']);
    try {
      final _server = await LocalServer.start(
          path: _webRoot, port: port, address: 'localhost');
      print('Server started on port ${_server.urlBase} ${_server.path}');
    } catch (e, _) {
      print('error: $e');
    }
  }
}
