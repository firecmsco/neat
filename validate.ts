import { buildFragUniforms, buildColorFunctions, buildNoise, fragmentShaderSource } from './lib/src/shaders.ts';

const fragShaderSourceCombined = buildFragUniforms() + buildColorFunctions() + buildNoise() + fragmentShaderSource;

console.log(fragShaderSourceCombined);
