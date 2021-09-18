import 'dart:async';

import 'package:gmat/src/models/flavors.dart';
import 'i_command.dart';

class FlavorCommand extends GmaCommand {
  @override
  final name = 'flavor';
  @override
  final description = 'Change flavor of selected App';
  @override
  String? get command => null;

  FlavorCommand() {
    argParser.addOption('change',
        abbr: 'c', allowed: FlavorsString.namedList, help: 'Change app flavor');
    argParser.addMultiOption('app',
        abbr: 'a',
        allowed: ['capp', 'mapp'],
        help: 'Select app SuperCupo[capp], SuperCupo Business[mapp]');
  }

  @override
  FutureOr<void> run() {
    return Future(() => null);
  }
}
