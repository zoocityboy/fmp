import 'dart:math';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/monitoring/monitoring_event.dart';

class Monitoring {
  bool enabled = false;
  final Set<MonitoringEvent> _events = {};

  void begin() {
    print(AnsiStyles.grey('🔆 [Monitoring] is running'));
  }

  void finished() {
    print(AnsiStyles.grey('🌙 Monitoring finished'));
  }

  String _generateId() {
    var rng = Random();
    var l = List.generate(5, (_) => rng.nextInt(99));
    return l.join('');
  }

  MonitoringEvent? createEvent({String? message}) {
    if (!enabled) return null;
    var id = _generateId();
    final event =
        MonitoringEvent(id: id, message: message, start: DateTime.now());
    _events.add(event);
    event.startReport();
    return event;
  }

  MonitoringEvent? end(MonitoringEvent? event) {
    if (!enabled || event == null) return null;
    var eventCopy = event.copyWith(end: DateTime.now());
    _events.removeWhere((element) => element.id == eventCopy.id);
    _events.add(eventCopy);
    eventCopy.endReport();
    return eventCopy;
  }

  String? report() {
    if (!enabled) return null;
    var sum = 0;
    print(AnsiStyles.rgb(255, 192, 203)('🕑 [Monitoring] all -> $_events'));
    if (_events.isNotEmpty) {
      sum = _events.map((e) => e.seconds).reduce((a, b) => a + b);
    }
    return AnsiStyles.rgb(255, 192, 203)('🕑 [Monitoring] all -> ${sum}s');
  }
}
