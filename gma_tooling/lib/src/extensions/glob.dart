import 'package:glob/glob.dart';
import 'package:path/path.dart' as p;

extension GlobCreate on Glob {
  static Glob create(
    String pattern, {
    p.Context? context,
    bool recursive = false,
    bool? caseSensitive,
    required String currentDirectoryPath,
  }) {
    context ??= p.Context(
      style: p.context.style,
      current: currentDirectoryPath,
    );
    return Glob(
      pattern,
      context: context,
      recursive: recursive,
      caseSensitive: caseSensitive,
    );
  }
}
