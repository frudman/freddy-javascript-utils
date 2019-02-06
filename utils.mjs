
// These tidbits DO NOT contain ANY dependencies: that's the whole point of this module :-) 

// These are useful lightweight(ish) methods that I find I use over and over again
// ...or that I want kept somewhere for reference on how to do this or that...

// EACH METHOD is self contained, so...
// ...a fine way to use these functions is to simply cut-and-paste them into your code (use this repo as reference)

// IMPORTANT: you can enable TREE SHAKING by importing (in your app) only those methods you need
// - tree shaking means a good bundler (e.g. webpack) will NOT include any method here (i.e. export) 
//   that is not explicitly imported in your app, thus reducing the code-size of your final (bundled) app


// obvious helper
// caveat: will FAIL with cyclical refs
export const deepClone = obj => JSON.parse(JSON.stringify(obj));

// a way to create a "seriously empty object" :-)
export const createNullObject = () => Object.create(null);

// prevent webpack/babel from removing async syntax (which would neutralize its intended effect) when going ES6->ES5
// see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
export const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();

// utility (using es6 generators)
export function* genCombinations(options) {

    // options is an object where each property contains an array of alternatives
    // EACH COMBINATION will be returned as an enumerable

    // usage: for (const combination of genCombinations(opts)) { 
    //          ...your code using combination here... 
    //        }
    // where: e.g. opts = { minified: [true,false], modType: ['amd','umd','cjs'], ecma: ['es5', 'es6', 'es7'], optimize: [false, 'medium', true]}
    // - opts would generate 54 combinations

    const props = Object.keys(options);
    if (props.length === 0) return; // trivial case

    const thisProp = props[0],
          propAlts = options[thisProp]; // an array of values

    if (props.length === 1) // variants on single property
        for (const alt of propAlts) 
            yield { [thisProp]: alt }; 
    else { // variants on multiple properties
        const otherProps = deepClone(options);
        delete otherProps[thisProp]; 
        for (const propAlt of propAlts)
            for (const subAlts of genCombinations(otherProps))
                yield Object.assign({ [thisProp]: propAlt }, subAlts); 
    }
}

// utility (using callback)
export function genCombinations_with_callback(options, cb) {

    // options is an object where each property contains an array of alternatives
    // cb will be called back, once for each COMBINATION of these properties

    // usage: genCombinations_with_callback(opts, combination => { 
    //          ...your callback code using combination here... 
    //        });
    // where: e.g. opts = { minified: [true,false], modType: ['amd','umd','cjs'], ecma: ['es5', 'es6', 'es7'], optimize: [false, 'medium', true]}
    // - opts would generate 54 callbacks

    const props = Object.keys(options);
    if (props.length === 0) return; // trivial case

    const thisProp = props[0],
          propAlts = options[thisProp]; // an array of values

    if (props.length === 1)
        propAlts.forEach(alt => cb({ [thisProp]: alt }));
    else {
        const otherProps = deepClone(options);
        delete otherProps[thisProp]; 
        propAlts.forEach(v => genCombos(otherProps, subAlts => cb(Object.assign({ [thisProp]: v }, subAlts))))
    }
}

// a simple replacement for axios.get (less code since can't just get axios.get)
export function http(url, {method = 'GET', retry = 3, retryDelayInMS = 500} = {}) {

    // IMPORTANT:
    //  this code depends on XMLHttpRequest settings .responseURL field upon completion
    //  - that feature is NOT SUPPORTED in IE (any versions) [supported on Edge]
    //  SO this code will NOT work on IE if need .responseURL [works on Edge]

    // read: https://gomakethings.com/promise-based-xhr/
    // also: https://gomakethings.com/why-i-still-use-xhr-instead-of-the-fetch-api/
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest

	return new Promise((resolve,reject) => {

        // Create the XHR request
        const request = new XMLHttpRequest();

		// Setup our listener to process compeleted requests
		request.onreadystatechange = () => {

            // wait until request/response complete
			if (request.readyState !== 4) return; 

			// process the response
			if (request.status >= 200 && request.status < 300) {
                // success
				resolve({ 
                    content: request.responseText,
                    contentType: request.getResponseHeader('Content-Type'),

                    // next one is useful to know final url in case of 30x redirects (as followed by browser)
                    // see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseURL
                    responseURL: request.responseURL || url, // NOT SUPPORTED by IE so pass back initial requested url
                });
			} else if (request.status >= 500 && retry-- > 0) {
                // server error: retry...
                setTimeout(() => {
                    http(url, {method, retry, retryDelayInMS})
                        .then(resolve)
                        .catch(reject);
                }, retryDelayInMS); // ...after a brief delay...
                retryDelayInMS *= 2; // ...and progressively increase it for next go around
            } else { 
                // client error (4xx) or too many retries or other non-retriable error
                const err = new Error(`failed to ${method} ${url} [${retry <= 0 ? 'too many retries;' : ''}http-code=${request.status}${request.statusText ? `(${request.statusText})`:''}]`)
                err.name = `HTTP-${method}-Error`;
                err.statusCode = request.status;
                err.statusText = request.statusText; 
				reject(err);
			}
        };
        
        // Setup our HTTP request
		request.open(method || 'GET', url, true); // last parm 'true' makes it async

		// Send the request
		request.send();
	});
}

export function loadCSSCode(cssCode) {
    const head = document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(cssCode));

    // style attribute no longer needed in modern [html5] browsers
    // as per https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
    //style.setAttribute('type', 'text/css'); 

    head.appendChild(style);
}

