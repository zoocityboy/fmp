import 'dart:async';

/// Processor should run all the necessary commands
/// above the list of Entities
///
/// List<IEntity> [app, package or plugin]
class Processor {
  final int concurency;
  Processor({this.concurency = 5});

  void runSync() {}
  FutureOr<void> runAsync() {}
}
