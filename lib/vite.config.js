import { defineConfig } from "vite";

export default ({ mode }) => {
    return defineConfig({
        define: {
            "process.env.NODE_ENV": `"${mode}"`,
        }
    })
}
