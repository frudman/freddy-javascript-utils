
// - to build libs: npm run build
// - to publish: npm run pub

// IMPORTANT: Webpack config below uses ES6 modules 
// - based on https://stackoverflow.com/a/51774289
// - this DEPENDS on webpack config file using the .babel.js extension
//  - it seems you DO NEED the .babel.js extension (unlike the addtl note in SO answer above)
// - no need for a separate .babelrc file as babel settings are directly in package.json file

// webpack strategy also partially inspired from: 
// - https://tech.trivago.com/2015/12/17/export-multiple-javascript-module-formats/

// to consider: re-implement using https://www.npmjs.com/package/parallel-webpack
// - same as below but done in parallel (and .variant() function already implemented)

import { deepClone, genCombinations } from './utils';

function genBuildConfiguration(baseConfig, opt) {
    // start with base config
    const config = deepClone(baseConfig); 

    // customize it
    config.output.filename = `lib/${opt.target.lib}/es${opt.ecma}/index${opt.minimize?'.min':''}.js`;
    config.output.libraryTarget = opt.target.name; // amd, umd, commonjs, ...

    if (config.optimization.minimize = opt.minimize)
        config.optimization.minimizer = [ minimizerConfig(opt.ecma) ];

    // done
    return config;
}

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

const baseBuildConfig = {
    mode: 'production',
    entry: './utils.js',
    output: { 
        path: __dirname, 
    }, 
    optimization: {
        minimize: false, // parms below will update this
    },
}

export default Array.from(genCombinations({
    target: [ 
        { lib: 'umd',  name: 'umd', },
        { lib: 'amd',  name: 'amd', },
        { lib: 'cjs2', name: 'commonjs2', },
        { lib: 'cjs',  name: 'commonjs', }
    ],
    minimize: [ false, true ],
    ecma: [ 5, 6 ],
})).map(options => genBuildConfiguration(baseBuildConfig, options));
