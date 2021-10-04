import 'package:ansi_styles/ansi_styles.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/models/package.dart';

typedef LoggerStatus = Map<Package, String>;
mixin LoggerMixin on GmaCommand {
  
  Progress? loggerCommandStart() {
  
    manager.log(
        '${AnsiStyles.yellow(r'⌾')} ${AnsiStyles.yellow.bold(description)}');
    manager.log(
        '   ⌘ ${AnsiStyles.cyan.bold('${command ?? 'flutter'} ${arguments.join(' ')}')}');
    if (!isVerbose) {
      return logger.progress(
        '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${manager.selectedPackages.length} packages',
      );
    } else {
      manager.log(
          '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${manager.selectedPackages.length} packages');
    }
    return null;
  }
  

  void loggerCommandFailures({Progress? progress}) {
    final _message =
        '       ⌙ ${AnsiStyles.red.bold('FAILED')} (in ${failures.length} packages)';
    if (progress != null) {
      progress.finish(message: _message, showTiming: true);
    } else {
      manager.log(_message);
    }
    for (final package in failures.keys) {
      manager.log(
            '           ⌙ ${AnsiStyles.redBright(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.redBright.italic(package.directoryName)} (with exit code ${failures[package]})',
        );
    }
  }

  void loggerCommandSuccess({Progress? progress}) {
    final _message = '       ⌙ ${AnsiStyles.green.bold('SUCCESS')}';
    if (progress != null) {
      progress.finish(showTiming: true, message: _message);
    } else {
      manager.log(_message);
    }
    
  }

  void loggerCommandResults(
      {required Map<Package, int> failures, Progress? progress}) {
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }
}

mixin LoggerMultipleMixin on GmaMultipleCommand {
  Progress? loggerCommandStarts() {
    final _command = commands
        .map((e) => '${e.key ?? 'flutter'} ${e.value.join(' ')}')
        .toList()
        .join(' & ');
    manager.log(
        '${AnsiStyles.yellow(r'⌾')} ${AnsiStyles.yellow.bold(description)}');
    manager.log('   ⌘ ${AnsiStyles.cyan.bold(_command)}');
    if (!isVerbose) {
      return logger.progress(
        '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${manager.selectedPackages.length} packages',
      );
    } else {
      manager.log(
          '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${manager.selectedPackages.length} packages');
    }
    return null;
  }
}
