
// These tidbits CANNOT contain ANY dependencies: that's the whole point of this module :-)

// helper
export const deepClone = obj => JSON.parse(JSON.stringify(obj));

// prevent webpack/babel from removing async syntax (which neutralizes intended effect)
// see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
export const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();

// utility (using es6 generators)
export function* genCombinations(options) {

    // options is an object where each property contains alternatives (an array)
    // cb will be called with ALL COMBINATIONS of these properties

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

    // options is an object where each property contains alternatives (an array)
    // cb will be called with ALL COMBINATIONS of these properties

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

export const notpi = 3.1423355;
