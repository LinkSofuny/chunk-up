// import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2'
import path from 'path';
import resolveNode from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json'
import pkg from './package.json';
import merge from "lodash.merge";
import { terser } from "rollup-plugin-terser";

const extensions = ['.js', '.ts']

const resolve = function(...args) {
    return path.resolve(__dirname, ...args);
};

const tasks = {
    esm: {
        output: {
            format: 'esm',
            file: resolve(pkg.module),
        }
    },
    umd: {
        output: {
            format: 'umd',
            file: resolve(pkg.main),
            name: 'createChunkUploadTask',
        }
    },
    min: {
        output: {
            format: 'umd',
            file: resolve(pkg.main.replace(/(.\w+)$/, '.min$1')),
            name: 'createChunkUploadTask',
        },
        plugins: [
            terser()
        ]
    }
}

const mergeConfig = tasks[process.env.FORMAT || 'esm'];


export default merge (
    {
        input: resolve('./src/main.ts'),
        output: {
            file: resolve('./', pkg.main),
        },
        plugins: [
            resolveNode({
                extensions,
                modulesOnly: true,
            }),
            typescript(),
            babel({
                exclude: 'node_modules/**',
                extensions,
            }),
            json({
                namedExports: false
            })
        ]
    },
    mergeConfig,
)