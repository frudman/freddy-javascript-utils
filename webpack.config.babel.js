
// - to build libs: npm run build
// - to publish: npm run pub

// IMPORTANT: this webpack config uses ES6 modules (for reference)
// - based on https://stackoverflow.com/a/51774289
// - this DEPENDS on webpack config file using the .babel.js extension
//  - also as per: https://stackoverflow.com/a/31906902
//  - it seems you DO NEED the .babel.js extension (unlike the addtl note in SO answer above)
// - no need for a separate .babelrc file as babel settings are directly in package.json file

// webpack strategy also partially inspired from: 
// - https://tech.trivago.com/2015/12/17/export-multiple-javascript-module-formats/

// to consider: re-implement using https://www.npmjs.com/package/parallel-webpack
// - same as below but done in parallel (and .variant() function already implemented)

// READ: https://hackernoon.com/7-different-ways-to-use-es-modules-today-fc552254ebf4
// - our package.json.module points to utils.msj (an ES6 file)

// A VERY GOOD READ: http://2ality.com/2017/04/setting-up-multi-platform-packages.html (slightly dated)

import { genCombinations } from './utils';

// "maintained" minimizer for webpack (from https://github.com/terser-js/terser)
import TerserPlugin from 'terser-webpack-plugin';

const minimizerConfig = ecmaVersion => new TerserPlugin({
    terserOptions: {
        // from: https://github.com/terser-js/terser#minify-options-structure
        // and: https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
        // - basic settings below (many more available)

        ecma: ecmaVersion,
        mangle: true, // Note `mangle.properties` is `false` by default.

        output: {
            comments: false, // https://github.com/webpack-contrib/terser-webpack-plugin#remove-comments
        },

        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false,
    },
});

const webpackConfig = opt => ({
    mode: 'production',
    entry: './utils.js',
    output: { 
        filename: `lib/${opt.target.lib}/es${opt.ecma}/index${opt.minimize?'.min':''}.js`,
        path: __dirname, 

        libraryTarget: opt.target.name, // amd, umd, commonjs, ...

        // VERY IMPORTANT: globalObject as per below else 'window' will be used and this fails when
        // trying to import this module in a node app (e.g. another webpack config file)
        // - as per: https://github.com/webpack/webpack/issues/6525#issuecomment-417580843
        // - also: https://github.com/webpack/webpack/issues/6522#issuecomment-366708234
        globalObject: `typeof self !== 'undefined' ? self : this`, // replaces default of 'window' (for webpack 4)
    }, 
    optimization: {
        minimize: opt.minimize,
        minimizer: opt.minimize ? [ minimizerConfig(opt.ecma) ] : [],
    },
});

export default Array.from(genCombinations({
    target: [ 
        { lib: 'umd',  name: 'umd', }, // browsers & servers/node
        { lib: 'amd',  name: 'amd', }, // browsers
        { lib: 'cjs',  name: 'commonjs2', }, // node/servers
    ],
    minimize: [ false, true ],
    ecma: [ 5, 6 ],
})).map(webpackConfig);
