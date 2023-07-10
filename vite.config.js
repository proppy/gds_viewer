import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
    build: {
	target: 'esnext',
    },
    plugins: [viteSingleFile()],
})
