
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

// a minimal replacement for axios.get (less code since can't just get standalone axios.get)
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

export function loadCSSCode(cssCode) {
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(cssCode));

    // style attribute no longer needed in modern [html5] browsers
    // as per https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
    //style.setAttribute('type', 'text/css'); 

    document.head.appendChild(style);
}


export function loadScript(url, onload, onerror) { // should ALSO be part of loadModule, no?

    const a = document.createElement('script'); 
    a.src = url;

    // todo: allow for an INTEGRITY attribute to verify loading of code (using sha-NNN signatures)
    // - https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

    // todo: consider adding CROSSORIGIN attribute as parameter
    // read: https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes
    //a.crossorigin = 'anonymous'; // or 'use-credentials'

    onload && (a.onload = onload);
    onerror && (a.onerror = evt => onerror(evt));
    document.body.appendChild(a);
}

// read: https://github.com/Caligatio/jsSHA#hmac
import SHA_256_ALGORITHM from './sha256.js'; 

export function SHA256(content, hmacKey = false) { // content expected to be string (for now)
    // to verify, use: https://www.freeformatter.com/hmac-generator.html
    const sha = new SHA_256_ALGORITHM("SHA-256", "TEXT"); // todo: content COULD BE an array buffer (?) so test for it?
    hmacKey && sha.setHMACKey(hmacKey, "TEXT"); // todo: key COULD BE an array buffer (?) so test for it?
    sha.update(content);
    return hmacKey ? sha.getHMAC('HEX') : sha.getHash('HEX');
}

export function SHA256_withUpdates(updateType = "TEXT", hmacKey = false) { // also "ARRAYBUFFER"

    // to verify, use: https://www.freeformatter.com/hmac-generator.html
    const sha = new SHA_256_ALGORITHM("SHA-256", updateType);
    hmacKey && sha.setHMACKey(hmacKey, "TEXT"); // todo: key COULD BE an array buffer (?) so test for it?

    return {
        update(content) { sha.update(content); },
        getHash(type = 'HEX') { return sha.getHash(type); },
        getHMAC(type = 'HEX') { return sha.getHMAC(type); },
    }
}

export function fmtDate(date, ...localeParms) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
    // also read: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString

    // see: https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLanguage/language
    // - window.navigator.language || window.navigator.userLanguage || window.navigator.browserLanguage; 
    // - (user|browser)Language for IE 11
    //const wn = window.navigator || {};
    //locale = [ wn.language || wn.userLanguage || wn.browserLanguage || 'en-US' ]; 
    // if locale is empty, will use defaults for browser (language+timezone)

    return new Intl.DateTimeFormat(...localeParms).format(date);
}

export function genSortOfUUID(len = 5) {

    // this MUST be unique for all users from all browsers (at the time of request)
    // - would be better to use a cookie but those can be manipulated
    // - also better to get uid from server but would require 2 tx instead of one

    // using CRYPTO: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
    // - all recent-vintage browsers support this

    const array = new Uint32Array(len); // each unit is 4 hex digits
    window.crypto.getRandomValues(array); 

    // below: using [...spread] technique because cannot use array.map() since that
    // would return a Uint32Array (typed array) where all values would then be converted to 0
    return [...array].map(n => n.toString(36)).join(''); // 36 as in base-36
}

export const arrayToObj = (() => { 
    // converts array of strings ['prop1','prop2','prop3=val',...] to object {prop1:'', prop2:'', prop3:'val', ...}
    const split = itm => [ ...itm.split('='), '' ];
    return (...props) => props.map(p => split(p)).reduce((sofar,[p,v]) => (sofar[p] = v, sofar), {});
})();


// The maximum is exclusive and the minimum is inclusive
export const random = (min,max) => Math.floor(Math.random() * (max - min)) + min; 

// when opening new windows 
export const dialogWindowSettings = ({
    width = 620,
    height = 550,
    menubar = 'no',
    toolbar = 'no',
    location = 'no',
    status = 'no',
    ...rest
} = {}) => // also resizable & scrollbars
    Object.entries({width,height,menubar,toolbar,location,status,...rest}).map(([k,v]) => `${k}=${v}`).join(',');

