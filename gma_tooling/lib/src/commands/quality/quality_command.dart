import 'dart:async';
import 'package:gmat/src/commands/quality/cyclic_dependencies_command.dart';
import 'package:gmat/src/commands/quality/dcm_command.dart';

import '../i_command.dart';
import 'analyze_command.dart';
import 'format_subcommand.dart';

class QualityCommand extends GmaCommand {
  @override
  final name = 'quality';
  
  @override
  final description = 'Analyze quality of selected packages';



  QualityCommand() {
    addSubcommand(AnalyzeSubCommand());
    addSubcommand(DcmSubCommand());
    addSubcommand(AnalyzeCyclicDependenciesSubCommand());
    addSubcommand(FomatSubcommand());
  }

  @override
  FutureOr<void> run() {
   return null;
  }
}


