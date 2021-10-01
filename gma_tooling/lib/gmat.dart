import 'dart:core';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:args/args.dart';
import 'package:args/command_runner.dart';
import 'package:dart_console/dart_console.dart';
import 'src/command_runner.dart';

export 'src/extensions/dart.dart';
export 'src/extensions/directory_ext.dart';
export 'src/extensions/iterable_ext.dart';
export 'src/extensions/string_ext.dart';
export 'src/extensions/glob.dart';

final console = Console();
final currentDir = Directory.current;

void execute(List<String> args) async {
  try {
    await KtCommandRunner(args).init();
  } on ArgParserException catch (error) {
    AnsiStyles.red(error.message);
  } on Exception catch (error) {
    if (error is! UsageException) rethrow;
    AnsiStyles.red(error.message);
  }
}
