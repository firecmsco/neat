import { vertexShaderSource, buildUniforms, buildColorFunctions, buildNoise, fragmentShaderSource } from "./lib/src/shaders.ts";

const vertShaderSourceCombined = buildUniforms() + buildNoise() + buildColorFunctions() + vertexShaderSource;
const fragShaderSourceCombined = buildUniforms() + buildColorFunctions() + buildNoise() + fragmentShaderSource;

const gl = document.getElementById("c").getContext("webgl");
const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, vertShaderSourceCombined);
gl.compileShader(vs);
if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error("RAW_VS_ERROR:\n" + gl.getShaderInfoLog(vs));
} else {
    console.log("VERTEX SHADER COMPILED SUCCESSFULLY");
}

const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, fragShaderSourceCombined);
gl.compileShader(fs);
if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error("RAW_FS_ERROR:\n" + gl.getShaderInfoLog(fs));
} else {
    console.log("FRAGMENT SHADER COMPILED SUCCESSFULLY");
}
