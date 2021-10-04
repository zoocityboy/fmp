import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';

abstract class AbstractProcessor<T> {
  Logger get logger;
  Future<Process> run();
}

abstract class AbstractExecutor<T> {
  Logger get logger;
  Future<T> run();
}
