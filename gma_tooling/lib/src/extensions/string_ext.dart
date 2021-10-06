import 'package:gmat/src/constants.dart';

extension StringPascal on String {
  String _upperCaseFirstLetter(String word) {
    return '${word.substring(0, 1).toUpperCase()}${word.substring(1).toLowerCase()}';
  }

  String toPascalCase() {
    return split('_').map(_upperCaseFirstLetter).toList().join();
  }
  String spaceLeft(int count) => '${' ' * count} $this';
  String spaceLeftCommand() => spaceLeft(Padding.command);
  String spaceLeftStatus() => spaceLeft(Padding.status);
  String spaceLeftProgress() => spaceLeft(Padding.progress);
}


extension ProcessResultString on String {
  String stdOutFiltred() {
    return split('\n')
        // .where(
        //   (line) => !line.contains(
        //     'Waiting for another flutter command to release the startup lock',
        //   ),
        // )
        .where((line) => !line.contains('Cleaning Xcode'))
        .where((line) => line.trim().isNotEmpty)
        .toList()
        .join('\n');
  }

  String stdErrFiltred() {
    return split('\n')
        // .where(
        //   (line) => !line.contains(
        //     'Waiting for another flutter command to release the startup lock',
        //   ),
        // )
        .where((line) => !line.contains('Cleaning Xcode'))
        .where((line) => line.trim().isNotEmpty)
        .toList()
        .join('\n');
  }
}
