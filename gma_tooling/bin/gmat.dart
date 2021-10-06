import 'dart:async';
import 'dart:io';

import 'package:gmat/gmat.dart' as koyal_tools;

void main(List<String> arguments) {
 runZonedGuarded(() {
    ProcessSignal.sigint.watch().listen((event) {
      koyal_tools.killDartProcess();
    });
   koyal_tools.execute(arguments);
 }, (e, s) => print('Oh noes! $e $s'));
}
