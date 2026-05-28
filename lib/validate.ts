import { buildFragUniforms, buildColorFunctions, buildNoise, fragmentShaderSource } from './src/shaders.js';

const fragShaderSourceCombined = buildFragUniforms() + buildColorFunctions() + buildNoise() + fragmentShaderSource;

console.log(fragShaderSourceCombined);
