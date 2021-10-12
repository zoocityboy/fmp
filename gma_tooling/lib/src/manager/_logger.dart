part of 'manager.dart';

mixin _BaseLoggerMixin {
  String formatTitle(String message, {String? prefix = '⌾'}) =>
      AnsiStyles.yellow.bold('$prefix $message'.spaceLeft(0));
  String formatSubtitle(String message, {String? prefix = '⌞'}) =>
      AnsiStyles.cyan.bold('$prefix $message'.spaceLeft(2));
  String formatHeader(String message, {String? prefix = '○'}) =>
      AnsiStyles.dim.bold('$prefix $message'.spaceLeft(4));
  String formatBody(String message, {String? prefix = '⌞'}) =>
      AnsiStyles.dim('$prefix $message'.spaceLeft(4));
  String formatCaption(String message, {String? prefix = '⌞'}) =>
      AnsiStyles.dim('$prefix $message'.spaceLeft(6));
  String formatFailed(String message,
          {String? prefix = '✕', int spaceLeft = 4}) =>
      AnsiStyles.redBright.italic('$prefix $message'.spaceLeft(spaceLeft));
  String formatSuccess(
          {String? message, String? prefix = '✓', int spaceLeft = 4}) =>
      AnsiStyles.greenBright.italic(
          '$prefix ${message ?? 'Successfully finished'}\n'
              .spaceLeft(spaceLeft));
}
mixin _LoggerMixin on _BaseLoggerMixin, _ProcessorMixin {
  Progress? currentProgress;
  void loggerCommandStart(
      {String? command, Set<String>? arguments, String? description}) {
    log('${AnsiStyles.yellow(r'⌾')} ${AnsiStyles.yellow.bold(description ?? '')}');
    log('⌘ ${AnsiStyles.cyan.bold('${command ?? 'flutter'} ${arguments?.join(' ')}')}'
        .spaceLeftCommand());
    if (!isVerbose) {
      currentProgress = logger.progress(
        '⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${selectedPackages.length} packages'
            .spaceLeftStatus(),
      );
      return;
    } else {
      currentProgress = null;
      log('⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${selectedPackages.length} packages'
          .spaceLeftStatus());
    }
  }

  void loggerCommandStarts(
      {required List<MapEntry<String?, List<String>>> commands,
      String? description}) {
    final _command = commands
        .map((e) => '${e.key ?? 'flutter'} ${e.value.join(' ')}')
        .toList()
        .join(' & ');
    log('${AnsiStyles.yellow(r'⌾')} ${AnsiStyles.yellow.bold(description)}');
    log('⌘ ${AnsiStyles.cyan.bold(_command)}'.spaceLeftCommand());
    if (!isVerbose) {
      currentProgress = logProgress(
        '⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${selectedPackages.length} packages'
            .spaceLeftStatus(),
      );
      return;
    } else {
      currentProgress = null;
      log('⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${selectedPackages.length} packages'
          .spaceLeftStatus());
    }
  }

  void loggerCommandFailures() {
    final _message =
        '⌙ ${AnsiStyles.red.bold('FAILED')} (in ${failures.length} packages)'
            .spaceLeftStatus();
    if (currentProgress != null) {
      currentProgress?.finish(message: _message, showTiming: true);
    } else {
      log(_message);
    }
    for (final package in failures.keys) {
      logError(
        '⌙ ${AnsiStyles.redBright(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.redBright.italic(package.directoryName)} (with exit code ${failures[package]?.key})'
            .spaceLeftStatus(),
      );
      logError(
        '⌙ ${AnsiStyles.redBright(failures[package]?.value)}'.spaceLeftStatus(),
      );
    }
  }

  void loggerCommandSuccess({Progress? progress}) {
    final _message = '⌙ ${AnsiStyles.green.bold('SUCCESS')}'.spaceLeftStatus();
    if (currentProgress != null) {
      currentProgress?.finish(showTiming: true, message: _message);
    } else {
      log(_message);
    }
  }

  void loggerCommandResults() {
    if (failures.isNotEmpty) {
      loggerCommandFailures();
    } else {
      loggerCommandSuccess();
    }
  }

  void loggerProgress(GmaWorker job) {
    if (isVerbose) {
      if (job.result.exitCode > 0) {}

      final _progress = AnsiStyles.whiteBright('$percent%');
      if (job.name != job.workingDirectory?.directoryName) {
        // logger.write("\r");
        log('⌙ $_progress ${AnsiStyles.dim.bold(job.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.dim.italic(job.workingDirectory?.directoryName)} ${AnsiStyles.dim('${job.command.join(' ')} running ...')}'
            .spaceLeftProgress());
      } else {
        // logger.write("\r");
        log('⌙ $_progress ${AnsiStyles.dim.bold(job.name)} ${AnsiStyles.dim('${job.command.join(' ')} running ...')}'
            .spaceLeftProgress());
      }
    }
  }

  /// Simple logger of the [message] to the stdout
  @override
  void log(String messsage) {
    logger.stdout(messsage);
  }

  /// Simple error logger of the [message] to the stderr
  @override
  void logError(String message) {
    logger.stderr(message);
  }

  @override
  Progress logProgress(String message) {
    return logger.progress(message);
  }
}
