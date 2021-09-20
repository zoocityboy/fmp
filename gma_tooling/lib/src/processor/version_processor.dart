import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/processor/i_abstract_processor.dart';

/// Version processor
///
/// Get all dependencies from `IEntity` and sync same version of package
/// a cross all packages
///
class VersionProcessor extends AbstractProcessor<String> {
  @override
  void kill() {}

  @override
  FutureOr<String> execute() async {
    throw UnimplementedError();
  }

  @override
  Future<Process> run() {
    throw UnimplementedError();
  }

  @override
  Logger get logger => throw UnimplementedError();
}
