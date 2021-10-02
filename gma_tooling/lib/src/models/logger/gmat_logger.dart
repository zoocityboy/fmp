import 'dart:async';

import 'package:cli_util/cli_logging.dart';
import 'dart:io' as io;

class GmatStandardLogger implements Logger {
  @override
  Ansi ansi;

  GmatStandardLogger({Ansi? ansi})
      : ansi = ansi ?? Ansi(Ansi.terminalSupportsAnsi);

  @override
  bool get isVerbose => false;

  Progress? _currentProgress;

  @override
  void stderr(String message) {
    _cancelProgress();

    io.stderr.writeln(message);
  }

  @override
  void stdout(String message) {
    _cancelProgress();

    print(message);
  }

  @override
  void trace(String message) {}

  @override
  void write(String message) {
    _cancelProgress();

    io.stdout.write(message);
  }

  @override
  void writeCharCode(int charCode) {
    _cancelProgress();

    io.stdout.writeCharCode(charCode);
  }

  void _cancelProgress() {
    var progress = _currentProgress;
    if (progress != null) {
      _currentProgress = null;
      progress.cancel();
    }
  }

  @override
  Progress progress(String message) {
    _cancelProgress();

    var progress = ansi.useAnsi
        ? GmatProgress(ansi, message)
        : SimpleProgress(this, message);
    _currentProgress = progress;
    return progress;
  }

  @override
  @Deprecated('This method will be removed in the future')
  void flush() {}
}

class GmatVerboseLogger extends VerboseLogger {
  GmatVerboseLogger({Ansi? ansi, bool logTime = true})
      : super(ansi: ansi, logTime: logTime);
  @override
  Progress progress(String message) => GmatProgress(ansi, message);
}

class GmatProgress extends Progress {
  static const List<String> kAnimationItems = [
    '⠋',
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏'
  ];

  final Ansi ansi;

  late final Timer _timer;

  GmatProgress(this.ansi, String message) : super(message) {
    _timer = Timer.periodic(Duration(milliseconds: 80), (t) {
      _updateDisplay();
    });
    io.stdout.write('$message...  '.padRight(40));
    _updateDisplay();
  }

  @override
  void cancel() {
    if (_timer.isActive) {
      _timer.cancel();
      _updateDisplay(cancelled: true);
    }
  }

  @override
  void finish({String? message, bool showTiming = false}) {
    if (_timer.isActive) {
      _timer.cancel();
      _updateDisplay(isFinal: true, message: message, showTiming: showTiming);
    }
  }

  void _updateDisplay(
      {bool isFinal = false,
      bool cancelled = false,
      String? message,
      bool showTiming = false}) {
    var char = kAnimationItems[_timer.tick % kAnimationItems.length];
    if (isFinal || cancelled) {
      char = '';
    }
    io.stdout.write('${ansi.backspace}$char');
    if (isFinal || cancelled) {
      if (message != null) {
        io.stdout.write(message.isEmpty ? ' ' : message);
      } else if (showTiming) {
        var time = (elapsed.inMilliseconds / 1000.0).toStringAsFixed(1);
        io.stdout.write('${time}s');
      } else {
        io.stdout.write(' ');
      }
      io.stdout.writeln();
    }
  }
}
