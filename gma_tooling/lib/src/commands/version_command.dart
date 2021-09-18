import 'dart:async';
import 'dart:io';

import 'package:args/args.dart';

import 'i_command.dart';

class VersionCommand extends GmaCommand {
  @override
  Directory? directory;
  @override
  final name = 'version';
  @override
  final description = 'Version of app';
  @override
  String? get command => null;

  VersionCommand() {
    // we can add command specific arguments here.
    // [argParser] is automatically created by the parent class.

    // argParser.addFlag('switch', abbr: 's');
    argParser.addMultiOption('show', abbr: 's', allowed: ['mapp', 'capp']);
    argParser.addMultiOption('app', abbr: 'a', allowed: ['mapp', 'capp']);
  }

  // [run] may also return a Future.
  @override
  FutureOr<void> run() {
    // [argResults] is set before [run()] is called and contains the flags/options
    // passed to this command.
    // final _parsed = argResults?.wasParsed('root');
    // print('_parsed: $_parsed');
    print(argResults?.arguments);
    print(argResults?.options);
    print(argResults?.rest);
    return Future(() => null);
  }
}
