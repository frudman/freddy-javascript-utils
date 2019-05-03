# freddy-javascript-utils
a javascript library of useful (?) "out-of-the-beaten-path" tidbits :-)

- These tidbits DO NOT contain ANY dependencies: that's the whole point of this module :-) 

- These are useful lightweight(ish) methods that I find I use over and over again
    - ...or that I want kept somewhere for reference on how to do this or that...

- EACH METHOD is self contained, so...
    - ...a fine way to use these functions is to simply cut-and-paste them into your code (use this repo as reference)

- IMPORTANT: you can enable TREE SHAKING by importing (in your app) only those methods you need
    - tree shaking means a good bundler (e.g. webpack) will NOT include any method here (i.e. export) 
      that is not explicitly imported in your app, thus reducing the code-size of your final (bundled) app

- PUBLISH: `npm run pub`