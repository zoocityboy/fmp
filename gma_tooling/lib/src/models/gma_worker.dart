import 'dart:io';

import 'package:gmat/src/models/package.dart';
import 'package:process_runner/process_runner.dart';

class GmaWorker extends WorkerJob {
  GmaWorker(
    this.package,
    List<String> command, {
    String? name,
    Directory? workingDirectory,
    bool printOutput = false,
    bool runInShell = true,
    bool isFastFail = false,
  }) : super(command,
            name: name,
            workingDirectory: workingDirectory,
            printOutput: printOutput,
            runInShell: runInShell,
            failOk: !isFastFail);
  final Package? package;
}
