import 'dart:core';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/command_runner.dart';
import 'package:gmat/src/exceptions/nodejs_not_found.dart';
import 'package:gmat/src/exceptions/not_found_packages.dart';
import 'package:gmat/src/exceptions/not_found_pubspec.dart';
import 'package:gmat/src/exceptions/not_initialized_exception.dart';
import 'package:gmat/src/extensions/iterable_ext.dart';
import 'package:gmat/src/extensions/string_ext.dart';

import 'src/commands/command_runner.dart';

export 'src/extensions/dart.dart';
export 'src/extensions/directory_ext.dart';
export 'src/extensions/iterable_ext.dart';
export 'src/extensions/string_ext.dart';
export 'src/extensions/glob.dart';
void killDartProcess() {
  stdout.writeAll([
    '\n\n',
    
    AnsiStyles.dim
        .italic('⌘ GMAT was closed by user. Killing all sub processes.')
        .spaceLeftCommand(),
    '\n',
    
  ]);

  if (Platform.isWindows) {
    Process.runSync('taskkill', ['/F', '/IM', 'dart.exe']);
  } else if (Platform.isLinux || Platform.isMacOS) {
    Process.runSync('killall', ['-9', 'dart']);
  }
}
void execute(List<String> args) async {
  await GmaCommandRunner().run(args).catchError((error) {
    switch (error.runtimeType) {
      case NodeJsNotFoundException:
        print(
            '⌙ ${AnsiStyles.redBright('${error.message}')}'.spaceLeftCommand());
        exitCode = 0;
        break;
      case NotInitializedException:
        print(ListString.dividerTop);
        print('GMAT is not initialized yet. run command: gmat bootstrap init');
        print(ListString.dividerBottom);
        
        exitCode = 64;
        break;
      case NotFoundPackages:
        print('$error');
        exitCode = 64;
        break;

      case NotFoundPubspec:
        print('$error');
        exitCode = 64;
        break;
      case UsageException:
        print('$error');
        exitCode = 1;
        break;
      default:
        print(AnsiStyles.red(error.message));
        exitCode = 64;
        break;
    }
    killDartProcess();
    exit(exitCode);  
  });
  killDartProcess();
  
}
