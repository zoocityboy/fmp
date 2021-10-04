extension StringPascal on String {
  String _upperCaseFirstLetter(String word) {
    return '${word.substring(0, 1).toUpperCase()}${word.substring(1).toLowerCase()}';
  }

  String toPascalCase() {
    return split('_').map(_upperCaseFirstLetter).toList().join();
  }

  
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
