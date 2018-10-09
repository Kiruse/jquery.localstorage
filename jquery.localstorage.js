(function() {
    function Factory($) {
        const ls = window.localStorage;
        
        /** Simple getter and setter. */
        $.ls = function(key, value) {
            if (arguments.length > 1) {
                return $.ls.set(key, value);
            }
            return $.ls.get(key);
        };
        
        /** Dedicated getter. */
        $.ls.get = function(key, defValue) {
            return key in ls ? JSON.parse(ls[key]) : defValue;
        };
        
        /** Dedicated setter. */
        $.ls.set = function(key, value) {
            ls[key] = JSON.stringify(value);
            return this;
        };
        
        /**
         * Clones the specified object into the database, where nested objects
         * are flattened by concatenating the path to their properties from the
         * root object with simple periods ('.'). Preexisting periods are
         * escaped with a backslash ('\') in the key string.
         * 
         * If a property is set, but undefined, it is removed from the local
         * storage.
         * 
         * Caveat: Any existing '.' characters in prefix are not escaped.
         */
        $.ls.clone = function(prefix, obj) {
            if (typeof prefix !== 'string') {
                obj = prefix;
                prefix = '';
            }
            
            if (typeof obj !== 'object') {
                throw Error('Expected object');
            }
            
            // Iterate over the properties of the object.
            for (var prop in obj) {
                let key = prefix + '.' + prop.replace(/\./g, '\\.');
                
                // Serialize objects and array-likes.
                if (typeof obj[prop] === 'object') {
                    // Serialize array-likes as JSON arrays.
                    if ('length' in obj[prop]) {
                        ls[key] = JSON.stringify(Array.prototype.slice.call(obj[prop]));
                    }
                    // Serialize nested objects by flattening them.
                    else {
                        this.clone(key, obj[prop]);
                    }
                }
                
                // Serialize primitives by stringifying them.
                else {
                    ls[key] = JSON.stringify(obj[prop]);
                }
            }
            
            return this;
        };
        
        /**
         * Complimentary opposite of @see clone - the properties of the passe
         * in object are (recurrsively) populated with the local storage's
         * current values.
         */
        $.ls.restore = function(prefix, obj) {
            if (typeof prefix !== 'string') {
                obj = prefix;
                prefix = '';
            }
            
            if (typeof obj !== 'object') {
                throw Error('Expected object');
            }
            
            for (var prop in obj) {
                let key = prefix + '.' + escapePropertyKey(prop);
                
                // Nested objects & arrays
                if (typeof obj[prop] === 'object') {
                    // Deserialize array
                    if ('length' in obj[prop] && key in ls) {
                        obj[prop] = JSON.parse(ls[key]);
                    }
                    // Populate nested object's properties
                    else {
                        this.restore(key, obj[prop]);
                    }
                }
                
                // Primitives
                else {
                    obj[prop] = ls[key];
                }
            }
            
            return obj;
        };
        
        /** Escapes a property key for compatibility with @see restore */
        function escapePropertyKey(key) {
            return key.replace(/\\/g, '\\\\').replace(/\./g, '\\.');
        }
        
        /**
         * Finds the next key segment, because we can escape the escape in order to un-escape the period.
         * Does not include the delimiting period.
         */
        /* I forgot this was useless before I wrote it. So meh, it's still here, but commented out
           for minification, in case I need it in the future.
        function findNextPropertySegment(key, start) {
            if (typeof start !== 'number') start = 0;
            
            let escaped = false;
            
            // Parse the key. It's afaik the best way.
            for (let i = start; i < key.length; ++i) {
                // Ignore and skip this character if it's escaped.
                if (escaped) {
                    escaped = false;
                    continue;
                }
                
                // Escape next character?
                if (key[i] === '\\') {
                    escaped = true;
                }
                
                // Delimiter reached?
                if (key[i] === '.') {
                    return key.substring(start, i);
                }
            }
            
            // Return the remainder of the key.
            return key.substr(start);
        }
        */
        
        /** Removes the specified key from the local storage. */
        $.ls.clear = function(key) {
            let keys = key.split(',').map(e => e.trim());
            
            if (typeof key === 'boolean') {
                if (key) {
                    for (var i in ls) {
                        delete ls[i];
                    }
                }
            }
            delete ls[key];
        };
        
        /**
         * Dumps all found localStorage records to a plain object restoring them
         * where applicable.
         * @see clone
         */
        $.ls.dump = function() {
            return Object.assign({}, ls);
        };
    }
    
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], Factory);
    }
    else {
        Factory($);
    }
})();
