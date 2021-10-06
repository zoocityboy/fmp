import 'package:gmat/src/commands/i_command.dart';

class VersionChangelogSubcommand extends GmaCommand {
  @override
  String get description => 'Generate changelog from commits';

  @override
  String get name => 'changelog';
}
