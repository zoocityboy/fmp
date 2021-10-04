import 'dart:async';

import 'i_command.dart';

class ExecCommand extends GmaCommand {
  @override
  final name = 'exec';
  @override
  final description = 'Execute external commands';

  ExecCommand() {
    // we can add command specific arguments here.
    // [argParser] is automatically created by the parent class.
    // argParser.addFlag('switch', abbr: 's');
    // argParser.addFlag('name');
  }

  // [run] may also return a Future.
  @override
  FutureOr<void> run() {
    return Future(() => null);
  }
}
