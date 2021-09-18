import 'dart:async';
import 'dart:io';
import 'i_command.dart';

class TestCommand extends GmaCommand {
  @override
  Directory? directory;
  @override
  final name = 'test';
  @override
  final description = 'Test package';
  @override
  String? get command => null;

  TestCommand() {
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
    //print(argResults!['packages']);
    return Future(() => null);
  }
}
