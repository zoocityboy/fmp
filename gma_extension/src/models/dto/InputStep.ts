import { BuildFlow } from "./BuildFlow";
export type BuildStep = (input: BuildFlow) => Thenable<BuildStep | void>;
