import 'dart:async';
import 'dart:io';

import 'package:gmat/src/commands/i_command.dart';

class CiCommand extends ICommand {
  @override
  Directory? directory;
  @override
  final name = 'ci';
  @override
  final description = 'Continious integration';
  @override
  String? get command => null;

  CiCommand() {
    // we can add command specific arguments here.
    // [argParser] is automatically created by the parent class.
    // argParser.addFlag('switch', abbr: 's');
    // argParser.addFlag('name');
  }

  // [run] may also return a Future.
  @override
  FutureOr<void> run() {
    // [argResults] is set before [run()] is called and contains the flags/options
    // passed to this command.
    // // print(argResults);
    return Future(() => null);
  }

  @override
  bool get checkRoot => true;
}
