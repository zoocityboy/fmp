import 'dart:core';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/command_runner.dart';
import 'package:dart_console/dart_console.dart';
import 'package:gmat/src/monitoring/monitoring.dart';
import 'src/command_runner.dart';

export 'src/extensions/dart.dart';
export 'src/extensions/directory_ext.dart';
export 'src/extensions/iterable_ext.dart';
export 'src/extensions/string_ext.dart';
export 'src/extensions/glob.dart';

final monitoring = Monitoring()..enabled = true;
final console = Console();
final currentDir = Directory.current;
void execute(List<String> args) async {
  monitoring.begin();
  try {
    console.clearScreen();
    await KtCommandRunner().run(args);
  } on Exception catch (error) {
    monitoring.finished();
    if (error is! UsageException) rethrow;
    AnsiStyles.red(error.message);
    exit(64); // E
  }
}
