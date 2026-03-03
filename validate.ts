import { buildUniforms, buildColorFunctions, buildNoise, fragmentShaderSource } from './lib/src/shaders.ts';

const fragShaderSourceCombined = buildUniforms() + buildColorFunctions() + buildNoise() + fragmentShaderSource;

console.log(fragShaderSourceCombined);
