
import 'package:gmat/src/commands/i_command.dart';
import 'package:gmat/src/commands/version/version_search_subcommand.dart';
import 'package:gmat/src/commands/version/version_update_subcommand.dart';

class VersionCommand extends SimpleGmaCommand {
  @override
  String get name => 'version';

  @override
  String get description => 'Allow to manipulate with versions of packages';


  VersionCommand() {
    addSubcommand(VersionUpdateSubcommand());
    addSubcommand(VersionSearchSubcommand());
  }

}
