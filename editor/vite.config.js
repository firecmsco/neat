import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default ({ mode }) => {
    return defineConfig({
        plugins: [react()],
        define: {
            "process.env.NODE_ENV": `"${mode}"`,
        },
        resolve: {
            alias: {
                '@camberi/neat': path.resolve(__dirname, '../lib/src')
            },
        },
    })
}
