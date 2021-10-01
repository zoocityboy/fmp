
import 'package:ansi_styles/ansi_styles.dart';
import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/manager.dart';

mixin LoggerMixin on GmaCommand {
  GmaManager get gmaManager => workspace.manager;
  Progress? loggerCommandStart() {
    gmaManager.log(
        '${AnsiStyles.yellow(r'⌾')} ${AnsiStyles.yellow.bold(description)}');
    gmaManager.log(
        '   ⌘ ${AnsiStyles.cyan.bold('${command ?? 'flutter'} ${arguments.join(' ')}')}');
    if (!isVerbose) {
      return logger.progress(
        '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${gmaManager.filtered.length} packages',
      );
    } else {
      gmaManager.log(
          '       ⌙ ${AnsiStyles.blueBright.bold('PROCESSING')} of ${gmaManager.filtered.length} packages');
    }
    return null;
  }

  void loggerCommandFailures({Progress? progress}) {
    if (!isVerbose) {
          gmaManager.log('\n');
        }
    final _message =
        '       ⌙ ${AnsiStyles.red.bold('FAILED')} (in ${failures.length} packages)';
    if (progress != null) {
      progress.finish(message: _message, showTiming: true);
    } else {
      gmaManager.log(_message);
    }
    for (final package in failures.keys) {
      if (package.name != package.directoryName) {
        gmaManager.log(
            '           ⌙ ${AnsiStyles.redBright(package.name)} ${AnsiStyles.dim('in folder')} ${AnsiStyles.redBright.italic(package.directoryName)} (with exit code ${failures[package]})',
        );
      } else {
        gmaManager.log(
            '           ⌙ ${AnsiStyles.redBright(package.name)} (with exit code ${failures[package]})',
        );
      }
    }
  }

  void loggerCommandSuccess({Progress? progress}) {
    final _message = '       ⌙ ${AnsiStyles.green.bold('SUCCESS')}';
    if (progress != null) {
      progress.finish(showTiming: true);
    }
    logger.stdout(_message);
  }
}
