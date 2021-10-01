import 'dart:async';
import 'dart:io';
import 'package:ansi_styles/ansi_styles.dart';
import 'package:gmat/src/mixins/logger_mixin.dart';
import 'package:gmat/src/models/config/config_app.dart';
import 'package:gmat/src/models/flavor/flavors.dart';
import 'package:gmat/src/models/package.dart';
import '../constants.dart';
import 'i_command.dart';

class FlavorCommand extends GmaCommand with LoggerMixin {
  @override
  final name = 'flavor';
  
  @override
  final description = 'Change flavor of selected App';
  
  @override
  String? get command => null;
  
  
  @override
  bool get shouldUseFilter => false;
  
  FlavorCommand() {
    argParser.addMultiOption(Constants.argApp,
        allowed: ['self_care', 'mapp'],
        allowedHelp: {
          'self_care': 'Customer application [CAPP]',
          'mapp': 'Merchant application [MAPP]',
        },
        defaultsTo: ['self_care'],
        callback: (mode) => print('selected $mode'));
    argParser.addOption(Constants.argFlavor,
        allowed: FlavorTypeConverter.namedList,
        mandatory: true,
        callback: (mode) => print('with $mode'));
    argParser.addFlag('force-reload',
        abbr: 'r',
        help: 'Force reload flavor even if is same like current',
        negatable: false);
  }

  @override
  FutureOr<void> run() async {
    await super.run();
    workspace.manager.applyFlavorFilter(apps: argResults?[Constants.argApp]);
    final progress = loggerCommandStart();
    await executeOnSelected();
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
      exitCode = 1;
    } else {
      loggerCommandSuccess(progress: progress);
    }
    return null;
  }

  @override
  Future<void> executeOnSelected() async {
    FlavorType flavorType =
        FlavorTypeConverter.fromJson(argResults![Constants.argFlavor]);
    final pool = workspace.manager.createPool;
    await pool.forEach<Package, void>(workspace.manager.filtered,
        (package) async {
      if (isFastFail && failures.isNotEmpty) {
        return Future.value();
      }
      loggerProgress(
          'changing flavor to ${AnsiStyles.white.bold(flavorType.value)}',
          package);
      try {
        await package.changeFlavor(flavorType);
      } catch (e) {
        failures[package] = 64;
        if (!isVerbose) {
          workspace.manager.log('\n');
        }
        workspace.manager.log(
            '         -> ${AnsiStyles.redBright.bold(package.name)}  ${AnsiStyles.dim.italic(e.toString())}');
      }
    }).drain<void>();
    customArgs = {'pub', 'get'};
    await super.executeOnSelected();
  }
}

class CustomCommand extends GmaCommand with LoggerMixin {
  final String customName, customDescription;

  @override
  String get description => customDescription;

  @override
  String get name => customName;

  @override
  String? get command => null;

  @override
  bool get shouldUseFilter => false;

  CustomCommand(GmaApp app,
      {required this.customName, required this.customDescription})
      : super() {
    if (app.stages.isNotEmpty) {
      argParser.addOption(
        'stage',
        abbr: 's',
        allowed: app.stages,
      );
    }
    if (app.countries.isNotEmpty) {
      argParser.addOption(
        'country',
        abbr: 'c',
        allowed: app.countries,
      );
    }
  }

  @override
  FutureOr<void> run() async {
    await super.run();
    workspace.manager.applyFlavorFilter();

    final progress = loggerCommandStart();
    await executeOnSelected();
    if (failures.isNotEmpty) {
      loggerCommandFailures(progress: progress);
      exitCode = 1;
    } else {
      loggerCommandSuccess(progress: progress);
    }
  }

  @override
  Future<void> executeOnSelected() async {}
}
