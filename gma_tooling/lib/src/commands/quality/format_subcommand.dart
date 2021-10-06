import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:glob/glob.dart';
import 'package:glob/list_local_fs.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/processor/shell_processor.dart';

class FomatSubcommand extends GmaCommand {
  @override
  String get description => 'Format code of the project.';

  @override
  String get name => 'format';
  @override
  String? get command => 'dart';

  @override
  Set<String> arguments = {'format', '-o', 'write', '.'};

  @override
  FutureOr<void> run() async {
    await super.run();

    manager.loggerCommandStart();
    final allFormatableFiles = Glob('**/*[^.freezed|^.g].dart')
        .listSync(root: Directory.current.path, followLinks: false);

    arguments.add(allFormatableFiles.map((e) => e.path).join(' '));
    final processor = AsyncShellProcessor(command!, arguments.toList(),
        workingDirectory: Directory.current.path, logger: logger);

    print(processor.toString());

    final response = await processor.run();
    response.stdout
        .transform(utf8.decoder)
        .forEach((value) => logger.stdout(value));
    await response.exitCode;
    print(response);
    manager.loggerCommandResults();
    if (failures.isNotEmpty) {
      exitCode = 1;
    }
  }
}
