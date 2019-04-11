
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
                const code = (retry <= 0 ? 'too many retries;last-' : '') + `http-code=${request.status}${request.statusText ? `(${request.statusText})`:''}`;
                const err = new Error(`failed to ${method} ${url} [${code}]`)
                err.name = `HTTP-${method}-Error`;
                err.statusCode = request.status;
                err.statusText = request.statusText; 
                err.code = code;
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
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(cssCode));

    // style attribute no longer needed in modern [html5] browsers
    // as per https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
    //style.setAttribute('type', 'text/css'); 

    document.head.appendChild(style);
}


export function loadScript(url) { // should be part of loadModule, no?
    const a = document.createElement('script'); 
    a.src = url;
    document.body.appendChild(a);
}

// allows us to create friendlier multi-line regexps (using spacing, including newlines, and ## end-of-line comments)
// uses 'bs' as substitute for BackSlash (\) to simplify string definitions (else would need to double-escape ALL backslashes)
// bs must be specified as a GLOBAL regex (else only first occurence would be replaced)
export const toRegEx = (srcRE,bs,flags) => new RegExp(srcRE.replace(/\s+[#]{2,}.{0,}/g, '').replace(/\s+/g,'').replace(bs, '\\'), flags);

/*
    commented out until actually needed...

    // as per: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
    if (!RegExp.prototype.escape) // or use Object.defineProperty with enumerable: false, configurable: false (to prevent clashes)
    RegExp.prototype.escape = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // function escapeRegExp(str) {
    //     return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    // }

    // then
    if (!String.prototype.replaceAll) // or use Object.defineProperty with enumerable: false, configurable: false (to prevent clashes)
    String.prototype.replaceAll = function(search, replacement) {
        const target = this;
        return target.replace(new RegExp(RegExp.escape(search), 'g'), replacement);
    };
*/

/* 
    1- we used the now-commented-out code below to generate our [complex] regular expressions
    2- then we captured that outout (using the console.log statement)
    3- then we used those generated regexps directly (cut-and-paste) to reduce final code/module size

    FYI: can verify regular expressions here: https://www.regexpal.com/ and https://regex101.com/ 
    FYI: [^] matches everything (including newlines): same as [/s/S]

    ***** commented out code begins below: *****

    // toRegEx uses '.{0,}/g' instead of 'dot-star-slash-gee' because star-slash (of dot-star-slash-gee) would terminate this commented out code!
    const toRegEx = (srcRE,bs,flags) => new RegExp(srcRE.replace(/\s+[#]{2,}.{0,}/g, '').replace(/\s+/g,'').replace(bs, '\\'), flags);

    const commentsPatSrc = toRegEx(`
        ## must look for (and ignore) quoted strings because could contain text that looks like comments

        ### quoted strings
        (['"\`])                 ## start (opening quote); becomes ~1
        (~~~1|(?:(?!~1)[^]))*?   ## quoted content (sans quotes); ~~~1 allows for embedded quotes
        ~1                       ## end (same as opening quote)
    |
        ### comments
        [/][/].*           ## end-of-line
        |
        [/][*][^]*?[*][/]  ## multiline
    `, /[~]/g, 'g');

    // OUR GENERATED REGULAR EXPRESSIONS (cut-and-pasted below)
    // we're NOT concatenating the REs to string because the string-conversion of these REs
    // display slightly different resulting REs ([\/] instead of just [/])
    console.log('const commentsPat =' , commentsPatSrc, ';');
*/            

const commentsPat = /(['"`])(\\\1|(?:(?!\1)[^]))*?\1|[/][/].*|[/][*][^]*?[*][/]/g;

export function stripComments(code) {
    return code.replace(commentsPat, full => (full[0] === '/') ? (full[1] === '/' ? '' : /\n/.test(full) ? '\n' : ' ') : full);
}


export function toQueryString(obj) {
    const esc = encodeURIComponent, sep = '&', eq = '=';
    return Object.entries(obj || {}).map(([k,v]) => esc(k) + eq + esc(v)).join(sep);
}


