import 'package:ansi_styles/ansi_styles.dart';

class MonitoringEvent {
  final String? id;
  final String? message;
  final DateTime? start;
  final DateTime? end;
  final List<MonitoringEvent> steps = [];
  final int tabCount;
  MonitoringEvent({
    this.id,
    this.message,
    this.start,
    this.end,
    this.tabCount = 0,
  });


  MonitoringEvent copyWith({
    String? id,
    String? message,
    DateTime? start,
    DateTime? end,
    int? tabCount,
  }) {
    return MonitoringEvent(
      id: id ?? this.id,
      message: message ?? this.message,
      start: start ?? this.start,
      end: end ?? this.end,
      tabCount: tabCount ?? this.tabCount,
    );
  }

  Duration? get difference => end?.difference(start!);
  int get seconds => difference?.inSeconds ?? 0;

  @override
  String toString() => 'MonitoringEvent(id: $id, start: $start, end: $end)';

  void startReport() =>  print(AnsiStyles.cyan('${getTabs(tabCount)} $message -> started'));
  void endReport() =>  print(AnsiStyles.cyan('${getTabs(tabCount)} $message -> finished $difference'));
  String getTabs(int count) => List.generate(count, (index) => '\t').join();

  MonitoringEvent addStep(String? message){
    final _step = MonitoringEvent(message: message, tabCount: tabCount + 1);
    steps.add(_step);
    _step.startReport();
    return _step;
  }
  void endStep(MonitoringEvent event){
    final _step = steps.firstWhere((element) => element.id ==event.id);
    _step.endReport();
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is MonitoringEvent &&
        other.id == id &&
        other.message == message &&
        other.start == start &&
        other.end == end;
  }

  @override
  int get hashCode => id.hashCode ^ start.hashCode ^ end.hashCode;
}
