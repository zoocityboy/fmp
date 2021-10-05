import 'dart:core';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/command_runner.dart';
import 'package:gmat/src/exceptions/not_found_packages.dart';
import 'package:gmat/src/exceptions/not_found_pubspec.dart';
import 'package:gmat/src/exceptions/not_initialized_exception.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';

import 'src/commands/command_runner.dart';

export 'src/extensions/dart.dart';
export 'src/extensions/directory_ext.dart';
export 'src/extensions/iterable_ext.dart';
export 'src/extensions/string_ext.dart';
export 'src/extensions/glob.dart';

void execute(List<String> args) async {
  await GmaCommandRunner().run(args).catchError((error) {
    if (error is NotInitializedException) {
      print(ListString.dividerTop);
      print('GMAT is not initialized yet. run command: gmat bootstrap init');
      print(ListString.dividerBottom);
      exit(65);
    }
    switch (error.runtimeType) {
      case NotInitializedException:
        exit(64);
      case NotFoundPackages:
        exit(64);
      case NotFoundPubspec:
        exit(64);
    }
    if (error is! UsageException) throw error;
    
    AnsiStyles.red(error.message);
    exit(64);
  });
  
  
}
