import { BuildFlow } from "./build_flow";
export type BuildStep = (input: BuildFlow) => Thenable<BuildStep | void>;
