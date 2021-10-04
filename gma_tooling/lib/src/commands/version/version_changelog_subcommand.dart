import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';

class VersionChangelogSubcommand extends GmaCommand with LoggerMixin {
  @override
  String get description => 'Generate changelog from commits';

  @override
  String get name => 'changelog';
}
