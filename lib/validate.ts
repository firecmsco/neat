import { buildUniforms, buildColorFunctions, buildNoise, fragmentShaderSource } from './src/shaders.js';

const fragShaderSourceCombined = buildUniforms() + buildColorFunctions() + buildNoise() + fragmentShaderSource;

console.log(fragShaderSourceCombined);
