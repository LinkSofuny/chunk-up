// import nodeResolve from 'rollup-plugin-node-resolve';
import ts from 'rollup-plugin-typescript2'
import path from 'path';
import json from '@rollup/plugin-json'
import pkg from './package.json';

const extensions = ['.js', '.ts']

const resolve = function(...args) {
    return path.resolve(__dirname, ...args);
};

export default {
    input: resolve('./src/main.ts'),
    output: {
        file: resolve('./', pkg.main),
    },
    plugins: [
        json({
            namedExports: false
        }),
        ts()
    ]
}