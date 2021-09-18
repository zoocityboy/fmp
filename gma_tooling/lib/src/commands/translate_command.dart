import 'dart:async';
import 'dart:io';
import 'i_command.dart';

class TranslateCommand extends GmaCommand {
  @override
  Directory? directory;
  @override
  final name = 'translate';
  @override
  final description = 'Translate package';
  @override
  String? get command => null;

  TranslateCommand() {
    argParser.addMultiOption(
      'packages',
      abbr: 'p',
      help: 'translate selected packages',
      valueHelp: 'multiple packages speratede by comma',
    );
    argParser.addFlag('all',
        help: 'translate all translatable packages', defaultsTo: false);
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
