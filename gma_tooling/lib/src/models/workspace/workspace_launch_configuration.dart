import 'dart:convert';

import 'package:collection/collection.dart';

class WorkspaceLaunchConfiguration {
  final String name;
  final String request;
  final String  type;
  final String  program;
  final String  preLaunchTask;
  final List<String> args;
  WorkspaceLaunchConfiguration({
    required this.name,
    required this.request,
    required this.type,
    required this.program,
    required this.preLaunchTask,
    required this.args,
  });
  

  WorkspaceLaunchConfiguration copyWith({
    String? name,
    String? request,
    String? type,
    String? program,
    String? preLaunchTask,
    List<String>? args,
  }) {
    return WorkspaceLaunchConfiguration(
      name: name ?? this.name,
      request: request ?? this.request,
      type: type ?? this.type,
      program: program ?? this.program,
      preLaunchTask: preLaunchTask ?? this.preLaunchTask,
      args: args ?? this.args,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'request': request,
      'type': type,
      'program': program,
      'preLaunchTask': preLaunchTask,
      'args': args,
    };
  }

  factory WorkspaceLaunchConfiguration.fromMap(Map<String, dynamic> map) {
    return WorkspaceLaunchConfiguration(
      name: map['name'],
      request: map['request'],
      type: map['type'],
      program: map['program'],
      preLaunchTask: map['preLaunchTask'],
      args: List<String>.from(map['args']),
    );
  }

  String toJson() => json.encode(toMap());

  factory WorkspaceLaunchConfiguration.fromJson(String source) => WorkspaceLaunchConfiguration.fromMap(json.decode(source));

  @override
  String toString() {
    return 'WorkspaceLaunchConfiguration(name: $name, request: $request, type: $type, program: $program, preLaunchTask: $preLaunchTask, args: $args)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;
  
    return other is WorkspaceLaunchConfiguration &&
      other.name == name &&
      other.request == request &&
      other.type == type &&
      other.program == program &&
      other.preLaunchTask == preLaunchTask &&
      listEquals(other.args, args);
  }

  @override
  int get hashCode {
    return name.hashCode ^
      request.hashCode ^
      type.hashCode ^
      program.hashCode ^
      preLaunchTask.hashCode ^
      args.hashCode;
  }
}
