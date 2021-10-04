import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';

import 'i_abstract_processor.dart';

class ShellProcessor extends AbstractProcessor<void> {
  ShellProcessor(
    this.executable,
    this.args, {
    this.workingDirectory,
    this.runInShell = true,
    required this.logger,
  });
  final String executable;
  final String? workingDirectory;
  final List<String> args;
  final bool runInShell;
  @override
  final Logger logger;

  @override
  Future<Process> run() {
    return Process.start(executable, args,
        workingDirectory: workingDirectory, runInShell: runInShell);
  }

  @override
  String toString() => 'running: ${args.join(' ')}';

}

class AsyncShellProcessor extends AbstractProcessor<ProcessResult> {
  AsyncShellProcessor(
    this.executable,
    this.args, {
    this.workingDirectory,
    this.runInShell = true,
    required this.logger,
  });
  final String executable;
  final String? workingDirectory;
  final List<String> args;
  final bool runInShell;
  @override
  final Logger logger;

  @override
  Future<Process> run() {
    return Process.start(executable, args,
        workingDirectory: workingDirectory, runInShell: runInShell);
  }

  @override
  String toString() => 'running: ${args.join(' ')}';

}
