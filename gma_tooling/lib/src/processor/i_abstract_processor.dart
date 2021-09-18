import 'dart:async';
import 'dart:io';

import 'package:cli_util/cli_logging.dart';

abstract class AbstractProcessor<T> {
  late Logger logger;
  Future<Process> run();
  void kill();
}

abstract class AbstractExecutor<T> {
  late Logger logger;
  Future<T> run();
  void kill();
}
