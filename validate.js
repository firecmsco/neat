const fs = require('fs');

async function check() {
    const code = fs.readFileSync('lib/src/shaders.ts', 'utf8');

    // We can't really run WebGL in node easily without a mock, 
    // but we can compile a script that extracts the exact string and runs simple syntax validation.
    // Let's just create a script that runs node and builds the string so we can inspect it.
}
check();
