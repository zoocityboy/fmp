class NodeJsNotFoundException implements Exception {
  const NodeJsNotFoundException(this.message);
  final String message;
  @override
  String toString() => 'NodeJsNotFoundException: $message';
}
