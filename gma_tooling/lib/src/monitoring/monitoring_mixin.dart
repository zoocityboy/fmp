import 'package:args/command_runner.dart';
import 'package:gmat/src/monitoring/monitoring_event.dart';
import 'package:gmat/src/processor/i_abstract_processor.dart';

mixin ProcessorMonitoring<T> on AbstractProcessor<T> {
  late MonitoringEvent parent;
  late MonitoringEvent _event;
  void begin(String? message) {
    _event = MonitoringEvent(
        message: message ?? runtimeType.toString(), tabCount: 1);
  }

  MonitoringEvent addStep(String message) {
    return _event.addStep(message);
  }

  void endStep(MonitoringEvent step) {
    _event.endStep(step);
  }

  void end() {
    _event.endReport();
  }
}
mixin CommandMonitoring<T> on Command<T> {
  late MonitoringEvent monitoringEvent;
  void begin(String? message) {
    monitoringEvent = MonitoringEvent(
        message: message ?? runtimeType.toString(), tabCount: 1);
  }

  MonitoringEvent addStep(String message) {
    return monitoringEvent.addStep(message);
  }

  void endStep(MonitoringEvent step) {
    monitoringEvent.endStep(step);
  }

  void end() {
    monitoringEvent.endReport();
  }
}
