import nodeResolve from 'rollup-plugin-node-resolve';
import path from 'path';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const extensions = ['.js', '.ts']

const resolve = function(...args) {
    return path.resolve(__dirname, ...args);
};

module.exports = {
    input: resolve('./dist/lib/main.js'),
    output: {
        file: resolve('./', pkg.main),
        format: 'esm'
    },
    plugins: [
        nodeResolve({
            extensions,
            modulesOnly: true,
        }),
        babel({
            exclude: 'node_modules/**',
            extensions
        }),
    ]
}