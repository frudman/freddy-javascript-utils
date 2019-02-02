// FYI: these BABEL settings (below) could be included directly in package.json 
// as "babel":{ presets, plugins} root property (read https://babeljs.io/docs/en/config-files)
// BUT... package.json CANNOT be annotated with comments so keep it as a separate file here for docs

// important: .babelrc is another way (traditional) to configure babel BUT IT DOESN'T [seem to] WORK 
// with webpack and the @babel/plugin-proposal-class-properties plugin, for whatever reason (tbi)
// info on the intertubes is varied but solution seems to be to use the newer **babel.config.js**
// format, so that's what we did below

// "presets": [
//     [
//       "@babel/preset-env",
//       {
//         "targets": {
//           "node": "current"
//         }
//       }
//     ]
//   ],
//   "plugins": [
//     "babel-plugin-transform-es2015-modules-commonjs"
//   ]
// }


module.exports = function(api) {

    // seems to be important... (don't know why: tbi)
    api.cache(true); // ...so there you go...

    const presets = [ 
        
        // read: https://babeljs.io/docs/en/babel-preset-env

        ["@babel/preset-env", {
            "targets": {
                "node": "current"
            }
        }]
        
        // ["@babel/env", {
        
        //     "modules": false, // false to NOT transform modules (presumably webpack will do this?)
        
        //     "targets": { 
        //         // we skip IE: too many limitations and not needed to support windows users anymore
        //         // todo: reduce browser versions below based on minimum reqs
        //         "chrome": "71",
        //         "firefox": "64",
        //         "edge": "44",
        //         "safari": "11.1",
        //         // "browsers": ["> 1%", "last 2 versions", "not ie <= 8"] // NOPE, we don't want this anymore
        //     }
        // }]
    ];

    const plugins = [
        
        // Enables CLASS private & static properties (see example in globals.js/EventEmitter)
        // - https://www.npmjs.com/package/@babel/plugin-proposal-class-properties
        // - https://babeljs.io/docs/en/next/babel-plugin-proposal-class-properties.html
        //"@babel/plugin-proposal-class-properties",
        ["@babel/plugin-proposal-class-properties", { "loose": true }],

        // require to enable webpack config files to use import/export
        "@babel/plugin-transform-modules-commonjs",

        // required to allow import() statements in app 
        // - e.g. return import(/* webpackChunkName: '[request]' */ './components/plugins/' + url + '/plugin.vue');
        // make these as chunks WITHOUT using import() (otherwise fails in Firefox)
        // we SHOUD NOT USE dynamic imports (i.e. import()) ANYMORE (use load-dynamic-module instead)
        // commented out below as per note above
        //"@babel/plugin-syntax-dynamic-import", 

        // // required to allow for [top-level?] async/await code (used by babel 7+)
        // // read: https://github.com/babel/babel-loader/issues/560#issuecomment-435479549
         "@babel/plugin-transform-runtime",
    ]

    return { presets, plugins};
}