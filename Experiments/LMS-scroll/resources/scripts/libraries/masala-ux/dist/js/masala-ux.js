/*!
 * masala-ux 1.3.12
 * Web UX framework for Nationalencyklopedin
 * Copyright 2014 NE Nationalencyklopedin AB
 */
/*!
 * typeahead.js 0.9.3
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function($) {
    var VERSION = "0.9.3";
    var utils = {
        isMsie: function() {
            var match = /(msie) ([\w.]+)/i.exec(navigator.userAgent);
            return match ? parseInt(match[2], 10) : false;
        },
        isBlankString: function(str) {
            return !str || /^\s*$/.test(str);
        },
        escapeRegExChars: function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        isString: function(obj) {
            return typeof obj === "string";
        },
        isNumber: function(obj) {
            return typeof obj === "number";
        },
        isArray: $.isArray,
        isFunction: $.isFunction,
        isObject: $.isPlainObject,
        isUndefined: function(obj) {
            return typeof obj === "undefined";
        },
        bind: $.proxy,
        bindAll: function(obj) {
            var val;
            for (var key in obj) {
                $.isFunction(val = obj[key]) && (obj[key] = $.proxy(val, obj));
            }
        },
        indexOf: function(haystack, needle) {
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i] === needle) {
                    return i;
                }
            }
            return -1;
        },
        each: $.each,
        map: $.map,
        filter: $.grep,
        every: function(obj, test) {
            var result = true;
            if (!obj) {
                return result;
            }
            $.each(obj, function(key, val) {
                if (!(result = test.call(null, val, key, obj))) {
                    return false;
                }
            });
            return !!result;
        },
        some: function(obj, test) {
            var result = false;
            if (!obj) {
                return result;
            }
            $.each(obj, function(key, val) {
                if (result = test.call(null, val, key, obj)) {
                    return false;
                }
            });
            return !!result;
        },
        mixin: $.extend,
        getUniqueId: function() {
            var counter = 0;
            return function() {
                return counter++;
            };
        }(),
        defer: function(fn) {
            setTimeout(fn, 0);
        },
        debounce: function(func, wait, immediate) {
            var timeout, result;
            return function() {
                var context = this, args = arguments, later, callNow;
                later = function() {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };
                callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                }
                return result;
            };
        },
        throttle: function(func, wait) {
            var context, args, timeout, result, previous, later;
            previous = 0;
            later = function() {
                previous = new Date();
                timeout = null;
                result = func.apply(context, args);
            };
            return function() {
                var now = new Date(), remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        tokenizeQuery: function(str) {
            return $.trim(str).toLowerCase().split(/[\s]+/);
        },
        tokenizeText: function(str) {
            return $.trim(str).toLowerCase().split(/[\s\-_]+/);
        },
        getProtocol: function() {
            return location.protocol;
        },
        noop: function() {}
    };
    var EventTarget = function() {
        var eventSplitter = /\s+/;
        return {
            on: function(events, callback) {
                var event;
                if (!callback) {
                    return this;
                }
                this._callbacks = this._callbacks || {};
                events = events.split(eventSplitter);
                while (event = events.shift()) {
                    this._callbacks[event] = this._callbacks[event] || [];
                    this._callbacks[event].push(callback);
                }
                return this;
            },
            trigger: function(events, data) {
                var event, callbacks;
                if (!this._callbacks) {
                    return this;
                }
                events = events.split(eventSplitter);
                while (event = events.shift()) {
                    if (callbacks = this._callbacks[event]) {
                        for (var i = 0; i < callbacks.length; i += 1) {
                            callbacks[i].call(this, {
                                type: event,
                                data: data
                            });
                        }
                    }
                }
                return this;
            }
        };
    }();
    var EventBus = function() {
        var namespace = "typeahead:";
        function EventBus(o) {
            if (!o || !o.el) {
                $.error("EventBus initialized without el");
            }
            this.$el = $(o.el);
        }
        utils.mixin(EventBus.prototype, {
            trigger: function(type) {
                var args = [].slice.call(arguments, 1);
                this.$el.trigger(namespace + type, args);
            }
        });
        return EventBus;
    }();
    var PersistentStorage = function() {
        var ls, methods;
        try {
            ls = window.localStorage;
            ls.setItem("~~~", "!");
            ls.removeItem("~~~");
        } catch (err) {
            ls = null;
        }
        function PersistentStorage(namespace) {
            this.prefix = [ "__", namespace, "__" ].join("");
            this.ttlKey = "__ttl__";
            this.keyMatcher = new RegExp("^" + this.prefix);
        }
        if (ls && window.JSON) {
            methods = {
                _prefix: function(key) {
                    return this.prefix + key;
                },
                _ttlKey: function(key) {
                    return this._prefix(key) + this.ttlKey;
                },
                get: function(key) {
                    if (this.isExpired(key)) {
                        this.remove(key);
                    }
                    return decode(ls.getItem(this._prefix(key)));
                },
                set: function(key, val, ttl) {
                    if (utils.isNumber(ttl)) {
                        ls.setItem(this._ttlKey(key), encode(now() + ttl));
                    } else {
                        ls.removeItem(this._ttlKey(key));
                    }
                    return ls.setItem(this._prefix(key), encode(val));
                },
                remove: function(key) {
                    ls.removeItem(this._ttlKey(key));
                    ls.removeItem(this._prefix(key));
                    return this;
                },
                clear: function() {
                    var i, key, keys = [], len = ls.length;
                    for (i = 0; i < len; i++) {
                        if ((key = ls.key(i)).match(this.keyMatcher)) {
                            keys.push(key.replace(this.keyMatcher, ""));
                        }
                    }
                    for (i = keys.length; i--; ) {
                        this.remove(keys[i]);
                    }
                    return this;
                },
                isExpired: function(key) {
                    var ttl = decode(ls.getItem(this._ttlKey(key)));
                    return utils.isNumber(ttl) && now() > ttl ? true : false;
                }
            };
        } else {
            methods = {
                get: utils.noop,
                set: utils.noop,
                remove: utils.noop,
                clear: utils.noop,
                isExpired: utils.noop
            };
        }
        utils.mixin(PersistentStorage.prototype, methods);
        return PersistentStorage;
        function now() {
            return new Date().getTime();
        }
        function encode(val) {
            return JSON.stringify(utils.isUndefined(val) ? null : val);
        }
        function decode(val) {
            return JSON.parse(val);
        }
    }();
    var RequestCache = function() {
        function RequestCache(o) {
            utils.bindAll(this);
            o = o || {};
            this.sizeLimit = o.sizeLimit || 10;
            this.cache = {};
            this.cachedKeysByAge = [];
        }
        utils.mixin(RequestCache.prototype, {
            get: function(url) {
                return this.cache[url];
            },
            set: function(url, resp) {
                var requestToEvict;
                if (this.cachedKeysByAge.length === this.sizeLimit) {
                    requestToEvict = this.cachedKeysByAge.shift();
                    delete this.cache[requestToEvict];
                }
                this.cache[url] = resp;
                this.cachedKeysByAge.push(url);
            }
        });
        return RequestCache;
    }();
    var Transport = function() {
        var pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests, requestCache;
        function Transport(o) {
            utils.bindAll(this);
            o = utils.isString(o) ? {
                url: o
            } : o;
            requestCache = requestCache || new RequestCache();
            maxPendingRequests = utils.isNumber(o.maxParallelRequests) ? o.maxParallelRequests : maxPendingRequests || 6;
            this.url = o.url;
            this.wildcard = o.wildcard || "%QUERY";
            this.filter = o.filter;
            this.replace = o.replace;
            this.ajaxSettings = {
                type: "get",
                cache: o.cache,
                timeout: o.timeout,
                dataType: o.dataType || "json",
                beforeSend: o.beforeSend
            };
            this._get = (/^throttle$/i.test(o.rateLimitFn) ? utils.throttle : utils.debounce)(this._get, o.rateLimitWait || 300);
        }
        utils.mixin(Transport.prototype, {
            _get: function(url, cb) {
                var that = this;
                if (belowPendingRequestsThreshold()) {
                    this._sendRequest(url).done(done);
                } else {
                    this.onDeckRequestArgs = [].slice.call(arguments, 0);
                }
                function done(resp) {
                    var data = that.filter ? that.filter(resp) : resp;
                    cb && cb(data);
                    requestCache.set(url, resp);
                }
            },
            _sendRequest: function(url) {
                var that = this, jqXhr = pendingRequests[url];
                if (!jqXhr) {
                    incrementPendingRequests();
                    jqXhr = pendingRequests[url] = $.ajax(url, this.ajaxSettings).always(always);
                }
                return jqXhr;
                function always() {
                    decrementPendingRequests();
                    pendingRequests[url] = null;
                    if (that.onDeckRequestArgs) {
                        that._get.apply(that, that.onDeckRequestArgs);
                        that.onDeckRequestArgs = null;
                    }
                }
            },
            get: function(query, cb) {
                var that = this, encodedQuery = encodeURIComponent(query || ""), url, resp;
                cb = cb || utils.noop;
                url = this.replace ? this.replace(this.url, encodedQuery) : this.url.replace(this.wildcard, encodedQuery);
                if (resp = requestCache.get(url)) {
                    utils.defer(function() {
                        cb(that.filter ? that.filter(resp) : resp);
                    });
                } else {
                    this._get(url, cb);
                }
                return !!resp;
            }
        });
        return Transport;
        function incrementPendingRequests() {
            pendingRequestsCount++;
        }
        function decrementPendingRequests() {
            pendingRequestsCount--;
        }
        function belowPendingRequestsThreshold() {
            return pendingRequestsCount < maxPendingRequests;
        }
    }();
    var Dataset = function() {
        var keys = {
            thumbprint: "thumbprint",
            protocol: "protocol",
            itemHash: "itemHash",
            adjacencyList: "adjacencyList"
        };
        function Dataset(o) {
            utils.bindAll(this);
            if (utils.isString(o.template) && !o.engine) {
                $.error("no template engine specified");
            }
            if (!o.local && !o.prefetch && !o.remote) {
                $.error("one of local, prefetch, or remote is required");
            }
            this.name = o.name || utils.getUniqueId();
            this.limit = o.limit || 5;
            this.minLength = o.minLength || 1;
            this.header = o.header;
            this.footer = o.footer;
            this.valueKey = o.valueKey || "value";
            this.template = compileTemplate(o.template, o.engine, this.valueKey);
            this.local = o.local;
            this.prefetch = o.prefetch;
            this.remote = o.remote;
            this.itemHash = {};
            this.adjacencyList = {};
            this.storage = o.name ? new PersistentStorage(o.name) : null;
        }
        utils.mixin(Dataset.prototype, {
            _processLocalData: function(data) {
                this._mergeProcessedData(this._processData(data));
            },
            _loadPrefetchData: function(o) {
                var that = this, thumbprint = VERSION + (o.thumbprint || ""), storedThumbprint, storedProtocol, storedItemHash, storedAdjacencyList, isExpired, deferred;
                if (this.storage) {
                    storedThumbprint = this.storage.get(keys.thumbprint);
                    storedProtocol = this.storage.get(keys.protocol);
                    storedItemHash = this.storage.get(keys.itemHash);
                    storedAdjacencyList = this.storage.get(keys.adjacencyList);
                }
                isExpired = storedThumbprint !== thumbprint || storedProtocol !== utils.getProtocol();
                o = utils.isString(o) ? {
                    url: o
                } : o;
                o.ttl = utils.isNumber(o.ttl) ? o.ttl : 24 * 60 * 60 * 1e3;
                if (storedItemHash && storedAdjacencyList && !isExpired) {
                    this._mergeProcessedData({
                        itemHash: storedItemHash,
                        adjacencyList: storedAdjacencyList
                    });
                    deferred = $.Deferred().resolve();
                } else {
                    deferred = $.getJSON(o.url).done(processPrefetchData);
                }
                return deferred;
                function processPrefetchData(data) {
                    var filteredData = o.filter ? o.filter(data) : data, processedData = that._processData(filteredData), itemHash = processedData.itemHash, adjacencyList = processedData.adjacencyList;
                    if (that.storage) {
                        that.storage.set(keys.itemHash, itemHash, o.ttl);
                        that.storage.set(keys.adjacencyList, adjacencyList, o.ttl);
                        that.storage.set(keys.thumbprint, thumbprint, o.ttl);
                        that.storage.set(keys.protocol, utils.getProtocol(), o.ttl);
                    }
                    that._mergeProcessedData(processedData);
                }
            },
            _transformDatum: function(datum) {
                var value = utils.isString(datum) ? datum : datum[this.valueKey], tokens = datum.tokens || utils.tokenizeText(value), item = {
                    value: value,
                    tokens: tokens
                };
                if (utils.isString(datum)) {
                    item.datum = {};
                    item.datum[this.valueKey] = datum;
                } else {
                    item.datum = datum;
                }
                item.tokens = utils.filter(item.tokens, function(token) {
                    return !utils.isBlankString(token);
                });
                item.tokens = utils.map(item.tokens, function(token) {
                    return token.toLowerCase();
                });
                return item;
            },
            _processData: function(data) {
                var that = this, itemHash = {}, adjacencyList = {};
                utils.each(data, function(i, datum) {
                    var item = that._transformDatum(datum), id = utils.getUniqueId(item.value);
                    itemHash[id] = item;
                    utils.each(item.tokens, function(i, token) {
                        var character = token.charAt(0), adjacency = adjacencyList[character] || (adjacencyList[character] = [ id ]);
                        !~utils.indexOf(adjacency, id) && adjacency.push(id);
                    });
                });
                return {
                    itemHash: itemHash,
                    adjacencyList: adjacencyList
                };
            },
            _mergeProcessedData: function(processedData) {
                var that = this;
                utils.mixin(this.itemHash, processedData.itemHash);
                utils.each(processedData.adjacencyList, function(character, adjacency) {
                    var masterAdjacency = that.adjacencyList[character];
                    that.adjacencyList[character] = masterAdjacency ? masterAdjacency.concat(adjacency) : adjacency;
                });
            },
            _getLocalSuggestions: function(terms) {
                var that = this, firstChars = [], lists = [], shortestList, suggestions = [];
                utils.each(terms, function(i, term) {
                    var firstChar = term.charAt(0);
                    !~utils.indexOf(firstChars, firstChar) && firstChars.push(firstChar);
                });
                utils.each(firstChars, function(i, firstChar) {
                    var list = that.adjacencyList[firstChar];
                    if (!list) {
                        return false;
                    }
                    lists.push(list);
                    if (!shortestList || list.length < shortestList.length) {
                        shortestList = list;
                    }
                });
                if (lists.length < firstChars.length) {
                    return [];
                }
                utils.each(shortestList, function(i, id) {
                    var item = that.itemHash[id], isCandidate, isMatch;
                    isCandidate = utils.every(lists, function(list) {
                        return ~utils.indexOf(list, id);
                    });
                    isMatch = isCandidate && utils.every(terms, function(term) {
                        return utils.some(item.tokens, function(token) {
                            return token.indexOf(term) === 0;
                        });
                    });
                    isMatch && suggestions.push(item);
                });
                return suggestions;
            },
            initialize: function() {
                var deferred;
                this.local && this._processLocalData(this.local);
                this.transport = this.remote ? new Transport(this.remote) : null;
                deferred = this.prefetch ? this._loadPrefetchData(this.prefetch) : $.Deferred().resolve();
                this.local = this.prefetch = this.remote = null;
                this.initialize = function() {
                    return deferred;
                };
                return deferred;
            },
            getSuggestions: function(query, cb) {
                var that = this, terms, suggestions, cacheHit = false;
                if (query.length < this.minLength) {
                    return;
                }
                terms = utils.tokenizeQuery(query);
                suggestions = this._getLocalSuggestions(terms).slice(0, this.limit);
                if (suggestions.length < this.limit && this.transport) {
                    cacheHit = this.transport.get(query, processRemoteData);
                }
                !cacheHit && cb && cb(suggestions);
                function processRemoteData(data) {
                    suggestions = suggestions.slice(0);
                    utils.each(data, function(i, datum) {
                        var item = that._transformDatum(datum), isDuplicate;
                        isDuplicate = utils.some(suggestions, function(suggestion) {
                            return item.value === suggestion.value;
                        });
                        !isDuplicate && suggestions.push(item);
                        return suggestions.length < that.limit;
                    });
                    cb && cb(suggestions);
                }
            }
        });
        return Dataset;
        function compileTemplate(template, engine, valueKey) {
            var renderFn, compiledTemplate;
            if (utils.isFunction(template)) {
                renderFn = template;
            } else if (utils.isString(template)) {
                compiledTemplate = engine.compile(template);
                renderFn = utils.bind(compiledTemplate.render, compiledTemplate);
            } else {
                renderFn = function(context) {
                    return "<p>" + context[valueKey] + "</p>";
                };
            }
            return renderFn;
        }
    }();
    var InputView = function() {
        function InputView(o) {
            var that = this;
            utils.bindAll(this);
            this.specialKeyCodeMap = {
                9: "tab",
                27: "esc",
                37: "left",
                39: "right",
                13: "enter",
                38: "up",
                40: "down"
            };
            this.$hint = $(o.hint);
            this.$input = $(o.input).on("blur.tt", this._handleBlur).on("focus.tt", this._handleFocus).on("keydown.tt", this._handleSpecialKeyEvent);
            if (!utils.isMsie()) {
                this.$input.on("input.tt", this._compareQueryToInputValue);
            } else {
                this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function($e) {
                    if (that.specialKeyCodeMap[$e.which || $e.keyCode]) {
                        return;
                    }
                    utils.defer(that._compareQueryToInputValue);
                });
            }
            this.query = this.$input.val();
            this.$overflowHelper = buildOverflowHelper(this.$input);
        }
        utils.mixin(InputView.prototype, EventTarget, {
            _handleFocus: function() {
                this.trigger("focused");
            },
            _handleBlur: function() {
                this.trigger("blured");
            },
            _handleSpecialKeyEvent: function($e) {
                var keyName = this.specialKeyCodeMap[$e.which || $e.keyCode];
                keyName && this.trigger(keyName + "Keyed", $e);
            },
            _compareQueryToInputValue: function() {
                var inputValue = this.getInputValue(), isSameQuery = compareQueries(this.query, inputValue), isSameQueryExceptWhitespace = isSameQuery ? this.query.length !== inputValue.length : false;
                if (isSameQueryExceptWhitespace) {
                    this.trigger("whitespaceChanged", {
                        value: this.query
                    });
                } else if (!isSameQuery) {
                    this.trigger("queryChanged", {
                        value: this.query = inputValue
                    });
                }
            },
            destroy: function() {
                this.$hint.off(".tt");
                this.$input.off(".tt");
                this.$hint = this.$input = this.$overflowHelper = null;
            },
            focus: function() {
                this.$input.focus();
            },
            blur: function() {
                this.$input.blur();
            },
            getQuery: function() {
                return this.query;
            },
            setQuery: function(query) {
                this.query = query;
            },
            getInputValue: function() {
                return this.$input.val();
            },
            setInputValue: function(value, silent) {
                this.$input.val(value);
                !silent && this._compareQueryToInputValue();
            },
            getHintValue: function() {
                return this.$hint.val();
            },
            setHintValue: function(value) {
                this.$hint.val(value);
            },
            getLanguageDirection: function() {
                return (this.$input.css("direction") || "ltr").toLowerCase();
            },
            isOverflow: function() {
                this.$overflowHelper.text(this.getInputValue());
                return this.$overflowHelper.width() > this.$input.width();
            },
            isCursorAtEnd: function() {
                var valueLength = this.$input.val().length, selectionStart = this.$input[0].selectionStart, range;
                if (utils.isNumber(selectionStart)) {
                    return selectionStart === valueLength;
                } else if (document.selection) {
                    range = document.selection.createRange();
                    range.moveStart("character", -valueLength);
                    return valueLength === range.text.length;
                }
                return true;
            }
        });
        return InputView;
        function buildOverflowHelper($input) {
            return $("<span></span>").css({
                position: "absolute",
                left: "-9999px",
                visibility: "hidden",
                whiteSpace: "nowrap",
                fontFamily: $input.css("font-family"),
                fontSize: $input.css("font-size"),
                fontStyle: $input.css("font-style"),
                fontVariant: $input.css("font-variant"),
                fontWeight: $input.css("font-weight"),
                wordSpacing: $input.css("word-spacing"),
                letterSpacing: $input.css("letter-spacing"),
                textIndent: $input.css("text-indent"),
                textRendering: $input.css("text-rendering"),
                textTransform: $input.css("text-transform")
            }).insertAfter($input);
        }
        function compareQueries(a, b) {
            a = (a || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
            b = (b || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
            return a === b;
        }
    }();
    var DropdownView = function() {
        var html = {
            suggestionsList: '<span class="tt-suggestions"></span>'
        }, css = {
            suggestionsList: {
                display: "block"
            },
            suggestion: {
                whiteSpace: "nowrap",
                cursor: "pointer"
            },
            suggestionChild: {
                whiteSpace: "normal"
            }
        };
        function DropdownView(o) {
            utils.bindAll(this);
            this.isOpen = false;
            this.isEmpty = true;
            this.isMouseOverDropdown = false;
            this.$menu = $(o.menu).on("mouseenter.tt", this._handleMouseenter).on("mouseleave.tt", this._handleMouseleave).on("click.tt", ".tt-suggestion", this._handleSelection).on("mouseover.tt", ".tt-suggestion", this._handleMouseover);
        }
        utils.mixin(DropdownView.prototype, EventTarget, {
            _handleMouseenter: function() {
                this.isMouseOverDropdown = true;
            },
            _handleMouseleave: function() {
                this.isMouseOverDropdown = false;
            },
            _handleMouseover: function($e) {
                var $suggestion = $($e.currentTarget);
                this._getSuggestions().removeClass("tt-is-under-cursor");
                $suggestion.addClass("tt-is-under-cursor");
            },
            _handleSelection: function($e) {
                var $suggestion = $($e.currentTarget);
                this.trigger("suggestionSelected", extractSuggestion($suggestion));
            },
            _show: function() {
                this.$menu.css("display", "block");
            },
            _hide: function() {
                this.$menu.hide();
            },
            _moveCursor: function(increment) {
                var $suggestions, $cur, nextIndex, $underCursor;
                if (!this.isVisible()) {
                    return;
                }
                $suggestions = this._getSuggestions();
                $cur = $suggestions.filter(".tt-is-under-cursor");
                $cur.removeClass("tt-is-under-cursor");
                nextIndex = $suggestions.index($cur) + increment;
                nextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;
                if (nextIndex === -1) {
                    this.trigger("cursorRemoved");
                    return;
                } else if (nextIndex < -1) {
                    nextIndex = $suggestions.length - 1;
                }
                $underCursor = $suggestions.eq(nextIndex).addClass("tt-is-under-cursor");
                this._ensureVisibility($underCursor);
                this.trigger("cursorMoved", extractSuggestion($underCursor));
            },
            _getSuggestions: function() {
                return this.$menu.find(".tt-suggestions > .tt-suggestion");
            },
            _ensureVisibility: function($el) {
                var menuHeight = this.$menu.height() + parseInt(this.$menu.css("paddingTop"), 10) + parseInt(this.$menu.css("paddingBottom"), 10), menuScrollTop = this.$menu.scrollTop(), elTop = $el.position().top, elBottom = elTop + $el.outerHeight(true);
                if (elTop < 0) {
                    this.$menu.scrollTop(menuScrollTop + elTop);
                } else if (menuHeight < elBottom) {
                    this.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
                }
            },
            destroy: function() {
                this.$menu.off(".tt");
                this.$menu = null;
            },
            isVisible: function() {
                return this.isOpen && !this.isEmpty;
            },
            closeUnlessMouseIsOverDropdown: function() {
                if (!this.isMouseOverDropdown) {
                    this.close();
                }
            },
            close: function() {
                if (this.isOpen) {
                    this.isOpen = false;
                    this.isMouseOverDropdown = false;
                    this._hide();
                    this.$menu.find(".tt-suggestions > .tt-suggestion").removeClass("tt-is-under-cursor");
                    this.trigger("closed");
                }
            },
            open: function() {
                if (!this.isOpen) {
                    this.isOpen = true;
                    !this.isEmpty && this._show();
                    this.trigger("opened");
                }
            },
            setLanguageDirection: function(dir) {
                var ltrCss = {
                    left: "0",
                    right: "auto"
                }, rtlCss = {
                    left: "auto",
                    right: " 0"
                };
                dir === "ltr" ? this.$menu.css(ltrCss) : this.$menu.css(rtlCss);
            },
            moveCursorUp: function() {
                this._moveCursor(-1);
            },
            moveCursorDown: function() {
                this._moveCursor(+1);
            },
            getSuggestionUnderCursor: function() {
                var $suggestion = this._getSuggestions().filter(".tt-is-under-cursor").first();
                return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
            },
            getFirstSuggestion: function() {
                var $suggestion = this._getSuggestions().first();
                return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
            },
            renderSuggestions: function(dataset, suggestions) {
                var datasetClassName = "tt-dataset-" + dataset.name, wrapper = '<div class="tt-suggestion">%body</div>', compiledHtml, $suggestionsList, $dataset = this.$menu.find("." + datasetClassName), elBuilder, fragment, $el;
                if ($dataset.length === 0) {
                    $suggestionsList = $(html.suggestionsList).css(css.suggestionsList);
                    $dataset = $("<div></div>").addClass(datasetClassName).append(dataset.header).append($suggestionsList).append(dataset.footer).appendTo(this.$menu);
                }
                if (suggestions.length > 0) {
                    this.isEmpty = false;
                    this.isOpen && this._show();
                    elBuilder = document.createElement("div");
                    fragment = document.createDocumentFragment();
                    utils.each(suggestions, function(i, suggestion) {
                        suggestion.dataset = dataset.name;
                        compiledHtml = dataset.template(suggestion.datum);
                        elBuilder.innerHTML = wrapper.replace("%body", compiledHtml);
                        $el = $(elBuilder.firstChild).css(css.suggestion).data("suggestion", suggestion);
                        $el.children().each(function() {
                            $(this).css(css.suggestionChild);
                        });
                        fragment.appendChild($el[0]);
                    });
                    $dataset.show().find(".tt-suggestions").html(fragment);
                } else {
                    this.clearSuggestions(dataset.name);
                }
                this.trigger("suggestionsRendered");
            },
            clearSuggestions: function(datasetName) {
                var $datasets = datasetName ? this.$menu.find(".tt-dataset-" + datasetName) : this.$menu.find('[class^="tt-dataset-"]'), $suggestions = $datasets.find(".tt-suggestions");
                $datasets.hide();
                $suggestions.empty();
                if (this._getSuggestions().length === 0) {
                    this.isEmpty = true;
                    this._hide();
                }
            }
        });
        return DropdownView;
        function extractSuggestion($el) {
            return $el.data("suggestion");
        }
    }();
    var TypeaheadView = function() {
        var html = {
            wrapper: '<span class="twitter-typeahead"></span>',
            hint: '<input class="tt-hint" type="text" autocomplete="off" spellcheck="off" disabled>',
            dropdown: '<span class="tt-dropdown-menu"></span>'
        }, css = {
            wrapper: {
                position: "relative",
                display: "inline-block"
            },
            hint: {
                position: "absolute",
                top: "0",
                left: "0",
                borderColor: "transparent",
                boxShadow: "none"
            },
            query: {
                position: "relative",
                verticalAlign: "top",
                backgroundColor: "transparent"
            },
            dropdown: {
                position: "absolute",
                top: "100%",
                left: "0",
                zIndex: "100",
                display: "none"
            }
        };
        if (utils.isMsie()) {
            utils.mixin(css.query, {
                backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
            });
        }
        if (utils.isMsie() && utils.isMsie() <= 7) {
            utils.mixin(css.wrapper, {
                display: "inline",
                zoom: "1"
            });
            utils.mixin(css.query, {
                marginTop: "-1px"
            });
        }
        function TypeaheadView(o) {
            var $menu, $input, $hint;
            utils.bindAll(this);
            this.$node = buildDomStructure(o.input);
            this.datasets = o.datasets;
            this.dir = null;
            this.eventBus = o.eventBus;
            $menu = this.$node.find(".tt-dropdown-menu");
            $input = this.$node.find(".tt-query");
            $hint = this.$node.find(".tt-hint");
            this.dropdownView = new DropdownView({
                menu: $menu
            }).on("suggestionSelected", this._handleSelection).on("cursorMoved", this._clearHint).on("cursorMoved", this._setInputValueToSuggestionUnderCursor).on("cursorRemoved", this._setInputValueToQuery).on("cursorRemoved", this._updateHint).on("suggestionsRendered", this._updateHint).on("opened", this._updateHint).on("closed", this._clearHint).on("opened closed", this._propagateEvent);
            this.inputView = new InputView({
                input: $input,
                hint: $hint
            }).on("focused", this._openDropdown).on("blured", this._closeDropdown).on("blured", this._setInputValueToQuery).on("enterKeyed tabKeyed", this._handleSelection).on("queryChanged", this._clearHint).on("queryChanged", this._clearSuggestions).on("queryChanged", this._getSuggestions).on("whitespaceChanged", this._updateHint).on("queryChanged whitespaceChanged", this._openDropdown).on("queryChanged whitespaceChanged", this._setLanguageDirection).on("escKeyed", this._closeDropdown).on("escKeyed", this._setInputValueToQuery).on("tabKeyed upKeyed downKeyed", this._managePreventDefault).on("upKeyed downKeyed", this._moveDropdownCursor).on("upKeyed downKeyed", this._openDropdown).on("tabKeyed leftKeyed rightKeyed", this._autocomplete);
        }
        utils.mixin(TypeaheadView.prototype, EventTarget, {
            _managePreventDefault: function(e) {
                var $e = e.data, hint, inputValue, preventDefault = false;
                switch (e.type) {
                  case "tabKeyed":
                    hint = this.inputView.getHintValue();
                    inputValue = this.inputView.getInputValue();
                    preventDefault = hint && hint !== inputValue;
                    break;

                  case "upKeyed":
                  case "downKeyed":
                    preventDefault = !$e.shiftKey && !$e.ctrlKey && !$e.metaKey;
                    break;
                }
                preventDefault && $e.preventDefault();
            },
            _setLanguageDirection: function() {
                var dir = this.inputView.getLanguageDirection();
                if (dir !== this.dir) {
                    this.dir = dir;
                    this.$node.css("direction", dir);
                    this.dropdownView.setLanguageDirection(dir);
                }
            },
            _updateHint: function() {
                var suggestion = this.dropdownView.getFirstSuggestion(), hint = suggestion ? suggestion.value : null, dropdownIsVisible = this.dropdownView.isVisible(), inputHasOverflow = this.inputView.isOverflow(), inputValue, query, escapedQuery, beginsWithQuery, match;
                if (hint && dropdownIsVisible && !inputHasOverflow) {
                    inputValue = this.inputView.getInputValue();
                    query = inputValue.replace(/\s{2,}/g, " ").replace(/^\s+/g, "");
                    escapedQuery = utils.escapeRegExChars(query);
                    beginsWithQuery = new RegExp("^(?:" + escapedQuery + ")(.*$)", "i");
                    match = beginsWithQuery.exec(hint);
                    this.inputView.setHintValue(inputValue + (match ? match[1] : ""));
                }
            },
            _clearHint: function() {
                this.inputView.setHintValue("");
            },
            _clearSuggestions: function() {
                this.dropdownView.clearSuggestions();
            },
            _setInputValueToQuery: function() {
                this.inputView.setInputValue(this.inputView.getQuery());
            },
            _setInputValueToSuggestionUnderCursor: function(e) {
                var suggestion = e.data;
                this.inputView.setInputValue(suggestion.value, true);
            },
            _openDropdown: function() {
                this.dropdownView.open();
            },
            _closeDropdown: function(e) {
                this.dropdownView[e.type === "blured" ? "closeUnlessMouseIsOverDropdown" : "close"]();
            },
            _moveDropdownCursor: function(e) {
                var $e = e.data;
                if (!$e.shiftKey && !$e.ctrlKey && !$e.metaKey) {
                    this.dropdownView[e.type === "upKeyed" ? "moveCursorUp" : "moveCursorDown"]();
                }
            },
            _handleSelection: function(e) {
                var byClick = e.type === "suggestionSelected", suggestion = byClick ? e.data : this.dropdownView.getSuggestionUnderCursor();
                if (suggestion) {
                    this.inputView.setInputValue(suggestion.value);
                    byClick ? this.inputView.focus() : e.data.preventDefault();
                    byClick && utils.isMsie() ? utils.defer(this.dropdownView.close) : this.dropdownView.close();
                    this.eventBus.trigger("selected", suggestion.datum, suggestion.dataset);
                }
            },
            _getSuggestions: function() {
                var that = this, query = this.inputView.getQuery();
                if (utils.isBlankString(query)) {
                    return;
                }
                utils.each(this.datasets, function(i, dataset) {
                    dataset.getSuggestions(query, function(suggestions) {
                        if (query === that.inputView.getQuery()) {
                            that.dropdownView.renderSuggestions(dataset, suggestions);
                        }
                    });
                });
            },
            _autocomplete: function(e) {
                var isCursorAtEnd, ignoreEvent, query, hint, suggestion;
                if (e.type === "rightKeyed" || e.type === "leftKeyed") {
                    isCursorAtEnd = this.inputView.isCursorAtEnd();
                    ignoreEvent = this.inputView.getLanguageDirection() === "ltr" ? e.type === "leftKeyed" : e.type === "rightKeyed";
                    if (!isCursorAtEnd || ignoreEvent) {
                        return;
                    }
                }
                query = this.inputView.getQuery();
                hint = this.inputView.getHintValue();
                if (hint !== "" && query !== hint) {
                    suggestion = this.dropdownView.getFirstSuggestion();
                    this.inputView.setInputValue(suggestion.value);
                    this.eventBus.trigger("autocompleted", suggestion.datum, suggestion.dataset);
                }
            },
            _propagateEvent: function(e) {
                this.eventBus.trigger(e.type);
            },
            destroy: function() {
                this.inputView.destroy();
                this.dropdownView.destroy();
                destroyDomStructure(this.$node);
                this.$node = null;
            },
            setQuery: function(query) {
                this.inputView.setQuery(query);
                this.inputView.setInputValue(query);
                this._clearHint();
                this._clearSuggestions();
                this._getSuggestions();
            }
        });
        return TypeaheadView;
        function buildDomStructure(input) {
            var $wrapper = $(html.wrapper), $dropdown = $(html.dropdown), $input = $(input), $hint = $(html.hint);
            $wrapper = $wrapper.css(css.wrapper);
            $dropdown = $dropdown.css(css.dropdown);
            $hint.css(css.hint).css({
                backgroundAttachment: $input.css("background-attachment"),
                backgroundClip: $input.css("background-clip"),
                backgroundColor: $input.css("background-color"),
                backgroundImage: $input.css("background-image"),
                backgroundOrigin: $input.css("background-origin"),
                backgroundPosition: $input.css("background-position"),
                backgroundRepeat: $input.css("background-repeat"),
                backgroundSize: $input.css("background-size")
            });
            $input.data("ttAttrs", {
                dir: $input.attr("dir"),
                autocomplete: $input.attr("autocomplete"),
                spellcheck: $input.attr("spellcheck"),
                style: $input.attr("style")
            });
            $input.addClass("tt-query").attr({
                autocomplete: "off",
                spellcheck: false
            }).css(css.query);
            try {
                !$input.attr("dir") && $input.attr("dir", "auto");
            } catch (e) {}
            return $input.wrap($wrapper).parent().prepend($hint).append($dropdown);
        }
        function destroyDomStructure($node) {
            var $input = $node.find(".tt-query");
            utils.each($input.data("ttAttrs"), function(key, val) {
                utils.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
            });
            $input.detach().removeData("ttAttrs").removeClass("tt-query").insertAfter($node);
            $node.remove();
        }
    }();
    (function() {
        var cache = {}, viewKey = "ttView", methods;
        methods = {
            initialize: function(datasetDefs) {
                var datasets;
                datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [ datasetDefs ];
                if (datasetDefs.length === 0) {
                    $.error("no datasets provided");
                }
                datasets = utils.map(datasetDefs, function(o) {
                    var dataset = cache[o.name] ? cache[o.name] : new Dataset(o);
                    if (o.name) {
                        cache[o.name] = dataset;
                    }
                    return dataset;
                });
                return this.each(initialize);
                function initialize() {
                    var $input = $(this), deferreds, eventBus = new EventBus({
                        el: $input
                    });
                    deferreds = utils.map(datasets, function(dataset) {
                        return dataset.initialize();
                    });
                    $input.data(viewKey, new TypeaheadView({
                        input: $input,
                        eventBus: eventBus = new EventBus({
                            el: $input
                        }),
                        datasets: datasets
                    }));
                    $.when.apply($, deferreds).always(function() {
                        utils.defer(function() {
                            eventBus.trigger("initialized");
                        });
                    });
                }
            },
            destroy: function() {
                return this.each(destroy);
                function destroy() {
                    var $this = $(this), view = $this.data(viewKey);
                    if (view) {
                        view.destroy();
                        $this.removeData(viewKey);
                    }
                }
            },
            setQuery: function(query) {
                return this.each(setQuery);
                function setQuery() {
                    var view = $(this).data(viewKey);
                    view && view.setQuery(query);
                }
            }
        };
        jQuery.fn.typeahead = function(method) {
            if (methods[method]) {
                return methods[method].apply(this, [].slice.call(arguments, 1));
            } else {
                return methods.initialize.apply(this, arguments);
            }
        };
    })();
})(window.jQuery);
/*!
 * Masonry PACKAGED v3.1.5
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

!function(a){function b(){}function c(a){function c(b){b.prototype.option||(b.prototype.option=function(b){a.isPlainObject(b)&&(this.options=a.extend(!0,this.options,b))})}function e(b,c){a.fn[b]=function(e){if("string"==typeof e){for(var g=d.call(arguments,1),h=0,i=this.length;i>h;h++){var j=this[h],k=a.data(j,b);if(k)if(a.isFunction(k[e])&&"_"!==e.charAt(0)){var l=k[e].apply(k,g);if(void 0!==l)return l}else f("no such method '"+e+"' for "+b+" instance");else f("cannot call methods on "+b+" prior to initialization; attempted to call '"+e+"'")}return this}return this.each(function(){var d=a.data(this,b);d?(d.option(e),d._init()):(d=new c(this,e),a.data(this,b,d))})}}if(a){var f="undefined"==typeof console?b:function(a){console.error(a)};return a.bridget=function(a,b){c(b),e(a,b)},a.bridget}}var d=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],c):c(a.jQuery)}(window),function(a){function b(b){var c=a.event;return c.target=c.target||c.srcElement||b,c}var c=document.documentElement,d=function(){};c.addEventListener?d=function(a,b,c){a.addEventListener(b,c,!1)}:c.attachEvent&&(d=function(a,c,d){a[c+d]=d.handleEvent?function(){var c=b(a);d.handleEvent.call(d,c)}:function(){var c=b(a);d.call(a,c)},a.attachEvent("on"+c,a[c+d])});var e=function(){};c.removeEventListener?e=function(a,b,c){a.removeEventListener(b,c,!1)}:c.detachEvent&&(e=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var f={bind:d,unbind:e};"function"==typeof define&&define.amd?define("eventie/eventie",f):"object"==typeof exports?module.exports=f:a.eventie=f}(this),function(a){function b(a){"function"==typeof a&&(b.isReady?a():f.push(a))}function c(a){var c="readystatechange"===a.type&&"complete"!==e.readyState;if(!b.isReady&&!c){b.isReady=!0;for(var d=0,g=f.length;g>d;d++){var h=f[d];h()}}}function d(d){return d.bind(e,"DOMContentLoaded",c),d.bind(e,"readystatechange",c),d.bind(a,"load",c),b}var e=a.document,f=[];b.isReady=!1,"function"==typeof define&&define.amd?(b.isReady="function"==typeof requirejs,define("doc-ready/doc-ready",["eventie/eventie"],d)):a.docReady=d(a.eventie)}(this),function(){function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if(a instanceof RegExp){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if(a instanceof RegExp)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return a}):"object"==typeof module&&module.exports?module.exports=a:this.EventEmitter=a}.call(this),function(a){function b(a){if(a){if("string"==typeof d[a])return a;a=a.charAt(0).toUpperCase()+a.slice(1);for(var b,e=0,f=c.length;f>e;e++)if(b=c[e]+a,"string"==typeof d[b])return b}}var c="Webkit Moz ms Ms O".split(" "),d=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return b}):"object"==typeof exports?module.exports=b:a.getStyleProperty=b}(window),function(a){function b(a){var b=parseFloat(a),c=-1===a.indexOf("%")&&!isNaN(b);return c&&b}function c(){for(var a={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},b=0,c=g.length;c>b;b++){var d=g[b];a[d]=0}return a}function d(a){function d(a){if("string"==typeof a&&(a=document.querySelector(a)),a&&"object"==typeof a&&a.nodeType){var d=f(a);if("none"===d.display)return c();var e={};e.width=a.offsetWidth,e.height=a.offsetHeight;for(var k=e.isBorderBox=!(!j||!d[j]||"border-box"!==d[j]),l=0,m=g.length;m>l;l++){var n=g[l],o=d[n];o=h(a,o);var p=parseFloat(o);e[n]=isNaN(p)?0:p}var q=e.paddingLeft+e.paddingRight,r=e.paddingTop+e.paddingBottom,s=e.marginLeft+e.marginRight,t=e.marginTop+e.marginBottom,u=e.borderLeftWidth+e.borderRightWidth,v=e.borderTopWidth+e.borderBottomWidth,w=k&&i,x=b(d.width);x!==!1&&(e.width=x+(w?0:q+u));var y=b(d.height);return y!==!1&&(e.height=y+(w?0:r+v)),e.innerWidth=e.width-(q+u),e.innerHeight=e.height-(r+v),e.outerWidth=e.width+s,e.outerHeight=e.height+t,e}}function h(a,b){if(e||-1===b.indexOf("%"))return b;var c=a.style,d=c.left,f=a.runtimeStyle,g=f&&f.left;return g&&(f.left=a.currentStyle.left),c.left=b,b=c.pixelLeft,c.left=d,g&&(f.left=g),b}var i,j=a("boxSizing");return function(){if(j){var a=document.createElement("div");a.style.width="200px",a.style.padding="1px 2px 3px 4px",a.style.borderStyle="solid",a.style.borderWidth="1px 2px 3px 4px",a.style[j]="border-box";var c=document.body||document.documentElement;c.appendChild(a);var d=f(a);i=200===b(d.width),c.removeChild(a)}}(),d}var e=a.getComputedStyle,f=e?function(a){return e(a,null)}:function(a){return a.currentStyle},g=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],d):"object"==typeof exports?module.exports=d(require("get-style-property")):a.getSize=d(a.getStyleProperty)}(window),function(a,b){function c(a,b){return a[h](b)}function d(a){if(!a.parentNode){var b=document.createDocumentFragment();b.appendChild(a)}}function e(a,b){d(a);for(var c=a.parentNode.querySelectorAll(b),e=0,f=c.length;f>e;e++)if(c[e]===a)return!0;return!1}function f(a,b){return d(a),c(a,b)}var g,h=function(){if(b.matchesSelector)return"matchesSelector";for(var a=["webkit","moz","ms","o"],c=0,d=a.length;d>c;c++){var e=a[c],f=e+"MatchesSelector";if(b[f])return f}}();if(h){var i=document.createElement("div"),j=c(i,"div");g=j?c:f}else g=e;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return g}):window.matchesSelector=g}(this,Element.prototype),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){for(var b in a)return!1;return b=null,!0}function d(a){return a.replace(/([A-Z])/g,function(a){return"-"+a.toLowerCase()})}function e(a,e,f){function h(a,b){a&&(this.element=a,this.layout=b,this.position={x:0,y:0},this._create())}var i=f("transition"),j=f("transform"),k=i&&j,l=!!f("perspective"),m={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[i],n=["transform","transition","transitionDuration","transitionProperty"],o=function(){for(var a={},b=0,c=n.length;c>b;b++){var d=n[b],e=f(d);e&&e!==d&&(a[d]=e)}return a}();b(h.prototype,a.prototype),h.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},h.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},h.prototype.getSize=function(){this.size=e(this.element)},h.prototype.css=function(a){var b=this.element.style;for(var c in a){var d=o[c]||c;b[d]=a[c]}},h.prototype.getPosition=function(){var a=g(this.element),b=this.layout.options,c=b.isOriginLeft,d=b.isOriginTop,e=parseInt(a[c?"left":"right"],10),f=parseInt(a[d?"top":"bottom"],10);e=isNaN(e)?0:e,f=isNaN(f)?0:f;var h=this.layout.size;e-=c?h.paddingLeft:h.paddingRight,f-=d?h.paddingTop:h.paddingBottom,this.position.x=e,this.position.y=f},h.prototype.layoutPosition=function(){var a=this.layout.size,b=this.layout.options,c={};b.isOriginLeft?(c.left=this.position.x+a.paddingLeft+"px",c.right=""):(c.right=this.position.x+a.paddingRight+"px",c.left=""),b.isOriginTop?(c.top=this.position.y+a.paddingTop+"px",c.bottom=""):(c.bottom=this.position.y+a.paddingBottom+"px",c.top=""),this.css(c),this.emitEvent("layout",[this])};var p=l?function(a,b){return"translate3d("+a+"px, "+b+"px, 0)"}:function(a,b){return"translate("+a+"px, "+b+"px)"};h.prototype._transitionTo=function(a,b){this.getPosition();var c=this.position.x,d=this.position.y,e=parseInt(a,10),f=parseInt(b,10),g=e===this.position.x&&f===this.position.y;if(this.setPosition(a,b),g&&!this.isTransitioning)return void this.layoutPosition();var h=a-c,i=b-d,j={},k=this.layout.options;h=k.isOriginLeft?h:-h,i=k.isOriginTop?i:-i,j.transform=p(h,i),this.transition({to:j,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},h.prototype.goTo=function(a,b){this.setPosition(a,b),this.layoutPosition()},h.prototype.moveTo=k?h.prototype._transitionTo:h.prototype.goTo,h.prototype.setPosition=function(a,b){this.position.x=parseInt(a,10),this.position.y=parseInt(b,10)},h.prototype._nonTransition=function(a){this.css(a.to),a.isCleaning&&this._removeStyles(a.to);for(var b in a.onTransitionEnd)a.onTransitionEnd[b].call(this)},h.prototype._transition=function(a){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(a);var b=this._transn;for(var c in a.onTransitionEnd)b.onEnd[c]=a.onTransitionEnd[c];for(c in a.to)b.ingProperties[c]=!0,a.isCleaning&&(b.clean[c]=!0);if(a.from){this.css(a.from);var d=this.element.offsetHeight;d=null}this.enableTransition(a.to),this.css(a.to),this.isTransitioning=!0};var q=j&&d(j)+",opacity";h.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:q,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(m,this,!1))},h.prototype.transition=h.prototype[i?"_transition":"_nonTransition"],h.prototype.onwebkitTransitionEnd=function(a){this.ontransitionend(a)},h.prototype.onotransitionend=function(a){this.ontransitionend(a)};var r={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};h.prototype.ontransitionend=function(a){if(a.target===this.element){var b=this._transn,d=r[a.propertyName]||a.propertyName;if(delete b.ingProperties[d],c(b.ingProperties)&&this.disableTransition(),d in b.clean&&(this.element.style[a.propertyName]="",delete b.clean[d]),d in b.onEnd){var e=b.onEnd[d];e.call(this),delete b.onEnd[d]}this.emitEvent("transitionEnd",[this])}},h.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(m,this,!1),this.isTransitioning=!1},h.prototype._removeStyles=function(a){var b={};for(var c in a)b[c]="";this.css(b)};var s={transitionProperty:"",transitionDuration:""};return h.prototype.removeTransitionStyles=function(){this.css(s)},h.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.emitEvent("remove",[this])},h.prototype.remove=function(){if(!i||!parseFloat(this.layout.options.transitionDuration))return void this.removeElem();var a=this;this.on("transitionEnd",function(){return a.removeElem(),!0}),this.hide()},h.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var a=this.layout.options;this.transition({from:a.hiddenStyle,to:a.visibleStyle,isCleaning:!0})},h.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var a=this.layout.options;this.transition({from:a.visibleStyle,to:a.hiddenStyle,isCleaning:!0,onTransitionEnd:{opacity:function(){this.isHidden&&this.css({display:"none"})}}})},h.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},h}var f=a.getComputedStyle,g=f?function(a){return f(a,null)}:function(a){return a.currentStyle};"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property"],e):(a.Outlayer={},a.Outlayer.Item=e(a.EventEmitter,a.getSize,a.getStyleProperty))}(window),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){return"[object Array]"===l.call(a)}function d(a){var b=[];if(c(a))b=a;else if(a&&"number"==typeof a.length)for(var d=0,e=a.length;e>d;d++)b.push(a[d]);else b.push(a);return b}function e(a,b){var c=n(b,a);-1!==c&&b.splice(c,1)}function f(a){return a.replace(/(.)([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()}function g(c,g,l,n,o,p){function q(a,c){if("string"==typeof a&&(a=h.querySelector(a)),!a||!m(a))return void(i&&i.error("Bad "+this.constructor.namespace+" element: "+a));this.element=a,this.options=b({},this.constructor.defaults),this.option(c);var d=++r;this.element.outlayerGUID=d,s[d]=this,this._create(),this.options.isInitLayout&&this.layout()}var r=0,s={};return q.namespace="outlayer",q.Item=p,q.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},b(q.prototype,l.prototype),q.prototype.option=function(a){b(this.options,a)},q.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),b(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},q.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},q.prototype._itemize=function(a){for(var b=this._filterFindItemElements(a),c=this.constructor.Item,d=[],e=0,f=b.length;f>e;e++){var g=b[e],h=new c(g,this);d.push(h)}return d},q.prototype._filterFindItemElements=function(a){a=d(a);for(var b=this.options.itemSelector,c=[],e=0,f=a.length;f>e;e++){var g=a[e];if(m(g))if(b){o(g,b)&&c.push(g);for(var h=g.querySelectorAll(b),i=0,j=h.length;j>i;i++)c.push(h[i])}else c.push(g)}return c},q.prototype.getItemElements=function(){for(var a=[],b=0,c=this.items.length;c>b;b++)a.push(this.items[b].element);return a},q.prototype.layout=function(){this._resetLayout(),this._manageStamps();var a=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,a),this._isLayoutInited=!0},q.prototype._init=q.prototype.layout,q.prototype._resetLayout=function(){this.getSize()},q.prototype.getSize=function(){this.size=n(this.element)},q.prototype._getMeasurement=function(a,b){var c,d=this.options[a];d?("string"==typeof d?c=this.element.querySelector(d):m(d)&&(c=d),this[a]=c?n(c)[b]:d):this[a]=0},q.prototype.layoutItems=function(a,b){a=this._getItemsForLayout(a),this._layoutItems(a,b),this._postLayout()},q.prototype._getItemsForLayout=function(a){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c];e.isIgnored||b.push(e)}return b},q.prototype._layoutItems=function(a,b){function c(){d.emitEvent("layoutComplete",[d,a])}var d=this;if(!a||!a.length)return void c();this._itemsOn(a,"layout",c);for(var e=[],f=0,g=a.length;g>f;f++){var h=a[f],i=this._getItemLayoutPosition(h);i.item=h,i.isInstant=b||h.isLayoutInstant,e.push(i)}this._processLayoutQueue(e)},q.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},q.prototype._processLayoutQueue=function(a){for(var b=0,c=a.length;c>b;b++){var d=a[b];this._positionItem(d.item,d.x,d.y,d.isInstant)}},q.prototype._positionItem=function(a,b,c,d){d?a.goTo(b,c):a.moveTo(b,c)},q.prototype._postLayout=function(){this.resizeContainer()},q.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var a=this._getContainerSize();a&&(this._setContainerMeasure(a.width,!0),this._setContainerMeasure(a.height,!1))}},q.prototype._getContainerSize=k,q.prototype._setContainerMeasure=function(a,b){if(void 0!==a){var c=this.size;c.isBorderBox&&(a+=b?c.paddingLeft+c.paddingRight+c.borderLeftWidth+c.borderRightWidth:c.paddingBottom+c.paddingTop+c.borderTopWidth+c.borderBottomWidth),a=Math.max(a,0),this.element.style[b?"width":"height"]=a+"px"}},q.prototype._itemsOn=function(a,b,c){function d(){return e++,e===f&&c.call(g),!0}for(var e=0,f=a.length,g=this,h=0,i=a.length;i>h;h++){var j=a[h];j.on(b,d)}},q.prototype.ignore=function(a){var b=this.getItem(a);b&&(b.isIgnored=!0)},q.prototype.unignore=function(a){var b=this.getItem(a);b&&delete b.isIgnored},q.prototype.stamp=function(a){if(a=this._find(a)){this.stamps=this.stamps.concat(a);for(var b=0,c=a.length;c>b;b++){var d=a[b];this.ignore(d)}}},q.prototype.unstamp=function(a){if(a=this._find(a))for(var b=0,c=a.length;c>b;b++){var d=a[b];e(d,this.stamps),this.unignore(d)}},q.prototype._find=function(a){return a?("string"==typeof a&&(a=this.element.querySelectorAll(a)),a=d(a)):void 0},q.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var a=0,b=this.stamps.length;b>a;a++){var c=this.stamps[a];this._manageStamp(c)}}},q.prototype._getBoundingRect=function(){var a=this.element.getBoundingClientRect(),b=this.size;this._boundingRect={left:a.left+b.paddingLeft+b.borderLeftWidth,top:a.top+b.paddingTop+b.borderTopWidth,right:a.right-(b.paddingRight+b.borderRightWidth),bottom:a.bottom-(b.paddingBottom+b.borderBottomWidth)}},q.prototype._manageStamp=k,q.prototype._getElementOffset=function(a){var b=a.getBoundingClientRect(),c=this._boundingRect,d=n(a),e={left:b.left-c.left-d.marginLeft,top:b.top-c.top-d.marginTop,right:c.right-b.right-d.marginRight,bottom:c.bottom-b.bottom-d.marginBottom};return e},q.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},q.prototype.bindResize=function(){this.isResizeBound||(c.bind(a,"resize",this),this.isResizeBound=!0)},q.prototype.unbindResize=function(){this.isResizeBound&&c.unbind(a,"resize",this),this.isResizeBound=!1},q.prototype.onresize=function(){function a(){b.resize(),delete b.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var b=this;this.resizeTimeout=setTimeout(a,100)},q.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},q.prototype.needsResizeLayout=function(){var a=n(this.element),b=this.size&&a;return b&&a.innerWidth!==this.size.innerWidth},q.prototype.addItems=function(a){var b=this._itemize(a);return b.length&&(this.items=this.items.concat(b)),b},q.prototype.appended=function(a){var b=this.addItems(a);b.length&&(this.layoutItems(b,!0),this.reveal(b))},q.prototype.prepended=function(a){var b=this._itemize(a);if(b.length){var c=this.items.slice(0);this.items=b.concat(c),this._resetLayout(),this._manageStamps(),this.layoutItems(b,!0),this.reveal(b),this.layoutItems(c)}},q.prototype.reveal=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.reveal()}},q.prototype.hide=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.hide()}},q.prototype.getItem=function(a){for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];if(d.element===a)return d}},q.prototype.getItems=function(a){if(a&&a.length){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c],f=this.getItem(e);f&&b.push(f)}return b}},q.prototype.remove=function(a){a=d(a);var b=this.getItems(a);if(b&&b.length){this._itemsOn(b,"remove",function(){this.emitEvent("removeComplete",[this,b])});for(var c=0,f=b.length;f>c;c++){var g=b[c];g.remove(),e(g,this.items)}}},q.prototype.destroy=function(){var a=this.element.style;a.height="",a.position="",a.width="";for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];d.destroy()}this.unbindResize(),delete this.element.outlayerGUID,j&&j.removeData(this.element,this.constructor.namespace)},q.data=function(a){var b=a&&a.outlayerGUID;return b&&s[b]},q.create=function(a,c){function d(){q.apply(this,arguments)}return Object.create?d.prototype=Object.create(q.prototype):b(d.prototype,q.prototype),d.prototype.constructor=d,d.defaults=b({},q.defaults),b(d.defaults,c),d.prototype.settings={},d.namespace=a,d.data=q.data,d.Item=function(){p.apply(this,arguments)},d.Item.prototype=new p,g(function(){for(var b=f(a),c=h.querySelectorAll(".js-"+b),e="data-"+b+"-options",g=0,k=c.length;k>g;g++){var l,m=c[g],n=m.getAttribute(e);try{l=n&&JSON.parse(n)}catch(o){i&&i.error("Error parsing "+e+" on "+m.nodeName.toLowerCase()+(m.id?"#"+m.id:"")+": "+o);continue}var p=new d(m,l);j&&j.data(m,a,p)}}),j&&j.bridget&&j.bridget(a,d),d},q.Item=p,q}var h=a.document,i=a.console,j=a.jQuery,k=function(){},l=Object.prototype.toString,m="object"==typeof HTMLElement?function(a){return a instanceof HTMLElement}:function(a){return a&&"object"==typeof a&&1===a.nodeType&&"string"==typeof a.nodeName},n=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1};"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","doc-ready/doc-ready","eventEmitter/EventEmitter","get-size/get-size","matches-selector/matches-selector","./item"],g):a.Outlayer=g(a.eventie,a.docReady,a.EventEmitter,a.getSize,a.matchesSelector,a.Outlayer.Item)}(window),function(a){function b(a,b){var d=a.create("masonry");return d.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var a=this.cols;for(this.colYs=[];a--;)this.colYs.push(0);this.maxY=0},d.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var a=this.items[0],c=a&&a.element;this.columnWidth=c&&b(c).outerWidth||this.containerWidth}this.columnWidth+=this.gutter,this.cols=Math.floor((this.containerWidth+this.gutter)/this.columnWidth),this.cols=Math.max(this.cols,1)},d.prototype.getContainerWidth=function(){var a=this.options.isFitWidth?this.element.parentNode:this.element,c=b(a);this.containerWidth=c&&c.innerWidth},d.prototype._getItemLayoutPosition=function(a){a.getSize();var b=a.size.outerWidth%this.columnWidth,d=b&&1>b?"round":"ceil",e=Math[d](a.size.outerWidth/this.columnWidth);e=Math.min(e,this.cols);for(var f=this._getColGroup(e),g=Math.min.apply(Math,f),h=c(f,g),i={x:this.columnWidth*h,y:g},j=g+a.size.outerHeight,k=this.cols+1-f.length,l=0;k>l;l++)this.colYs[h+l]=j;return i},d.prototype._getColGroup=function(a){if(2>a)return this.colYs;for(var b=[],c=this.cols+1-a,d=0;c>d;d++){var e=this.colYs.slice(d,d+a);b[d]=Math.max.apply(Math,e)}return b},d.prototype._manageStamp=function(a){var c=b(a),d=this._getElementOffset(a),e=this.options.isOriginLeft?d.left:d.right,f=e+c.outerWidth,g=Math.floor(e/this.columnWidth);g=Math.max(0,g);var h=Math.floor(f/this.columnWidth);h-=f%this.columnWidth?0:1,h=Math.min(this.cols-1,h);for(var i=(this.options.isOriginTop?d.top:d.bottom)+c.outerHeight,j=g;h>=j;j++)this.colYs[j]=Math.max(i,this.colYs[j])},d.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var a={height:this.maxY};return this.options.isFitWidth&&(a.width=this._getContainerFitWidth()),a},d.prototype._getContainerFitWidth=function(){for(var a=0,b=this.cols;--b&&0===this.colYs[b];)a++;return(this.cols-a)*this.columnWidth-this.gutter},d.prototype.needsResizeLayout=function(){var a=this.containerWidth;return this.getContainerWidth(),a!==this.containerWidth},d}var c=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++){var e=a[c];if(e===b)return c}return-1};"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size"],b):a.Masonry=b(a.Outlayer,a.getSize)}(window);
/*!
 * scrollup v2.4.0
 * Url: http://markgoodyear.com/labs/scrollup/
 * Copyright (c) Mark Goodyear — @markgdyr — http://markgoodyear.com
 * License: MIT
 */
(function ($, window, document) {
    'use strict';

    // Main function
    $.fn.scrollUp = function (options) {

        // Ensure that only one scrollUp exists
        if (!$.data(document.body, 'scrollUp')) {
            $.data(document.body, 'scrollUp', true);
            $.fn.scrollUp.init(options);
        }
    };

    // Init
    $.fn.scrollUp.init = function (options) {

        // Define vars
        var o = $.fn.scrollUp.settings = $.extend({}, $.fn.scrollUp.defaults, options),
            triggerVisible = false,
            animIn, animOut, animSpeed, scrollDis, scrollEvent, scrollTarget, $self;

        // Create element
        if (o.scrollTrigger) {
            $self = $(o.scrollTrigger);
        } else {
            $self = $('<a/>', {
                id: o.scrollName,
                href: '#top'
            });
        }

        // Set scrollTitle if there is one
        if (o.scrollTitle) {
            $self.attr('title', o.scrollTitle);
        }

        $self.appendTo('body');

        // If not using an image display text
        if (!(o.scrollImg || o.scrollTrigger)) {
            $self.html(o.scrollText);
        }

        // Minimum CSS to make the magic happen
        $self.css({
            display: 'none',
            position: 'fixed',
            zIndex: o.zIndex
        });

        // Active point overlay
        if (o.activeOverlay) {
            $('<div/>', {
                id: o.scrollName + '-active'
            }).css({
                position: 'absolute',
                'top': o.scrollDistance + 'px',
                width: '100%',
                borderTop: '1px dotted' + o.activeOverlay,
                zIndex: o.zIndex
            }).appendTo('body');
        }

        // Switch animation type
        switch (o.animation) {
            case 'fade':
                animIn = 'fadeIn';
                animOut = 'fadeOut';
                animSpeed = o.animationSpeed;
                break;

            case 'slide':
                animIn = 'slideDown';
                animOut = 'slideUp';
                animSpeed = o.animationSpeed;
                break;

            default:
                animIn = 'show';
                animOut = 'hide';
                animSpeed = 0;
        }

        // If from top or bottom
        if (o.scrollFrom === 'top') {
            scrollDis = o.scrollDistance;
        } else {
            scrollDis = $(document).height() - $(window).height() - o.scrollDistance;
        }

        // Scroll function
        scrollEvent = $(window).scroll(function () {
            if ($(window).scrollTop() > scrollDis) {
                if (!triggerVisible) {
                    $self[animIn](animSpeed);
                    triggerVisible = true;
                }
            } else {
                if (triggerVisible) {
                    $self[animOut](animSpeed);
                    triggerVisible = false;
                }
            }
        });

        if (o.scrollTarget) {
            if (typeof o.scrollTarget === 'number') {
                scrollTarget = o.scrollTarget;
            } else if (typeof o.scrollTarget === 'string') {
                scrollTarget = Math.floor($(o.scrollTarget).offset().top);
            }
        } else {
            scrollTarget = 0;
        }

        // To the top
        $self.click(function (e) {
            e.preventDefault();

            $('html, body').animate({
                scrollTop: scrollTarget
            }, o.scrollSpeed, o.easingType);
        });
    };

    // Defaults
    $.fn.scrollUp.defaults = {
        scrollName: 'scrollUp',      // Element ID
        scrollDistance: 300,         // Distance from top/bottom before showing element (px)
        scrollFrom: 'top',           // 'top' or 'bottom'
        scrollSpeed: 300,            // Speed back to top (ms)
        easingType: 'linear',        // Scroll to top easing (see http://easings.net/)
        animation: 'fade',           // Fade, slide, none
        animationSpeed: 200,         // Animation in speed (ms)
        scrollTrigger: false,        // Set a custom triggering element. Can be an HTML string or jQuery object
        scrollTarget: false,         // Set a custom target element for scrolling to. Can be element or number
        scrollText: 'Scroll to top', // Text for element, can contain HTML
        scrollTitle: false,          // Set a custom <a> title if required. Defaults to scrollText
        scrollImg: false,            // Set true to use image
        activeOverlay: false,        // Set CSS color to display scrollUp active point, e.g '#00FFFF'
        zIndex: 2147483647           // Z-Index for the overlay
    };

    // Destroy scrollUp plugin and clean all modifications to the DOM
    $.fn.scrollUp.destroy = function (scrollEvent) {
        $.removeData(document.body, 'scrollUp');
        $('#' + $.fn.scrollUp.settings.scrollName).remove();
        $('#' + $.fn.scrollUp.settings.scrollName + '-active').remove();

        // If 1.7 or above use the new .off()
        if ($.fn.jquery.split('.')[1] >= 7) {
            $(window).off('scroll', scrollEvent);

        // Else use the old .unbind()
        } else {
            $(window).unbind('scroll', scrollEvent);
        }
    };

    $.scrollUp = $.fn.scrollUp;

})(jQuery, window, document);

/* ========================================================================
 * Bootstrap: transition.js v3.2.0
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false
    var $el = this
    $(this).one('bsTransitionEnd', function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()

    if (!$.support.transition) return

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
      }
    }
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: alert.js v3.2.0
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]'
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close)
  }

  Alert.VERSION = '3.2.0'

  Alert.prototype.close = function (e) {
    var $this    = $(this)
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = $(selector)

    if (e) e.preventDefault()

    if (!$parent.length) {
      $parent = $this.hasClass('alert') ? $this : $this.parent()
    }

    $parent.trigger(e = $.Event('close.bs.alert'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent
        .one('bsTransitionEnd', removeElement)
        .emulateTransitionEnd(150) :
      removeElement()
  }


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.alert')

      if (!data) $this.data('bs.alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.alert

  $.fn.alert             = Plugin
  $.fn.alert.Constructor = Alert


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);

/* ========================================================================
 * Bootstrap: button.js v3.2.0
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element)
    this.options   = $.extend({}, Button.DEFAULTS, options)
    this.isLoading = false
  }

  Button.VERSION  = '3.2.0'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }

  Button.prototype.setState = function (state) {
    var d    = 'disabled'
    var $el  = this.$element
    var val  = $el.is('input') ? 'val' : 'html'
    var data = $el.data()

    state = state + 'Text'

    if (data.resetText == null) $el.data('resetText', $el[val]())

    $el[val](data[state] == null ? this.options[state] : data[state])

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      if (state == 'loadingText') {
        this.isLoading = true
        $el.addClass(d).attr(d, d)
      } else if (this.isLoading) {
        this.isLoading = false
        $el.removeClass(d).removeAttr(d)
      }
    }, this), 0)
  }

  Button.prototype.toggle = function () {
    var changed = true
    var $parent = this.$element.closest('[data-toggle="buttons"]')

    if ($parent.length) {
      var $input = this.$element.find('input')
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked') && this.$element.hasClass('active')) changed = false
        else $parent.find('.active').removeClass('active')
      }
      if (changed) $input.prop('checked', !this.$element.hasClass('active')).trigger('change')
    }

    if (changed) this.$element.toggleClass('active')
  }


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.button')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.button', (data = new Button(this, options)))

      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  var old = $.fn.button

  $.fn.button             = Plugin
  $.fn.button.Constructor = Button


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


  // BUTTON DATA-API
  // ===============

  $(document).on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    var $btn = $(e.target)
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
    Plugin.call($btn, 'toggle')
    e.preventDefault()
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: carousel.js v3.2.0
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element).on('keydown.bs.carousel', $.proxy(this.keydown, this))
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options     = options
    this.paused      =
    this.sliding     =
    this.interval    =
    this.$active     =
    this.$items      = null

    this.options.pause == 'hover' && this.$element
      .on('mouseenter.bs.carousel', $.proxy(this.pause, this))
      .on('mouseleave.bs.carousel', $.proxy(this.cycle, this))
  }

  Carousel.VERSION  = '3.2.0'

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true
  }

  Carousel.prototype.keydown = function (e) {
    switch (e.which) {
      case 37: this.prev(); break
      case 39: this.next(); break
      default: return
    }

    e.preventDefault()
  }

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))

    return this
  }

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item')
    return this.$items.index(item || this.$active)
  }

  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'))

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid.bs.carousel', function () { that.to(pos) }) // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active')
    var $next     = next || $active[type]()
    var isCycling = this.interval
    var direction = type == 'next' ? 'left' : 'right'
    var fallback  = type == 'next' ? 'first' : 'last'
    var that      = this

    if (!$next.length) {
      if (!this.options.wrap) return
      $next = this.$element.find('.item')[fallback]()
    }

    if ($next.hasClass('active')) return (this.sliding = false)

    var relatedTarget = $next[0]
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    })
    this.$element.trigger(slideEvent)
    if (slideEvent.isDefaultPrevented()) return

    this.sliding = true

    isCycling && this.pause()

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active')
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
      $nextIndicator && $nextIndicator.addClass('active')
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type)
      $next[0].offsetWidth // force reflow
      $active.addClass(direction)
      $next.addClass(direction)
      $active
        .one('bsTransitionEnd', function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () {
            that.$element.trigger(slidEvent)
          }, 0)
        })
        .emulateTransitionEnd($active.css('transition-duration').slice(0, -1) * 1000)
    } else {
      $active.removeClass('active')
      $next.addClass('active')
      this.sliding = false
      this.$element.trigger(slidEvent)
    }

    isCycling && this.cycle()

    return this
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.carousel')
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  var old = $.fn.carousel

  $.fn.carousel             = Plugin
  $.fn.carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }


  // CAROUSEL DATA-API
  // =================

  $(document).on('click.bs.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var href
    var $this   = $(this)
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) // strip for ie7
    if (!$target.hasClass('carousel')) return
    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-slide-to')
    if (slideIndex) options.interval = false

    Plugin.call($target, options)

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex)
    }

    e.preventDefault()
  })

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this)
      Plugin.call($carousel, $carousel.data())
    })
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: collapse.js v3.2.0
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function (element, options) {
    this.$element      = $(element)
    this.options       = $.extend({}, Collapse.DEFAULTS, options)
    this.transitioning = null

    if (this.options.parent) this.$parent = $(this.options.parent)
    if (this.options.toggle) this.toggle()
  }

  Collapse.VERSION  = '3.2.0'

  Collapse.DEFAULTS = {
    toggle: true
  }

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width')
    return hasWidth ? 'width' : 'height'
  }

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return

    var startEvent = $.Event('show.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var actives = this.$parent && this.$parent.find('> .panel > .in')

    if (actives && actives.length) {
      var hasData = actives.data('bs.collapse')
      if (hasData && hasData.transitioning) return
      Plugin.call(actives, 'hide')
      hasData || actives.data('bs.collapse', null)
    }

    var dimension = this.dimension()

    this.$element
      .removeClass('collapse')
      .addClass('collapsing')[dimension](0)

    this.transitioning = 1

    var complete = function () {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse in')[dimension]('')
      this.transitioning = 0
      this.$element
        .trigger('shown.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    var scrollSize = $.camelCase(['scroll', dimension].join('-'))

    this.$element
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(350)[dimension](this.$element[0][scrollSize])
  }

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return

    var startEvent = $.Event('hide.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var dimension = this.dimension()

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight

    this.$element
      .addClass('collapsing')
      .removeClass('collapse')
      .removeClass('in')

    this.transitioning = 1

    var complete = function () {
      this.transitioning = 0
      this.$element
        .trigger('hidden.bs.collapse')
        .removeClass('collapsing')
        .addClass('collapse')
    }

    if (!$.support.transition) return complete.call(this)

    this.$element
      [dimension](0)
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(350)
  }

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']()
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.collapse')
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data && options.toggle && option == 'show') option = !option
      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.collapse

  $.fn.collapse             = Plugin
  $.fn.collapse.Constructor = Collapse


  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var href
    var $this   = $(this)
    var target  = $this.attr('data-target')
        || e.preventDefault()
        || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7
    var $target = $(target)
    var data    = $target.data('bs.collapse')
    var option  = data ? 'toggle' : $this.data()
    var parent  = $this.attr('data-parent')
    var $parent = parent && $(parent)

    if (!data || !data.transitioning) {
      if ($parent) $parent.find('[data-toggle="collapse"][data-parent="' + parent + '"]').not($this).addClass('collapsed')
      $this[$target.hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
    }

    Plugin.call($target, option)
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: dropdown.js v3.2.0
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.2.0'

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.trigger('focus')

      $parent
        .toggleClass('open')
        .trigger('shown.bs.dropdown', relatedTarget)
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27)/.test(e.keyCode)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive || (isActive && e.keyCode == 27)) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.divider):visible a'
    var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc)

    if (!$items.length) return

    var index = $items.index($items.filter(':focus'))

    if (e.keyCode == 38 && index > 0)                 index--                        // up
    if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
    if (!~index)                                      index = 0

    $items.eq(index).trigger('focus')
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $parent = getParent($(this))
      var relatedTarget = { relatedTarget: this }
      if (!$parent.hasClass('open')) return
      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))
      if (e.isDefaultPrevented()) return
      $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget)
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle + ', [role="menu"], [role="listbox"]', Dropdown.prototype.keydown)

}(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.2.0
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options        = options
    this.$body          = $(document.body)
    this.$element       = $(element)
    this.$backdrop      =
    this.isShown        = null
    this.scrollbarWidth = 0

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal')
        }, this))
    }
  }

  Modal.VERSION  = '3.2.0'

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.$body.addClass('modal-open')

    this.setScrollbar()
    this.escape()

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element
        .addClass('in')
        .attr('aria-hidden', false)

      that.enforceFocus()

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

      transition ?
        that.$element.find('.modal-dialog') // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          })
          .emulateTransitionEnd(300) :
        that.$element.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

    e = $.Event('hide.bs.modal')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.$body.removeClass('modal-open')

    this.resetScrollbar()
    this.escape()

    $(document).off('focusin.bs.modal')

    this.$element
      .removeClass('in')
      .attr('aria-hidden', true)
      .off('click.dismiss.bs.modal')

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(300) :
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keyup.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keyup.dismiss.bs.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.$element.trigger('hidden.bs.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
        .appendTo(this.$body)

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus.call(this.$element[0])
          : this.hide.call(this)
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(150) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(150) :
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  Modal.prototype.checkScrollbar = function () {
    if (document.body.clientWidth >= window.innerWidth) return
    this.scrollbarWidth = this.scrollbarWidth || this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    if (this.scrollbarWidth) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', '')
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.modal

  $.fn.modal             = Plugin
  $.fn.modal.Constructor = Modal


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus')
      })
    })
    Plugin.call($target, option, this)
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: tooltip.js v3.2.0
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       =
    this.options    =
    this.enabled    =
    this.timeout    =
    this.hoverState =
    this.$element   = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.2.0'

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $(this.options.viewport.selector || this.options.viewport)

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(document.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var $parent      = this.$element.parent()
        var parentDim    = this.getPosition($parent)

        placement = placement == 'bottom' && pos.top   + pos.height       + actualHeight - parentDim.scroll > parentDim.height ? 'top'    :
                    placement == 'top'    && pos.top   - parentDim.scroll - actualHeight < 0                                   ? 'bottom' :
                    placement == 'right'  && pos.right + actualWidth      > parentDim.width                                    ? 'left'   :
                    placement == 'left'   && pos.left  - actualWidth      < parentDim.left                                     ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        that.$element.trigger('shown.bs.' + that.type)
        that.hoverState = null
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(150) :
        complete()
    }
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  = offset.top  + marginTop
    offset.left = offset.left + marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var arrowDelta          = delta.left ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowPosition       = delta.left ? 'left'        : 'top'
    var arrowOffsetPosition = delta.left ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], arrowPosition)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, position) {
    this.arrow().css(position, delta ? (50 * (1 - delta / dimension) + '%') : '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function () {
    var that = this
    var $tip = this.tip()
    var e    = $.Event('hide.bs.' + this.type)

    this.$element.removeAttr('aria-describedby')

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      that.$element.trigger('hidden.bs.' + that.type)
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && this.$tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(150) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof ($e.attr('data-original-title')) != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element
    var el     = $element[0]
    var isBody = el.tagName == 'BODY'
    return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : null, {
      scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop(),
      width:  isBody ? $(window).width()  : $element.outerWidth(),
      height: isBody ? $(window).height() : $element.outerHeight()
    }, isBody ? { top: 0, left: 0 } : $element.offset())
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width   }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.width) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    return (this.$tip = this.$tip || $(this.options.template))
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.validate = function () {
    if (!this.$element[0].parentNode) {
      this.hide()
      this.$element = null
      this.options  = null
    }
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
  }

  Tooltip.prototype.destroy = function () {
    clearTimeout(this.timeout)
    this.hide().$element.off('.' + this.type).removeData('bs.' + this.type)
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(jQuery);

/* ========================================================================
 * Bootstrap: popover.js v3.2.0
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.2.0'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').empty()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }

  Popover.prototype.tip = function () {
    if (!this.$tip) this.$tip = $(this.options.template)
    return this.$tip
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

/* ========================================================================
 * Bootstrap: scrollspy.js v3.2.0
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    var process  = $.proxy(this.process, this)

    this.$body          = $('body')
    this.$scrollElement = $(element).is('body') ? $(window) : $(element)
    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options)
    this.selector       = (this.options.target || '') + ' .nav li > a'
    this.offsets        = []
    this.targets        = []
    this.activeTarget   = null
    this.scrollHeight   = 0

    this.$scrollElement.on('scroll.bs.scrollspy', process)
    this.refresh()
    this.process()
  }

  ScrollSpy.VERSION  = '3.2.0'

  ScrollSpy.DEFAULTS = {
    offset: 10
  }

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
  }

  ScrollSpy.prototype.refresh = function () {
    var offsetMethod = 'offset'
    var offsetBase   = 0

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position'
      offsetBase   = this.$scrollElement.scrollTop()
    }

    this.offsets = []
    this.targets = []
    this.scrollHeight = this.getScrollHeight()

    var self     = this

    this.$body
      .find(this.selector)
      .map(function () {
        var $el   = $(this)
        var href  = $el.data('target') || $el.attr('href')
        var $href = /^#./.test(href) && $(href)

        return ($href
          && $href.length
          && $href.is(':visible')
          && [[$href[offsetMethod]().top + offsetBase, href]]) || null
      })
      .sort(function (a, b) { return a[0] - b[0] })
      .each(function () {
        self.offsets.push(this[0])
        self.targets.push(this[1])
      })
  }

  ScrollSpy.prototype.process = function () {
    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset
    var scrollHeight = this.getScrollHeight()
    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()
    var offsets      = this.offsets
    var targets      = this.targets
    var activeTarget = this.activeTarget
    var i

    if (this.scrollHeight != scrollHeight) {
      this.refresh()
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
    }

    if (activeTarget && scrollTop <= offsets[0]) {
      return activeTarget != (i = targets[0]) && this.activate(i)
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i]
        && scrollTop >= offsets[i]
        && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
        && this.activate(targets[i])
    }
  }

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target

    $(this.selector)
      .parentsUntil(this.options.target, '.active')
      .removeClass('active')

    var selector = this.selector +
        '[data-target="' + target + '"],' +
        this.selector + '[href="' + target + '"]'

    var active = $(selector)
      .parents('li')
      .addClass('active')

    if (active.parent('.dropdown-menu').length) {
      active = active
        .closest('li.dropdown')
        .addClass('active')
    }

    active.trigger('activate.bs.scrollspy')
  }


  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.scrollspy')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.scrollspy

  $.fn.scrollspy             = Plugin
  $.fn.scrollspy.Constructor = ScrollSpy


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      Plugin.call($spy, $spy.data())
    })
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: tab.js v3.2.0
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.VERSION = '3.2.0'

  Tab.prototype.show = function () {
    var $this    = this.element
    var $ul      = $this.closest('ul:not(.dropdown-menu)')
    var selector = $this.data('target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return

    var previous = $ul.find('.active:last a')[0]
    var e        = $.Event('show.bs.tab', {
      relatedTarget: previous
    })

    $this.trigger(e)

    if (e.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.closest('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: previous
      })
    })
  }

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .active')
    var transition = callback
      && $.support.transition
      && $active.hasClass('fade')

    function next() {
      $active
        .removeClass('active')
        .find('> .dropdown-menu > .active')
        .removeClass('active')

      element.addClass('active')

      if (transition) {
        element[0].offsetWidth // reflow for transition
        element.addClass('in')
      } else {
        element.removeClass('fade')
      }

      if (element.parent('.dropdown-menu')) {
        element.closest('li.dropdown').addClass('active')
      }

      callback && callback()
    }

    transition ?
      $active
        .one('bsTransitionEnd', next)
        .emulateTransitionEnd(150) :
      next()

    $active.removeClass('in')
  }


  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.tab')

      if (!data) $this.data('bs.tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tab

  $.fn.tab             = Plugin
  $.fn.tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


  // TAB DATA-API
  // ============

  $(document).on('click.bs.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    Plugin.call($(this), 'show')
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: affix.js v3.2.0
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))

    this.$element     = $(element)
    this.affixed      =
    this.unpin        =
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION  = '3.2.0'

  Affix.RESET    = 'affix affix-top affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset
    this.$element.removeClass(Affix.RESET).addClass('affix')
    var scrollTop = this.$target.scrollTop()
    var position  = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
    var scrollTop    = this.$target.scrollTop()
    var position     = this.$element.offset()
    var offset       = this.options.offset
    var offsetTop    = offset.top
    var offsetBottom = offset.bottom

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.unpin   != null && (scrollTop + this.unpin <= position.top) ? false :
                offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ? 'bottom' :
                offsetTop    != null && (scrollTop <= offsetTop) ? 'top' : false

    if (this.affixed === affix) return
    if (this.unpin != null) this.$element.css('top', '')

    var affixType = 'affix' + (affix ? '-' + affix : '')
    var e         = $.Event(affixType + '.bs.affix')

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

    this.$element
      .removeClass(Affix.RESET)
      .addClass(affixType)
      .trigger($.Event(affixType.replace('affix', 'affixed')))

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - this.$element.height() - offsetBottom
      })
    }
  }


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.affix

  $.fn.affix             = Plugin
  $.fn.affix.Constructor = Affix


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom) data.offset.bottom = data.offsetBottom
      if (data.offsetTop)    data.offset.top    = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);

"undefined"==typeof jwplayer&&(jwplayer=function(e){if(jwplayer.api)return jwplayer.api.selectPlayer(e)},jwplayer.version="6.8.4616",jwplayer.vid=document.createElement("video"),jwplayer.audio=document.createElement("audio"),jwplayer.source=document.createElement("source"),function(e){function a(h){return function(){return b(h)}}function l(h,b,a,k,j){return function(){var d,f;if(j)a(h);else{try{if(d=h.responseXML)if(f=d.firstChild,d.lastChild&&"parsererror"===d.lastChild.nodeName){k&&k("Invalid XML");
return}}catch(g){}if(d&&f)return a(h);(d=c.parseXML(h.responseText))&&d.firstChild?(h=c.extend({},h,{responseXML:d}),a(h)):k&&k(h.responseText?"Invalid XML":b)}}}var g=document,f=window,d=navigator,c=e.utils=function(){};c.exists=function(h){switch(typeof h){case "string":return 0<h.length;case "object":return null!==h;case "undefined":return!1}return!0};c.styleDimension=function(h){return h+(0<h.toString().indexOf("%")?"":"px")};c.getAbsolutePath=function(h,b){c.exists(b)||(b=g.location.href);if(c.exists(h)){var a;
if(c.exists(h)){a=h.indexOf("://");var k=h.indexOf("?");a=0<a&&(0>k||k>a)}else a=void 0;if(a)return h;a=b.substring(0,b.indexOf("://")+3);var k=b.substring(a.length,b.indexOf("/",a.length+1)),j;0===h.indexOf("/")?j=h.split("/"):(j=b.split("?")[0],j=j.substring(a.length+k.length+1,j.lastIndexOf("/")),j=j.split("/").concat(h.split("/")));for(var d=[],f=0;f<j.length;f++)j[f]&&(c.exists(j[f])&&"."!=j[f])&&(".."==j[f]?d.pop():d.push(j[f]));return a+k+"/"+d.join("/")}};c.extend=function(){var h=c.extend.arguments;
if(1<h.length){for(var a=1;a<h.length;a++)c.foreach(h[a],function(a,k){try{c.exists(k)&&(h[0][a]=k)}catch(b){}});return h[0]}return null};var m=window.console=window.console||{log:function(){}};c.log=function(){var h=Array.prototype.slice.call(arguments,0);"object"===typeof m.log?m.log(h):m.log.apply(m,h)};var b=c.userAgentMatch=function(h){return null!==d.userAgent.toLowerCase().match(h)};c.isIE=c.isMSIE=a(/msie/i);c.isFF=a(/firefox/i);c.isChrome=a(/chrome/i);c.isIPod=a(/iP(hone|od)/i);c.isIPad=
a(/iPad/i);c.isSafari602=a(/Macintosh.*Mac OS X 10_8.*6\.0\.\d* Safari/i);c.isIETrident=function(h){return h?(h=parseFloat(h).toFixed(1),b(RegExp("msie\\s*"+h+"|trident/.+rv:\\s*"+h,"i"))):b(/msie|trident/i)};c.isSafari=function(){return b(/safari/i)&&!b(/chrome/i)&&!b(/chromium/i)&&!b(/android/i)};c.isIOS=function(h){return h?b(RegExp("iP(hone|ad|od).+\\sOS\\s"+h,"i")):b(/iP(hone|ad|od)/i)};c.isAndroid=function(h,a){var c=a?!b(/chrome\/[23456789]/i):!0;return h?c&&b(RegExp("android.*"+h,"i")):c&&
b(/android/i)};c.isMobile=function(){return c.isIOS()||c.isAndroid()};c.saveCookie=function(h,a){g.cookie="jwplayer."+h+"\x3d"+a+"; path\x3d/"};c.getCookies=function(){for(var h={},a=g.cookie.split("; "),c=0;c<a.length;c++){var k=a[c].split("\x3d");0===k[0].indexOf("jwplayer.")&&(h[k[0].substring(9,k[0].length)]=k[1])}return h};c.typeOf=function(h){var a=typeof h;return"object"===a?!h?"null":h instanceof Array?"array":a:a};c.translateEventResponse=function(h,a){var b=c.extend({},a);if(h==e.events.JWPLAYER_FULLSCREEN&&
!b.fullscreen)b.fullscreen="true"==b.message?!0:!1,delete b.message;else if("object"==typeof b.data){var k=b.data;delete b.data;b=c.extend(b,k)}else"object"==typeof b.metadata&&c.deepReplaceKeyName(b.metadata,["__dot__","__spc__","__dsh__","__default__"],["."," ","-","default"]);c.foreach(["position","duration","offset"],function(h,a){b[a]&&(b[a]=Math.round(1E3*b[a])/1E3)});return b};c.flashVersion=function(){if(c.isAndroid())return 0;var h=d.plugins,a;try{if("undefined"!==h&&(a=h["Shockwave Flash"]))return parseInt(a.description.replace(/\D+(\d+)\..*/,
"$1"),10)}catch(b){}if("undefined"!=typeof f.ActiveXObject)try{if(a=new f.ActiveXObject("ShockwaveFlash.ShockwaveFlash"))return parseInt(a.GetVariable("$version").split(" ")[1].split(",")[0],10)}catch(k){}return 0};c.getScriptPath=function(h){for(var a=g.getElementsByTagName("script"),b=0;b<a.length;b++){var c=a[b].src;if(c&&0<=c.indexOf(h))return c.substr(0,c.indexOf(h))}return""};c.deepReplaceKeyName=function(h,a,b){switch(e.utils.typeOf(h)){case "array":for(var k=0;k<h.length;k++)h[k]=e.utils.deepReplaceKeyName(h[k],
a,b);break;case "object":c.foreach(h,function(c,k){var d;if(a instanceof Array&&b instanceof Array){if(a.length!=b.length)return;d=a}else d=[a];for(var f=c,g=0;g<d.length;g++)f=f.replace(RegExp(a[g],"g"),b[g]);h[f]=e.utils.deepReplaceKeyName(k,a,b);c!=f&&delete h[c]})}return h};var p=c.pluginPathType={ABSOLUTE:0,RELATIVE:1,CDN:2};c.getPluginPathType=function(h){if("string"==typeof h){h=h.split("?")[0];var a=h.indexOf("://");if(0<a)return p.ABSOLUTE;var b=h.indexOf("/");h=c.extension(h);return 0>a&&
0>b&&(!h||!isNaN(h))?p.CDN:p.RELATIVE}};c.getPluginName=function(h){return h.replace(/^(.*\/)?([^-]*)-?.*\.(swf|js)$/,"$2")};c.getPluginVersion=function(h){return h.replace(/[^-]*-?([^\.]*).*$/,"$1")};c.isYouTube=function(h){return/^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/.test(h)};c.youTubeID=function(h){try{return/v[=\/]([^?&]*)|youtu\.be\/([^?]*)|^([\w-]*)$/i.exec(h).slice(1).join("").replace("?","")}catch(a){return""}};c.isRtmp=function(h,a){return 0===h.indexOf("rtmp")||"rtmp"==a};c.foreach=
function(a,b){var d,k;for(d in a)"function"==c.typeOf(a.hasOwnProperty)?a.hasOwnProperty(d)&&(k=a[d],b(d,k)):(k=a[d],b(d,k))};c.isHTTPS=function(){return 0===f.location.href.indexOf("https")};c.repo=function(){var a="http://p.jwpcdn.com/"+e.version.split(/\W/).splice(0,2).join("/")+"/";try{c.isHTTPS()&&(a=a.replace("http://","https://ssl."))}catch(b){}return a};c.ajax=function(a,b,d,k){var j;0<a.indexOf("#")&&(a=a.replace(/#.*$/,""));if(a&&0<=a.indexOf("://")&&a.split("/")[2]!=f.location.href.split("/")[2]&&
c.exists(f.XDomainRequest))j=new f.XDomainRequest,j.onload=l(j,a,b,d,k),j.ontimeout=j.onprogress=function(){},j.timeout=5E3;else if(c.exists(f.XMLHttpRequest)){var g=j=new f.XMLHttpRequest,t=a;j.onreadystatechange=function(){if(4===g.readyState)switch(g.status){case 200:l(g,t,b,d,k)();break;case 404:d("File not found")}}}else return d&&d(),j;j.overrideMimeType&&j.overrideMimeType("text/xml");j.onerror=function(){d("Error loading file")};setTimeout(function(){try{j.open("GET",a,!0),j.send()}catch(b){d&&
d(a)}},0);return j};c.parseXML=function(a){var b;try{if(f.DOMParser){if(b=(new f.DOMParser).parseFromString(a,"text/xml"),b.childNodes&&b.childNodes.length&&"parsererror"==b.childNodes[0].firstChild.nodeName)return}else b=new f.ActiveXObject("Microsoft.XMLDOM"),b.async="false",b.loadXML(a)}catch(c){return}return b};c.filterPlaylist=function(a,b){var d=[],k,j,f,g;for(k=0;k<a.length;k++)if(j=c.extend({},a[k]),j.sources=c.filterSources(j.sources),0<j.sources.length){for(f=0;f<j.sources.length;f++)g=
j.sources[f],g.label||(g.label=f.toString());d.push(j)}if(b&&0===d.length)for(k=0;k<a.length;k++)if(j=c.extend({},a[k]),j.sources=c.filterSources(j.sources,!0),0<j.sources.length){for(f=0;f<j.sources.length;f++)g=j.sources[f],g.label||(g.label=f.toString());d.push(j)}return d};c.filterSources=function(a,b){var d,k,j=c.extensionmap;if(a){k=[];for(var f=0;f<a.length;f++){var g=a[f].type,m=a[f].file;m&&(m=c.trim(m));g||(g=j.extType(c.extension(m)),a[f].type=g);b?e.embed.flashCanPlay(m,g)&&(d||(d=g),
g==d&&k.push(c.extend({},a[f]))):c.canPlayHTML5(g)&&(d||(d=g),g==d&&k.push(c.extend({},a[f])))}}return k};c.canPlayHTML5=function(a){if(c.isAndroid()&&("hls"==a||"m3u"==a||"m3u8"==a))return!1;a=c.extensionmap.types[a];return!!a&&!!e.vid.canPlayType&&e.vid.canPlayType(a)};c.seconds=function(a){a=a.replace(",",".");var b=a.split(":"),c=0;"s"==a.slice(-1)?c=parseFloat(a):"m"==a.slice(-1)?c=60*parseFloat(a):"h"==a.slice(-1)?c=3600*parseFloat(a):1<b.length?(c=parseFloat(b[b.length-1]),c+=60*parseFloat(b[b.length-
2]),3==b.length&&(c+=3600*parseFloat(b[b.length-3]))):c=parseFloat(a);return c};c.serialize=function(a){return null==a?null:"true"==a.toString().toLowerCase()?!0:"false"==a.toString().toLowerCase()?!1:isNaN(Number(a))||5<a.length||0===a.length?a:Number(a)}}(jwplayer),function(e){var a="video/",l=e.foreach,g={mp4:a+"mp4",vorbis:"audio/ogg",ogg:a+"ogg",webm:a+"webm",aac:"audio/mp4",mp3:"audio/mpeg",hls:"application/vnd.apple.mpegurl"},f={mp4:g.mp4,f4v:g.mp4,m4v:g.mp4,mov:g.mp4,m4a:g.aac,f4a:g.aac,aac:g.aac,
mp3:g.mp3,ogv:g.ogg,ogg:g.vorbis,oga:g.vorbis,webm:g.webm,m3u8:g.hls,hls:g.hls},a="video",a={flv:a,f4v:a,mov:a,m4a:a,m4v:a,mp4:a,aac:a,f4a:a,mp3:"sound",smil:"rtmp",m3u8:"hls",hls:"hls"},d=e.extensionmap={};l(f,function(a,f){d[a]={html5:f}});l(a,function(a,f){d[a]||(d[a]={});d[a].flash=f});d.types=g;d.mimeType=function(a){var d;l(g,function(b,f){!d&&f==a&&(d=b)});return d};d.extType=function(a){return d.mimeType(f[a])}}(jwplayer.utils),function(e){var a=e.loaderstatus={NEW:0,LOADING:1,ERROR:2,COMPLETE:3},
l=document;e.scriptloader=function(g){function f(){c=a.ERROR;b.sendEvent(m.ERROR)}function d(){c=a.COMPLETE;b.sendEvent(m.COMPLETE)}var c=a.NEW,m=jwplayer.events,b=new m.eventdispatcher;e.extend(this,b);this.load=function(){var b=e.scriptloader.loaders[g];if(b&&(b.getStatus()==a.NEW||b.getStatus()==a.LOADING))b.addEventListener(m.ERROR,f),b.addEventListener(m.COMPLETE,d);else if(e.scriptloader.loaders[g]=this,c==a.NEW){c=a.LOADING;var h=l.createElement("script");h.addEventListener?(h.onload=d,h.onerror=
f):h.readyState&&(h.onreadystatechange=function(){("loaded"==h.readyState||"complete"==h.readyState)&&d()});l.getElementsByTagName("head")[0].appendChild(h);h.src=g}};this.getStatus=function(){return c}};e.scriptloader.loaders={}}(jwplayer.utils),function(e){e.trim=function(a){return a.replace(/^\s*/,"").replace(/\s*$/,"")};e.pad=function(a,e,g){for(g||(g="0");a.length<e;)a=g+a;return a};e.xmlAttribute=function(a,e){for(var g=0;g<a.attributes.length;g++)if(a.attributes[g].name&&a.attributes[g].name.toLowerCase()==
e.toLowerCase())return a.attributes[g].value.toString();return""};e.extension=function(a){if(!a||"rtmp"==a.substr(0,4))return"";a=a.substring(a.lastIndexOf("/")+1,a.length).split("?")[0].split("#")[0];if(-1<a.lastIndexOf("."))return a.substr(a.lastIndexOf(".")+1,a.length).toLowerCase()};e.stringToColor=function(a){a=a.replace(/(#|0x)?([0-9A-F]{3,6})$/gi,"$2");3==a.length&&(a=a.charAt(0)+a.charAt(0)+a.charAt(1)+a.charAt(1)+a.charAt(2)+a.charAt(2));return parseInt(a,16)}}(jwplayer.utils),function(e){var a=
"touchmove",l="touchstart";e.touch=function(g){function f(k){k.type==l?(b=!0,h=c(n.DRAG_START,k)):k.type==a?b&&(q||(d(n.DRAG_START,k,h),q=!0),d(n.DRAG,k)):(b&&(q?d(n.DRAG_END,k):(k.cancelBubble=!0,d(n.TAP,k))),b=q=!1,h=null)}function d(a,b,d){if(p[a]&&(b.preventManipulation&&b.preventManipulation(),b.preventDefault&&b.preventDefault(),b=d?d:c(a,b)))p[a](b)}function c(a,b){var d=null;b.touches&&b.touches.length?d=b.touches[0]:b.changedTouches&&b.changedTouches.length&&(d=b.changedTouches[0]);if(!d)return null;
var c=m.getBoundingClientRect(),d={type:a,target:m,x:d.pageX-window.pageXOffset-c.left,y:d.pageY,deltaX:0,deltaY:0};a!=n.TAP&&h&&(d.deltaX=d.x-h.x,d.deltaY=d.y-h.y);return d}var m=g,b=!1,p={},h=null,q=!1,n=e.touchEvents;document.addEventListener(a,f);document.addEventListener("touchend",function(a){b&&q&&d(n.DRAG_END,a);b=q=!1;h=null});document.addEventListener("touchcancel",f);g.addEventListener(l,f);g.addEventListener("touchend",f);this.addEventListener=function(a,b){p[a]=b};this.removeEventListener=
function(a){delete p[a]};return this}}(jwplayer.utils),function(e){e.touchEvents={DRAG:"jwplayerDrag",DRAG_START:"jwplayerDragStart",DRAG_END:"jwplayerDragEnd",TAP:"jwplayerTap"}}(jwplayer.utils),function(e){e.key=function(a){var l,g,f;this.edition=function(){return f&&f.getTime()<(new Date).getTime()?"invalid":l};this.token=function(){return g};e.exists(a)||(a="");try{a=e.tea.decrypt(a,"36QXq4W@GSBV^teR");var d=a.split("/");(l=d[0])?/^(free|pro|premium|ads)$/i.test(l)?(g=d[1],d[2]&&0<parseInt(d[2])&&
(f=new Date,f.setTime(String(d[2])))):l="invalid":l="free"}catch(c){l="invalid"}}}(jwplayer.utils),function(e){var a=e.tea={};a.encrypt=function(f,d){if(0==f.length)return"";var c=a.strToLongs(g.encode(f));1>=c.length&&(c[1]=0);for(var m=a.strToLongs(g.encode(d).slice(0,16)),b=c.length,e=c[b-1],h=c[0],q,n=Math.floor(6+52/b),k=0;0<n--;){k+=2654435769;q=k>>>2&3;for(var j=0;j<b;j++)h=c[(j+1)%b],e=(e>>>5^h<<2)+(h>>>3^e<<4)^(k^h)+(m[j&3^q]^e),e=c[j]+=e}c=a.longsToStr(c);return l.encode(c)};a.decrypt=function(f,
d){if(0==f.length)return"";for(var c=a.strToLongs(l.decode(f)),m=a.strToLongs(g.encode(d).slice(0,16)),b=c.length,e=c[b-1],h=c[0],q,n=2654435769*Math.floor(6+52/b);0!=n;){q=n>>>2&3;for(var k=b-1;0<=k;k--)e=c[0<k?k-1:b-1],e=(e>>>5^h<<2)+(h>>>3^e<<4)^(n^h)+(m[k&3^q]^e),h=c[k]-=e;n-=2654435769}c=a.longsToStr(c);c=c.replace(/\0+$/,"");return g.decode(c)};a.strToLongs=function(a){for(var d=Array(Math.ceil(a.length/4)),c=0;c<d.length;c++)d[c]=a.charCodeAt(4*c)+(a.charCodeAt(4*c+1)<<8)+(a.charCodeAt(4*c+
2)<<16)+(a.charCodeAt(4*c+3)<<24);return d};a.longsToStr=function(a){for(var d=Array(a.length),c=0;c<a.length;c++)d[c]=String.fromCharCode(a[c]&255,a[c]>>>8&255,a[c]>>>16&255,a[c]>>>24&255);return d.join("")};var l={code:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\x3d",encode:function(a,d){var c,e,b,p,h=[],q="",n,k,j=l.code;k=("undefined"==typeof d?0:d)?g.encode(a):a;n=k.length%3;if(0<n)for(;3>n++;)q+="\x3d",k+="\x00";for(n=0;n<k.length;n+=3)c=k.charCodeAt(n),e=k.charCodeAt(n+
1),b=k.charCodeAt(n+2),p=c<<16|e<<8|b,c=p>>18&63,e=p>>12&63,b=p>>6&63,p&=63,h[n/3]=j.charAt(c)+j.charAt(e)+j.charAt(b)+j.charAt(p);h=h.join("");return h=h.slice(0,h.length-q.length)+q},decode:function(a,d){d="undefined"==typeof d?!1:d;var c,e,b,p,h,q=[],n,k=l.code;n=d?g.decode(a):a;for(var j=0;j<n.length;j+=4)c=k.indexOf(n.charAt(j)),e=k.indexOf(n.charAt(j+1)),p=k.indexOf(n.charAt(j+2)),h=k.indexOf(n.charAt(j+3)),b=c<<18|e<<12|p<<6|h,c=b>>>16&255,e=b>>>8&255,b&=255,q[j/4]=String.fromCharCode(c,e,
b),64==h&&(q[j/4]=String.fromCharCode(c,e)),64==p&&(q[j/4]=String.fromCharCode(c));p=q.join("");return d?g.decode(p):p}},g={encode:function(a){a=a.replace(/[\u0080-\u07ff]/g,function(a){a=a.charCodeAt(0);return String.fromCharCode(192|a>>6,128|a&63)});return a=a.replace(/[\u0800-\uffff]/g,function(a){a=a.charCodeAt(0);return String.fromCharCode(224|a>>12,128|a>>6&63,128|a&63)})},decode:function(a){a=a.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,function(a){a=(a.charCodeAt(0)&15)<<12|
(a.charCodeAt(1)&63)<<6|a.charCodeAt(2)&63;return String.fromCharCode(a)});return a=a.replace(/[\u00c0-\u00df][\u0080-\u00bf]/g,function(a){a=(a.charCodeAt(0)&31)<<6|a.charCodeAt(1)&63;return String.fromCharCode(a)})}}}(jwplayer.utils),function(e){e.events={COMPLETE:"COMPLETE",ERROR:"ERROR",API_READY:"jwplayerAPIReady",JWPLAYER_READY:"jwplayerReady",JWPLAYER_FULLSCREEN:"jwplayerFullscreen",JWPLAYER_RESIZE:"jwplayerResize",JWPLAYER_ERROR:"jwplayerError",JWPLAYER_SETUP_ERROR:"jwplayerSetupError",JWPLAYER_MEDIA_BEFOREPLAY:"jwplayerMediaBeforePlay",
JWPLAYER_MEDIA_BEFORECOMPLETE:"jwplayerMediaBeforeComplete",JWPLAYER_COMPONENT_SHOW:"jwplayerComponentShow",JWPLAYER_COMPONENT_HIDE:"jwplayerComponentHide",JWPLAYER_MEDIA_BUFFER:"jwplayerMediaBuffer",JWPLAYER_MEDIA_BUFFER_FULL:"jwplayerMediaBufferFull",JWPLAYER_MEDIA_ERROR:"jwplayerMediaError",JWPLAYER_MEDIA_LOADED:"jwplayerMediaLoaded",JWPLAYER_MEDIA_COMPLETE:"jwplayerMediaComplete",JWPLAYER_MEDIA_SEEK:"jwplayerMediaSeek",JWPLAYER_MEDIA_TIME:"jwplayerMediaTime",JWPLAYER_MEDIA_VOLUME:"jwplayerMediaVolume",
JWPLAYER_MEDIA_META:"jwplayerMediaMeta",JWPLAYER_MEDIA_MUTE:"jwplayerMediaMute",JWPLAYER_MEDIA_LEVELS:"jwplayerMediaLevels",JWPLAYER_MEDIA_LEVEL_CHANGED:"jwplayerMediaLevelChanged",JWPLAYER_CAPTIONS_CHANGED:"jwplayerCaptionsChanged",JWPLAYER_CAPTIONS_LIST:"jwplayerCaptionsList",JWPLAYER_CAPTIONS_LOADED:"jwplayerCaptionsLoaded",JWPLAYER_PLAYER_STATE:"jwplayerPlayerState",state:{BUFFERING:"BUFFERING",IDLE:"IDLE",PAUSED:"PAUSED",PLAYING:"PLAYING"},JWPLAYER_PLAYLIST_LOADED:"jwplayerPlaylistLoaded",JWPLAYER_PLAYLIST_ITEM:"jwplayerPlaylistItem",
JWPLAYER_PLAYLIST_COMPLETE:"jwplayerPlaylistComplete",JWPLAYER_DISPLAY_CLICK:"jwplayerViewClick",JWPLAYER_CONTROLS:"jwplayerViewControls",JWPLAYER_USER_ACTION:"jwplayerUserAction",JWPLAYER_INSTREAM_CLICK:"jwplayerInstreamClicked",JWPLAYER_INSTREAM_DESTROYED:"jwplayerInstreamDestroyed",JWPLAYER_AD_TIME:"jwplayerAdTime",JWPLAYER_AD_ERROR:"jwplayerAdError",JWPLAYER_AD_CLICK:"jwplayerAdClicked",JWPLAYER_AD_COMPLETE:"jwplayerAdComplete",JWPLAYER_AD_IMPRESSION:"jwplayerAdImpression",JWPLAYER_AD_COMPANIONS:"jwplayerAdCompanions",
JWPLAYER_AD_SKIPPED:"jwplayerAdSkipped"}}(jwplayer),function(e){var a=e.utils;e.events.eventdispatcher=function(l,g){function f(c,b,d){if(c)for(var h=0;h<c.length;h++){var g=c[h];if(g){null!==g.count&&0===--g.count&&delete c[h];try{g.listener(b)}catch(f){a.log('Error handling "'+d+'" event listener ['+h+"]: "+f.toString(),g.listener,b)}}}}var d,c;this.resetEventListeners=function(){d={};c=[]};this.resetEventListeners();this.addEventListener=function(c,b,g){try{a.exists(d[c])||(d[c]=[]),"string"==
a.typeOf(b)&&(b=(new Function("return "+b))()),d[c].push({listener:b,count:g||null})}catch(h){a.log("error",h)}return!1};this.removeEventListener=function(c,b){if(d[c]){try{for(var g=0;g<d[c].length;g++)if(d[c][g].listener.toString()==b.toString()){d[c].splice(g,1);break}}catch(h){a.log("error",h)}return!1}};this.addGlobalListener=function(d,b){try{"string"==a.typeOf(d)&&(d=(new Function("return "+d))()),c.push({listener:d,count:b||null})}catch(g){a.log("error",g)}return!1};this.removeGlobalListener=
function(d){if(d){try{for(var b=c.length;b--;)c[b].listener.toString()==d.toString()&&c.splice(b,1)}catch(g){a.log("error",g)}return!1}};this.sendEvent=function(m,b){a.exists(b)||(b={});a.extend(b,{id:l,version:e.version,type:m});g&&a.log(m,b);f(d[m],b,m);f(c,b,m)}}}(window.jwplayer),function(e){var a={},l={};e.plugins=function(){};e.plugins.loadPlugins=function(g,f){l[g]=new e.plugins.pluginloader(new e.plugins.model(a),f);return l[g]};e.plugins.registerPlugin=function(g,f,d,c){var m=e.utils.getPluginName(g);
a[m]||(a[m]=new e.plugins.plugin(g));a[m].registerPlugin(g,f,d,c)}}(jwplayer),function(e){e.plugins.model=function(a){this.addPlugin=function(l){var g=e.utils.getPluginName(l);a[g]||(a[g]=new e.plugins.plugin(l));return a[g]};this.getPlugins=function(){return a}}}(jwplayer),function(e){var a=jwplayer.utils,l=jwplayer.events;e.pluginmodes={FLASH:0,JAVASCRIPT:1,HYBRID:2};e.plugin=function(g){function f(){switch(a.getPluginPathType(g)){case a.pluginPathType.ABSOLUTE:return g;case a.pluginPathType.RELATIVE:return a.getAbsolutePath(g,
window.location.href)}}function d(){q=setTimeout(function(){m=a.loaderstatus.COMPLETE;n.sendEvent(l.COMPLETE)},1E3)}function c(){m=a.loaderstatus.ERROR;n.sendEvent(l.ERROR)}var m=a.loaderstatus.NEW,b,p,h,q,n=new l.eventdispatcher;a.extend(this,n);this.load=function(){if(m==a.loaderstatus.NEW)if(0<g.lastIndexOf(".swf"))b=g,m=a.loaderstatus.COMPLETE,n.sendEvent(l.COMPLETE);else if(a.getPluginPathType(g)==a.pluginPathType.CDN)m=a.loaderstatus.COMPLETE,n.sendEvent(l.COMPLETE);else{m=a.loaderstatus.LOADING;
var k=new a.scriptloader(f());k.addEventListener(l.COMPLETE,d);k.addEventListener(l.ERROR,c);k.load()}};this.registerPlugin=function(c,d,g,f){q&&(clearTimeout(q),q=void 0);h=d;g&&f?(b=f,p=g):"string"==typeof g?b=g:"function"==typeof g?p=g:!g&&!f&&(b=c);m=a.loaderstatus.COMPLETE;n.sendEvent(l.COMPLETE)};this.getStatus=function(){return m};this.getPluginName=function(){return a.getPluginName(g)};this.getFlashPath=function(){if(b)switch(a.getPluginPathType(b)){case a.pluginPathType.ABSOLUTE:return b;
case a.pluginPathType.RELATIVE:return 0<g.lastIndexOf(".swf")?a.getAbsolutePath(b,window.location.href):a.getAbsolutePath(b,f())}return null};this.getJS=function(){return p};this.getTarget=function(){return h};this.getPluginmode=function(){if("undefined"!=typeof b&&"undefined"!=typeof p)return e.pluginmodes.HYBRID;if("undefined"!=typeof b)return e.pluginmodes.FLASH;if("undefined"!=typeof p)return e.pluginmodes.JAVASCRIPT};this.getNewInstance=function(a,b,c){return new p(a,b,c)};this.getURL=function(){return g}}}(jwplayer.plugins),
function(e){var a=e.utils,l=e.events,g=a.foreach;e.plugins.pluginloader=function(f,d){function c(){h?k.sendEvent(l.ERROR,{message:q}):p||(p=!0,b=a.loaderstatus.COMPLETE,k.sendEvent(l.COMPLETE))}function m(){n||c();if(!p&&!h){var b=0,d=f.getPlugins();a.foreach(n,function(g){g=a.getPluginName(g);var k=d[g];g=k.getJS();var f=k.getTarget(),k=k.getStatus();if(k==a.loaderstatus.LOADING||k==a.loaderstatus.NEW)b++;else if(g&&(!f||parseFloat(f)>parseFloat(e.version)))h=!0,q="Incompatible player version",c()});
0==b&&c()}}var b=a.loaderstatus.NEW,p=!1,h=!1,q,n=d,k=new l.eventdispatcher;a.extend(this,k);this.setupPlugins=function(b,c,d){var k={length:0,plugins:{}},h=0,j={},e=f.getPlugins();g(c.plugins,function(g,f){var m=a.getPluginName(g),p=e[m],l=p.getFlashPath(),n=p.getJS(),q=p.getURL();l&&(k.plugins[l]=a.extend({},f),k.plugins[l].pluginmode=p.getPluginmode(),k.length++);try{if(n&&c.plugins&&c.plugins[q]){var C=document.createElement("div");C.id=b.id+"_"+m;C.style.position="absolute";C.style.top=0;C.style.zIndex=
h+10;j[m]=p.getNewInstance(b,a.extend({},c.plugins[q]),C);h++;b.onReady(d(j[m],C,!0));b.onResize(d(j[m],C))}}catch(F){a.log("ERROR: Failed to load "+m+".")}});b.plugins=j;return k};this.load=function(){if(!(a.exists(d)&&"object"!=a.typeOf(d))){b=a.loaderstatus.LOADING;g(d,function(b){a.exists(b)&&(b=f.addPlugin(b),b.addEventListener(l.COMPLETE,m),b.addEventListener(l.ERROR,j))});var c=f.getPlugins();g(c,function(a,b){b.load()})}m()};var j=this.pluginFailed=function(){h||(h=!0,q="File not found",c())};
this.getStatus=function(){return b}}}(jwplayer),function(){jwplayer.parsers={localName:function(e){return e?e.localName?e.localName:e.baseName?e.baseName:"":""},textContent:function(e){return e?e.textContent?jwplayer.utils.trim(e.textContent):e.text?jwplayer.utils.trim(e.text):"":""},getChildNode:function(e,a){return e.childNodes[a]},numChildren:function(e){return e.childNodes?e.childNodes.length:0}}}(jwplayer),function(e){var a=e.parsers;(a.jwparser=function(){}).parseEntry=function(l,g){for(var f=
[],d=[],c=e.utils.xmlAttribute,m=0;m<l.childNodes.length;m++){var b=l.childNodes[m];if("jwplayer"==b.prefix){var p=a.localName(b);"source"==p?(delete g.sources,f.push({file:c(b,"file"),"default":c(b,"default"),label:c(b,"label"),type:c(b,"type")})):"track"==p?(delete g.tracks,d.push({file:c(b,"file"),"default":c(b,"default"),kind:c(b,"kind"),label:c(b,"label")})):(g[p]=e.utils.serialize(a.textContent(b)),"file"==p&&g.sources&&delete g.sources)}g.file||(g.file=g.link)}if(f.length){g.sources=[];for(m=
0;m<f.length;m++)0<f[m].file.length&&(f[m]["default"]="true"==f[m]["default"]?!0:!1,f[m].label.length||delete f[m].label,g.sources.push(f[m]))}if(d.length){g.tracks=[];for(m=0;m<d.length;m++)0<d[m].file.length&&(d[m]["default"]="true"==d[m]["default"]?!0:!1,d[m].kind=!d[m].kind.length?"captions":d[m].kind,d[m].label.length||delete d[m].label,g.tracks.push(d[m]))}return g}}(jwplayer),function(e){var a=jwplayer.utils,l=a.xmlAttribute,g=e.localName,f=e.textContent,d=e.numChildren,c=e.mediaparser=function(){};
c.parseGroup=function(e,b){var p,h,q=[];for(h=0;h<d(e);h++)if(p=e.childNodes[h],"media"==p.prefix&&g(p))switch(g(p).toLowerCase()){case "content":l(p,"duration")&&(b.duration=a.seconds(l(p,"duration")));0<d(p)&&(b=c.parseGroup(p,b));l(p,"url")&&(b.sources||(b.sources=[]),b.sources.push({file:l(p,"url"),type:l(p,"type"),width:l(p,"width"),label:l(p,"label")}));break;case "title":b.title=f(p);break;case "description":b.description=f(p);break;case "guid":b.mediaid=f(p);break;case "thumbnail":b.image||
(b.image=l(p,"url"));break;case "group":c.parseGroup(p,b);break;case "subtitle":var n={};n.file=l(p,"url");n.kind="captions";if(0<l(p,"lang").length){var k=n;p=l(p,"lang");var j={zh:"Chinese",nl:"Dutch",en:"English",fr:"French",de:"German",it:"Italian",ja:"Japanese",pt:"Portuguese",ru:"Russian",es:"Spanish"};p=j[p]?j[p]:p;k.label=p}q.push(n)}b.hasOwnProperty("tracks")||(b.tracks=[]);for(h=0;h<q.length;h++)b.tracks.push(q[h]);return b}}(jwplayer.parsers),function(e){function a(a){for(var b={},d=0;d<
a.childNodes.length;d++){var h=a.childNodes[d],f=c(h);if(f)switch(f.toLowerCase()){case "enclosure":b.file=l.xmlAttribute(h,"url");break;case "title":b.title=g(h);break;case "guid":b.mediaid=g(h);break;case "pubdate":b.date=g(h);break;case "description":b.description=g(h);break;case "link":b.link=g(h);break;case "category":b.tags=b.tags?b.tags+g(h):g(h)}}b=e.mediaparser.parseGroup(a,b);b=e.jwparser.parseEntry(a,b);return new jwplayer.playlist.item(b)}var l=jwplayer.utils,g=e.textContent,f=e.getChildNode,
d=e.numChildren,c=e.localName;e.rssparser={};e.rssparser.parse=function(g){for(var b=[],e=0;e<d(g);e++){var h=f(g,e);if("channel"==c(h).toLowerCase())for(var l=0;l<d(h);l++){var n=f(h,l);"item"==c(n).toLowerCase()&&b.push(a(n))}}return b}}(jwplayer.parsers),function(e){e.playlist=function(a){var l=[];if("array"==e.utils.typeOf(a))for(var g=0;g<a.length;g++)l.push(new e.playlist.item(a[g]));else l.push(new e.playlist.item(a));return l}}(jwplayer),function(e){var a=e.item=function(l){var g=jwplayer.utils,
f=g.extend({},a.defaults,l);f.tracks=l&&g.exists(l.tracks)?l.tracks:[];0==f.sources.length&&(f.sources=[new e.source(f)]);for(var d=0;d<f.sources.length;d++){var c=f.sources[d]["default"];f.sources[d]["default"]=c?"true"==c.toString():!1;f.sources[d]=new e.source(f.sources[d])}if(f.captions&&!g.exists(l.tracks)){for(l=0;l<f.captions.length;l++)f.tracks.push(f.captions[l]);delete f.captions}for(d=0;d<f.tracks.length;d++)f.tracks[d]=new e.track(f.tracks[d]);return f};a.defaults={description:"",image:"",
mediaid:"",title:"",sources:[],tracks:[]}}(jwplayer.playlist),function(e){var a=jwplayer,l=a.utils,g=a.events,f=a.parsers;e.loader=function(){function a(c){try{var d=c.responseXML.childNodes;c="";for(var l=0;l<d.length&&!(c=d[l],8!=c.nodeType);l++);"xml"==f.localName(c)&&(c=c.nextSibling);if("rss"!=f.localName(c))m("Not a valid RSS feed");else{var n=new e(f.rssparser.parse(c));b.sendEvent(g.JWPLAYER_PLAYLIST_LOADED,{playlist:n})}}catch(k){m()}}function c(a){m(a.match(/invalid/i)?"Not a valid RSS feed":
"")}function m(a){b.sendEvent(g.JWPLAYER_ERROR,{message:a?a:"Error loading file"})}var b=new g.eventdispatcher;l.extend(this,b);this.load=function(b){l.ajax(b,a,c)}}}(jwplayer.playlist),function(e){var a=jwplayer.utils,l={file:void 0,label:void 0,type:void 0,"default":void 0};e.source=function(g){var f=a.extend({},l);a.foreach(l,function(d){a.exists(g[d])&&(f[d]=g[d],delete g[d])});f.type&&0<f.type.indexOf("/")&&(f.type=a.extensionmap.mimeType(f.type));"m3u8"==f.type&&(f.type="hls");"smil"==f.type&&
(f.type="rtmp");return f}}(jwplayer.playlist),function(e){var a=jwplayer.utils,l={file:void 0,label:void 0,kind:"captions","default":!1};e.track=function(g){var f=a.extend({},l);g||(g={});a.foreach(l,function(d){a.exists(g[d])&&(f[d]=g[d],delete g[d])});return f}}(jwplayer.playlist),function(e){function a(a,c,d){var g=a.style;g.backgroundColor="#000";g.color="#FFF";g.width=l.styleDimension(d.width);g.height=l.styleDimension(d.height);g.display="table";g.opacity=1;d=document.createElement("p");g=d.style;
g.verticalAlign="middle";g.textAlign="center";g.display="table-cell";g.font="15px/20px Arial, Helvetica, sans-serif";d.innerHTML=c.replace(":",":\x3cbr\x3e");a.innerHTML="";a.appendChild(d)}var l=e.utils,g=e.events,f=!0,d=!1,c=document,m=e.embed=function(b){function p(a,b){l.foreach(b,function(b,c){"function"==typeof a[b]&&a[b].call(a,c)})}function h(){if(!E)if("array"==l.typeOf(t.playlist)&&2>t.playlist.length&&(0==t.playlist.length||!t.playlist[0].sources||0==t.playlist[0].sources.length))k();else if(!B)if("string"==
l.typeOf(t.playlist)){var a=new e.playlist.loader;a.addEventListener(g.JWPLAYER_PLAYLIST_LOADED,function(a){t.playlist=a.playlist;B=d;h()});a.addEventListener(g.JWPLAYER_ERROR,function(a){B=d;k(a)});B=f;a.load(t.playlist)}else if(y.getStatus()==l.loaderstatus.COMPLETE){for(a=0;a<t.modes.length;a++)if(t.modes[a].type&&m[t.modes[a].type]){var c=l.extend({},t),n=new m[t.modes[a].type](r,t.modes[a],c,y,b);if(n.supportsConfig())return n.addEventListener(g.ERROR,q),n.embed(),p(b,c.events),b}var u;t.fallback?
(u="No suitable players found and fallback enabled",D=setTimeout(function(){j(u,f)},10),l.log(u),new m.download(r,t,k)):(u="No suitable players found and fallback disabled",j(u,d),l.log(u),r.parentNode.replaceChild(w,r))}}function q(a){u(A+a.message)}function n(a){u("Could not load plugins: "+a.message)}function k(a){a&&a.message?u("Error loading playlist: "+a.message):u(A+"No playable sources found")}function j(a,c){D&&(clearTimeout(D),D=null);D=setTimeout(function(){D=null;b.dispatchEvent(g.JWPLAYER_SETUP_ERROR,
{message:a,fallback:c})},0)}function u(b){E||(t.fallback?(E=f,a(r,b,t),j(b,f)):j(b,d))}var t=new m.config(b.config),r,v,w,x=t.width,z=t.height,A="Error loading player: ",y=e.plugins.loadPlugins(b.id,t.plugins),B=d,E=d,D=null;t.fallbackDiv&&(w=t.fallbackDiv,delete t.fallbackDiv);t.id=b.id;v=c.getElementById(b.id);t.aspectratio?b.config.aspectratio=t.aspectratio:delete b.config.aspectratio;r=c.createElement("div");r.id=v.id;r.style.width=0<x.toString().indexOf("%")?x:x+"px";r.style.height=0<z.toString().indexOf("%")?
z:z+"px";v.parentNode.replaceChild(r,v);this.embed=function(){E||(y.addEventListener(g.COMPLETE,h),y.addEventListener(g.ERROR,n),y.load())};this.errorScreen=u;return this};e.embed.errorScreen=a}(jwplayer),function(e){function a(a){if(a.playlist)for(var c=0;c<a.playlist.length;c++)a.playlist[c]=new f(a.playlist[c]);else{var e={};g.foreach(f.defaults,function(b){l(a,e,b)});e.sources||(a.levels?(e.sources=a.levels,delete a.levels):(c={},l(a,c,"file"),l(a,c,"type"),e.sources=c.file?[c]:[]));a.playlist=
[new f(e)]}}function l(a,c,f){g.exists(a[f])&&(c[f]=a[f],delete a[f])}var g=e.utils,f=e.playlist.item;(e.embed.config=function(d){var c={fallback:!0,height:270,primary:"html5",width:480,base:d.base?d.base:g.getScriptPath("jwplayer.js"),aspectratio:""};d=g.extend(c,e.defaults,d);var c={type:"html5",src:d.base+"jwplayer.html5.js"},f={type:"flash",src:d.base+"jwplayer.flash.swf"};d.modes="flash"==d.primary?[f,c]:[c,f];d.listbar&&(d.playlistsize=d.listbar.size,d.playlistposition=d.listbar.position,d.playlistlayout=
d.listbar.layout);d.flashplayer&&(f.src=d.flashplayer);d.html5player&&(c.src=d.html5player);a(d);f=d.aspectratio;if("string"!=typeof f||!g.exists(f))c=0;else{var b=f.indexOf(":");-1==b?c=0:(c=parseFloat(f.substr(0,b)),f=parseFloat(f.substr(b+1)),c=0>=c||0>=f?0:100*(f/c)+"%")}-1==d.width.toString().indexOf("%")?delete d.aspectratio:c?d.aspectratio=c:delete d.aspectratio;return d}).addConfig=function(d,c){a(c);return g.extend(d,c)}}(jwplayer),function(e){var a=e.utils,l=document;e.embed.download=function(g,
f,d){function c(b,c){for(var d=l.querySelectorAll(b),g=0;g<d.length;g++)a.foreach(c,function(a,b){d[g].style[a]=b})}function e(a,b,c){a=l.createElement(a);b&&(a.className="jwdownload"+b);c&&c.appendChild(a);return a}var b=a.extend({},f),p=b.width?b.width:480,h=b.height?b.height:320,q;f=f.logo?f.logo:{prefix:a.repo(),file:"logo.png",margin:10};var n,k,j,b=b.playlist,u,t=["mp4","aac","mp3"];if(b&&b.length){u=b[0];q=u.sources;for(b=0;b<q.length;b++){var r=q[b],v=r.type?r.type:a.extensionmap.extType(a.extension(r.file));
r.file&&a.foreach(t,function(b){v==t[b]?(n=r.file,k=u.image):a.isYouTube(r.file)&&(j=r.file)})}n?(q=n,d=k,g&&(b=e("a","display",g),e("div","icon",b),e("div","logo",b),q&&b.setAttribute("href",a.getAbsolutePath(q))),b="#"+g.id+" .jwdownload",g.style.width="",g.style.height="",c(b+"display",{width:a.styleDimension(Math.max(320,p)),height:a.styleDimension(Math.max(180,h)),background:"black center no-repeat "+(d?"url("+d+")":""),backgroundSize:"contain",position:"relative",border:"none",display:"block"}),
c(b+"display div",{position:"absolute",width:"100%",height:"100%"}),c(b+"logo",{top:f.margin+"px",right:f.margin+"px",background:"top right no-repeat url("+f.prefix+f.file+")"}),c(b+"icon",{background:"center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAgNJREFUeNrs28lqwkAYB/CZqNVDDj2r6FN41QeIy8Fe+gj6BL275Q08u9FbT8ZdwVfotSBYEPUkxFOoks4EKiJdaDuTjMn3wWBO0V/+sySR8SNSqVRKIR8qaXHkzlqS9jCfzzWcTCYp9hF5o+59sVjsiRzcegSckFzcjT+ruN80TeSlAjCAAXzdJSGPFXRpAAMYwACGZQkSdhG4WCzehMNhqV6vG6vVSrirKVEw66YoSqDb7cqlUilE8JjHd/y1MQefVzqdDmiaJpfLZWHgXMHn8F6vJ1cqlVAkEsGuAn83J4gAd2RZymQygX6/L1erVQt+9ZPWb+CDwcCC2zXGJaewl/DhcHhK3DVj+KfKZrMWvFarcYNLomAv4aPRSFZVlTlcSPA5fDweW/BoNIqFnKV53JvncjkLns/n/cLdS+92O7RYLLgsKfv9/t8XlDn4eDyiw+HA9Jyz2eyt0+kY2+3WFC5hluej0Ha7zQQq9PPwdDq1Et1sNsx/nFBgCqWJ8oAK1aUptNVqcYWewE4nahfU0YQnk4ntUEfGMIU2m01HoLaCKbTRaDgKtaVLk9tBYaBcE/6Artdr4RZ5TB6/dC+9iIe/WgAMYADDpAUJAxjAAAYwgGFZgoS/AtNNTF7Z2bL0BYPBV3Jw5xFwwWcYxgtBP5OkE8i9G7aWGOOCruvauwADALMLMEbKf4SdAAAAAElFTkSuQmCC)"})):
j?(f=j,g=e("iframe","",g),g.src="http://www.youtube.com/embed/"+a.youTubeID(f),g.width=p,g.height=h,g.style.border="none"):d()}}}(jwplayer),function(e){var a=e.utils,l=e.events,g={};(e.embed.flash=function(d,c,m,b,p){function h(a,b,c){var d=document.createElement("param");d.setAttribute("name",b);d.setAttribute("value",c);a.appendChild(d)}function q(a,b,c){return function(){try{c&&document.getElementById(p.id+"_wrapper").appendChild(b);var d=document.getElementById(p.id).getPluginConfig("display");
"function"==typeof a.resize&&a.resize(d.width,d.height);b.style.left=d.x;b.style.top=d.h}catch(g){}}}function n(b){if(!b)return{};var c={},d=[];a.foreach(b,function(b,g){var k=a.getPluginName(b);d.push(b);a.foreach(g,function(a,b){c[k+"."+a]=b})});c.plugins=d.join(",");return c}var k=new e.events.eventdispatcher,j=a.flashVersion();a.extend(this,k);this.embed=function(){m.id=p.id;if(10>j)return k.sendEvent(l.ERROR,{message:"Flash version must be 10.0 or greater"}),!1;var f,e,r=p.config.listbar,v=a.extend({},
m);if(d.id+"_wrapper"==d.parentNode.id)f=document.getElementById(d.id+"_wrapper");else{f=document.createElement("div");e=document.createElement("div");e.style.display="none";e.id=d.id+"_aspect";f.id=d.id+"_wrapper";f.style.position="relative";f.style.display="block";f.style.width=a.styleDimension(v.width);f.style.height=a.styleDimension(v.height);if(p.config.aspectratio){var w=parseFloat(p.config.aspectratio);e.style.display="block";e.style.marginTop=p.config.aspectratio;f.style.height="auto";f.style.display=
"inline-block";r&&("bottom"==r.position?e.style.paddingBottom=r.size+"px":"right"==r.position&&(e.style.marginBottom=-1*r.size*(w/100)+"px"))}d.parentNode.replaceChild(f,d);f.appendChild(d);f.appendChild(e)}f=b.setupPlugins(p,v,q);0<f.length?a.extend(v,n(f.plugins)):delete v.plugins;"undefined"!=typeof v["dock.position"]&&"false"==v["dock.position"].toString().toLowerCase()&&(v.dock=v["dock.position"],delete v["dock.position"]);f=v.wmode?v.wmode:v.height&&40>=v.height?"transparent":"opaque";e="height width modes events primary base fallback volume".split(" ");
for(r=0;r<e.length;r++)delete v[e[r]];e=a.getCookies();a.foreach(e,function(a,b){"undefined"==typeof v[a]&&(v[a]=b)});e=window.location.href.split("/");e.splice(e.length-1,1);e=e.join("/");v.base=e+"/";g[d.id]=v;a.isIE()?(e='\x3cobject classid\x3d"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" " width\x3d"100%" height\x3d"100%"id\x3d"'+d.id+'" name\x3d"'+d.id+'" tabindex\x3d0""\x3e',e+='\x3cparam name\x3d"movie" value\x3d"'+c.src+'"\x3e',e+='\x3cparam name\x3d"allowfullscreen" value\x3d"true"\x3e\x3cparam name\x3d"allowscriptaccess" value\x3d"always"\x3e',
e+='\x3cparam name\x3d"seamlesstabbing" value\x3d"true"\x3e',e+='\x3cparam name\x3d"wmode" value\x3d"'+f+'"\x3e',e+='\x3cparam name\x3d"bgcolor" value\x3d"#000000"\x3e',e+="\x3c/object\x3e",d.outerHTML=e,f=document.getElementById(d.id)):(e=document.createElement("object"),e.setAttribute("type","application/x-shockwave-flash"),e.setAttribute("data",c.src),e.setAttribute("width","100%"),e.setAttribute("height","100%"),e.setAttribute("bgcolor","#000000"),e.setAttribute("id",d.id),e.setAttribute("name",
d.id),e.setAttribute("tabindex",0),h(e,"allowfullscreen","true"),h(e,"allowscriptaccess","always"),h(e,"seamlesstabbing","true"),h(e,"wmode",f),d.parentNode.replaceChild(e,d),f=e);p.config.aspectratio&&(f.style.position="absolute");p.container=f;p.setPlayer(f,"flash")};this.supportsConfig=function(){if(j)if(m){if("string"==a.typeOf(m.playlist))return!0;try{var b=m.playlist[0].sources;if("undefined"==typeof b)return!0;for(var c=0;c<b.length;c++)if(b[c].file&&f(b[c].file,b[c].type))return!0}catch(d){}}else return!0;
return!1}}).getVars=function(a){return g[a]};var f=e.embed.flashCanPlay=function(d,c){if(a.isYouTube(d)||a.isRtmp(d,c)||"hls"==c)return!0;var f=a.extensionmap[c?c:a.extension(d)];return!f?!1:!!f.flash}}(jwplayer),function(e){var a=e.utils,l=a.extensionmap,g=e.events;e.embed.html5=function(f,d,c,m,b){function p(a,b,c){return function(){try{var d=document.querySelector("#"+f.id+" .jwmain");c&&d.appendChild(b);"function"==typeof a.resize&&(a.resize(d.clientWidth,d.clientHeight),setTimeout(function(){a.resize(d.clientWidth,
d.clientHeight)},400));b.left=d.style.left;b.top=d.style.top}catch(g){}}}function h(a){q.sendEvent(a.type,{message:"HTML5 player not found"})}var q=this,n=new g.eventdispatcher;a.extend(q,n);q.embed=function(){if(e.html5){m.setupPlugins(b,c,p);f.innerHTML="";var k=e.utils.extend({},c);delete k.volume;k=new e.html5.player(k);b.container=document.getElementById(b.id);b.setPlayer(k,"html5")}else k=new a.scriptloader(d.src),k.addEventListener(g.ERROR,h),k.addEventListener(g.COMPLETE,q.embed),k.load()};
q.supportsConfig=function(){if(e.vid.canPlayType)try{if("string"==a.typeOf(c.playlist))return!0;for(var b=c.playlist[0].sources,d=0;d<b.length;d++){var f;var g=b[d].file,h=b[d].type;if(null!==navigator.userAgent.match(/BlackBerry/i)||a.isAndroid()&&("m3u"==a.extension(g)||"m3u8"==a.extension(g))||a.isRtmp(g,h))f=!1;else{var p=l[h?h:a.extension(g)],m;if(!p||p.flash&&!p.html5)m=!1;else{var n=p.html5,q=e.vid;if(n)try{m=q.canPlayType(n)?!0:!1}catch(A){m=!1}else m=!0}f=m}if(f)return!0}}catch(y){}return!1}}}(jwplayer),
function(e){var a=e.embed,l=e.utils,g=/\.(js|swf)$/;e.embed=l.extend(function(f){function d(){r="Adobe SiteCatalyst Error: Could not find Media Module"}var c=l.repo(),m=l.extend({},e.defaults),b=l.extend({},m,f.config),p=f.config,h=b.plugins,q=b.analytics,n=c+"jwpsrv.js",k=c+"sharing.js",j=c+"related.js",u=c+"gapro.js",m=e.key?e.key:m.key,t=(new e.utils.key(m)).edition(),r,h=h?h:{};"ads"==t&&b.advertising&&(g.test(b.advertising.client)?h[b.advertising.client]=b.advertising:h[c+b.advertising.client+
".js"]=b.advertising);delete p.advertising;p.key=m;b.analytics&&g.test(b.analytics.client)&&(n=b.analytics.client);delete p.analytics;q&&"ads"!==t&&delete q.enabled;if("free"==t||!q||!1!==q.enabled)h[n]=q?q:{};delete h.sharing;delete h.related;switch(t){case "ads":if(p.sitecatalyst)try{window.s&&window.s.hasOwnProperty("Media")?new e.embed.sitecatalyst(f):d()}catch(v){d()}case "premium":b.related&&(g.test(b.related.client)&&(j=b.related.client),h[j]=b.related),b.ga&&(g.test(b.ga.client)&&(u=b.ga.client),
h[u]=b.ga);case "pro":b.sharing&&(g.test(b.sharing.client)&&(k=b.sharing.client),h[k]=b.sharing),b.skin&&(p.skin=b.skin.replace(/^(beelden|bekle|five|glow|modieus|roundster|stormtrooper|vapor)$/i,l.repo()+"skins/$1.xml"))}p.plugins=h;f.config=p;f=new a(f);r&&f.errorScreen(r);return f},e.embed)}(jwplayer),function(e){var a=jwplayer.utils;e.sitecatalyst=function(e){function g(c){b.debug&&a.log(c)}function f(a){a=a.split("/");a=a[a.length-1];a=a.split("?");return a[0]}function d(){if(!k){k=!0;var a=
m.getPosition();g("stop: "+h+" : "+a);s.Media.stop(h,a)}}function c(){j||(d(),j=!0,g("close: "+h),s.Media.close(h),u=!0,n=0)}var m=e,b=a.extend({},m.config.sitecatalyst),p={onPlay:function(){if(!u){var a=m.getPosition();k=!1;g("play: "+h+" : "+a);s.Media.play(h,a)}},onPause:d,onBuffer:d,onIdle:c,onPlaylistItem:function(d){try{u=!0;c();n=0;var g;if(b.mediaName)g=b.mediaName;else{var e=m.getPlaylistItem(d.index);g=e.title?e.title:e.file?f(e.file):e.sources&&e.sources.length?f(e.sources[0].file):""}h=
g;q=b.playerName?b.playerName:m.id}catch(k){a.log(k)}},onTime:function(){if(u){var a=m.getDuration();if(-1==a)return;j=k=u=!1;g("open: "+h+" : "+a+" : "+q);s.Media.open(h,a,q);g("play: "+h+" : 0");s.Media.play(h,0)}a=m.getPosition();if(3<=Math.abs(a-n)){var b=n;g("seek: "+b+" to "+a);g("stop: "+h+" : "+b);s.Media.stop(h,b);g("play: "+h+" : "+a);s.Media.play(h,a)}n=a},onComplete:c},h,q,n,k=!0,j=!0,u;a.foreach(p,function(a){m[a](p[a])})}}(jwplayer.embed),function(e,a){var l=[],g=e.utils,f=e.events,
d=f.state,c=document,m=e.api=function(b){function l(a,b){return function(c){return b(a,c)}}function h(a,b){t[a]||(t[a]=[],n(f.JWPLAYER_PLAYER_STATE,function(b){var c=b.newstate;b=b.oldstate;if(c==a){var d=t[c];if(d)for(var g=0;g<d.length;g++){var f=d[g];"function"==typeof f&&f.call(this,{oldstate:b,newstate:c})}}}));t[a].push(b);return j}function q(a,b){try{a.jwAddEventListener(b,'function(dat) { jwplayer("'+j.id+'").dispatchEvent("'+b+'", dat); }')}catch(c){g.log("Could not add internal listener")}}
function n(a,b){u[a]||(u[a]=[],r&&v&&q(r,a));u[a].push(b);return j}function k(){if(v){if(r){var a=Array.prototype.slice.call(arguments,0),b=a.shift();if("function"===typeof r[b]){switch(a.length){case 6:return r[b](a[0],a[1],a[2],a[3],a[4],a[5]);case 5:return r[b](a[0],a[1],a[2],a[3],a[4]);case 4:return r[b](a[0],a[1],a[2],a[3]);case 3:return r[b](a[0],a[1],a[2]);case 2:return r[b](a[0],a[1]);case 1:return r[b](a[0])}return r[b]()}}return null}w.push(arguments)}var j=this,u={},t={},r,v=!1,w=[],x,
z={},A={};j.container=b;j.id=b.id;j.getBuffer=function(){return k("jwGetBuffer")};j.getContainer=function(){return j.container};j.addButton=function(a,b,c,d){try{A[d]=c,k("jwDockAddButton",a,b,"jwplayer('"+j.id+"').callback('"+d+"')",d)}catch(f){g.log("Could not add dock button"+f.message)}};j.removeButton=function(a){k("jwDockRemoveButton",a)};j.callback=function(a){if(A[a])A[a]()};j.forceState=function(a){k("jwForceState",a);return j};j.releaseState=function(){return k("jwReleaseState")};j.getDuration=
function(){return k("jwGetDuration")};j.getFullscreen=function(){return k("jwGetFullscreen")};j.getHeight=function(){return k("jwGetHeight")};j.getLockState=function(){return k("jwGetLockState")};j.getMeta=function(){return j.getItemMeta()};j.getMute=function(){return k("jwGetMute")};j.getPlaylist=function(){var a=k("jwGetPlaylist");"flash"==j.renderingMode&&g.deepReplaceKeyName(a,["__dot__","__spc__","__dsh__","__default__"],["."," ","-","default"]);return a};j.getPlaylistItem=function(a){g.exists(a)||
(a=j.getPlaylistIndex());return j.getPlaylist()[a]};j.getPlaylistIndex=function(){return k("jwGetPlaylistIndex")};j.getPosition=function(){return k("jwGetPosition")};j.getRenderingMode=function(){return j.renderingMode};j.getState=function(){return k("jwGetState")};j.getVolume=function(){return k("jwGetVolume")};j.getWidth=function(){return k("jwGetWidth")};j.setFullscreen=function(a){g.exists(a)?k("jwSetFullscreen",a):k("jwSetFullscreen",!k("jwGetFullscreen"));return j};j.setMute=function(a){g.exists(a)?
k("jwSetMute",a):k("jwSetMute",!k("jwGetMute"));return j};j.lock=function(){return j};j.unlock=function(){return j};j.load=function(a){k("jwLoad",a);return j};j.playlistItem=function(a){k("jwPlaylistItem",parseInt(a,10));return j};j.playlistPrev=function(){k("jwPlaylistPrev");return j};j.playlistNext=function(){k("jwPlaylistNext");return j};j.resize=function(a,b){if("flash"!==j.renderingMode)k("jwResize",a,b);else{var d=c.getElementById(j.id+"_wrapper"),f=c.getElementById(j.id+"_aspect");f&&(f.style.display=
"none");d&&(d.style.display="block",d.style.width=g.styleDimension(a),d.style.height=g.styleDimension(b))}return j};j.play=function(b){b===a?(b=j.getState(),b==d.PLAYING||b==d.BUFFERING?k("jwPause"):k("jwPlay")):k("jwPlay",b);return j};j.pause=function(b){b===a?(b=j.getState(),b==d.PLAYING||b==d.BUFFERING?k("jwPause"):k("jwPlay")):k("jwPause",b);return j};j.stop=function(){k("jwStop");return j};j.seek=function(a){k("jwSeek",a);return j};j.setVolume=function(a){k("jwSetVolume",a);return j};j.createInstream=
function(){return new m.instream(this,r)};j.setInstream=function(a){return x=a};j.loadInstream=function(a,b){x=j.setInstream(j.createInstream()).init(b);x.loadItem(a);return x};j.getQualityLevels=function(){return k("jwGetQualityLevels")};j.getCurrentQuality=function(){return k("jwGetCurrentQuality")};j.setCurrentQuality=function(a){k("jwSetCurrentQuality",a)};j.getCaptionsList=function(){return k("jwGetCaptionsList")};j.getCurrentCaptions=function(){return k("jwGetCurrentCaptions")};j.setCurrentCaptions=
function(a){k("jwSetCurrentCaptions",a)};j.getControls=function(){return k("jwGetControls")};j.getSafeRegion=function(){return k("jwGetSafeRegion")};j.setControls=function(a){k("jwSetControls",a)};j.destroyPlayer=function(){k("jwPlayerDestroy")};j.playAd=function(a){var b=e(j.id).plugins;b.vast&&b.vast.jwPlayAd(a)};j.pauseAd=function(){var a=e(j.id).plugins;a.vast?a.vast.jwPauseAd():k("jwPauseAd")};var y={onBufferChange:f.JWPLAYER_MEDIA_BUFFER,onBufferFull:f.JWPLAYER_MEDIA_BUFFER_FULL,onError:f.JWPLAYER_ERROR,
onSetupError:f.JWPLAYER_SETUP_ERROR,onFullscreen:f.JWPLAYER_FULLSCREEN,onMeta:f.JWPLAYER_MEDIA_META,onMute:f.JWPLAYER_MEDIA_MUTE,onPlaylist:f.JWPLAYER_PLAYLIST_LOADED,onPlaylistItem:f.JWPLAYER_PLAYLIST_ITEM,onPlaylistComplete:f.JWPLAYER_PLAYLIST_COMPLETE,onReady:f.API_READY,onResize:f.JWPLAYER_RESIZE,onComplete:f.JWPLAYER_MEDIA_COMPLETE,onSeek:f.JWPLAYER_MEDIA_SEEK,onTime:f.JWPLAYER_MEDIA_TIME,onVolume:f.JWPLAYER_MEDIA_VOLUME,onBeforePlay:f.JWPLAYER_MEDIA_BEFOREPLAY,onBeforeComplete:f.JWPLAYER_MEDIA_BEFORECOMPLETE,
onDisplayClick:f.JWPLAYER_DISPLAY_CLICK,onControls:f.JWPLAYER_CONTROLS,onQualityLevels:f.JWPLAYER_MEDIA_LEVELS,onQualityChange:f.JWPLAYER_MEDIA_LEVEL_CHANGED,onCaptionsList:f.JWPLAYER_CAPTIONS_LIST,onCaptionsChange:f.JWPLAYER_CAPTIONS_CHANGED,onAdError:f.JWPLAYER_AD_ERROR,onAdClick:f.JWPLAYER_AD_CLICK,onAdImpression:f.JWPLAYER_AD_IMPRESSION,onAdTime:f.JWPLAYER_AD_TIME,onAdComplete:f.JWPLAYER_AD_COMPLETE,onAdCompanions:f.JWPLAYER_AD_COMPANIONS,onAdSkipped:f.JWPLAYER_AD_SKIPPED};g.foreach(y,function(a){j[a]=
l(y[a],n)});var B={onBuffer:d.BUFFERING,onPause:d.PAUSED,onPlay:d.PLAYING,onIdle:d.IDLE};g.foreach(B,function(a){j[a]=l(B[a],h)});j.remove=function(){if(!v)throw"Cannot call remove() before player is ready";w=[];m.destroyPlayer(this.id)};j.setup=function(a){if(e.embed){var b=c.getElementById(j.id);b&&(a.fallbackDiv=b);b=j;w=[];m.destroyPlayer(b.id);b=e(j.id);b.config=a;(new e.embed(b)).embed();return b}return j};j.registerPlugin=function(a,b,c,d){e.plugins.registerPlugin(a,b,c,d)};j.setPlayer=function(a,
b){r=a;j.renderingMode=b};j.detachMedia=function(){if("html5"==j.renderingMode)return k("jwDetachMedia")};j.attachMedia=function(a){if("html5"==j.renderingMode)return k("jwAttachMedia",a)};j.removeEventListener=function(a,b){var c=u[a];if(c)for(var d=c.length;d--;)c[d]===b&&c.splice(d,1)};j.dispatchEvent=function(a,b){var c=u[a];if(c)for(var c=c.slice(0),d=g.translateEventResponse(a,b),e=0;e<c.length;e++){var k=c[e];if("function"===typeof k)try{a===f.JWPLAYER_PLAYLIST_LOADED&&g.deepReplaceKeyName(d.playlist,
["__dot__","__spc__","__dsh__","__default__"],["."," ","-","default"]),k.call(this,d)}catch(h){g.log("There was an error calling back an event handler")}}};j.dispatchInstreamEvent=function(a){x&&x.dispatchEvent(a,arguments)};j.callInternal=k;j.playerReady=function(a){v=!0;r||j.setPlayer(c.getElementById(a.id));j.container=c.getElementById(j.id);g.foreach(u,function(a){q(r,a)});n(f.JWPLAYER_PLAYLIST_ITEM,function(){z={}});n(f.JWPLAYER_MEDIA_META,function(a){g.extend(z,a.metadata)});for(j.dispatchEvent(f.API_READY);0<
w.length;)k.apply(this,w.shift())};j.getItemMeta=function(){return z};j.isBeforePlay=function(){return k("jwIsBeforePlay")};j.isBeforeComplete=function(){return k("jwIsBeforeComplete")};return j};m.selectPlayer=function(a){var d;g.exists(a)||(a=0);a.nodeType?d=a:"string"==typeof a&&(d=c.getElementById(a));return d?(a=m.playerById(d.id))?a:m.addPlayer(new m(d)):"number"==typeof a?l[a]:null};m.playerById=function(a){for(var c=0;c<l.length;c++)if(l[c].id==a)return l[c];return null};m.addPlayer=function(a){for(var c=
0;c<l.length;c++)if(l[c]==a)return a;l.push(a);return a};m.destroyPlayer=function(a){for(var d=-1,f,e=0;e<l.length;e++)l[e].id==a&&(d=e,f=l[e]);0<=d&&(a=f.id,e=c.getElementById(a+("flash"==f.renderingMode?"_wrapper":"")),g.clearCss&&g.clearCss("#"+a),e&&("html5"==f.renderingMode&&f.destroyPlayer(),f=c.createElement("div"),f.id=a,e.parentNode.replaceChild(f,e)),l.splice(d,1));return null};e.playerReady=function(a){var c=e.api.playerById(a.id);c?c.playerReady(a):e.api.selectPlayer(a.id).playerReady(a)}}(window.jwplayer),
function(e){var a=e.events,l=e.utils,g=a.state;e.api.instream=function(f,d){function c(a,b){h[a]||(h[a]=[],d.jwInstreamAddEventListener(a,'function(dat) { jwplayer("'+f.id+'").dispatchInstreamEvent("'+a+'", dat); }'));h[a].push(b);return this}function e(b,d){q[b]||(q[b]=[],c(a.JWPLAYER_PLAYER_STATE,function(a){var c=a.newstate,d=a.oldstate;if(c==b){var e=q[c];if(e)for(var f=0;f<e.length;f++){var g=e[f];"function"==typeof g&&g.call(this,{oldstate:d,newstate:c,type:a.type})}}}));q[b].push(d);return this}
var b,p,h={},q={},n=this;n.type="instream";n.init=function(){f.callInternal("jwInitInstream");return n};n.loadItem=function(a,c){b=a;p=c||{};"array"==l.typeOf(a)?f.callInternal("jwLoadArrayInstream",b,p):f.callInternal("jwLoadItemInstream",b,p)};n.removeEvents=function(){h=q={}};n.removeEventListener=function(a,b){var c=h[a];if(c)for(var d=c.length;d--;)c[d]===b&&c.splice(d,1)};n.dispatchEvent=function(a,b){var c=h[a];if(c)for(var c=c.slice(0),d=l.translateEventResponse(a,b[1]),e=0;e<c.length;e++){var f=
c[e];"function"==typeof f&&f.call(this,d)}};n.onError=function(b){return c(a.JWPLAYER_ERROR,b)};n.onMediaError=function(b){return c(a.JWPLAYER_MEDIA_ERROR,b)};n.onFullscreen=function(b){return c(a.JWPLAYER_FULLSCREEN,b)};n.onMeta=function(b){return c(a.JWPLAYER_MEDIA_META,b)};n.onMute=function(b){return c(a.JWPLAYER_MEDIA_MUTE,b)};n.onComplete=function(b){return c(a.JWPLAYER_MEDIA_COMPLETE,b)};n.onPlaylistComplete=function(b){return c(a.JWPLAYER_PLAYLIST_COMPLETE,b)};n.onPlaylistItem=function(b){return c(a.JWPLAYER_PLAYLIST_ITEM,
b)};n.onTime=function(b){return c(a.JWPLAYER_MEDIA_TIME,b)};n.onBuffer=function(a){return e(g.BUFFERING,a)};n.onPause=function(a){return e(g.PAUSED,a)};n.onPlay=function(a){return e(g.PLAYING,a)};n.onIdle=function(a){return e(g.IDLE,a)};n.onClick=function(b){return c(a.JWPLAYER_INSTREAM_CLICK,b)};n.onInstreamDestroyed=function(b){return c(a.JWPLAYER_INSTREAM_DESTROYED,b)};n.onAdSkipped=function(b){return c(a.JWPLAYER_AD_SKIPPED,b)};n.play=function(a){d.jwInstreamPlay(a)};n.pause=function(a){d.jwInstreamPause(a)};
n.hide=function(){f.callInternal("jwInstreamHide")};n.destroy=function(){n.removeEvents();f.callInternal("jwInstreamDestroy")};n.setText=function(a){d.jwInstreamSetText(a?a:"")};n.getState=function(){return d.jwInstreamState()};n.setClick=function(a){d.jwInstreamClick&&d.jwInstreamClick(a)}}}(window.jwplayer),function(e){var a=e.api,l=a.selectPlayer;a.selectPlayer=function(a){return(a=l(a))?a:{registerPlugin:function(a,d,c){e.plugins.registerPlugin(a,d,c)}}}}(jwplayer));
(function(g){g.html5={};g.html5.version="6.8.4616"})(jwplayer);
(function(g){var h=document;g.parseDimension=function(a){return"string"==typeof a?""===a?0:-1<a.lastIndexOf("%")?a:parseInt(a.replace("px",""),10):a};g.timeFormat=function(a){if(0<a){var c=Math.floor(a/3600),e=Math.floor((a-3600*c)/60);a=Math.floor(a%60);return(c?c+":":"")+(10>e?"0":"")+e+":"+(10>a?"0":"")+a}return"00:00"};g.bounds=function(a){var c={left:0,right:0,width:0,height:0,top:0,bottom:0};if(!a||!h.body.contains(a))return c;if(a.getBoundingClientRect){a=a.getBoundingClientRect(a);var e=window.pageYOffset,
b=window.pageXOffset;if(!a.width&&!a.height&&!a.left&&!a.top)return c;c.left=a.left+b;c.right=a.right+b;c.top=a.top+e;c.bottom=a.bottom+e;c.width=a.right-a.left;c.height=a.bottom-a.top}else{c.width=a.offsetWidth|0;c.height=a.offsetHeight|0;do c.left+=a.offsetLeft|0,c.top+=a.offsetTop|0;while(a=a.offsetParent);c.right=c.left+c.width;c.bottom=c.top+c.height}return c};g.empty=function(a){if(a)for(;0<a.childElementCount;)a.removeChild(a.children[0])}})(jwplayer.utils);
(function(g){function h(a,b,c){if(!e.exists(b))return"";c=c?" !important":"";return isNaN(b)?b.match(/png|gif|jpe?g/i)&&0>b.indexOf("url")?"url("+b+")":b+c:0===b||"z-index"===a||"opacity"===a?""+b+c:/color/i.test(a)?"#"+e.pad(b.toString(16).replace(/^0x/i,""),6)+c:Math.ceil(b)+"px"+c}function a(a,b){for(var c=0;c<a.length;c++){var d=a[c],e,f;for(e in b){f=e;f=f.split("-");for(var h=1;h<f.length;h++)f[h]=f[h].charAt(0).toUpperCase()+f[h].slice(1);f=f.join("");d.style[f]!==b[e]&&(d.style[f]=b[e])}}}
function c(a){var c=b[a].sheet,d,e,h;if(c){d=c.cssRules;e=l[a];h=a;var u=f[h];h+=" { ";for(var m in u)h+=m+": "+u[m]+"; ";h+="}";if(void 0!==e&&e<d.length&&d[e].selectorText===a){if(h===d[e].cssText)return;c.deleteRule(e)}else e=d.length,l[a]=e;c.insertRule(h,e)}}var e=g.utils,b={},d,f={},u=null,l={},m=e.css=function(a,e,l){f[a]||(f[a]={});var j=f[a];l=l||!1;var m=!1,g,w;for(g in e)w=h(g,e[g],l),""!==w?w!==j[g]&&(j[g]=w,m=!0):void 0!==j[g]&&(delete j[g],m=!0);if(m){if(!b[a]){if(!d||5E4<d.sheet.cssRules.length)e=
document.createElement("style"),e.type="text/css",document.getElementsByTagName("head")[0].appendChild(e),d=e;b[a]=d}null!==u?u.styleSheets[a]=f[a]:c(a)}};m.style=function(b,c,d){if(!(void 0===b||null===b)){void 0===b.length&&(b=[b]);var e={},f;for(f in c)e[f]=h(f,c[f]);if(null!==u&&!d){c=(c=b.__cssRules)||{};for(var l in e)c[l]=e[l];b.__cssRules=c;0>u.elements.indexOf(b)&&u.elements.push(b)}else a(b,e)}};m.block=function(a){null===u&&(u={id:a,styleSheets:{},elements:[]})};m.unblock=function(b){if(u&&
(!b||u.id===b)){for(var d in u.styleSheets)c(d);for(b=0;b<u.elements.length;b++)d=u.elements[b],a(d,d.__cssRules);u=null}};e.clearCss=function(a){for(var d in f)0<=d.indexOf(a)&&delete f[d];for(var e in b)0<=e.indexOf(a)&&c(e)};e.transform=function(a,b){var c={};b=b||"";c.transform=b;c["-webkit-transform"]=b;c["-ms-transform"]=b;c["-moz-transform"]=b;c["-o-transform"]=b;"string"===typeof a?m(a,c):m.style(a,c)};e.dragStyle=function(a,b){m(a,{"-webkit-user-select":b,"-moz-user-select":b,"-ms-user-select":b,
"-webkit-user-drag":b,"user-select":b,"user-drag":b})};e.transitionStyle=function(a,b){navigator.userAgent.match(/5\.\d(\.\d)? safari/i)||m(a,{"-webkit-transition":b,"-moz-transition":b,"-o-transition":b,transition:b})};e.rotate=function(a,b){e.transform(a,"rotate("+b+"deg)")};e.rgbHex=function(a){a=String(a).replace("#","");3===a.length&&(a=a[0]+a[0]+a[1]+a[1]+a[2]+a[2]);return"#"+a.substr(-6)};e.hexToRgba=function(a,b){var c="rgb",d=[parseInt(a.substr(1,2),16),parseInt(a.substr(3,2),16),parseInt(a.substr(5,
2),16)];void 0!==b&&100!==b&&(c+="a",d.push(b/100));return c+"("+d.join(",")+")"};m(".jwplayer ".slice(0,-1)+" div span a img ul li video".split(" ").join(", .jwplayer ")+", .jwclick",{margin:0,padding:0,border:0,color:"#000000","font-size":"100%",font:"inherit","vertical-align":"baseline","background-color":"transparent","text-align":"left",direction:"ltr","-webkit-tap-highlight-color":"rgba(255, 255, 255, 0)"});m(".jwplayer ul",{"list-style":"none"})})(jwplayer);
(function(g){var h=g.stretching={NONE:"none",FILL:"fill",UNIFORM:"uniform",EXACTFIT:"exactfit"};g.scale=function(a,c,e,b,d){var f="";c=c||1;e=e||1;b|=0;d|=0;if(1!==c||1!==e)f="scale("+c+", "+e+")";if(b||d)f="translate("+b+"px, "+d+"px)";g.transform(a,f)};g.stretch=function(a,c,e,b,d,f){if(!c||!e||!b||!d||!f)return!1;a=a||h.UNIFORM;var u=2*Math.ceil(e/2)/d,l=2*Math.ceil(b/2)/f,m="video"===c.tagName.toLowerCase(),r=!1,n="jw"+a.toLowerCase();switch(a.toLowerCase()){case h.FILL:u>l?l=u:u=l;r=!0;break;
case h.NONE:u=l=1;case h.EXACTFIT:r=!0;break;default:u>l?0.95<d*l/e?(r=!0,n="jwexactfit"):(d*=l,f*=l):0.95<f*u/b?(r=!0,n="jwexactfit"):(d*=u,f*=u),r&&(u=2*Math.ceil(e/2)/d,l=2*Math.ceil(b/2)/f)}m?(a={left:"",right:"",width:"",height:""},r?(e<d&&(a.left=a.right=Math.ceil((e-d)/2)),b<f&&(a.top=a.bottom=Math.ceil((b-f)/2)),a.width=d,a.height=f,g.scale(c,u,l,0,0)):(r=!1,g.transform(c)),g.css.style(c,a)):c.className=c.className.replace(/\s*jw(none|exactfit|uniform|fill)/g,"")+" "+n;return r}})(jwplayer.utils);
(function(g){g.dfxp=function(){var h=jwplayer.utils.seconds;this.parse=function(a){var c=[{begin:0,text:""}];a=a.replace(/^\s+/,"").replace(/\s+$/,"");var e=a.split("\x3c/p\x3e"),b=a.split("\x3c/tt:p\x3e"),d=[];for(a=0;a<e.length;a++)0<=e[a].indexOf("\x3cp")&&(e[a]=e[a].substr(e[a].indexOf("\x3cp")+2).replace(/^\s+/,"").replace(/\s+$/,""),d.push(e[a]));for(a=0;a<b.length;a++)0<=b[a].indexOf("\x3ctt:p")&&(b[a]=b[a].substr(b[a].indexOf("\x3ctt:p")+5).replace(/^\s+/,"").replace(/\s+$/,""),d.push(b[a]));
e=d;for(a=0;a<e.length;a++){b=e[a];d={};try{var f=b.indexOf('begin\x3d"'),b=b.substr(f+7),f=b.indexOf('" end\x3d"');d.begin=h(b.substr(0,f));b=b.substr(f+7);f=b.indexOf('"');d.end=h(b.substr(0,f));f=b.indexOf('"\x3e');b=b.substr(f+2);d.text=b}catch(u){}b=d;b.text&&(c.push(b),b.end&&(c.push({begin:b.end,text:""}),delete b.end))}if(1<c.length)return c;throw{message:"Invalid DFXP file:"};}}})(jwplayer.parsers);
(function(g){g.srt=function(){var h=jwplayer.utils,a=h.seconds;this.parse=function(c,e){var b=e?[]:[{begin:0,text:""}];c=h.trim(c);var d=c.split("\r\n\r\n");1==d.length&&(d=c.split("\n\n"));for(var f=0;f<d.length;f++)if("WEBVTT"!=d[f]){var u,l=d[f];u={};var m=l.split("\r\n");1==m.length&&(m=l.split("\n"));try{l=1;0<m[0].indexOf(" --\x3e ")&&(l=0);var r=m[l].indexOf(" --\x3e ");0<r&&(u.begin=a(m[l].substr(0,r)),u.end=a(m[l].substr(r+5)));if(m[l+1]){u.text=m[l+1];for(l+=2;l<m.length;l++)u.text+="\x3cbr/\x3e"+
m[l]}}catch(n){}u.text&&(b.push(u),u.end&&!e&&(b.push({begin:u.end,text:""}),delete u.end))}if(1<b.length)return b;throw{message:"Invalid SRT file"};}}})(jwplayer.parsers);
(function(g){var h=g.utils,a=h.css,c=!0,e=!1,b=g.events,d=80,f=30;g.html5.adskipbutton=function(u,l,m,r){function n(a){if(!(0>p)){var b=v.getContext("2d");b.clearRect(0,0,d,f);w(b,0,0,d,f,5,c,e,e);w(b,0,0,d,f,5,e,c,e);b.fillStyle="#979797";b.globalAlpha=1;var k=v.width/2,j=v.height/2;b.textAlign="center";b.font="Bold 11px Sans-Serif";b.fillText(m.replace(/xx/gi,Math.ceil(p-a)),k,j+4)}}function g(a,b){if("number"==h.typeOf(F))p=F;else if("%"==F.slice(-1)){var c=parseFloat(F.slice(0,-1));b&&!isNaN(c)&&
(p=b*c/100)}else"string"==h.typeOf(F)?p=h.seconds(F):isNaN(F)||(p=F)}function j(){k&&x.sendEvent(b.JWPLAYER_AD_SKIPPED)}function q(){if(k){var a=v.getContext("2d");a.clearRect(0,0,d,f);w(a,0,0,d,f,5,c,e,c);w(a,0,0,d,f,5,e,c,c);a.fillStyle="#FFFFFF";a.globalAlpha=1;var b=v.height/2,j=v.width/2;a.textAlign="center";a.font="Bold 12px Sans-Serif";a.fillText(r+"     ",j,b+4);a.drawImage(A,v.width-(v.width-a.measureText(r).width)/2-4,(f-s.height)/2)}}function C(){if(k){var a=v.getContext("2d");a.clearRect(0,
0,d,f);w(a,0,0,d,f,5,c,e,e);w(a,0,0,d,f,5,e,c,e);a.fillStyle="#979797";a.globalAlpha=1;var b=v.height/2,j=v.width/2;a.textAlign="center";a.font="Bold 12px Sans-Serif";a.fillText(r+"     ",j,b+4);a.drawImage(s,v.width-(v.width-a.measureText(r).width)/2-4,(f-s.height)/2)}}function w(a,b,d,e,k,j,f,h,r){"undefined"==typeof h&&(h=c);"undefined"===typeof j&&(j=5);a.beginPath();a.moveTo(b+j,d);a.lineTo(b+e-j,d);a.quadraticCurveTo(b+e,d,b+e,d+j);a.lineTo(b+e,d+k-j);a.quadraticCurveTo(b+e,d+k,b+e-j,d+k);a.lineTo(b+
j,d+k);a.quadraticCurveTo(b,d+k,b,d+k-j);a.lineTo(b,d+j);a.quadraticCurveTo(b,d,b+j,d);a.closePath();h&&(a.strokeStyle="white",a.globalAlpha=r?1:0.25,a.stroke());f&&(a.fillStyle="#000000",a.globalAlpha=0.5,a.fill())}function t(a,b){var c=document.createElement(a);b&&(c.className=b);return c}var D,v,x=new b.eventdispatcher,p=-1,k=e,B,F=0,s,A;h.extend(this,x);this.updateSkipTime=function(b,l){var u=v.getContext("2d");g(b,l);if(0<=p)if(a.style(D,{visibility:B?"visible":"hidden"}),0<p-b)n(b);else if(!k){k=
c;u.clearRect(0,0,d,f);w(u,0,0,d,f,5,c,e,e);w(u,0,0,d,f,5,e,c);u.fillStyle="#979797";u.globalAlpha=1;var m=v.height/2,x=v.width/2;u.textAlign="center";u.font="Bold 12px Sans-Serif";u.fillText(r+"     ",x,m+4);u.drawImage(s,v.width-(v.width-u.measureText(r).width)/2-4,(f-s.height)/2);h.isMobile()?(new h.touch(D)).addEventListener(h.touchEvents.TAP,j):(D.addEventListener("click",j),D.addEventListener("mouseover",q),D.addEventListener("mouseout",C));D.style.cursor="pointer"}};this.reset=function(a){k=
!1;F=a;g(0,0);n(0)};this.show=function(){B=!0;0<p&&a.style(D,{visibility:"visible"})};this.hide=function(){B=!1;a.style(D,{visibility:"hidden"})};this.element=function(){return D};s=new Image;s.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ODkzMWI3Ny04YjE5LTQzYzMtOGM2Ni0wYzdkODNmZTllNDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI0OTcxRkE0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI0OTcxRjk0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDA5ZGQxNDktNzdkMi00M2E3LWJjYWYtOTRjZmM2MWNkZDI0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjQ4OTMxYjc3LThiMTktNDNjMy04YzY2LTBjN2Q4M2ZlOWU0NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqAZXX0AAABYSURBVHjafI2BCcAwCAQ/kr3ScRwjW+g2SSezCi0kYHpwKLy8JCLDbWaGTM+MAFzuVNXhNiTQsh+PS9QhZ7o9JuFMeUVNwjsamDma4K+3oy1cqX/hxyPAAAQwNKV27g9PAAAAAElFTkSuQmCC";
s.className="jwskipimage jwskipout";A=new Image;A.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ODkzMWI3Ny04YjE5LTQzYzMtOGM2Ni0wYzdkODNmZTllNDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI0OTcxRkU0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI0OTcxRkQ0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDA5ZGQxNDktNzdkMi00M2E3LWJjYWYtOTRjZmM2MWNkZDI0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjQ4OTMxYjc3LThiMTktNDNjMy04YzY2LTBjN2Q4M2ZlOWU0NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PvgIj/QAAABYSURBVHjadI6BCcAgDAS/0jmyih2tm2lHSRZJX6hQQ3w4FP49LKraSHV3ZLDzAuAi3cwaqUhSfvft+EweznHneUdTzPGRmp5hEJFhAo3LaCnjn7blzCvAAH9YOSCL5RZKAAAAAElFTkSuQmCC";
A.className="jwskipimage jwskipover";D=t("div","jwskip");D.id=u.id+"_skipcontainer";v=t("canvas");D.appendChild(v);this.width=v.width=d;this.height=v.height=f;D.appendChild(A);D.appendChild(s);a.style(D,{visibility:"hidden",bottom:l})};a(".jwskip",{position:"absolute","float":"right",display:"inline-block",width:d,height:f,right:10});a(".jwskipimage",{position:"relative",display:"none"})})(window.jwplayer);
(function(g){var h=g.utils,a=g.events,c=a.state,e=g.parsers,b=h.css,d="playing",f=document;g.html5.captions=function(b,l){function m(a){h.log("CAPTIONS("+a+")")}function r(a){(H=a.fullscreen)?(n(),setTimeout(n,500)):C(!0)}function n(){var a=x.offsetHeight,b=x.offsetWidth;0!==a&&0!==b&&B.resize(b,Math.round(0.94*a))}function z(a,b){h.ajax(a,function(a){var c=a.responseXML?a.responseXML.firstChild:null;K++;if(c){"xml"==e.localName(c)&&(c=c.nextSibling);for(;c.nodeType==c.COMMENT_NODE;)c=c.nextSibling}c=
c&&"tt"==e.localName(c)?new g.parsers.dfxp:new g.parsers.srt;try{var d=c.parse(a.responseText);s<A.length&&(A[b].data=d);C(!1)}catch(k){m(k.message+": "+A[b].file)}K==A.length&&(0<I&&(t(I),I=-1),q())},j,!0)}function j(a){K++;m(a);K==A.length&&(0<I&&(t(I),I=-1),q())}function q(){for(var b=[],c=0;c<A.length;c++)b.push(A[c]);P.sendEvent(a.JWPLAYER_CAPTIONS_LOADED,{captionData:b})}function C(a){!A.length||Q?B.hide():F==d&&0<G?(B.show(),H?r({fullscreen:!0}):(w(),a&&setTimeout(w,500))):B.hide()}function w(){B.resize()}
function t(b){0<b?(s=b-1,G=b,s>=A.length||(A[s].data?B.populate(A[s].data):K==A.length?(m("file not loaded: "+A[s].file),0!=G&&D(a.JWPLAYER_CAPTIONS_CHANGED,A,0),G=0):I=b,C(!1))):(G=0,C(!1))}function D(a,b,c){P.sendEvent(a,{type:a,tracks:b,track:c})}function v(){for(var a=[{label:"Off"}],b=0;b<A.length;b++)a.push({label:A[b].label});return a}var x,p={back:!0,color:"#FFFFFF",fontSize:15,fontFamily:"Arial,sans-serif",fontOpacity:100,backgroundColor:"#000",backgroundOpacity:100,edgeStyle:null,windowColor:"#FFFFFF",
windowOpacity:0},k={fontStyle:"normal",fontWeight:"normal",textDecoration:"none"},B,F,s,A=[],K=0,I=-1,G=0,H=!1,P=new a.eventdispatcher,Q=h.isAndroid(4)&&!h.isChrome();h.extend(this,P);this.element=function(){return x};this.getCaptionsList=function(){return v()};this.getCurrentCaptions=function(){return G};this.setCurrentCaptions=function(b){0<=b&&(G!=b&&b<=A.length)&&(t(b),b=v(),h.saveCookie("captionLabel",b[G].label),D(a.JWPLAYER_CAPTIONS_CHANGED,b,G))};x=f.createElement("div");x.id=b.id+"_caption";
x.className="jwcaptions";b.jwAddEventListener(a.JWPLAYER_PLAYER_STATE,function(a){switch(a.newstate){case c.IDLE:F="idle";C(!1);break;case c.PLAYING:F=d,C(!1)}});b.jwAddEventListener(a.JWPLAYER_PLAYLIST_ITEM,function(){s=0;A=[];B.update(0);K=0;if(!Q){for(var c=b.jwGetPlaylist()[b.jwGetPlaylistIndex()].tracks,d=[],e=0,k="",j=0,k="",e=0;e<c.length;e++)k=c[e].kind.toLowerCase(),("captions"==k||"subtitles"==k)&&d.push(c[e]);for(e=G=0;e<d.length;e++)if(k=d[e].file)d[e].label||(d[e].label=e.toString()),
A.push(d[e]),z(A[e].file,e);for(e=0;e<A.length;e++)if(A[e]["default"]){j=e+1;break}if(k=h.getCookies().captionLabel){c=v();for(e=0;e<c.length;e++)if(k==c[e].label){j=e;break}}0<j&&t(j);C(!1);D(a.JWPLAYER_CAPTIONS_LIST,v(),G)}});b.jwAddEventListener(a.JWPLAYER_MEDIA_ERROR,m);b.jwAddEventListener(a.JWPLAYER_ERROR,m);b.jwAddEventListener(a.JWPLAYER_READY,function(){h.foreach(p,function(a,b){l&&(void 0!==l[a]?b=l[a]:void 0!==l[a.toLowerCase()]&&(b=l[a.toLowerCase()]));k[a]=b});B=new g.html5.captions.renderer(k,
x);C(!1)});b.jwAddEventListener(a.JWPLAYER_MEDIA_TIME,function(a){B.update(a.position)});b.jwAddEventListener(a.JWPLAYER_FULLSCREEN,r);b.jwAddEventListener(a.JWPLAYER_RESIZE,function(){C(!1)})};b(".jwcaptions",{position:"absolute",cursor:"pointer",width:"100%",height:"100%",overflow:"hidden"})})(jwplayer);
(function(g){var h=g.utils,a=h.css.style;g.html5.captions.renderer=function(c,e){function b(b){b=b||"";q="hidden";a(m,{visibility:q});n.innerHTML=b;b.length&&(q="visible",setTimeout(d,16))}function d(){if("visible"===q){var b=m.clientWidth,d=Math.pow(b/400,0.6),e=c.fontSize*d;a(n,{maxWidth:b+"px",fontSize:Math.round(e)+"px",lineHeight:Math.round(1.4*e)+"px",padding:Math.round(1*d)+"px "+Math.round(8*d)+"px"});c.windowOpacity&&a(r,{padding:Math.round(5*d)+"px",borderRadius:Math.round(5*d)+"px"});a(m,
{visibility:q})}}function f(){for(var a=-1,c=0;c<l.length;c++)if(l[c].begin<=j&&(c==l.length-1||l[c+1].begin>=j)){a=c;break}-1==a?b(""):a!=g&&(g=a,b(l[c].text))}function u(a,b,c){c=h.hexToRgba("#000000",c);"dropshadow"===a?b.textShadow="0 2px 1px "+c:"raised"===a?b.textShadow="0 0 5px "+c+", 0 1px 5px "+c+", 0 2px 5px "+c:"depressed"===a?b.textShadow="0 -2px 1px "+c:"uniform"===a&&(b.textShadow="-2px 0 1px "+c+",2px 0 1px "+c+",0 -2px 1px "+c+",0 2px 1px "+c+",-1px 1px 1px "+c+",1px 1px 1px "+c+",1px -1px 1px "+
c+",1px 1px 1px "+c)}var l,m,r,n,g,j,q="visible",C=-1;this.hide=function(){clearInterval(C);a(m,{display:"none"})};this.populate=function(a){g=-1;l=a;f()};this.resize=function(){d()};this.show=function(){a(m,{display:"block"});d();clearInterval(C);C=setInterval(d,250)};this.update=function(a){j=a;l&&f()};var w=c.fontOpacity,t=c.windowOpacity,D=c.edgeStyle,v=c.backgroundColor,x={display:"inline-block"},p={color:h.hexToRgba(h.rgbHex(c.color),w),display:"inline-block",fontFamily:c.fontFamily,fontStyle:c.fontStyle,
fontWeight:c.fontWeight,textAlign:"center",textDecoration:c.textDecoration,wordWrap:"break-word"};t&&(x.backgroundColor=h.hexToRgba(h.rgbHex(c.windowColor),t));u(D,p,w);c.back?p.backgroundColor=h.hexToRgba(h.rgbHex(v),c.backgroundOpacity):null===D&&u("uniform",p);m=document.createElement("div");r=document.createElement("div");n=document.createElement("span");a(m,{display:"block",height:"auto",position:"absolute",bottom:"20px",textAlign:"center",width:"100%"});a(r,x);a(n,p);r.appendChild(n);m.appendChild(r);
e.appendChild(m)}})(jwplayer);
(function(g){var h=g.html5,a=g.utils,c=g.events,e=c.state,b=a.css,d=a.transitionStyle,f=a.isMobile(),u=a.isAndroid(4)&&!a.isChrome(),l="button",m="text",r="slider",n="none",z="100%",j={display:n},q={display:"block"},C={display:x},w="array",t=!1,D=!0,v=null,x,p=window,k=document;h.controlbar=function(d,F){function s(a,b,c){return{name:a,type:b,className:c}}function A(c){b.block($);if(c.duration==Number.POSITIVE_INFINITY||!c.duration&&a.isSafari()&&!f)Z.setText(J.jwGetPlaylist()[J.jwGetPlaylistIndex()].title||"Live broadcast");
else{var d;E.elapsed&&(d=a.timeFormat(c.position),E.elapsed.innerHTML=d);E.duration&&(d=a.timeFormat(c.duration),E.duration.innerHTML=d);0<c.duration?X(c.position/c.duration):X(0);va=c.duration;wa||Z.setText()}}function K(){var a=J.jwGetMute();Ka=J.jwGetVolume()/100;S("mute",a||0===Ka);V(a?0:Ka)}function I(){b.style(E.hd,j);b.style(E.cc,j);Pa();sa()}function G(a){Qa=a.currentQuality|0;E.hd&&(E.hd.querySelector("button").className=2===fa.length&&0===Qa?"off":"");ma&&0<=Qa&&ma.setActive(a.currentQuality)}
function H(a){ga&&(La=a.track|0,E.cc&&(E.cc.querySelector("button").className=2===ga.length&&0===La?"off":""),na&&0<=La&&na.setActive(a.track))}function P(){la=a.extend({},Xa,oa.getComponentSettings("controlbar"),F);xa=N("background").height;var c=ta?0:la.margin;b.style(W,{height:xa,bottom:c,left:c,right:c,"max-width":ta?"":la.maxwidth});b(Q(".jwtext"),{font:la.fontsize+"px/"+N("background").height+"px "+la.font,color:la.fontcolor,"font-weight":la.fontweight});b(Q(".jwoverlay"),{bottom:xa})}function Q(a){return"#"+
$+(a?" "+a:"")}function M(){return k.createElement("span")}function y(c,d,e,j,k){var f=M(),h=N(c);j=j?" left center":" center";var r=aa(h);f.className="jw"+c;f.innerHTML="\x26nbsp;";if(h&&h.src)return e=e?{background:"url('"+h.src+"') repeat-x "+j,"background-size":r,height:k?h.height:x}:{background:"url('"+h.src+"') no-repeat"+j,"background-size":r,width:h.width,height:k?h.height:x},f.skin=h,b(Q((k?".jwvertical ":"")+".jw"+c),a.extend(e,d)),E[c]=f}function R(a,c,d,e){c&&c.src&&(b(a,{width:c.width,
background:"url("+c.src+") no-repeat center","background-size":aa(c)}),d.src&&!f&&b(a+":hover,"+a+".off:hover",{background:"url("+d.src+") no-repeat center","background-size":aa(d)}),e&&e.src&&b(a+".off",{background:"url("+e.src+") no-repeat center","background-size":aa(e)}))}function T(a){return function(b){rb[a]&&(rb[a](),f&&Ma.sendEvent(c.JWPLAYER_USER_ACTION));b.preventDefault&&b.preventDefault()}}function ca(b){a.foreach(gb,function(a,c){a!=b&&("cc"==a&&(clearTimeout(Da),Da=x),"hd"==a&&(clearTimeout(Ea),
Ea=x),c.hide())})}function ba(){!ta&&!wa&&(b.block($),Ha.show(),Ca("volume",Ha),ca("volume"))}function S(b,c){a.exists(c)||(c=!hb[b]);E[b]&&(E[b].className="jw"+b+(c?" jwtoggle jwtoggling":" jwtoggling"),setTimeout(function(){E[b].className=E[b].className.replace(" jwtoggling","")},100));hb[b]=c}function aa(a){return a?parseInt(a.width,10)+"px "+parseInt(a.height,10)+"px":"0 0"}function Y(){fa&&2<fa.length&&(ib&&(clearTimeout(ib),ib=x),b.block($),ma.show(),Ca("hd",ma),ca("hd"))}function qa(){ga&&
2<ga.length&&(jb&&(clearTimeout(jb),jb=x),b.block($),na.show(),Ca("cc",na),ca("cc"))}function da(a){0<=a&&a<fa.length&&(J.jwSetCurrentQuality(a),clearTimeout(Ea),Ea=x,ma.hide())}function Ra(a){0<=a&&a<ga.length&&(J.jwSetCurrentCaptions(a),clearTimeout(Da),Da=x,na.hide())}function ha(){2==ga.length&&Ra((La+1)%2)}function kb(){2==fa.length&&da((Qa+1)%2)}function Ia(a){a.preventDefault();k.onselectstart=function(){return t}}function Ya(a){Sa();ya=a;p.addEventListener("mouseup",O,t)}function Sa(){p.removeEventListener("mouseup",
O);ya=v}function Ta(){E.timeRail.className="jwrail";J.jwGetState()!=e.IDLE&&(J.jwSeekDrag(D),Ya("time"),za(),Ma.sendEvent(c.JWPLAYER_USER_ACTION))}function Na(b){if(ya){var d=(new Date).getTime();50<d-lb&&(Za(b),lb=d);var e=E[ya].querySelector(".jwrail"),e=a.bounds(e),e=b.x/e.width;100<e&&(e=100);b.type==a.touchEvents.DRAG_END?(J.jwSeekDrag(t),E.timeRail.className="jwrail jwsmooth",Sa(),$a.time(e),ua()):(X(e),500<d-mb&&(mb=d,$a.time(e)));Ma.sendEvent(c.JWPLAYER_USER_ACTION)}}function U(b){var d=E.time.querySelector(".jwrail"),
d=a.bounds(d);b=b.x/d.width;100<b&&(b=100);J.jwGetState()!=e.IDLE&&($a.time(b),Ma.sendEvent(c.JWPLAYER_USER_ACTION))}function L(a){return function(b){b.button||(E[a+"Rail"].className="jwrail","time"==a?J.jwGetState()!=e.IDLE&&(J.jwSeekDrag(D),Ya(a)):Ya(a))}}function O(b){var c=(new Date).getTime();50<c-lb&&(Za(b),lb=c);if(ya&&!b.button){var d=E[ya].querySelector(".jwrail"),e=a.bounds(d),d=ya,e=E[d].vertical?(e.bottom-b.pageY)/e.height:(b.pageX-e.left)/e.width;"mouseup"==b.type?("time"==d&&J.jwSeekDrag(t),
E[d+"Rail"].className="jwrail jwsmooth",Sa(),$a[d.replace("H","")](e)):("time"==ya?X(e):V(e),500<c-mb&&(mb=c,$a[ya.replace("H","")](e)));return!1}}function za(){pa&&(va&&!ta&&!f)&&(b.block($),pa.show(),Ca("time",pa))}function ua(){pa&&pa.hide()}function Za(b){ia=a.bounds(W);if((ab=a.bounds(sb))&&0!==ab.width){var c=b.x;b.pageX&&(c=b.pageX-ab.left);0<=c&&c<=ab.width&&(pa.positionX(Math.round(c)),Oa(va*c/ab.width))}}function Oa(c){var d=bb.updateTimeline(c,function(a){b.style(pa.element(),{width:a});
Ca("time",pa)});Ua?(c=Ua.text)&&b.style(pa.element(),{width:32<c.length?160:""}):(c=a.timeFormat(c),d||b.style(pa.element(),{width:""}));cb.innerHTML!==c&&(cb.innerHTML=c);Ca("time",pa)}function Aa(){a.foreach(db,function(a,c){var d={};d.left=-1<c.position.toString().search(/^[\d\.]+%$/)?c.position:(100*c.position/va).toFixed(2)+"%";b.style(c.element,d)})}function nb(){jb=setTimeout(na.hide,500)}function ja(){ib=setTimeout(ma.hide,500)}function ra(a,c,d,e){if(!f){var j=a.element();c.appendChild(j);
c.addEventListener("mousemove",d,t);e?c.addEventListener("mouseout",e,t):c.addEventListener("mouseout",a.hide,t);b.style(j,{left:"50%"})}}function eb(b,d,e,j){if(f){var k=b.element();d.appendChild(k);(new a.touch(d)).addEventListener(a.touchEvents.TAP,function(){var a=e;"cc"==j?(2==ga.length&&(a=ha),Da?(clearTimeout(Da),Da=x,b.hide()):(Da=setTimeout(function(){b.hide();Da=x},4E3),a()),Ma.sendEvent(c.JWPLAYER_USER_ACTION)):"hd"==j&&(2==fa.length&&(a=kb),Ea?(clearTimeout(Ea),Ea=x,b.hide()):(Ea=setTimeout(function(){b.hide();
Ea=x},4E3),a()),Ma.sendEvent(c.JWPLAYER_USER_ACTION))})}}function Va(c){var d=M();d.className="jwgroup jw"+c;Fa[c]=d;if(Ga[c]){var d=Ga[c],e=Fa[c];if(d&&0<d.elements.length)for(var I=0;I<d.elements.length;I++){var p;a:{p=d.elements[I];var g=c;switch(p.type){case m:g=void 0;p=p.name;var g={},G=N(("alt"==p?"elapsed":p)+"Background");if(G.src){var q=M();q.id=$+"_"+p;"elapsed"==p||"duration"==p?(q.className="jwtext jw"+p+" jwhidden",pb.push(q)):q.className="jwtext jw"+p;g.background="url("+G.src+") repeat-x center";
g["background-size"]=aa(N("background"));b.style(q,g);q.innerHTML="alt"!=p?"00:00":"";g=E[p]=q}else g=null;p=g;break a;case l:if("blank"!=p.name){p=p.name;G=g;if(!N(p+"Button").src||f&&("mute"==p||0===p.indexOf("volume"))||u&&/hd|cc/.test(p))p=v;else{var g=M(),q=M(),A=void 0,A=ka,s=y(A.name);s||(s=M(),s.className="jwblankDivider");A.className&&(s.className+=" "+A.className);A=s;s=k.createElement("button");g.style+=" display:inline-block";g.className="jw"+p+" jwbuttoncontainer";"left"==G?(g.appendChild(q),
g.appendChild(A)):(g.appendChild(A),g.appendChild(q));f?"hd"!=p&&"cc"!=p&&(new a.touch(s)).addEventListener(a.touchEvents.TAP,T(p)):s.addEventListener("click",T(p),t);s.innerHTML="\x26nbsp;";q.appendChild(s);G=N(p+"Button");q=N(p+"ButtonOver");A=N(p+"ButtonOff");R(Q(".jw"+p+" button"),G,q,A);(G=xb[p])&&R(Q(".jw"+p+".jwtoggle button"),N(G+"Button"),N(G+"ButtonOver"));p=E[p]=g}break a}break;case r:g=void 0;A=p.name;if(f&&0===A.indexOf("volume"))g=void 0;else{p=M();var q="volume"==A,w=A+("time"==A?"Slider":
"")+"Cap",G=q?"Top":"Left",g=q?"Bottom":"Right",s=y(w+G,v,t,t,q),B=y(w+g,v,t,t,q),C;C=A;var H=q,D=G,Ka=g,ha=M(),K=["Rail","Buffer","Progress"],F=void 0,ca=void 0;ha.className="jwrail jwsmooth";for(var da=0;da<K.length;da++){var ca="time"==C?"Slider":"",P=C+ca+K[da],Y=y(P,v,!H,0===C.indexOf("volume"),H),ba=y(P+"Cap"+D,v,t,t,H),J=y(P+"Cap"+Ka,v,t,t,H),S=N(P+"Cap"+D),O=N(P+"Cap"+Ka);if(Y){var ia=M();ia.className="jwrailgroup "+K[da];ba&&ia.appendChild(ba);ia.appendChild(Y);J&&(ia.appendChild(J),J.className+=
" jwcap"+(H?"Bottom":"Right"));b(Q(".jwrailgroup."+K[da]),{"min-width":H?x:S.width+O.width});ia.capSize=H?S.height+O.height:S.width+O.width;b(Q("."+Y.className),{left:H?x:S.width,right:H?x:O.width,top:H?S.height:x,bottom:H?O.height:x,height:H?"auto":x});2==da&&(F=ia);2==da&&!H?(Y=M(),Y.className="jwprogressOverflow",Y.appendChild(ia),E[P]=Y,ha.appendChild(Y)):(E[P]=ia,ha.appendChild(ia))}}if(D=y(C+ca+"Thumb",v,t,t,H))b(Q("."+D.className),{opacity:"time"==C?0:1,"margin-top":H?D.skin.height/-2:x}),
D.className+=" jwthumb",(H&&F?F:ha).appendChild(D);f?(H=new a.touch(ha),H.addEventListener(a.touchEvents.DRAG_START,Ta),H.addEventListener(a.touchEvents.DRAG,Na),H.addEventListener(a.touchEvents.DRAG_END,Na),H.addEventListener(a.touchEvents.TAP,U)):(F=C,"volume"==F&&!H&&(F+="H"),ha.addEventListener("mousedown",L(F),t));"time"==C&&!f&&(ha.addEventListener("mousemove",za,t),ha.addEventListener("mouseout",ua,t));C=E[C+"Rail"]=ha;ha=N(w+G);w=N(w+G);p.className="jwslider jw"+A;s&&p.appendChild(s);p.appendChild(C);
B&&(q&&(B.className+=" jwcapBottom"),p.appendChild(B));b(Q(".jw"+A+" .jwrail"),{left:q?x:ha.width,right:q?x:w.width,top:q?ha.height:x,bottom:q?w.height:x,width:q?z:x,height:q?"auto":x});E[A]=p;p.vertical=q;"time"==A?(pa=new h.overlay($+"_timetooltip",oa),bb=new h.thumbs($+"_thumb"),cb=k.createElement("div"),cb.className="jwoverlaytext",ob=k.createElement("div"),g=bb.element(),ob.appendChild(g),ob.appendChild(cb),pa.setContents(ob),sb=C,Oa(0),g=pa.element(),C.appendChild(g),E.timeSliderRail||b.style(E.time,
j),E.timeSliderThumb&&b.style(E.timeSliderThumb,{"margin-left":N("timeSliderThumb").width/-2}),g=N("timeSliderCue"),G={"z-index":1},g&&g.src?(y("timeSliderCue"),G["margin-left"]=g.width/-2):G.display=n,b(Q(".jwtimeSliderCue"),G),Ja(0),X(0),X(0),Ja(0)):0===A.indexOf("volume")&&(A=p,s="volume"+(q?"":"H"),B=q?"vertical":"horizontal",b(Q(".jw"+s+".jw"+B),{width:N(s+"Rail",q).width+(q?0:N(s+"Cap"+G).width+N(s+"RailCap"+G).width+N(s+"RailCap"+g).width+N(s+"Cap"+g).width),height:q?N(s+"Cap"+G).height+N(s+
"Rail").height+N(s+"RailCap"+G).height+N(s+"RailCap"+g).height+N(s+"Cap"+g).height:x}),A.className+=" jw"+B);g=p}p=g;break a}p=void 0}p&&("volume"==d.elements[I].name&&p.vertical?(Ha=new h.overlay($+"_volumeOverlay",oa),Ha.setContents(p)):e.appendChild(p))}}}function sa(){clearTimeout(tb);tb=setTimeout(Z.redraw,0)}function Pa(){1<J.jwGetPlaylist().length&&(!k.querySelector("#"+J.id+" .jwplaylist")||J.jwGetFullscreen())?(b.style(E.next,C),b.style(E.prev,C)):(b.style(E.next,j),b.style(E.prev,j))}function Ca(b,
c){ia||(ia=a.bounds(W));c.constrainX(ia,!0)}function Ja(a){E.timeSliderBuffer&&(a=Math.min(Math.max(0,a),1),b.style(E.timeSliderBuffer,{width:(100*a).toFixed(1)+"%",opacity:0<a?1:0}))}function Ba(a,c){if(E[a]){var d=E[a].vertical,e=a+("time"===a?"Slider":""),j=100*Math.min(Math.max(0,c),1)+"%",k=E[e+"Progress"],e=E[e+"Thumb"],f;k&&(f={},d?(f.height=j,f.bottom=0):f.width=j,"volume"!==a&&(f.opacity=0<c||ya?1:0),b.style(k,f));e&&(f={},d?f.top=0:f.left=j,b.style(e,f))}}function V(a){Ba("volume",a);Ba("volumeH",
a)}function X(a){Ba("time",a)}function N(a){var b="controlbar",c=a;0===a.indexOf("volume")&&(0===a.indexOf("volumeH")?c=a.replace("volumeH","volume"):b="tooltip");return(a=oa.getSkinElement(b,c))?a:{width:0,height:0,src:"",image:x,ready:t}}function ea(b){b=(new g.parsers.srt).parse(b.responseText,!0);if(a.typeOf(b)!==w)return fb("Invalid data");Z.addCues(b)}function fb(b){a.log("Cues failed to load: "+b)}var J,oa,ka=s("divider","divider"),Xa={margin:8,maxwidth:800,font:"Arial,sans-serif",fontsize:11,
fontcolor:15658734,fontweight:"bold",layout:{left:{position:"left",elements:[s("play",l),s("prev",l),s("next",l),s("elapsed",m)]},center:{position:"center",elements:[s("time",r),s("alt",m)]},right:{position:"right",elements:[s("duration",m),s("hd",l),s("cc",l),s("mute",l),s("volume",r),s("volumeH",r),s("fullscreen",l)]}}},la,Ga,E,xa,W,$,va,fa,Qa,ga,La,Ka,Ha,ia,sb,ab,pa,ob,bb,cb,ib,Ea,ma,jb,Da,na,tb,Wa=-1,ta=t,qb=t,ya=v,mb=0,lb=0,db=[],Ua,wa=t,Ma=new c.eventdispatcher,xb={play:"pause",mute:"unmute",
fullscreen:"normalscreen"},hb={play:t,mute:t,fullscreen:t},rb={play:function(){hb.play?J.jwPause():J.jwPlay()},mute:function(){var a=!hb.mute;J.jwSetMute(a);!a&&0===Ka&&J.jwSetVolume(20);K()},fullscreen:function(){J.jwSetFullscreen()},next:function(){J.jwPlaylistNext()},prev:function(){J.jwPlaylistPrev()},hd:kb,cc:ha},$a={time:function(a){J.jwSeek(Ua?Ua.position:a*va)},volume:function(a){V(a);0.1>a&&(a=0);0.9<a&&(a=1);J.jwSetVolume(100*a)}},gb={},pb=[],Z=this;a.extend(Z,Ma);Z.setText=function(a){b.block($);
var c=E.alt,d=E.time;E.timeSliderRail?b.style(d,a?j:q):b.style(d,j);c&&(b.style(c,a?q:j),c.innerHTML=a||"");sa()};var Fa={};Z.redraw=function(c){b.block($);c&&Z.visible&&Z.show(D);P();c=top!==window.self&&a.isMSIE();b.style(E.fullscreen,{display:ta||qb||c?n:""});b(Q(".jwvolumeH"),{display:ta||wa?"block":n});b(Q(".jwmute .jwoverlay"),{display:!ta&&!wa?"block":n});b.style(E.hd,{display:!ta&&!wa&&fa&&1<fa.length&&ma?"":n});b.style(E.cc,{display:!ta&&!wa&&ga&&1<ga.length&&na?"":n});Aa();b.unblock($);
if(Z.visible){c=N("capLeft");var d=N("capRight");c={left:Math.round(a.parseDimension(Fa.left.offsetWidth)+c.width),right:Math.round(a.parseDimension(Fa.right.offsetWidth)+d.width)};b.style(Fa.center,c)}};Z.audioMode=function(a){a!=ta&&(ta=a,sa())};Z.instreamMode=function(a){a!=wa&&(wa=a)};Z.hideFullscreen=function(a){a!=qb&&(qb=a,sa())};Z.element=function(){return W};Z.margin=function(){return parseInt(la.margin,10)};Z.height=function(){return xa};Z.show=function(c){if(!Z.visible||c){Z.visible=!0;
c={display:"inline-block"};var d=la.maxwidth|0;!ta&&d&&(W.parentNode&&a.isIETrident())&&(c.width=W.parentNode.clientWidth>d+(la.margin|0)?d:"");b.style(W,c);ia=a.bounds(W);W&&E.alt&&(W.parentNode&&320<=W.parentNode.clientWidth?b.style(pb,C):b.style(pb,j));b.block($);K();sa();clearTimeout(Wa);Wa=-1;Wa=setTimeout(function(){b.style(W,{opacity:1})},0)}};Z.showTemp=function(){this.visible||(W.style.opacity=0,W.style.display="inline-block")};Z.hideTemp=function(){this.visible||(W.style.display=n)};Z.addCues=
function(b){a.foreach(b,function(a,b){if(b.text){var c=b.begin,d=b.text;if(0<=c.toString().search(/^[\d\.]+%?$/)){var e=y("timeSliderCue"),j=E.timeSliderRail,k={position:c,text:d,element:e};e&&j&&(j.appendChild(e),e.addEventListener("mouseover",function(){Ua=k},!1),e.addEventListener("mouseout",function(){Ua=v},!1),db.push(k))}Aa()}})};Z.hide=function(){Z.visible&&(Z.visible=!1,b.style(W,{opacity:0}),clearTimeout(Wa),Wa=-1,Wa=setTimeout(function(){b.style(W,{display:n})},250))};E={};J=d;$=J.id+"_controlbar";
va=0;W=M();W.id=$;W.className="jwcontrolbar";oa=J.skin;Ga=oa.getComponentLayout("controlbar");Ga||(Ga=Xa.layout);a.clearCss(Q());b.block($+"build");P();var ub=y("capLeft"),vb=y("capRight"),wb=y("background",{position:"absolute",left:N("capLeft").width,right:N("capRight").width,"background-repeat":"repeat-x"},D);wb&&W.appendChild(wb);ub&&W.appendChild(ub);Va("left");Va("center");Va("right");W.appendChild(Fa.left);W.appendChild(Fa.center);W.appendChild(Fa.right);E.hd&&(ma=new h.menu("hd",$+"_hd",oa,
da),f?eb(ma,E.hd,Y,"hd"):ra(ma,E.hd,Y,ja),gb.hd=ma);E.cc&&(na=new h.menu("cc",$+"_cc",oa,Ra),f?eb(na,E.cc,qa,"cc"):ra(na,E.cc,qa,nb),gb.cc=na);E.mute&&(E.volume&&E.volume.vertical)&&(Ha=new h.overlay($+"_volumeoverlay",oa),Ha.setContents(E.volume),ra(Ha,E.mute,ba),gb.volume=Ha);b.style(Fa.right,{right:N("capRight").width});vb&&W.appendChild(vb);b.unblock($+"build");J.jwAddEventListener(c.JWPLAYER_MEDIA_TIME,A);J.jwAddEventListener(c.JWPLAYER_PLAYER_STATE,function(a){switch(a.newstate){case e.BUFFERING:case e.PLAYING:E.timeSliderThumb&&
b.style(E.timeSliderThumb,{opacity:1});S("play",D);break;case e.PAUSED:ya||S("play",t);break;case e.IDLE:S("play",t),E.timeSliderThumb&&b.style(E.timeSliderThumb,{opacity:0}),E.timeRail&&(E.timeRail.className="jwrail",setTimeout(function(){E.timeRail.className+=" jwsmooth"},100)),Ja(0),A({position:0,duration:0})}});J.jwAddEventListener(c.JWPLAYER_PLAYLIST_ITEM,function(b){if(!wa){b=J.jwGetPlaylist()[b.index].tracks;var c=t,d=E.timeSliderRail;a.foreach(db,function(a,b){d.removeChild(b.element)});db.length=
0;if(a.typeOf(b)==w&&!f)for(var e=0;e<b.length;e++)if(!c&&(b[e].file&&b[e].kind&&"thumbnails"==b[e].kind.toLowerCase())&&(bb.load(b[e].file),c=D),b[e].file&&b[e].kind&&"chapters"==b[e].kind.toLowerCase()){var j=b[e].file;j?a.ajax(j,ea,fb,D):db.length=0}c||bb.load()}});J.jwAddEventListener(c.JWPLAYER_MEDIA_MUTE,K);J.jwAddEventListener(c.JWPLAYER_MEDIA_VOLUME,K);J.jwAddEventListener(c.JWPLAYER_MEDIA_BUFFER,function(a){Ja(a.bufferPercent/100)});J.jwAddEventListener(c.JWPLAYER_FULLSCREEN,function(a){S("fullscreen",
a.fullscreen);Pa();Z.visible&&Z.show(D)});J.jwAddEventListener(c.JWPLAYER_PLAYLIST_LOADED,I);J.jwAddEventListener(c.JWPLAYER_MEDIA_LEVELS,function(a){fa=a.levels;if(!wa&&fa&&1<fa.length&&ma){b.style(E.hd,C);ma.clearOptions();for(var c=0;c<fa.length;c++)ma.addOption(fa[c].label,c);G(a)}else b.style(E.hd,j);sa()});J.jwAddEventListener(c.JWPLAYER_MEDIA_LEVEL_CHANGED,G);J.jwAddEventListener(c.JWPLAYER_CAPTIONS_LIST,function(a){ga=a.tracks;if(!wa&&ga&&1<ga.length&&na){b.style(E.cc,C);na.clearOptions();
for(var c=0;c<ga.length;c++)na.addOption(ga[c].label,c);H(a)}else b.style(E.cc,j);sa()});J.jwAddEventListener(c.JWPLAYER_CAPTIONS_CHANGED,H);J.jwAddEventListener(c.JWPLAYER_RESIZE,function(){ia=a.bounds(W);0<ia.width&&Z.show(D)});f||(W.addEventListener("mouseover",function(){p.addEventListener("mousemove",O,t);p.addEventListener("mousedown",Ia,t)},!1),W.addEventListener("mouseout",function(){p.removeEventListener("mousemove",O);p.removeEventListener("mousedown",Ia);k.onselectstart=null},!1));setTimeout(K,
0);I();Z.visible=!1};b("span.jwcontrolbar",{position:"absolute",margin:"auto",opacity:0,display:n});b("span.jwcontrolbar span",{height:z});a.dragStyle("span.jwcontrolbar span",n);b("span.jwcontrolbar .jwgroup",{display:"inline"});b("span.jwcontrolbar span, span.jwcontrolbar .jwgroup button,span.jwcontrolbar .jwleft",{position:"relative","float":"left"});b("span.jwcontrolbar .jwright",{position:"relative","float":"right"});b("span.jwcontrolbar .jwcenter",{position:"absolute"});b("span.jwcontrolbar buttoncontainer,span.jwcontrolbar button",
{display:"inline-block",height:z,border:n,cursor:"pointer"});b("span.jwcontrolbar .jwcapRight,span.jwcontrolbar .jwtimeSliderCapRight,span.jwcontrolbar .jwvolumeCapRight",{right:0,position:"absolute"});b("span.jwcontrolbar .jwcapBottom",{bottom:0,position:"absolute"});b("span.jwcontrolbar .jwtime",{position:"absolute",height:z,width:z,left:0});b("span.jwcontrolbar .jwthumb",{position:"absolute",height:z,cursor:"pointer"});b("span.jwcontrolbar .jwrail",{position:"absolute",cursor:"pointer"});b("span.jwcontrolbar .jwrailgroup",
{position:"absolute",width:z});b("span.jwcontrolbar .jwrailgroup span",{position:"absolute"});b("span.jwcontrolbar .jwdivider+.jwdivider",{display:n});b("span.jwcontrolbar .jwtext",{padding:"0 5px","text-align":"center"});b("span.jwcontrolbar .jwalt",{display:n,overflow:"hidden"});b("span.jwcontrolbar .jwalt",{position:"absolute",left:0,right:0,"text-align":"left"},D);b("span.jwcontrolbar .jwoverlaytext",{padding:3,"text-align":"center"});b("span.jwcontrolbar .jwvertical *",{display:"block"});b("span.jwcontrolbar .jwvertical .jwvolumeProgress",
{height:"auto"},D);b("span.jwcontrolbar .jwprogressOverflow",{position:"absolute",overflow:"hidden"});d("span.jwcontrolbar","opacity .25s, background .25s, visibility .25s");d("span.jwcontrolbar button","opacity .25s, background .25s, visibility .25s");d("span.jwcontrolbar .jwtime .jwsmooth span","opacity .25s, background .25s, visibility .25s, width .25s linear, left .05s linear");d("span.jwcontrolbar .jwtoggling",n)})(window.jwplayer);
(function(g){var h=g.utils,a=g.events,c=a.state,e=g.playlist,b=!0,d=!1;g.html5.controller=function(f,u){function l(){return f.getVideo()}function m(a){x.sendEvent(a.type,a)}function r(c){z(b);switch(h.typeOf(c)){case "string":var d=new e.loader;d.addEventListener(a.JWPLAYER_PLAYLIST_LOADED,function(a){r(a.playlist)});d.addEventListener(a.JWPLAYER_ERROR,function(a){r([]);a.message="Could not load playlist: "+a.message;m(a)});d.load(c);break;case "object":case "array":v.setPlaylist(new g.playlist(c));
break;case "number":v.setItem(c)}}function n(e){h.exists(e)||(e=b);if(!e)return j();try{0<=k&&(r(k),k=-1);if(!B&&(B=b,x.sendEvent(a.JWPLAYER_MEDIA_BEFOREPLAY),B=d,A)){A=d;F=null;return}if(v.state==c.IDLE){if(0===v.playlist.length)return d;l().load(v.playlist[v.item])}else v.state==c.PAUSED&&l().play();return b}catch(f){x.sendEvent(a.JWPLAYER_ERROR,f),F=null}return d}function z(e){F=null;try{return v.state!=c.IDLE?l().stop():e||(s=b),B&&(A=b),b}catch(j){x.sendEvent(a.JWPLAYER_ERROR,j)}return d}function j(e){F=
null;h.exists(e)||(e=b);if(!e)return n();try{switch(v.state){case c.PLAYING:case c.BUFFERING:l().pause();break;default:B&&(A=b)}return b}catch(j){x.sendEvent(a.JWPLAYER_ERROR,j)}return d}function q(a){h.css.block(v.id+"_next");r(a);n();h.css.unblock(v.id+"_next")}function C(){q(v.item+1)}function w(){v.state==c.IDLE&&(s?s=d:(F=w,v.repeat?C():v.item==v.playlist.length-1?(k=0,z(b),setTimeout(function(){x.sendEvent(a.JWPLAYER_PLAYLIST_COMPLETE)},0)):C()))}function t(a){return function(){p?D(a,arguments):
K.push({method:a,arguments:arguments})}}function D(a,b){var c=[],d;for(d=0;d<b.length;d++)c.push(b[d]);a.apply(this,c)}var v=f,x=new a.eventdispatcher(v.id,v.config.debug),p=d,k=-1,B,F,s=d,A,K=[];h.extend(this,x);this.play=t(n);this.pause=t(j);this.seek=t(function(a){v.state!=c.PLAYING&&n(b);l().seek(a)});this.stop=function(){s=b;t(z)()};this.load=t(r);this.next=t(C);this.prev=t(function(){q(v.item-1)});this.item=t(q);this.setVolume=t(v.setVolume);this.setMute=t(v.setMute);this.setFullscreen=t(function(a){u.fullscreen(a)});
this.detachMedia=function(){try{return v.getVideo().detachMedia()}catch(a){return null}};this.attachMedia=function(a){try{v.getVideo().attachMedia(a),"function"==typeof F&&F()}catch(b){return null}};this.setCurrentQuality=t(function(a){l().setCurrentQuality(a)});this.getCurrentQuality=function(){return l()?l().getCurrentQuality():-1};this.getQualityLevels=function(){return l()?l().getQualityLevels():null};this.setCurrentCaptions=t(function(a){u.setCurrentCaptions(a)});this.getCurrentCaptions=function(){return u.getCurrentCaptions()};
this.getCaptionsList=function(){return u.getCaptionsList()};this.checkBeforePlay=function(){return B};this.playerReady=function(a){if(!p){u.completeSetup();x.sendEvent(a.type,a);g.utils.exists(window.jwplayer.playerReady)&&g.playerReady(a);v.addGlobalListener(m);u.addGlobalListener(m);x.sendEvent(g.events.JWPLAYER_PLAYLIST_LOADED,{playlist:g(v.id).getPlaylist()});x.sendEvent(g.events.JWPLAYER_PLAYLIST_ITEM,{index:v.item});r();v.autostart&&!h.isMobile()&&n();for(p=b;0<K.length;)a=K.shift(),D(a.method,
a.arguments)}};v.addEventListener(a.JWPLAYER_MEDIA_BUFFER_FULL,function(){l().play()});v.addEventListener(a.JWPLAYER_MEDIA_COMPLETE,function(){setTimeout(w,25)});v.addEventListener(a.JWPLAYER_MEDIA_ERROR,function(b){b=h.extend({},b);b.type=a.JWPLAYER_ERROR;x.sendEvent(b.type,b)})}})(jwplayer);
(function(g){g.html5.defaultskin=function(){this.text='\x3c?xml version\x3d"1.0" ?\x3e\x3cskin author\x3d"JW Player" name\x3d"Six" target\x3d"6.7" version\x3d"3.0"\x3e\x3ccomponents\x3e\x3ccomponent name\x3d"controlbar"\x3e\x3csettings\x3e\x3csetting name\x3d"margin" value\x3d"10"/\x3e\x3csetting name\x3d"maxwidth" value\x3d"800"/\x3e\x3csetting name\x3d"fontsize" value\x3d"11"/\x3e\x3csetting name\x3d"fontweight" value\x3d"normal"/\x3e\x3csetting name\x3d"fontcase" value\x3d"normal"/\x3e\x3csetting name\x3d"fontcolor" value\x3d"0xd2d2d2"/\x3e\x3c/settings\x3e\x3celements\x3e\x3celement name\x3d"background" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAeCAYAAADtlXTHAAAAN0lEQVR42mMQFRW/x2RiYqLI9O3bNwam////MzAxAAESARQCsf6jcmFiOLkIoxAGEGIBmSAHAQBWYyX2FoQvwgAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"capLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAeCAYAAAARgF8NAAAAtElEQVR42tWRQQrCMBBFvzDJRltcmDTURYO3kHoK71K8hGfxFh7DnS2atXSRpozbViwVRNS3frw/MMTM0NpYADsAOYAZOpDWZgXgEMfxwlqrpJSyJwAooihSWZalbduirms8CnmSJCqEgGcQgJkQQmAAwgivCcyjBf78xLs3/MUEM3/9WT9QuDVNE4gEDQlH564mTZdqSNh779dVVU6U0nMi6pXIuctJa7P13hdled4AmHaFO61WQkab+AHPAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"capRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAeCAYAAAARgF8NAAAAtklEQVR42tWTMQrCUBBE35evhX2UYJGTeACx8y4eQvRW6jWSVBJ/BCXEFMmStRISNKQSdWCrnZ0ZdlnjedOQNnLgCGycS2KzWCy12S3LsozjOM2y7AKsbFEUrXFjzCgIglkUReR5vh6oKs2q6xoRwff9CTAf0AFr7RAYdxKe6CVY1R4C6Ict+hX6MvyHhap++1g/rSBSCVB0KpzPyRXYv2xSRCRN3a2qqhOwM2+e9w4cgK1zSfgA16hp3sNEmiwAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"playButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAeCAYAAAA2Lt7lAAABIklEQVR42u3VoWqFUBjAcWFpaWn11qULew8RmQg+wnwAH0NBQYPFcosXdooYTH7FZhIEDQoaDIJJVDQ5bTeIHO8UFjzwR9sPPcdPYhxH4siIEziB/YFpvU69T71NvRAbFw5wybLsJgjC93T/sRXCAa5VVcEwDBCG4c9WCAf4zPMc5sqyhL7vN0FYQJIk8FhRFNB1HRaEBURRBEvNT9W27SqEBQRBAGulaQpN0yxCWIDv+4BTHMdQ1/V8vWua9jUfcSzA8zzYkm3bd0mSGGzAdV3AyTAMxHEcv/kVOY4Da+m6jliW5Z/eZMuyYClVVRHDMPyfjylCCB6TZRnRNM3v9aFdTdOEOVEUEUVR/N6j4qIoyo0kSf6oYXfsuD5/mSfw/4BfzM60PxpdNhsAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"playButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAeCAYAAAA2Lt7lAAABIklEQVR42u3VoWqFUBjAccPi4uIe4D7A4g3rIoIIvsRd8ymmgoIGi9liEYPJZDMJgm4o6MCJYBIVTd+03SByzqaw4IE/2n7oOX4SAEAcGXECJ7A/MK/Huee5p7kHAnOhAJc8zz94nn+f719wIRTg2jQNTNMEURR940IowGtRFLBU1zWM44gFIQFpmsJ9ZVnCMAxIEBIQxzGstTxV3/ebEBIQhiFslWUZdF23CiEBQRAASkmSQNu2y7XQNO22HHEkwPd9wMlxnC9Jkt6QAc/zACXDMCqO4wTsV+S6Lmyl63rFsqzw6022bRvWUlW1YhhG+PMxtSwL7pNluaJpWtjrQ7uapglLoihWFEUJe4+Ki6IonyRJCkcNu2PH9fnLPIH/B/wA5fzQF959z6UAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"pauseButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAeCAYAAAA2Lt7lAAAAmUlEQVR42u2WTQoCMQxGX8RlDzAX9FRezXXxAN30B+KmIDilmQHLKNNsCt8jPAg0RFSVkXVhcE3BCQTXVigiDlgAV6MAPOtLzVdcVcMmAbCo6v1DegMeG7kpcN77VbaDmwJKKd3ZWtwU5Jy7jRY/XpBS6jZa/HhBjLHbaPETjGi44O//QWisgrCDv5dg66r45rqWebZMwe8LXlPydRVUwjqdAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"pauseButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAeCAYAAAA2Lt7lAAAAn0lEQVR42u2VSwrFIAxFr9AFuIRuoftxz+0SOnLs1A/cN3H0WhILlVJqJkIO4ZCIcSKJnjGhcwzBVwXGGAtgBmBrKgDY64maP3CSobWDmeT6J10AbI1cFVjv/SF3get3UEoRZ6txVZBzFgs1/rwgpSQWavx5QYxRLNT4B0bUXfD6dxBOVkG4wFXB7pxbTtZ1K5cFda9vQucaH3/yENwYP2sBdLsTPIMJAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"prevButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAeCAYAAAAhDE4sAAAA6UlEQVR42mP4//8/AzUww6hBowYNaoOAgAeIJaA0OmAGYn4gFgViTkIGqQDp/SAaiwHqJSUl6Q8ePFgMZMsRMsjg0aNHIIMM0A24cuXKmh8/fux/+fIlSF6XoEG3bt0CKbRHNuDbt2/7Hz9+vB8kB5U3IGjQ+fPn96enp5feuHFj5efPn/ffvn17P0gMGRNl0JEjR/YnJSWVbdmyZSWIjQ0TZdCuXbvgXgsNDc2YPXv2WpAYMibKoPXr12MEdkBAQMbEiRPXguSg8gQDW2X58uU4o9/X1zdj8uTJREU/dRLkaO4fNWhYGAQACIKTdMKw1gUAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"prevButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAeCAYAAAAhDE4sAAAA6UlEQVR42mP4//8/AzUww6hBowYNaoOAQACIFaA0OmABYhEglgFiHkIGGfyHMAywGGBSUlLS9eDBg5tAtgYhgxwePXoEYjigG3DlypVnP378+P/y5UuQvA1Bg27dugVihCAb8O3bt/+PHz/+D5KDyjsQNOj8+fP/09PT59y4cePh58+f/9++ffs/SAwZE2XQkSNH/iclJc3dsmXLIxAbGybKoF27dsG9Fhoa2j179uznIDFkTJRB69evxwjsgICA7okTJz4HyUHlCQa2wfLly3FGv6+vb/fkyZNvERP91EmQo7l/1KBhYRAAuDSgTOE1ffsAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"nextButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAeCAYAAADKO/UvAAAA6klEQVR42mP4//8/A6WYYdSQUUMGxBAg4ARiUSDmB2JmBkzAA8QSIBqfIXIPHjxYXFJSkg5kq2MxTAWobj+UxmmI7suXL/f/+PFj/5UrV9ZgMczg0aNHIEMM8BlicOvWrf0g/Pjx4/3fvn1DN8weJEfQkPPnz+9Hxrdv397/+fPn/Tdu3FiZnp5eChIjaMiRI0f2Y8NbtmxZmZSUVAZiEzRk165d+5Hx7Nmz14aGhmbAvAMSI2SI7vr16/eD8MSJE9cGBARkoAcsSI6QIXKTJ09e7Ovrm4EripcvX04wiilPbKO5eNSQQW8IAG8yOc7bkjJcAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"nextButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAeCAYAAADKO/UvAAAA6klEQVR42mP4//8/A6WYYdSQUUMGxBAg4AFiGSAWAWIWBkwgAMQKIBqfIRoPHjy4WVJS0gVkm2AxzOA/RKEBPkNsXr58+f/Hjx//r1y58gyLYQ6PHj0CKXTAZ4jDrVu3/oPw48eP/3/79g3dsBCQHEFDzp8//x8Z3759+//nz5//37hx42F6evockBhBQ44cOfIfG96yZcujpKSkuSA2QUN27dr1HxnPnj37eWhoaDfMOyAxQobYrF+//j8IT5w48XlAQEA3esCC5AgZojF58uRbvr6+3biiePny5QSjmPLENpqLRw0Z9IYAAGB2RqagdTNIAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"elapsedBackground" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAeCAYAAAAPSW++AAAAFklEQVR42mP4//8/AzbMMCoxKjHcJAArFxoDYgoNvgAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"durationBackground" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAeCAYAAAAPSW++AAAAFklEQVR42mP4//8/AzbMMCoxKjHcJAArFxoDYgoNvgAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"timeSliderCapLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAeCAYAAADpYKT6AAAAFElEQVR42mP4//8/AwwzjHIGhgMAcFgNAkNCQTAAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"timeSliderCapRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAeCAYAAADpYKT6AAAAFElEQVR42mP4//8/AwwzjHIGhgMAcFgNAkNCQTAAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"timeSliderRail" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAeCAYAAADtlXTHAAAAM0lEQVR42pWNIRLAIADD0vrJwv9f2gkONJhcokJbDFyDZNbJwLYPhKWdkpaRzNL242X0A7ayDBvOWGKEAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"timeSliderRailCapLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAoUlEQVR42t3RTQrCMBCG4SwKgrhttaSkFAppS9Mk/VEPoTvBC7nyUIpnKq4/JwGDeANdPJt3MZMhDAD7xv4ixvH6SG5kfocL5wJlKVHXrQ+HLBNoGoW21R5Lks1dyhpdZwMXZ60tjOkDH40ZYO0YsDTlDzdvGLYBq6rmJESBvp8wjjvPPSnK8+JKoJTGNO3DFQsKZzeKdjw/z4vIkqx++o9eChh4OrGutekAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"timeSliderRailCapRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAqElEQVR42t3RTQrCMBCG4VkIgritWlpaCoW2oc1Pf9RD6E48kSsPpXim6vpzphAX3kAXz+ZNMiSEANA3+ukYBOuR3djhE6uqRp4XiKIEvHCZYl0bCKUaxPG0cCStHbyiUFitNneytoVnjJM4knM9PGs7iU/qui08mRuG0YP6fgfRtgOSJENZqhMNwx5NY5CmmbjylWbEM15yRGt75jD3z1yyhez4iz96A9GweD4LqeZmAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"timeSliderBuffer" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAeCAYAAADtlXTHAAAALUlEQVR42mP+//8/A3NDQwOJxNy58/8zCwkJNyARwsJglgiIBSPevn3TSLrxAICJLIFssC4FAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"timeSliderBufferCapLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAbElEQVR42mP8//8/AzpgHL6CMjJyvoyMDJlAIVuwoKysvA8TE9NCRkZGISCGqJSXV9wKFPQCC8AElZRUPgEFeVHMVFFR/QRUgSqoqqq+Dcj2RBFUU9PwBbIXALEQipOAEn5ACugkBlvGkREdAE2UZQboCcvbAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"timeSliderBufferCapRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAaUlEQVR42t3QuxGAIBBFUfoA+S1oM1KudkUi5s8VwXEcKzC4yXlLggAg3on/oVK6KDUsUg7zjdZ6GOOgtc18kCp6H+Ac4Rx5WCsSRfR43CqGENEjCqXhiEfX8xgntDKXOu7c2uGnP/+FB8gXjGr6cT/xAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"timeSliderProgress" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAeCAYAAADtlXTHAAAALklEQVR42p3MsQ0AQAjDQCv7z8gakCo0LPDfnFyZJAh4J6oqZBt19zEzV7bhb792VRs5A8JlWAAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"timeSliderProgressCapLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAYklEQVR42mP8//8/AzpgHNaCvkCcCcS2MEGfb9++Lfz48aPQz58/ISpfv3699c2bN14o2s+dO/cJyOZFETx69Cim4N69e7cB2Z4oglu2bAHZvACIhVCctHbtWj90Jw3z6AAAdAV63jcCcQsAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"timeSliderProgressCapRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAZUlEQVR42t3QIQ7AIAyFYQ44boojQ1VisVgcggQzhn5ryraQ7QaIz/xJ85IqAOpLLRkb29n2xpQScs7ovVcOWmKMEY9SipMYQsDkkOi9x6RJJCJMxrm1FrfKxpAx5mSO6bU//3MBeArIus+/eXoAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"timeSliderThumb" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAeCAYAAAAl+Z4RAAABm0lEQVR42u2UTUsCURSGJ0kNV1MghjuhVhYEbSPoY5WbWhV90pd/SfwPulDc6c6vvYrjQl2kLdQ/IDhwe8/wTsQ04ZSbFg48Mtzzvsdzz71nNKWUtgjaMsF/SOB4VoAPrIIAWCMBrvmocX0k6Afr4BBcgRdyCQ4Y81P7zRwEO+CpUCjkJpPJ0DTNmTAejweyhtgjNcGvSWzzLkh2u11jNBqpXq+nDMOw6Pf7CkmUxERD7WcSKSki/9xqtYxOp6Pa7bYrEhONaMEmvVoIHGUymfxPRifZbDYPzzG9mg6ua7XawGuCer0+hOeGXi0snW42mzOvCbCNGTyv9Fp7+VWCRqMxheeZXuvntlKpeN5CtVodwHPH5ltlnKXTac9NFC08CXsL0oi4lFQsFo15ZtGw/LjdRDmKqBylXJJSqWTMMSepjdrH6GemGDiVhqZSqRz2+Y5um2jutFwuv8ka5+KEWt2+SPZV3mBgH1yABx6VcA/OGYtR6zoPOkvb5tDsEXnfYkx3mp3jHKIozCOO8F1nzHWc//5BWX6VF0/wATCN7PmY+qrmAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"timeSliderCue" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAeCAYAAAAl+Z4RAAAAfElEQVR42mP4//8/AyWYYdSAUQOGuQGiouJZQHwEirNIMgCkwcbG7klra/tvEAaxcRmCy4Aj1dV1v3Nz8/+DMIgNEiPJgLS0jN+ZmTn/QRjEBoodJckLRkYmT5KSUn8nJqb8BrGBYtmkBmI2yFYgPgTEmaMpcdSAUQPwYwAtmWpcwU8bfwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"hdButtonOff" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAeCAYAAADQBxWhAAABiElEQVR42u2Vu0oDQRSGF1SwiIVCspfZnb1rEcxFCOmNzdb2PoIvpCCxEyJYqdU+gbVtKmMeQavx/KMDg4I4GxACU/wcZjL/+ebMzNk4Qgjnv+VYqIVa6HpC2223Ii1IYgXBX5lAF0HARBjyxoIfeUygIo5TkSQZmUO5c8TvY70yzwskDGsg+DFvBE3TXGRZoYw7jIWPnCcCEWM1D9V1vTcajSvX9edRFEsf/MZQGBWU5Pg+eyAJRIzVPOmS9ESw8XB4dIKKda8RNM9LKZW81xtMut3DM0QdSpB7xiJBVd5Mp9dbNPeme42gRVFKqeR0h+cEuEDUoag8ijhO4I7GG6R33WsI3ZfSK8JDQdShtIkrqvKZTgFtNsHx6l4jaFkeSOkVcR7/uFNavz2b3e7Sho5pPMdj072NoLgv1SK4p99aBi8XFTaCdjreK3oNRtwNXiKASIioXifaAus+2yuXvykg5inP8s/Qfn9wCsMqn0HyvyCPyQd/k9RSzd9Qra889q/NQi10DaEfbVCWtJniLegAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"hdButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAeCAYAAADQBxWhAAABwklEQVR4nO2Uz0oCURTGXZigT+Br+ALiKyi4UAMJDAaEFkGLVrkM3BjkQiSFGElE0IUIIgrCLERUEkFJyD+ghLS1aVWn88kEg7i4KcwiRvhxzvngOx/cuV4LEVmMxvBAM9QM/Weh/DthnIyLcTOeA3Brfuw5EQl1xmKx+HK5VDebDR0K/NiDfSKhrul0qq5WKxgPBn7swT6RUPdisaDZbHY02IN9IqGeyWRCeli7y+fza/SomDX9mjmz2+2Xfr//UVEUdY/XIxQ6HA5JD2vnlUplgh4Vs6aHa7Wa0u/33wKBwK3X633Y4xUL7Xa7pIe1QCQSuZEk6QkVs6ZHi8XifDAYULlcHlmt1mi73f7a8YqF8jGRHtZOE4mEnM1mn1Exa3o0l8vN0cuy/GKz2S5ardb3jlcstNFokB7WpEKh8NrpdAgVs6aHM5mMwto7H+99KBSSm83mrlcstFqtkh5cnGQyuUaPilnTtxfJ4XBc+Xw+mUM+93iFQt2lUon0jMdjqtfr2x4V868ORqMR9Xo9XDLa9Yr+ZVz87VQ+MjoW7BF9HJz8beLpdFrlS0KHkkqlPoLBoPAzaPyDbwRmqBlqhv6JH8CLXqCC55PmAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"ccButtonOff" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAeCAYAAADQBxWhAAAB10lEQVR42u1Vu0oDQRQNmEZQSGHMYzebZHcTg0IeFlZaCIpGRI2itb+hEOMnWEasbGLlo/EHJDY21jYWvhURH5UijudMEomI4CQgBLY4zMxhzj1z78zddQkhXP8Nl2PqmDqmrWnq9fqywBUgmgD1WRXTq2BQE7puNAzqGUfFVITDURGJmBKhUFj4/UGZQXe3X2ha6Afv8wW+eIJ68kqm0aglTNMWhhGh0XUymV4olba8udxsn6bpOzSA0Vk6nZnZ3t7pmpycSoHfJ08d9cqmFBKBgCYQeBrmE+DPYbRRLK57cJD7TKZ/FNnOgb8Av1YorHaBf64dWNnUsmISmL/l8yvtCHZQd1cPWN9ibxvGI/LgPsgD73VaNVPbjklg/gq4cXdlwwjL4CjjLjI74V6Mx1X+nWXHIR4ty65pVU3jEtWHMpxI9M4j4A2y2qyW8Qn8QDyeWMT8DuUvLi0tezF/YZbUKpvGYj0SfEi8S4zZcvnQMzY2HsVaPiSMpzAYIT84OGRjvcdS17QNm/LELF99y+h65YV+bxm/7E/ub8iULcJeq4lZLtO0ZBsQlTuL/8pTQz2v48+mqVR6joJmPoPQXzKOygffDXQAnU2goxrH+bU5po5pC5p+AoMCobNnBGFcAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"ccButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAeCAYAAADQBxWhAAACIklEQVR42u2VO4saURiGbVZERC39AVZ2U9jK/gERCxG1sdIiAZukCWSxs1hZlE0jLtEQb9FCUfF+v4DXFTR4KxSDE9ikSDM72WTRk3OGGIatDgpLihGewo953+c4Z+bIAwDwnhseJ+WknPQkKfycQWQQAqKCnB+B6m8e9ZzhSGV2u/1yu93SFEWBY0F51IP6cKTEarWiSZJEwaNBedSD+nCkqs1mA9br9cmgHtSHIz1fLpeATa/X+2U2m+NisfiCIAhXIBD4gubtdvunyWSKiUSit0ql8joSiZBPs6gPSzqZTAAbg8HwyWKxvJ/P51Q4HP4sFAo9nU7nQavV+m0228fFYkH5/f5biURy0+12d+wstnQwGIADsGQPJa+LxSI5Go3AdDoFUPLYaDTQfr2s1Wp3hzlc1GO/3wfsPLa01WqBA/V6fS8QCF7FYrGv6Huz2QRut/sulUr9gNe+SCQS39EcLmLvcrm+5fP5HTuPLS2Xy+BApVIBer0+BPf0QzKZvHc6nRN4G68LhcJvtVp9Y7VaI3ABtMPhuJVKpe+y2eyOnceWZjIZwKZarT7odLoon89/I5fLnaFQaJvL5dCCaI1GE0ZzhUJxBR8kZs7O4kpV8XgcsIG/hNmf2WzGPBylUomZp9NpMBwOmfl4PP43Z4P7yhA+n4+ORqPgVFAP7uEgg+/epdfrpYPBIDgWj8dzbzQasY/B5z/wuT9xTspJ/zvpH7Snd5Nr6YMeAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"muteButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAeCAYAAAAy2w7YAAACPUlEQVR42mP4//8/Az0ww6hFoxYNvEVkAiYgZgZiRpgALSxijIuL4zt58qQNkM0Fs4xci0CaWYCYHUoji7G4u7sLv337dtaKFStsoWrIsghkILu1tbXCixcvmoBsXqg4C9AXphs3bjQEsvnKysr0gZYtlJaWFgUFJakWgcKet7Oz0/bdu3crX758uR/IF4f6hHXmzJna79+/X+Dl5SUD5AsdP368+uDBgwEghxFjERtIExBLALHMjh070r58+bL7zp07+69evQqySPbChQu2ycnJIAsFNm3alHDt2rUcEHvq1KnWt2/fbgX5kBiLhID0fhgGBsf+ixcv7j9//jwYA+Xljh49Gvb48eN6kOGenp7yQEfMA7KFOTk5xYCWLgKxibFI4sSJE/txYaC8FCj4rly5shhkIAifOnVqAYwNjLcFRFsEDOf9uDBQXpqDg0Pi8OHDMItEgGy4RTA2UUG3a9eu/bgwUF7+5s2b8evXr68EBV1kZKTSvn375oIMFxQUFNu/f/9CaPCTlhgaGxtTgEl495YtW/aDMCgxbNiwwdDU1BSkRgAYfxmLFy9OA7HXrFljv27duiZiEwN68uaJjo62Ahq2EmgILHmDihtWIN8QaNE8PT09SZDjLl++3DBjxgwvYpM31gyroaEhDzSkHjnDbtu2Ta+qqkoT5IMJEyaYHjp0aC4w5QmTk2EJFUEgn7EkJiaKAUuN+SUlJZaUFEEEC1UzMzOurq4uM2oUqgQtI7maGK3KRy0aPhYBAK/+y9iyNfpJAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"muteButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAeCAYAAAAy2w7YAAACW0lEQVR42mP4//8/Az0ww6hFoxYNvEVkAlYg5gBiFpgALSxitLOzk122bFkikC0NxMyUWMQIxNxALALEXFAxFiibS1tbW+vx48fX6urqcqFqyLII5EIRJSUlr8uXL+8HslWg4pwrVqwI7ezsDAGyVf38/OKBlj3k5+c3BgUlqRaxAbFiXFxc+YMHD96/fPkSpMAOZAkQ8+Xm5gY+e/bsvo6OjgOQr79p06btc+bMaQE5jBiLBIDYAIhBmn0mTJiw9uPHj3/u3Lnz/+rVqyAFfkADE4DxYghka02dOnXmnj17lgLZOvn5+VnHjx8/BGSrEWORwX8k8Pbt2/8XL178f/78eTAGygesXLmy/cKFCzuBbE1g/HhcunTpLpBtyMrKanHu3LmHIDYxFjmcOHHiPy4MlHcDYtszZ848AdJGQGxy8ODBB0AaFDfGBw4cALOJsgio8T8uDJR3Z2Fhsd+9ezfIIlDwmQLZcItgbKKCbteuXf9xYaB84L59+ybOnz9/EyjozMzMvLds2QIOOk5OTqtt27Y9hAY/aYkhNTV19fr16/8ADfsPwkAx3/7+/kAFBQUNIFt748aNi7u7u+eDEkNTU1M+0AH7QMmdnOStYGtrWzJr1qz369atAymwBWJ2IOYFGhwBjLc7UlJS1iDH7d+/f29FRUUtkC1MboYVFhMT8wS6fDeQrQzLsMCk7RMdHe0F8kFKSkrazp077wBTngE5GRZfEcQMLUg5gT7Wu3fv3t2wsLB0kKNoVqjKy8tLFhQURALZUpQWqoQACzTemImuJkar8lGLho9FAFfb1pYP/NUtAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"unmuteButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAeCAYAAAAy2w7YAAAA2klEQVR42mP4//8/Az0ww6hFoxaNWkR9i3AARiBmAWJ2EE0ri0CWsFtbWys8e/asCcjmpYVFTCCD29rabN69e7cSiPcD+WLUsogNiIWAWAKIZbZv357y9evX3Y8ePdp/584dkEUS1LJICEjvh2GQL65evbr/8uXLYExNiyROnjy5HxemqkUHDhzYjwtTNei2bdu2HxempkUoiaG6ujpl1apVO9euXbsfhKlpEXry5gkPD7eaM2fOymXLllE1eWPNsMrKynITJ06sp1WGpV0RNFpNjFo0atHgtQgANKFe0TzIhR0AAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"unmuteButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAeCAYAAAAy2w7YAAAA2klEQVR42mP4//8/Az0ww6hFoxaNWkR9i3AARiDmBmIRIOailUXMIAuUlJS8Ll26tBfIVqaFRWxArBgTE1P64MGD9+/evQMpsKKWRQJAbADEDkDs09/fv/rTp09/Hj169P/OnTsgBQ7UssjgPxIA+eLq1av/L1++DMbUtMjh5MmT/3Fhqlp04MCB/7gwVYNu27Zt/3FhalqEkhgSExNXLV++/M/atWv/gzA1LUJP3grW1tbFkyZNer9s2TKQAktaZlhhIPBoaWnZTasMS7siaLSaGLVo1KLBaxEAvQpqyzzc7aAAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"fullscreenButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAeCAYAAAAo5+5WAAABX0lEQVR42u2UQYuCQBTHFTxJUJ0LJWiPQp/Dm126+x3yLi3YKU/dO+ilgx2iyETesXuelESNuvcN3HkwLh6WRXZYlgUHfoyg/ObN/43DlWXJ/QZcK27Ffyj+ZvAEkSATFMKEMiZ0mMSz2Ux+PB4O+Q7qoJy14p4kSdPL5eKTBaACK2cRCxjDarVa3O93yLLsE1Zxd7PZzF+vFyRJAnEcAxk+PmPmLOK+53lWFEVwvV7BMIz34XA4DcPQwZ00EfM1cPtdzBY7T3hbr9eWaZoGPR09VVVxFpuIRU3TZCqTcfun08lCKZX36TuhXkQTsVwUhTMajaa2bS+ezyekaQrn89mi0i9HE7FCjhPcbjcfu388HuFwOMByuZzTWH4snux2OwiCAHAmDQNd1xc0U4FJvN1uoYI0yx8MBhrNlWcRj13XhYr9fg95njv4O7OKO/RiqS4ZhcYgMonbi74V/0PxB6RCFmvPDfJxAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"fullscreenButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAeCAYAAAAo5+5WAAABaklEQVR42u2UIWzCQBSGAYFsEGwISBNkp5hHoHFV9dXD1tehiqpjSQ0GwS2hNE0bUokHBYUUmtbXVb7dS66IZVkaLsuypJd86aXiu3f/u7saANR+g1olrsR/KP5h1CkCRaIMKSPGgNLiETcURZGSJAnhy0A5b8XPoihOdrtdTheAAqycR9zEGAzDIHEcQxRFd3jFbcuy5lmWwel0guPxCEEQ5DjHzHnEndVqZR8OB9jv96Bp2kev15tst9sQd1JGjFk22Be338ZssfOUV9M0bV3X3+n8Bf+Px2M8JUIZsSDLssRkEm7fdV0bpUzeoTyxRe9FlBFLt9st7Pf7k9lsRtI0hcvlAp7n2Uz67SgjHtLjBOfzOcfuO44Dm80GptPpnMXysHhECAHf9wG/tGGgqiphN67JJV4ul1BAm5V3u903lnmdRzxYLBZQsF6v4Xq9hnidWaMeFrfYw1I8MkMWg8BVcfXQV+J/KP4EGwslGEtzWUAAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"normalscreenButton" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAeCAYAAAAo5+5WAAABX0lEQVR42u3VMYvCMBQHcPXw1K3oKfclzqGlU7+MWye3c3Lph+gmdHGuW8WpGUrrarEIrlZEBKEtdPbegxeQG3pHglsDf0hJ+6N5adLG4/FovCKNGq7havgfrfmUFqQD6ULecFAGbs/n8w/ClCAIJofD4Rv6A8RlYCXLsoVhGOP1em2WZekXRcEAn8FYTwYe3W43dr/fXUTP5zOD+JvNZoJlkYE/Ebter4yjy+XSxJlgzaXgNE0ZT5Ikrq7rX1TzpgzcP51OjOdyuTCsuWVZQ1n4HXF8c8qIytD+C27STQo9xIE+oZWtEsZp5Xm+gGv2HMLFYVwITdPGURS5sDiMh95cGMZtqnieZx6PR3+/3zMeWbiD2xQ2gB/HMYP4cO1in2ouDPe22+1st9sxiG/btqmq6jgMwwUtqDCMp9RgtVrNHMeZENadTqdD+lqEYY736Ehs/ToqxeD611TDr4V/ALfMb7vGw5DiAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"normalscreenButtonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAeCAYAAAAo5+5WAAABbklEQVR42u3VMauCUBQH8GqIN8UbImlocHSrPeR9haYWV7fX6NRniIbCqUDQwRpycVC/hFMNXSKzoD0Cx/PugeMbGnwPL21e+KOg/jj36L3WAKD2jtQquIKL4X+MOk+Djk2eNk+H5wMvisCt0WikEKZYlrUKgsDn5wPERWDler0yWZYn8/ncez6f8Hg8IIoixCUReHi/3+F0OmUIJkkC5/MZTNNcYVtE4C/GGFwuF8Dj8XiE6XTq4Uyw50Lwfr+HPLwFWa/X+6ae10XgfhzHkOdwOECapmw8HmPFDRH4E3GsnDKkNrT+qrhONyn0UA70CS0cRXADp3W73Ri8DMJLw1hxp9vtTtbrdeb7PuShykvDuEyV2WzmhWEIu93uN6JwG5cpXwCw3W7BdV1YLpfZZrMB6nlpWOKw7zgO2LYNmqZ5kiRNFosFoxdaGsZdamAYhq/r+oqwjqqq+SdVGs5xibbE5stWWQ6ufk0V/F74Bzh6cDMaFwHFAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"volumeCapLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAeCAYAAADpYKT6AAAAFElEQVR42mP4//8/AwwzjHIGhgMAcFgNAkNCQTAAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"volumeCapRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAeCAYAAADpYKT6AAAAFElEQVR42mP4//8/AwwzjHIGhgMAcFgNAkNCQTAAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"volumeRail" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAeCAYAAABaKIzgAAAAWElEQVR42u3VsQ3AIBBDUW4ASpQGIRS4sP+EzgzpYun/CV5lh6TiUAAFChQoUKD/grZ2WUij9+EBnfP2gK6VHtC9baCPBzTzeEBt5klS5ZmAAgUKFCjQr71HYkzTWoeyuwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"volumeRailCapLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAeCAYAAAALvL+DAAAAgUlEQVR42tXQQQqDMBAF0MFdwa02xBDTSWK3dW+X9rYt9GTV9gDfmUDBK7h4kPn5kCEEgPboOEHTnFUWT7HqcBUfYyyc86C2NS9rHfr+ghAY2lj1wJwQYy6NL3NESrmgrnNv74MMQ0HTdL9Ja/mH+nY1z49Rm3LxK3toKE6iPs4XboLWK4v24Kf0AAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"volumeRailCapRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAeCAYAAAALvL+DAAAAgUlEQVR42tWQTQrCMBCFB3dCt60hDWmcJHWr+7qst1XwZCp1/3wjCF6hiw/m/cAMIwDkH1mP0ba7F7mS+jVCiHDOg8aDHCQlxTDs4X1A17mb5FyhWmABG4uUUmGoZmu8aYwwYkzo+3CXn2D6nKbzUTgslszz5cS1GzumIVsT63rhB+kPMQcishPoAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"volumeProgress" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAeCAYAAABaKIzgAAAASElEQVR42u3UsQnAQAwEwRe4/wLVh5TqWzDGiWC2guGCi5k5GwpQUFBQUFDQr9AV0sjMFdCnqg7on9DutqgfBQUFBQUFBX3bBU4WWutcf3kcAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"volumeProgressCapLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAeCAYAAAALvL+DAAAATklEQVR42mP8//8/AzJgHB4CfUCcDBb4/fv3hDdv3uR/+/YNouLy5csf//79ywfXcvTo0Y9ANkJg9+7dE4HsPBRDN2zYMAFIJTEOoxADAG38dDtrd5P1AAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"volumeProgressCapRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAeCAYAAAALvL+DAAAAT0lEQVR42t3QIQ6AMAxG4d5fkHGS+un6JtXV84Cr+TfKQuAIID7z5CMA9ETfDtuw3MHd0VpDRJQMqoqTmR0ZRATTFWqtmNYMzLwP5SeDXjqg+Gveu5kMqgAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3c/elements\x3e\x3c/component\x3e\x3ccomponent name\x3d"display"\x3e\x3csettings\x3e\x3csetting name\x3d"bufferrotation" value\x3d"90"/\x3e\x3csetting name\x3d"bufferinterval" value\x3d"125"/\x3e\x3csetting name\x3d"fontcase" value\x3d"normal"/\x3e\x3csetting name\x3d"fontcolor" value\x3d"0xffffff"/\x3e\x3csetting name\x3d"fontsize" value\x3d"11"/\x3e\x3csetting name\x3d"fontweight" value\x3d"normal"/\x3e\x3c/settings\x3e\x3celements\x3e\x3celement name\x3d"background" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAA0CAYAAACQGfi1AAAAZUlEQVR42u2VwQ3AMAgDebBClEUYt8NV+XUBvnQKq0UcC1jYZ9nX2pcJzyNiSwUy06QCJj6vMvUH1dwiBEZgSg+gCIv6Y0rIAygi5D8UjUUjA/aAyZwwOPIP2mMKRd9bdM79KAVee0AqrmZ58iQAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"backgroundOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAA0CAYAAACQGfi1AAAAZklEQVR42u2VsQ3AQAgDKVjhlS5TsH+dMV4MQUumsBL0xwIW9ln2ta7HhOcRcUsFqsqkAiY+7zb1Bz3cIgSOwJQeQBEWzceUkA+giJD/UDQWjQzYAybzhMGRfzAeUyj63qLMnUqBF2JaKtp629puAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"capLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAA0CAYAAACHO2h8AAAA7ElEQVR42u3XvQqDMBQFYCPYWLWIiNFFUePvUju2e/sA9Vnsmzj2WbXXQktxkWgoIjlwudtH7pDhoL7vpSGEeBWsG0wEgyXGoAEC5G5ZVk0I0XRdV2RZRsyQ47hHQB6+75td173hzytZoYbS+IyxynzOGGrzvAjmnDOGnmVZutLCCOjfUFGsDyoENAHBp90ulK8MyjIBTUMZHyhNBTQFJUkqoAmI0mSrUBxzg+jKoChaHxTzgUJuUMgNirhAbRCEAYIshRrX9S6qut8thSpN0xvbts0lxeZb/ACrDeOgYYyVOWeinyp6gnWdW0Vft69cndg2ea8AAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"capLeftOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAA0CAYAAACHO2h8AAAA50lEQVR42mP8//8/AwiIiUnYAKlIINYCYk4GEgEL1JAMQUHBTDExMV5ubm42JiAg2SCQS0CGyMrKCv/794/p58+fDDBXkuqiSCEhQZ4/f/6Q7Ap0gzRZWNjYyXAEhkFcTEyMQNdQZhITA5XAqEFEpmxKo576LqI0DY3G2pD22qCK/mEc2IMv1kYDm+gwGi0hR2YYUS2LjBa1dC/YqOai/4PMa9/+/fv/j5GRkYnSWLv+8+ePX9SI/uWfgeDfv7//IF4kDzO9evXiyLdvX6e/BYLv33/8AHoTXKqQihmRuqK2QCqC3K4oAL0UgwtgxUxZAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"capRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAA0CAYAAACHO2h8AAAA8klEQVR42u1XQQ6CQAwEUlfjTRLAC4k/8MIX/IDv8w16l1foA9RwUjhw2JW4IWFt9QPAokHcJk2zPUw6nWyTAc8LNlbzkJhnzH2aXo/UgCiKgqYoVVUpIUSQZdnS9+dbBNtBURSNx7ExGGPjMAwZPtcIdoIWtCyl1CtxMtt1Z9M8z1eAb60AYCMsC5xID8lxbBvLBKyOwgDVANKV/xPUlFHtB1UbrPyDXnbfVDPLrrMjcyH/eEcdfhFzar932DqbqHfy66qm3p9Vaqsm5aMk76ZFjXwb55x8WtyKGtGRUpZCcLR7dzJ+B0iSy03DisYEQo0nc8B4p9SUlywAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"capRightOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAA0CAYAAACHO2h8AAAA7klEQVR42u1XMQ6CMBSF5qdGEwdJQBfY3Rm9iEfwRHoDL8LgAYyzYTIwMFCrOFBfPQFQNKh9yU/TDi///Zf+5JHvzw9Oe9xQJ9Q+yy6JfqA4jqO2LDUghIjyPF8FwWILsh1JKVu347ou45yPwzAc4boB2ZE6yHKUUq9CY8zzZtOiKNaEuxGIOMexREdmTIy5DMeEnJ5giRoQmdr/DmnKuvaFrv2s/T897KG5ZofdZEZ2Q/7xjHr8InbVfm6x9dbR4Ow3dQ1/tdaxy9i1qro/dHYzkqZzWwnoANhJGuSoChCiLKW86uCXUJqe0z6i6BMdqXhIR7IE5AAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"bufferIcon" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAABTElEQVR42u3WPUtCURzH8Xt92HRwCJokNAOJqKVcitBF0pr0FfRAay+gqDFobXaoKXsD6SY4Nbk7CA4OUa/h9jvwjy6XfDjdw+UIP+EzXfR+z/3fc9DxPM+xicMgBjGIQQxiEIPsC6rAGD6gYUPQ0Pv9fIIbVVAcknOCvqIKOoaBqP8xshFMoBm45soilJjJoHd5EkpfY8UJX1DSZFDPF9S1IagEHXiDXY0gV6ISpkfGg3EpgnbgCdpwYOBmKSiI1H+CWvISK69hDzzYgKJYDxvUtiFoG57hBfYNjCwddmTcZUsdtAW3cA15jRtk4BDKsGIy6B4exY1GkIo5EVVTQWq7P/iC7jT/3v4EHS1ydCz6w3sSpZ7UZuBaDi5EcJyrElKDrOmXetrqzuBKXE75XizKXXbqCzq3YdtnJUpZ48HIIAYxiEEMYhCDZvsG/QUNjWGQyWIAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"bufferIconOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAABTElEQVR42u3WPUtCURzH8Xt92HRwCJokNAOJqKVcitBF0pr0FfRAay+gqDFobXaoKXsD6SY4Nbk7CA4OUa/h9jvwjy6XfDjdw+UIP+EzXfR+z/3fc9DxPM+xicMgBjGIQQxiEIPsC6rAGD6gYUPQ0Pv9fIIbVVAcknOCvqIKOoaBqP8xshFMoBm45soilJjJoHd5EkpfY8UJX1DSZFDPF9S1IagEHXiDXY0gV6ISpkfGg3EpgnbgCdpwYOBmKSiI1H+CWvISK69hDzzYgKJYDxvUtiFoG57hBfYNjCwddmTcZUsdtAW3cA15jRtk4BDKsGIy6B4exY1GkIo5EVVTQWq7P/iC7jT/3v4EHS1ydCz6w3sSpZ7UZuBaDi5EcJyrElKDrOmXetrqzuBKXE75XizKXXbqCzq3YdtnJUpZ48HIIAYxiEEMYhCDZvsG/QUNjWGQyWIAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"errorIcon" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAACs0lEQVR42u2XTWsaURSGbWtKqbQULJiGbrppN666K3EhNF11IYhZJnSrCO0P6MKG/gEX7SKbiKKCEUQEC4pCIKCoqPUThJDqSg1C6CoQwu15B0fMdBzHkDEhXOGB8dxz7zzOdeZVHWNMd5vQcSEuxIW4EBfiQndJ6IqvFeLpmJXbILS6u7v7FeD4poUeGY3G991u97TX652aTKYN1G5K6D7xyufzJfv9PgN7e3u/UMPYTQg9sVqtnwaDwTldHQZwjBrGli30gDBns9kmbRc7Pj4WwDFqGEPPMoWMTqfzG10RdnR0dAnU3G73DnqWJfRQr9e/q9Vqw06nw+TAGHrQq7XQPeKl1+sNY4tarZaAzWbzA/E9xtCDXszRUuix2Wy20wnP6vU6E6H6RzBdQw96qW7QSgi3+etYLJZrNBqsUqlMoLoVTNfQE4/H81R/s8hjYBGhZ5ubm5/pk1+USiU2jSgkraMXczD3uoWQV29zudyfQqHA8vn8JUQhaR29mIO5anNOrdCqx+P50Ww22eHh4X+IQnJjmENzf6rNOTVCyKsNunv+HhwcMDlEoVnjmLu2tvZBTc7NE5rkFV16lslkZBGFZo1jrtqcmyck5FW73T5PpVJsFuJtr9SDNdTknJKQkFfpdLqJBZPJ5Ey2t7f9W1tbfqUerIG1xjmnv4qQ0eVy7ZTLZZZIJBQZjUYC8/qwFuXcd1r7+aJCQl4Vi8UhPQjZdUKPAsWckxOa5BX9lGDRaHQuFotlH6jpxZpKOScnJORVtVo9i0QiTA12u32fiKjtx9qzck4qNMkrXN5wOKyK4XDITk5OVPePt08256RCQl7RPl8Eg0GmJfT9vHA4HF+kOScVevGbXqFQiAUCAU2BFM6FcyoJGbBlxLr49NWQ9fG5DPy/PRfiQlyIC3EhLqQh/wBHF7waCbYO0QAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"errorIconOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAACs0lEQVR42u2XTWsaURSGbWtKqbQULJiGbrppN666K3EhNF11IYhZJnSrCO0P6MKG/gEX7SKbiKKCEUQEC4pCIKCoqPUThJDqSg1C6CoQwu15B0fMdBzHkDEhXOGB8dxz7zzOdeZVHWNMd5vQcSEuxIW4EBfiQndJ6IqvFeLpmJXbILS6u7v7FeD4poUeGY3G991u97TX652aTKYN1G5K6D7xyufzJfv9PgN7e3u/UMPYTQg9sVqtnwaDwTldHQZwjBrGli30gDBns9kmbRc7Pj4WwDFqGEPPMoWMTqfzG10RdnR0dAnU3G73DnqWJfRQr9e/q9Vqw06nw+TAGHrQq7XQPeKl1+sNY4tarZaAzWbzA/E9xtCDXszRUuix2Wy20wnP6vU6E6H6RzBdQw96qW7QSgi3+etYLJZrNBqsUqlMoLoVTNfQE4/H81R/s8hjYBGhZ5ubm5/pk1+USiU2jSgkraMXczD3uoWQV29zudyfQqHA8vn8JUQhaR29mIO5anNOrdCqx+P50Ww22eHh4X+IQnJjmENzf6rNOTVCyKsNunv+HhwcMDlEoVnjmLu2tvZBTc7NE5rkFV16lslkZBGFZo1jrtqcmyck5FW73T5PpVJsFuJtr9SDNdTknJKQkFfpdLqJBZPJ5Ey2t7f9W1tbfqUerIG1xjmnv4qQ0eVy7ZTLZZZIJBQZjUYC8/qwFuXcd1r7+aJCQl4Vi8UhPQjZdUKPAsWckxOa5BX9lGDRaHQuFotlH6jpxZpKOScnJORVtVo9i0QiTA12u32fiKjtx9qzck4qNMkrXN5wOKyK4XDITk5OVPePt08256RCQl7RPl8Eg0GmJfT9vHA4HF+kOScVevGbXqFQiAUCAU2BFM6FcyoJGbBlxLr49NWQ9fG5DPy/PRfiQlyIC3EhLqQh/wBHF7waCbYO0QAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"playIcon" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAABzElEQVR42u3XTYtBURjA8VuzmdWsZmk7GzWfxL1IJMs5n8GXkISFzCQz5pSUlMUjC2WhLCyUBclLXkIkNt5ZmXt3FpLn3nPRdE796y5/dc+rcDwehUdK4CAO4iAO4iAO+o8geTzLvcq9yD0JOg0MyNDv9z/dbveH/P2mFwwDMs7nczgcDlCr1X71gmFA76PRCJRmsxns93tdYCjQYDCA06bTKXMYCtTr9eBck8kEdrsdExgK1Ol04FLj8VgzDAVqtVpwTcPhELbbrSoYClSv1wGTvE3AZrNBwVCgarUKaup2u7Ber6+CoUCVSgW01G63YbVaXYShQOVyGVjUbDZhuVyehaFApVIJWKbMs8ViAY1G4zsUConKeYkCFYtF0KNMJvPj8/kkNKhQKADLYrEYdblcRPUvy+fzwKJoNEqdTifRPKlzuRxoKRKJUIfDQZgt+2w2C2oKh8PUbrcT5hsjIIe8cqjNZiO6HR3pdBquKRgMUqvVSnQ/XFOpFFzK7/dTi8VCbnb9SCaTcC55D6Fms5nc/IKWSCTgNK/XSyVJIve6whrj8TgoeTweKooiufcl3xAIBL5MJhN5lGfQYz0U+duegziIgziIgzhIfX+1FIqPwZcb/gAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"playIconOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAAByklEQVR42u3XuWoCQRzHcYuUKVPmAXyAlBbpPRFFfIek8yXMIGohFiLYiCCChWIhWAgWFoKFIh54RGUH0cZbq192OwsR/+uuSpiBL2z5gZ3TAMDwTBkESIAESIAESID+I0ger3Lvcm9yLwadBgVkHI1GHZ/P9yN/f+gFo4BMi8UCx+MRzWZT0gtGAX1Op1MozedzHA4HXWAk0Hg8xmmz2UxzGAk0HA5xLs459vu9JjASqN/v41KSJN0MI4G63S6uaTKZYLfbqYKRQK1WC5TkbQLb7ZYEI4EajQbUNBgMsNlsroKRQPV6HbfU6/WwXq8vwkigWq0GLep0OlitVmdhJFC1WoWWKfNsuVyi3W7/RiKRL+W8JIEqlQr0KJ/PjwOBwDcZVC6XoWWJRIJ7vV6m+peVSiVoUTwe5x6Ph908qYvFIm4pFotxt9vNNFv2hUIBaopGo9zlcjHNN8ZcLgdK8srhTqeT6XZ0ZLNZXFM4HOYOh4PpfrhmMhlcKhgMcrvdzu52/Uin0ziXvIdwm83G7n5BS6VSOI0xxq1WK3vUFdaUTCah5Pf7ucViYY++5BtDoVDXbDazZ3kGPddDUbztBUiABEiABEiA1PcHSCzm64IZEhcAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"replayIcon" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAAEwUlEQVR42u1YW0icRxR2o6k2pmyMa0NJjRrRtWgp3rA00ifJpuqqL1FEpGLxQQVJIaUVgnZViqIglHh5UHej4mXpqruj4v2CFwTxLgjiFRUUUby8KCL2fMv8QYKa/Lsb0sL+8OHvzJxvvn/OmTln1ubi4sLmvwQbqyCrIKsgqyCroP+jIBMeB8J9wheEWx9q9DEFPVxeXi5JSUmJo3c3wh2C5FMK+mZ/f5+dnJywoaGhsvDw8J8gkq+c5FMI+nZra4sBXJiBMVYUEhLyI/U9IHx2lTBLCZLwL5cR3AlygnJjY4MJ2NzcZAcHB+zo6Ki5pqYmx83NLYjGOBPsLClIwmPDNTIyUlFXV6eanp5W7+7u6k5PTw3r6+vsXUDc4eEh29nZ+ae0tPSlo6PjY75aZgvCl8mUSuXT4eHhcgjACmxvbxsnXVtbY6urq9cCY46Pj9n4+Hgm8dw1V9BtBGhubm46uaAFIpaWlkRhcHCwPiMjIwWra+4KYWVcNRrNKxJjJF9cXDSitbX1jUqlylQoFEpyxXOh/TJoRXTZ2dm/29vb+xKP1NwYQsy4FBUVvdjb22MLCwtG9Pf3a5OTk3+hPm8eqAjw74R+YGpqSl9cXPyXh4dHCA9+O0ts+zsIXnKRfn5+ngEtLS3VNMkT6rtHsL18DqF/dnaWVVVVvabtHkZtX13a7sKG+FIqlT7gHyFKEAhcBwYGyubm5tjMzAzr6urSent7h1K74xVnysO2trbXUVFRz+n9EeHzS2PwVxodHR1GG+LvycnJYvr/a7SLEeRA5M9WVlYMRMAmJiZYfHz8zzwOJDfksrtX5LJbCQkJ/rTLWrAbwQlu2IgRJKuurv6TghKByejMeUNtXu+46UMffMDjhoYGjcAHbswhRpA7uUg9NjbGgKysrEwewKY+zuAQ+MCNOcQIklOS1JHPGRAREaEUAtHExwEcAh+4MYcYQb5kaKADDYcac3Z2DjbRXW/jSCaTBQl8IyMjBswhSlBPT4+hr6+PAT4+Pj+YK8jFxSVI4Ovt7RUtSN7U1KTr7u5mQFxcXLSZLrOnbR8p8IFbrMvcKysr1R0dHQwoKCj4jW9rU5/7hYWFLwW+iooK0UEty8nJUdFhxwAi0Zix7WHj1dnZqRH4KFGL3vYOYWFhz/R6vYEeNjo6ytLS0m46GG86g6SwBQe4wAlusQcjiB7l5+eXNzc3M4BSiNbPz++61HGdGEfYUI5rFHjAydOLRHRyDQ0NVdTX1+t1Oh0OM0YVYrVcLn/CV8r2PW6SYixsYAsOcIGTJ1rTyo+kpKQXjY2NTKvVovRABajl7vPige7A85ctf8eJ7oUxGAsb2IIDXOAUVtjkAi01NfUVfR2jfMTa29sZ1dGoeTRlZWV/xMTEKJ2cnII9PT2/pwQcQ7VzJvowBmNhA9v09PQsXjHaWaSEjY2NTafKsYUSLZKt8YBDBYla+fz8nJ2dnRkLerShTxhHNvrExMRfuZjblrp1GIv8wMDAp1SSltPVxlBbW8tuAo1hGBsQEKDgbrKz9L3s7TXI399fQW5U5eXlqUtKSnRqtdoA4B1t6AsODg7nu+naa/XHvCj6csh5m+x912hRgqy/D1kFWQVZBVkFWQVdj38BAk7AFyu8ie8AAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"replayIconOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAA0CAYAAADi1poDAAAE2ElEQVR42u1YaUhcVxi1xirttDHWpbQxtSKoSRTiVoUaKFQquBOCVkQwkmmrVqH9FyiKC1TRYv+o+eFWNW513zruiguCdRcUcWXGRhFFR1q143j7neG+IMFJ88YJaWEuHHze5bzz7v22O0aMMaP/EowMggyCDIIMggyC/o+CdGjvED4kvEe48rKLXqUgp5WVlXmpVPoDPbsQrhKMX6egT/f29tjx8TEbGhpaCAgI+Ib6HAkSwhuvQ9Bnm5ubDODC1K2trWPe3t5f0pg94a2LhOlLkDH/cluCK8GbkCiXy5kAhULB9vf3mVKp/Lu8vLzTzs4ugOZcJ5jqU5Axt41bQUFB0srKStn09LR8Z2fnr5OTk7ONjQ32PCDu4OCAbW9v/5mfn/9EIpHc4bt1aUFvEm4EBwc/HB4eXoQA7MDW1pbmpevr62xtbU0rMOfw8JCNj4/XE4/FZQWZwYvS09Mf0xGoIGJ5eVkUBgcH95KSkn7G7l52h7AzN0tLS5tJjIZ8aWlJg7a2tj9SU1Pr/P39k+goHgn950E7cpSSklJjZmZ2l3hsOJ/ONgSb+SgnJ6dkd3eXLSwsaNDf36+MjY39icY+4YYKA/9cGAempqZOc3Nz++3t7UO58Zvqw+2vwnjpiE7n5+cZ0NTU9JRecp/G3ieYnI9DGJ+dnWXFxcVz5O4PqM/hnLsLDvGxubm5Pf8IUYJAcGtgYGBhbm6OzczMsK6uLqWjo2M49V+7IKY4tbe3z4WEhDyi59uEd89Favy1CQ0NfUAOMT05Ofk7/e+MfjGCJET+1erq6hkRsImJCRYZGfkjt4OLIq+E5zKLC3LZlaioqC/Iy1TwRnCCG2vECLItKyv7jYwShsko5mxSn9dzx/SyDTt0p7q6WiHwgRvvECPIlY5IPjY2xoDk5OQ6bsC6tuvgEPjAjXeIEeRDSfKIzpwBgYGBiYIh6tgk4BD4wI13iBF0lxaqKaAhqDFLS8tAHY/rmR1ZWVkFCHwjIyNqvEOUoJ6eHnVfXx8DnJ2d711WkLW1dYDA19vbK1qQT0NDw1F3dzcDIiIivuNVoa7tbXL7bwU+cIs9MteioiK5TCZjQFZWViV3a13bB9nZ2U8EvsLCQtFGbZuWliajYMcAIlFQn6eOx4Y1np2dnQqBjxK1aLeX+Pn5fd3c3HzW0tLCRkdHWXx8/IsCo7aGuTZYCw5wgRPcYgMjgtntzMzMxcbGRgZQClG6uLhoSx3axFzDGspxBwIPOHl6MRadXH19faVVVVWn9fX1CGaMKsSnTk5O9/lOmfzLMdlgLtZgLTjABU6eaHUrP2JiYkpqampYbW0tSg9UgEp+fJ7c0CU8f5lwT0RE98QczMUarAUHuMApJF5dCjTUMTfj4uKa6esY5SPW0dHBqI5GzaMoKCj4NSwsLNHCwiLQwcEhjBLw91Q712EMczAXa7A2ISGhDVzna6NLlbDh4eGPqXJUUaJFstUEOFSQqJXVajVTqVSagh59GBPm0ZrT6OjoX3j5aqavW4emyPfw8HhIJekiXW3OKioq2ItAcxjmuru7S/kxmer7XvbsGuTm5ialY5RlZGTI8/LyjkpKSs4APKMPY15eXnHcm7Req1/VRdEHeYnDh/fd4AZurJe7veH3IYMggyCDIIMggyDt+AeCTA8AFSrCbwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3c/elements\x3e\x3c/component\x3e\x3ccomponent name\x3d"dock"\x3e\x3csettings\x3e\x3csetting name\x3d"iconalpha" value\x3d"1"/\x3e\x3csetting name\x3d"iconalphaactive" value\x3d"1"/\x3e\x3csetting name\x3d"iconalphaover" value\x3d"1"/\x3e\x3c/settings\x3e\x3celements\x3e\x3celement name\x3d"button" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAgCAYAAABpRpp6AAAAzUlEQVR42u2YMQ7CMAxF7aRiSQckWtGOHKMLR2DimFyAE3CUdqWiQ4ucYANXqIiRv+T96ek7kYx1vS8A4MzT8QTIMxPPjefyhm2a5tS2bem9xxxpiSj1fV8Pw/AU4K6qduWyLJhSylIvcoSRgY8CHIgiQsb5ihTG4EBZDHjtFJ+OKANmZKuEAWvtsE7DmpbOKmGVsEr8xrB9zSsbVvdKWCVs6cywGf4bwwI8EcXknMv6+hNjFKuTD6HcIsJhw5EbVq6w43h/zPN8RW3n1hcs+1ICqMmZZQAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"buttonOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAgCAYAAABpRpp6AAAA1UlEQVR42u2YMQ4CIRBFgV1LoXA3snoht/MOtnoarbyF1R5ptxRsDAngTKKtnWbYzE8+oXz8/IGEum3XCyHECbwDa0FTD/AAPtewHK21h67rTFVViiJtjDGN47iZpumJwH3TrEwIQeWcScYrpVTICMB7BNZwACUI6x0kMupaFCYG/gsw0Vn7lnDmSjBw4R3moeNKcCW4EjO7h/lp/nHCxd0SXAkeOk6YE55Vwj7GlBSIMmgCISsCD97ft1obQxUaYb13DrY3BL445yS4h/2SaMCf79brC0M0WI9LC6AuAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"buttonActive" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAgCAYAAABpRpp6AAAAyklEQVR42u2YPQ4CIRSEccF2fwIbKz2T23kKaz2BVt7Dai9G4kJls+CbRDtbzWPzJhlCqL5MBkie6fvNWil1Ju/JreKpQB7JF0PLyTl3tNZ2WuuKI20iee+35CeAB86wUEUCIwEfANziIOesOAuMYDWqMAnwX4CZ1/dbwlkqIcCFd1gunVRCKiGVWNg7LF/zjxMu7pWQSsilk4Ql4UUlPM1zSu/JClthvgZWAI8xTru6bjqu0ICNMTxoewfwNYSwIg+0b5gG/Bm33l7CZ0/XNL9BmAAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"divider" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAgCAYAAAA1zNleAAAAFUlEQVR42mP4//8/AzJmGBUYFUBgAEE5fpDLFJZbAAAAAElFTkSuQmCC"/\x3e\x3c/elements\x3e\x3c/component\x3e\x3ccomponent name\x3d"playlist"\x3e\x3csettings\x3e\x3csetting name\x3d"backgroundcolor" value\x3d"0x3c3c3e"/\x3e\x3csetting name\x3d"fontcolor" value\x3d"0x848489"/\x3e\x3csetting name\x3d"fontsize" value\x3d"11"/\x3e\x3csetting name\x3d"fontweight" value\x3d"normal"/\x3e\x3csetting name\x3d"activecolor" value\x3d"0xb2b2b6"/\x3e\x3csetting name\x3d"overcolor" value\x3d"0xb2b2b6"/\x3e\x3csetting name\x3d"titlecolor" value\x3d"0xb9b9be"/\x3e\x3csetting name\x3d"titlesize" value\x3d"12"/\x3e\x3csetting name\x3d"titleweight" value\x3d"bold"/\x3e\x3csetting name\x3d"titleactivecolor" value\x3d"0xececf4"/\x3e\x3csetting name\x3d"titleovercolor" value\x3d"0xececf4"/\x3e\x3c/settings\x3e\x3celements\x3e\x3celement name\x3d"item" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABMCAIAAACnG28HAAAAoElEQVR42u3SQQkAAAwDsQor8y9rJvYZBKLguLQD5yIBxsJYGAuMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWGAsjIWxwFgYC2OBsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJY/LSgjDi3dpmB4AAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"itemActive" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABMCAIAAACnG28HAAAAoElEQVR42u3SQQkAAAwDsToq829uJvYZBKLguLQD5yIBxsJYGAuMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWGAsjIWxwFgYC2OBsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJY/LRBziyQuYSeagAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"itemImage" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAA2CAIAAAC3LQuFAAAB9UlEQVR42u3ZiWrCQBAGYF9CzWnu05hDbX3/N+tfBqdrjEIptNL9YQo5hKQfuzM7m9V6vWU8iRX+zucLYzEIRCACEYhABCIQgQjEIBCBCEQgAv0s6nrveQGBHgZ0CHSpqtZ1fc8Lu24wr+MUr5qmudVAbXvQrbzt1j0e3/RWHKe4iB9YDeT7obndud/3ch1Sm42DKybZ/wfK8wr/dlFUcjoMx9l+cNN013nX4NT3dxZVMeWAkYwLeD0CQkrCaZ6XFgFlWaEQko9dN1gEOhxG82e2AKFUKUTbdn0/3n9yEaAkyWSgnU7vtgANw4TnOo4nqRcQWVYuAml6DsPYipV0GEZ9PxVFjedilqGW40DWPlcXxwTCLTkuy9oKIIyaNC2CIMJzISVAcZwpCu6aQFr4MQctGUExjPBQaRpmcwocOmRkiOmi0ZZmVXONLH9mQHXdmkCSfRBRlNoChMWxJJpxPM2AMExQp2RNOAuo2QIEAnRVZdnoGxgT6nMdKPl7FqJp436QTiIcTNN5EQgFzt4NMy1S6DOuDdp8QfTLWxyvBYSUhKK228W6Sr4H0p6eW643Zc7M3AT6CnOhiEiS/A9f5hWBZkkarTyBbsJs69G48bPP8iBC6kG/JoWfQPxwSCACEYhBIAIRiEAEIhCBCMQg0HeBGE/iA2Oi1tFMiSX7AAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"divider" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANIAAAABCAIAAAAkUWeUAAAAEUlEQVR42mPQ1zccRaOIzggAmuR1T+nadMkAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"sliderRail" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAABCAYAAADErm6rAAAAIklEQVR42mP6//8/Az4sKir+X0lJ5b+ysioKBomB5AjpBwAxrjrJQvfEawAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"sliderCapTop" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAKCAYAAACuaZ5oAAAAGUlEQVR42mP4//8/Ay0xw6gFoxaMWkB7CwB2As1P8WmmAwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"sliderCapBottom" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAKCAYAAACuaZ5oAAAAGUlEQVR42mP4//8/Ay0xw6gFoxaMWkB7CwB2As1P8WmmAwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"sliderRailCapTop" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAECAYAAACUY/8YAAAAYUlEQVR42q2PSwqAMBBDe4mqrVL7sXh6vZoUDxAnxX0LungQEpJhFADVQusxC4dQXqhzT7dnfBcuY2Y4t1ao6TH7fGAYptPaBd5HhJAq1PSY/fFB4WCMG1LKFWp6kt2t/gOk+eeZy1KEHQAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"sliderRailCapBottom" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAECAYAAACUY/8YAAAAYElEQVR42mP4//8/Az4sJibxSUlJ5b+ysioKBokB5b4Q0s9ASIG0tMxGWVl5DAtAYiA5ii2wsbE1ALr0A8hAkKtBGMQGiYHkKLYAiJlcXd0MQa4FGvoZhEFskBhIjpB+AF4F6qfhUR58AAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"sliderThumb" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAABCAYAAADErm6rAAAAKElEQVR4XmP8//8/AyHw+PHj/z9+/GD4+vUrGH/79g1MBwQEMBLSCwC4sRX/S7kwJwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"sliderThumbCapBottom" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAECAYAAACUY/8YAAAASElEQVR42q3NoQ0AMAgFUfYXrIJH4/FIFmg6wS/1TUqaipOXRwDoVmbOiIC7w8ygqhCR2XmpCfAB4G/ArgAuYBQwCuDu1wZeW0osItX5QArCAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"sliderThumbCapTop" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAECAYAAACUY/8YAAAAWUlEQVR42rWNoQ1AIQwF2V8QHAJJKlAoSHVJ6qpI2IMwwPsrIPji3F3OAXB/ci221nytdRPRTin5p4MxRlBViAiYGaUUxBjDs8Gcc6+1YGYQEfTekXM+N+0HR/gfgjnWeYEAAAAASUVORK5CYII\x3d"/\x3e\x3c/elements\x3e\x3c/component\x3e\x3ccomponent name\x3d"tooltip"\x3e\x3csettings\x3e\x3csetting name\x3d"fontcase" value\x3d"normal"/\x3e\x3csetting name\x3d"fontcolor" value\x3d"0xacacac"/\x3e\x3csetting name\x3d"fontsize" value\x3d"11"/\x3e\x3csetting name\x3d"fontweight" value\x3d"normal"/\x3e\x3csetting name\x3d"activecolor" value\x3d"0xffffff"/\x3e\x3csetting name\x3d"overcolor" value\x3d"0xffffff"/\x3e\x3c/settings\x3e\x3celements\x3e\x3celement name\x3d"background" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAACCAYAAABsfz2XAAAAEklEQVR42mOwtnV8RgpmIFUDAFr3JukT6L+UAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"arrow" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAADCAYAAACnI+4yAAAAEklEQVR42mP4//8/AymYgeYaABssa5WUTzsyAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"capTop" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAECAYAAAC6Jt6KAAAAHUlEQVR42mMUFRU/wUACYHR1935GkgZrW0faagAAqHQGCWgiU9QAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"capBottom" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAECAYAAAC6Jt6KAAAAGElEQVR42mOwtnV8RgpmoL0GUVHxE6RgAO7IRsl4Cw8cAAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"capLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAACCAYAAACUn8ZgAAAAFklEQVR42mMQFRU/YW3r+AwbZsAnCQBUPRWHq8l/fAAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"capRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAACCAYAAACUn8ZgAAAAFklEQVR42mOwtnV8hg2LioqfYMAnCQBwXRWHw2Rr1wAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"capTopLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAECAYAAABCxiV9AAAAPklEQVR4XmMQFRVnBeIiIN4FxCeQMQOQU6ijq3/VycXjiau79zNkDJLcZWvv9MTGzumZta0jCgZJnkAXhPEBnhkmTDF7/FAAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"capTopRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAECAYAAABCxiV9AAAAPklEQVR42mMQFRU/gYZ3A3ERELMyuLp7P0PGTi4eT3R09a8CJbMYrG0dnyFjGzunZ7b2Tk+AkrswJGEYZAUA8XwmRnLnEVMAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"capBottomLeft" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAECAYAAABCxiV9AAAAMklEQVR42mMQFRU/YW3r+AwbZgBK7rK0snuCS7JQXUP7qqW1/RNskqxAXATEu0FWIGMAFlYlnOJtim4AAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"capBottomRight" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAECAYAAABCxiV9AAAANUlEQVR42mOwtnV8hg2LioqfYMAmYWll9wQouQtD0tLa/om6hvZVoGQ2A0g7Gt4NxEVAzAoAZzolltlSH50AAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"menuOption" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAARCAYAAADkIz3lAAAAdklEQVR42mP4//8/AzGYYdgpFBUVlwPiXUD8GUrLYVUoJiaxR1JS+r+srNx/EA3kH8Bl4md5ecX/iorK/xUUlP4D+T+xKgSask9GRu6/srLqfxAN5B/CqtDb21cdpBho5VcQ7enprYHL10xAzAXEPFCaaVhHIQBeKc15eWl8jgAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"menuOptionOver" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAARCAYAAADkIz3lAAAAdklEQVR42mP4//8/AzGYYdgpFBUVlwPiXUD8GUrLYVUoJiaxR1JS+r+srNx/EA3kH8Bl4md5ecX/iorK/xUUlP4D+T+xKgSask9GRu6/srLqfxAN5B/CqtDb21cdpBho5VcQ7enprYHL10xAzAXEPFCaaVhHIQBeKc15eWl8jgAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"menuOptionActive" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAARCAYAAADkIz3lAAAAqklEQVR42mP4//8/AzGYYSgohAIZIHYE4lAoDeJjKJR1c3PLffTo0aXfv39/B9EgPlBcDl2h0/379y+/fv36/9OnT/+DaKDiq0BxF3SFoc+ePQOZ9B+Gnz9//hsoHo6u0GX//v2Xr1279h+GDx48CDLRDV2hkq2tbe6uXbsunz9//geItre3B7lRGV0hMxCrAbEHEIdBaRCfGVvwgBRzADE3lGbGCJ4hENcAI1indUdh01cAAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"volumeCapTop" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAFCAYAAAB1j90SAAAAE0lEQVR42mP4//8/AzmYYQRoBADgm9EvDrkmuwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"volumeCapBottom" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAFCAYAAAB1j90SAAAAE0lEQVR42mP4//8/AzmYYQRoBADgm9EvDrkmuwAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"volumeRailCapTop" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAECAYAAAC+0w63AAAAXklEQVR42n2NWwqAIBRE3YSmJT4KafW1tZAWMN2RPkSojwPDPO5VAFSP1lMRDqG+UJexN4524bJ2hvehQU2P2efQGHs6tyCEhBhzg5oes7+PlcWUVuS8Nah5QLK77z7Bcm/CZuJM1AAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"volumeRailCapBottom" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAECAYAAAC+0w63AAAAXklEQVR42mP4//8/AwyLiUl8UlVV/6+mpoGCQWJAuS/IahmQOdLSMhvl5RUxNILEQHI4NdrY2BoATf4AUgiyBYRBbJAYSA6nRiBmcnV1MwSZDlT8GYRBbJAYSA5ZLQArC3Oj7DuqswAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"volumeRail" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAA0CAYAAAC6qQkaAAAAXklEQVR42mP5//8/AwyIiUn85+bmZmBkZGRABiA1X79+ZXj16gVcgoUBDaBrwiWGoZFYMCg0MpKnkZFxCPlxVONw0MjIyDgaOCM7AdC7lBuNjtGiY1TjqMbRwooijQBUhw3jnmCdzgAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"volumeProgress" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAA0CAYAAAC6qQkaAAAAT0lEQVR42u3LIQ4AQQhDUe5/FjJ4NH48ggQu0rWbGbEH2Iqanz4BIO9VFTITe29EBNwdqorzJ2fo7guutb7hzFzQzAgJCQkJCQkJCQn/AR/HKvJmqR7XwAAAAABJRU5ErkJggg\x3d\x3d"/\x3e\x3celement name\x3d"volumeProgressCapTop" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAECAYAAAC+0w63AAAAWUlEQVR42p2LoQoAIRAF/f8gNsNGMZhMK+YVtpkW/A/xA9714+COC1OGGQfA/eFRMrOvte6c8yYi/2kcYwRVhYig945SCmKM4XU0s73WwpwTIoLWGlJK595da8On65TYLg8AAAAASUVORK5CYII\x3d"/\x3e\x3celement name\x3d"volumeProgressCapBottom" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAECAYAAAC+0w63AAAASElEQVR42o3LIQ4AMQgFUe6v6EnwaDweyQ3aPcBf6poNyVaMm0cA6CwzZ0TA3WFmUFWIyPP9qIGjgeMX7gpywVVwFeTuaeFNL2bLq1AT4lm+AAAAAElFTkSuQmCC"/\x3e\x3celement name\x3d"volumeThumb" src\x3d"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAQCAYAAAAmlE46AAABQElEQVR42p2SsWqDUBSGTYgpEqlLqNCxdHMoGTp079Y1kFJohrR5mzyCm4PpA2Rw1MlZg7gk6eSWXcxgzy//BWkbLBU+uZzz/derHq2ua+0/tK+e0BcGwlC4IEPW+nR+hNAcCffCVFiQKWsjOr12SBeuhJnv++uiKHZVVZUAa9TQo6OrMHa5FJ6DINgcj8f6cDjUeZ43YI0aenAEixnNEB48z/P3+32dZdmvoAcHLjPNDrM4jnfnQgo4PDIy2lhYbrfbU1cwTdOTuO/MaPZfg0mSlOK+MdPcXsIw7DwqHLgqiMc+rlardVcQDlx1VLzorfDquu7mXAg9ceZ0LfU78OgJGrLrRxRFn/IhSoA1agxN6BpqAEzhWnCEJ0pLMmfNoWOqAVAjZ3K3G0p3xGHNpqN/n9cBj2Dx5W0yZs1oD/kXpOphz005RgUAAAAASUVORK5CYII\x3d"/\x3e\x3c/elements\x3e\x3c/component\x3e\x3c/components\x3e\x3c/skin\x3e';this.xml=
g.utils.parseXML(this.text);return this}})(jwplayer);
(function(g){var h=g.html5,a=g.utils,c=g.events,e=c.state,b=a.css,d=a.isMobile(),f=document,u=".jwpreview",l=!0,m=!1;h.display=function(r,g){function z(b){if(aa&&(r.jwGetControls()||r.jwGetState()==e.PLAYING))aa(b);else if((!d||!r.jwGetControls())&&S.sendEvent(c.JWPLAYER_DISPLAY_CLICK),r.jwGetControls()){var j=(new Date).getTime();Y&&500>j-Y?(r.jwSetFullscreen(),Y=void 0):Y=(new Date).getTime();var k=a.bounds(p.parentNode.querySelector(".jwcontrolbar")),f=a.bounds(p),j=k.left-10-f.left,h=k.left+30-
f.left,g=f.bottom-40,l=f.bottom,n=k.right-30-f.left,k=k.right+10-f.left;if(d&&!(b.x>=j&&b.x<=h&&b.y>=g&&b.y<=l)){if(b.x>=n&&b.x<=k&&b.y>=g&&b.y<=l){r.jwSetFullscreen();return}S.sendEvent(c.JWPLAYER_DISPLAY_CLICK);if(M)return}switch(r.jwGetState()){case e.PLAYING:case e.BUFFERING:r.jwPause();break;default:r.jwPlay()}}}function j(a,b){ba.showicons&&(a||b?(R.setRotation("buffer"==a?parseInt(ba.bufferrotation,10):0,parseInt(ba.bufferinterval,10)),R.setIcon(a),R.setText(b)):R.hide())}function q(a){s!=
a?(s&&x(u,m),(s=a)?(a=new Image,a.addEventListener("load",t,m),a.src=s):(b("#"+p.id+" "+u,{"background-image":void 0}),x(u,m),A=K=0)):s&&!M&&x(u,l);w(r.jwGetState())}function C(a){clearTimeout(qa);qa=setTimeout(function(){w(a.newstate)},100)}function w(a){a=T?T:r?r.jwGetState():e.IDLE;if(a!=ca)switch(ca=a,R&&R.setRotation(0),a){case e.IDLE:!H&&!P&&(s&&!I&&x(u,l),a=!0,r._model&&!1===r._model.config.displaytitle&&(a=!1),j("play",F&&a?F.title:""));break;case e.BUFFERING:H=m;G.error&&G.error.setText();
P=m;j("buffer");break;case e.PLAYING:j();break;case e.PAUSED:j("play")}}function t(){A=this.width;K=this.height;w(r.jwGetState());v();s&&b("#"+p.id+" "+u,{"background-image":"url("+s+")"})}function D(a){H=l;j("error",a.message)}function v(){0<p.clientWidth*p.clientHeight&&a.stretch(r.jwGetStretching(),k,p.clientWidth,p.clientHeight,A,K)}function x(c,d){a.exists(Q[c])||(Q[c]=!1);Q[c]!=d&&(Q[c]=d,b("#"+p.id+" "+c,{opacity:d?1:0,visibility:d?"visible":"hidden"}))}var p,k,B,F,s,A,K,I=m,G={},H=m,P=m,Q=
{},M,y,R,T,ca,ba=a.extend({showicons:l,bufferrotation:45,bufferinterval:100,fontcolor:"#ccc",overcolor:"#fff",fontsize:15,fontweight:""},r.skin.getComponentSettings("display"),g),S=new c.eventdispatcher,aa,Y;a.extend(this,S);this.clickHandler=z;var qa;this.forceState=function(a){T=a;w(a);this.show()};this.releaseState=function(a){T=null;w(a);this.show()};this.hidePreview=function(a){I=a;x(u,!a);a&&(M=!0)};this.setHiding=function(){M=!0};this.element=function(){return p};this.redraw=v;this.show=function(a){if(R&&
(a||(T?T:r?r.jwGetState():e.IDLE)!=e.PLAYING))clearTimeout(y),y=void 0,p.style.display="block",R.show(),M=!1};this.hide=function(){R&&(R.hide(),M=!0)};this.setAlternateClickHandler=function(a){aa=a};this.revertAlternateClickHandler=function(){aa=void 0};p=f.createElement("div");p.id=r.id+"_display";p.className="jwdisplay";k=f.createElement("div");k.className="jwpreview jw"+r.jwGetStretching();p.appendChild(k);r.jwAddEventListener(c.JWPLAYER_PLAYER_STATE,C);r.jwAddEventListener(c.JWPLAYER_PLAYLIST_ITEM,
function(){H=m;G.error&&G.error.setText();var a=(F=r.jwGetPlaylist()[r.jwGetPlaylistIndex()])?F.image:"";ca=void 0;q(a)});r.jwAddEventListener(c.JWPLAYER_PLAYLIST_COMPLETE,function(){P=l;j("replay");var a=r.jwGetPlaylist()[0];q(a.image)});r.jwAddEventListener(c.JWPLAYER_MEDIA_ERROR,D);r.jwAddEventListener(c.JWPLAYER_ERROR,D);d?(B=new a.touch(p),B.addEventListener(a.touchEvents.TAP,z)):p.addEventListener("click",z,m);B={font:ba.fontweight+" "+ba.fontsize+"px/"+(parseInt(ba.fontsize,10)+3)+"px Arial, Helvetica, sans-serif",
color:ba.fontcolor};R=new h.displayicon(p.id+"_button",r,B,{color:ba.overcolor});p.appendChild(R.element());C({newstate:e.IDLE})};b(".jwdisplay",{position:"absolute",cursor:"pointer",width:"100%",height:"100%",overflow:"hidden"});b(".jwdisplay .jwpreview",{position:"absolute",width:"100%",height:"100%",background:"no-repeat center",overflow:"hidden",opacity:0});b(".jwdisplay, .jwdisplay *",{"-webkit-transition":"opacity .25s, background-image .25s, color .25s","-moz-transition":"opacity .25s, background-image .25s, color .25s",
"-o-transition":"opacity .25s, background-image .25s, color .25s"})})(jwplayer);
(function(g){var h=g.utils,a=h.css,c=document,e="none",b="100%";g.html5.displayicon=function(d,f,u,l){function m(a,b,d,e){var j=c.createElement("div");j.className=a;b&&b.appendChild(j);w&&r(j,a,"."+a,d,e);return j}function r(b,c,d,e,j){var k=n(c);"replayIcon"==c&&!k.src&&(k=n("playIcon"));k.src?(e=h.extend({},e),0<c.indexOf("Icon")&&(s=k.width|0),e.width=k.width,e["background-image"]="url("+k.src+")",e["background-size"]=k.width+"px "+k.height+"px",j=h.extend({},j),k.overSrc&&(j["background-image"]=
"url("+k.overSrc+")"),h.isMobile()||a("#"+f.id+" .jwdisplay:hover "+d,j),a.style(w,{display:"table"})):a.style(w,{display:"none"});e&&a.style(b,e);F=k}function n(a){var b=C.getSkinElement("display",a);a=C.getSkinElement("display",a+"Over");return b?(b.overSrc=a&&a.src?a.src:"",b):{src:"",overSrc:"",width:0,height:0}}function z(){var b=x||0===s;a.style(p,{display:p.innerHTML&&b?"":e});K=b?30:0;j()}function j(){clearTimeout(A);0<K--&&(A=setTimeout(j,33));var c="px "+b,d=Math.ceil(Math.max(F.width,h.bounds(w).width-
v.width-D.width)),c={"background-size":[D.width+c,d+c,v.width+c].join(", ")};w.parentNode&&(c.left=1==w.parentNode.clientWidth%2?"0.5px":"");a.style(w,c)}function q(){H=(H+G)%360;h.rotate(k,H)}var C=f.skin,w,t,D,v,x,p,k,B={},F,s=0,A=-1,K=0;this.element=function(){return w};this.setText=function(a){var b=p.style;p.innerHTML=a?a.replace(":",":\x3cbr\x3e"):"";b.height="0";b.display="block";if(a)for(;2<Math.floor(p.scrollHeight/c.defaultView.getComputedStyle(p,null).lineHeight.replace("px",""));)p.innerHTML=
p.innerHTML.replace(/(.*) .*$/,"$1...");b.height="";b.display="";z()};this.setIcon=function(a){var b=B[a];b||(b=m("jwicon"),b.id=w.id+"_"+a);r(b,a+"Icon","#"+b.id);w.contains(k)?w.replaceChild(b,k):w.appendChild(b);k=b};var I,G=0,H;this.setRotation=function(a,b){clearInterval(I);H=0;G=a|0;0===G?q():I=setInterval(q,b)};var P=this.hide=function(){w.style.opacity=0};this.show=function(){w.style.opacity=1};w=m("jwdisplayIcon");w.id=d;t=n("background");D=n("capLeft");v=n("capRight");x=0<D.width*v.width;
var Q={"background-image":"url("+D.src+"), url("+t.src+"), url("+v.src+")","background-position":"left,center,right","background-repeat":"no-repeat",padding:"0 "+v.width+"px 0 "+D.width+"px",height:t.height,"margin-top":t.height/-2};a("#"+d+" ",Q);h.isMobile()||(t.overSrc&&(Q["background-image"]="url("+D.overSrc+"), url("+t.overSrc+"), url("+v.overSrc+")"),a("#"+f.id+" .jwdisplay:hover "+("#"+d+" "),Q));p=m("jwtext",w,u,l);k=m("jwicon",w);f.jwAddEventListener(g.events.JWPLAYER_RESIZE,j);P();z()};
a(".jwplayer .jwdisplayIcon",{display:"table",cursor:"pointer",position:"relative","margin-left":"auto","margin-right":"auto",top:"50%"});a(".jwplayer .jwdisplayIcon div",{position:"relative",display:"table-cell","vertical-align":"middle","background-repeat":"no-repeat","background-position":"center"});a(".jwplayer .jwdisplayIcon div",{"vertical-align":"middle"},!0);a(".jwplayer .jwdisplayIcon .jwtext",{color:"#fff",padding:"0 1px","max-width":"300px","overflow-y":"hidden","text-align":"center","-webkit-user-select":e,
"-moz-user-select":e,"-ms-user-select":e,"user-select":e})})(jwplayer);
(function(g){var h=g.html5,a=g.utils,c=a.css,e=a.bounds,b=".jwdockbuttons",d=document,f="none",u="block";h.dock=function(g,m){function r(a){return!a||!a.src?{}:{background:"url("+a.src+") center","background-size":a.width+"px "+a.height+"px"}}function n(b,d){var e=q(b);c(z("."+b),a.extend(r(e),{width:e.width}));return j("div",b,d)}function z(a){return"#"+t+" "+(a?a:"")}function j(a,b,c){a=d.createElement(a);b&&(a.className=b);c&&c.appendChild(a);return a}function q(a){return(a=D.getSkinElement("dock",
a))?a:{width:0,height:0,src:""}}function C(){c(b+" .capLeft, "+b+" .capRight",{display:v?u:f})}var w=a.extend({},{iconalpha:0.75,iconalphaactive:0.5,iconalphaover:1,margin:8},m),t=g.id+"_dock",D=g.skin,v=0,x={},p={},k,B,F,s=this;s.redraw=function(){e(k)};s.element=function(){return k};s.offset=function(a){c(z(),{"margin-left":a})};s.hide=function(){s.visible&&(s.visible=!1,k.style.opacity=0,clearTimeout(F),F=setTimeout(function(){k.style.display=f},250))};s.showTemp=function(){s.visible||(k.style.opacity=
0,k.style.display=u)};s.hideTemp=function(){s.visible||(k.style.display=f)};s.show=function(){!s.visible&&v&&(s.visible=!0,k.style.display=u,clearTimeout(F),F=setTimeout(function(){k.style.opacity=1},0))};s.addButton=function(b,d,f,g){if(!x[g]){var r=j("div","divider",B),l=j("button",null,B),n=j("div",null,l);n.id=t+"_"+g;n.innerHTML="\x26nbsp;";c("#"+n.id,{"background-image":b});"string"==typeof f&&(f=new Function(f));a.isMobile()?(new a.touch(l)).addEventListener(a.touchEvents.TAP,function(a){f(a)}):
l.addEventListener("click",function(a){f(a);a.preventDefault()});x[g]={element:l,label:d,divider:r,icon:n};if(d){var q=new h.overlay(n.id+"_tooltip",D,!0);b=j("div");b.id=n.id+"_label";b.innerHTML=d;c("#"+b.id,{padding:3});q.setContents(b);if(!a.isMobile()){var m;l.addEventListener("mouseover",function(){clearTimeout(m);var b=p[g],d,j;d=e(x[g].icon);b.offsetX(0);j=e(k);c("#"+b.element().id,{left:d.left-j.left+d.width/2});d=e(b.element());j.left>d.left&&b.offsetX(j.left-d.left+8);q.show();a.foreach(p,
function(a,b){a!=g&&b.hide()})},!1);l.addEventListener("mouseout",function(){m=setTimeout(q.hide,100)},!1);k.appendChild(q.element());p[g]=q}}v++;C()}};s.removeButton=function(a){if(x[a]){B.removeChild(x[a].element);B.removeChild(x[a].divider);var b=document.getElementById(""+t+"_"+a+"_tooltip");b&&k.removeChild(b);delete x[a];v--;C()}};s.numButtons=function(){return v};s.visible=!1;k=j("div","jwdock");B=j("div","jwdockbuttons");k.appendChild(B);k.id=t;var A=q("button"),K=q("buttonOver"),I=q("buttonActive");
A&&(c(z(),{height:A.height,padding:w.margin}),c(b,{height:A.height}),c(z("button"),a.extend(r(A),{width:A.width,cursor:"pointer",border:f})),c(z("button:hover"),r(K)),c(z("button:active"),r(I)),c(z("button\x3ediv"),{opacity:w.iconalpha}),c(z("button:hover\x3ediv"),{opacity:w.iconalphaover}),c(z("button:active\x3ediv"),{opacity:w.iconalphaactive}),c(z(".jwoverlay"),{top:w.margin+A.height}),n("capLeft",B),n("capRight",B),n("divider"));setTimeout(function(){e(k)})};c(".jwdock",{opacity:0,display:f});
c(".jwdock \x3e *",{height:"100%","float":"left"});c(".jwdock \x3e .jwoverlay",{height:"auto","float":f,"z-index":99});c(b+" button",{position:"relative"});c(b+" \x3e *",{height:"100%","float":"left"});c(b+" .divider",{display:f});c(b+" button ~ .divider",{display:u});c(b+" .capLeft, "+b+" .capRight",{display:f});c(b+" .capRight",{"float":"right"});c(b+" button \x3e div",{left:0,right:0,top:0,bottom:0,margin:5,position:"absolute","background-position":"center","background-repeat":"no-repeat"});a.transitionStyle(".jwdock",
"background .25s, opacity .25s");a.transitionStyle(".jwdock .jwoverlay","opacity .25s");a.transitionStyle(b+" button div","opacity .25s")})(jwplayer);
(function(g){var h=g.html5,a=g.utils,c=g.events,e=c.state,b=g.playlist;h.instream=function(d,f,g,l){function m(a){C(a.type,a);M&&d.jwInstreamDestroy(!1,y)}function r(a){C(a.type,a);j(null)}function n(a){C(a.type,a)}function z(){H&&H.releaseState(y.jwGetState());I.play()}function j(){if(v&&x+1<v.length){x++;var e=v[x];D=new b.item(e);M.setPlaylist([e]);var j;p&&(j=p[x]);k=a.extend(t,j);I.load(M.playlist[0]);B.reset(k.skipoffset||-1);T=setTimeout(function(){C(c.JWPLAYER_PLAYLIST_ITEM,{index:x},!0)},
0)}else T=setTimeout(function(){C(c.JWPLAYER_PLAYLIST_COMPLETE,{},!0);d.jwInstreamDestroy(!0,y)},0)}function q(a){a.width&&a.height&&(H&&H.releaseState(y.jwGetState()),g.resizeMedia())}function C(a,b){b=b||{};t.tag&&!b.tag&&(b.tag=t.tag);P.sendEvent(a,b)}function w(){G&&G.redraw();H&&H.redraw()}var t={controlbarseekable:"never",controlbarpausable:!0,controlbarstoppable:!0,loadingmessage:"Loading ad",playlistclickable:!0,skipoffset:null,tag:null},D,v,x=0,p,k={controlbarseekable:"never",controlbarpausable:!1,
controlbarstoppable:!1},B,F,s,A,K,I,G,H,P=new c.eventdispatcher,Q,M,y=this,R=!0,T=-1;d.jwAddEventListener(c.JWPLAYER_RESIZE,w);d.jwAddEventListener(c.JWPLAYER_FULLSCREEN,function(b){w();!b.fullscreen&&a.isIPad()&&(M.state===e.PAUSED?H.show(!0):M.state===e.PLAYING&&H.hide())});y.init=function(){F=l.detachMedia();I=new h.video(F);I.addGlobalListener(n);I.addEventListener(c.JWPLAYER_MEDIA_META,q);I.addEventListener(c.JWPLAYER_MEDIA_COMPLETE,j);I.addEventListener(c.JWPLAYER_MEDIA_BUFFER_FULL,z);I.addEventListener(c.JWPLAYER_MEDIA_ERROR,
m);I.addEventListener(c.JWPLAYER_MEDIA_TIME,function(a){B&&B.updateSkipTime(a.position,a.duration)});I.attachMedia();I.mute(f.mute);I.volume(f.volume);M=new h.model({},I);M.setVolume(f.volume);M.setMute(f.mute);K=f.playlist[f.item];s=F.currentTime;l.checkBeforePlay()||0===s?(A=e.PLAYING,R=!1):A=d.jwGetState()===e.IDLE||f.getVideo().checkComplete()?e.IDLE:e.PLAYING;A==e.PLAYING&&F.pause();H=new h.display(y);H.forceState(e.BUFFERING);Q=document.createElement("div");Q.id=y.id+"_instream_container";Q.appendChild(H.element());
G=new h.controlbar(y);G.instreamMode(!0);Q.appendChild(G.element());d.jwGetControls()?(G.show(),H.show()):(G.hide(),H.hide());g.setupInstream(Q,G,H,M);w();y.jwInstreamSetText(t.loadingmessage)};y.load=function(j,f){if(a.isAndroid(2.3))m({type:c.JWPLAYER_ERROR,message:"Error loading instream: Cannot play instream on Android 2.3"});else{C(c.JWPLAYER_PLAYLIST_ITEM,{index:x},!0);var l=a.bounds(document.getElementById(d.id)),n=g.getSafeRegion();if("object"==a.typeOf(j))D=new b.item(j),M.setPlaylist([j]),
k=a.extend(t,f),B=new h.adskipbutton(d,l.height-(n.y+n.height)+10,k.skipMessage,k.skipText),B.addEventListener(c.JWPLAYER_AD_SKIPPED,r),B.reset(k.skipoffset||-1);else if("array"==a.typeOf(j)){var q;f&&(p=f,q=f[x]);k=a.extend(t,q);B=new h.adskipbutton(d,l.height-(n.y+n.height)+10,k.skipMessage,k.skipText);B.addEventListener(c.JWPLAYER_AD_SKIPPED,r);B.reset(k.skipoffset||-1);v=j;j=v[x];D=new b.item(j);M.setPlaylist([j])}d.jwGetControls()?B.show():B.hide();l=B.element();Q.appendChild(l);M.addEventListener(c.JWPLAYER_ERROR,
m);H.setAlternateClickHandler(function(a){d.jwGetControls()?(M.state==e.PAUSED?y.jwInstreamPlay():y.jwInstreamPause(),a.hasControls=!0):a.hasControls=!1;C(c.JWPLAYER_INSTREAM_CLICK,a)});a.isIE()&&F.parentElement.addEventListener("click",H.clickHandler);g.addEventListener(c.JWPLAYER_AD_SKIPPED,r);I.load(M.playlist[0])}};y.jwInstreamDestroy=function(a){if(M){clearTimeout(T);T=-1;I.detachMedia();l.attachMedia();A!=e.IDLE?f.getVideo().load(K,!1):f.getVideo().stop();P.resetEventListeners();I.resetEventListeners();
M.resetEventListeners();if(G)try{G.element().parentNode.removeChild(G.element())}catch(b){}H&&(F&&F.parentElement&&F.parentElement.removeEventListener("click",H.clickHandler),H.revertAlternateClickHandler());C(c.JWPLAYER_INSTREAM_DESTROYED,{reason:a?"complete":"destroyed"},!0);A==e.PLAYING&&(F.play(),f.playlist[f.item]==K&&R&&f.getVideo().seek(s));g.destroyInstream(I.audioMode());M=null}};y.jwInstreamAddEventListener=function(a,b){P.addEventListener(a,b)};y.jwInstreamRemoveEventListener=function(a,
b){P.removeEventListener(a,b)};y.jwInstreamPlay=function(){I.play(!0);f.state=e.PLAYING;H.show()};y.jwInstreamPause=function(){I.pause(!0);f.state=e.PAUSED;d.jwGetControls()&&H.show()};y.jwInstreamSeek=function(a){I.seek(a)};y.jwInstreamSetText=function(a){G.setText(a)};y.jwInstreamState=function(){return f.state};y.setControls=function(a){a?B.show():B.hide()};y.jwPlay=function(){"true"==k.controlbarpausable.toString().toLowerCase()&&y.jwInstreamPlay()};y.jwPause=function(){"true"==k.controlbarpausable.toString().toLowerCase()&&
y.jwInstreamPause()};y.jwStop=function(){"true"==k.controlbarstoppable.toString().toLowerCase()&&(d.jwInstreamDestroy(!1,y),d.jwStop())};y.jwSeek=function(a){switch(k.controlbarseekable.toLowerCase()){case "always":y.jwInstreamSeek(a);break;case "backwards":M.position>a&&y.jwInstreamSeek(a)}};y.jwSeekDrag=function(a){M.seekDrag(a)};y.jwGetPosition=function(){};y.jwGetDuration=function(){};y.jwGetWidth=d.jwGetWidth;y.jwGetHeight=d.jwGetHeight;y.jwGetFullscreen=d.jwGetFullscreen;y.jwSetFullscreen=d.jwSetFullscreen;
y.jwGetVolume=function(){return f.volume};y.jwSetVolume=function(a){M.setVolume(a);d.jwSetVolume(a)};y.jwGetMute=function(){return f.mute};y.jwSetMute=function(a){M.setMute(a);d.jwSetMute(a)};y.jwGetState=function(){return!M?e.IDLE:M.state};y.jwGetPlaylist=function(){return[D]};y.jwGetPlaylistIndex=function(){return 0};y.jwGetStretching=function(){return f.config.stretching};y.jwAddEventListener=function(a,b){P.addEventListener(a,b)};y.jwRemoveEventListener=function(a,b){P.removeEventListener(a,b)};
y.jwSetCurrentQuality=function(){};y.jwGetQualityLevels=function(){return[]};y.jwGetControls=function(){return d.jwGetControls()};y.skin=d.skin;y.id=d.id+"_instream";return y}})(window.jwplayer);
(function(g){var h=g.utils,a=h.css,c=g.events.state,e=g.html5.logo=function(b,d){function f(a){h.exists(a)&&a.stopPropagation&&a.stopPropagation();if(!z||!m.link)u.jwGetState()==c.IDLE||u.jwGetState()==c.PAUSED?u.jwPlay():u.jwPause();z&&m.link&&(u.jwPause(),u.jwSetFullscreen(!1),window.open(m.link,m.linktarget))}var u=b,l=u.id+"_logo",m,r,n=e.defaults,z=!1;this.resize=function(){};this.element=function(){return r};this.offset=function(b){a("#"+l+" ",{"margin-bottom":b})};this.position=function(){return m.position};
this.margin=function(){return parseInt(m.margin)};this.hide=function(a){if(m.hide||a)z=!1,r.style.visibility="hidden",r.style.opacity=0};this.show=function(){z=!0;r.style.visibility="visible";r.style.opacity=1};var j="o";u.edition&&(j=u.edition(),j="pro"==j?"p":"premium"==j?"r":"ads"==j?"a":"free"==j?"f":"o");if("o"==j||"f"==j)n.link="http://www.longtailvideo.com/jwpabout/?a\x3dl\x26v\x3d"+g.version+"\x26m\x3dh\x26e\x3d"+j;m=h.extend({},n,d);m.hide="true"==m.hide.toString();r=document.createElement("img");
r.className="jwlogo";r.id=l;if(m.file){var n=/(\w+)-(\w+)/.exec(m.position),j={},q=m.margin;3==n.length?(j[n[1]]=q,j[n[2]]=q):j.top=j.right=q;a("#"+l+" ",j);r.src=(m.prefix?m.prefix:"")+m.file;h.isMobile()?(new h.touch(r)).addEventListener(h.touchEvents.TAP,f):r.onclick=f}else r.style.display="none";return this};e.defaults={prefix:h.repo(),file:"logo.png",linktarget:"_top",margin:8,hide:!1,position:"top-right"};a(".jwlogo",{cursor:"pointer",position:"absolute","z-index":100,opacity:0});h.transitionStyle(".jwlogo",
"visibility .25s, opacity .25s")})(jwplayer);
(function(g){var h=g.html5,a=g.utils,c=a.css;h.menu=function(e,b,d,f){function g(a){return!a||!a.src?{}:{background:"url("+a.src+") no-repeat left","background-size":a.width+"px "+a.height+"px"}}function l(a,b){return function(){C(a);n&&n(b)}}function m(a,b){var c=document.createElement("div");a&&(c.className=a);b&&b.appendChild(c);return c}function r(a){return(a=d.getSkinElement("tooltip",a))?a:{width:0,height:0,src:void 0}}var n=f,z=new h.overlay(b+"_overlay",d);f=a.extend({fontcase:void 0,fontcolor:"#cccccc",
fontsize:11,fontweight:void 0,activecolor:"#ffffff",overcolor:"#ffffff"},d.getComponentSettings("tooltip"));var j,q=[];this.element=function(){return z.element()};this.addOption=function(c,d){var e=m("jwoption",j);e.id=b+"_option_"+d;e.innerHTML=c;a.isMobile()?(new a.touch(e)).addEventListener(a.touchEvents.TAP,l(q.length,d)):e.addEventListener("click",l(q.length,d));q.push(e)};this.clearOptions=function(){for(;0<q.length;)j.removeChild(q.pop())};var C=this.setActive=function(a){for(var b=0;b<q.length;b++){var c=
q[b];c.className=c.className.replace(" active","");b==a&&(c.className+=" active")}};this.show=z.show;this.hide=z.hide;this.offsetX=z.offsetX;this.positionX=z.positionX;this.constrainX=z.constrainX;j=m("jwmenu");j.id=b;var w=r("menuTop"+e);e=r("menuOption");var t=r("menuOptionOver"),D=r("menuOptionActive");if(w&&w.image){var v=new Image;v.src=w.src;v.width=w.width;v.height=w.height;j.appendChild(v)}e&&(w="#"+b+" .jwoption",c(w,a.extend(g(e),{height:e.height,color:f.fontcolor,"padding-left":e.width,
font:f.fontweight+" "+f.fontsize+"px Arial,Helvetica,sans-serif","line-height":e.height,"text-transform":"upper"==f.fontcase?"uppercase":void 0})),c(w+":hover",a.extend(g(t),{color:f.overcolor})),c(w+".active",a.extend(g(D),{color:f.activecolor})));z.setContents(j)};c("."+"jwmenu jwoption".replace(/ /g," ."),{cursor:"pointer",position:"relative"})})(jwplayer);
(function(g){var h=jwplayer.utils,a=jwplayer.events;g.model=function(c,e){function b(a){var b=r[a.type]?r[a.type].split(","):[],c,e;if(0<b.length){for(c=0;c<b.length;c++){var f=b[c].split("-\x3e"),h=f[0],f=f[1]?f[1]:h;d[f]!=a[h]&&(d[f]=a[h],e=!0)}e&&d.sendEvent(a.type,a)}else d.sendEvent(a.type,a)}var d=this,f,u=h.getCookies(),l={controlbar:{},display:{}},m={autostart:!1,controls:!0,debug:void 0,fullscreen:!1,height:320,mobilecontrols:!1,mute:!1,playlist:[],playlistposition:"none",playlistsize:180,
playlistlayout:"extended",repeat:!1,skin:void 0,stretching:h.stretching.UNIFORM,width:480,volume:90},r={};r[a.JWPLAYER_MEDIA_MUTE]="mute";r[a.JWPLAYER_MEDIA_VOLUME]="volume";r[a.JWPLAYER_PLAYER_STATE]="newstate-\x3estate";r[a.JWPLAYER_MEDIA_BUFFER]="bufferPercent-\x3ebuffer";r[a.JWPLAYER_MEDIA_TIME]="position,duration";d.setVideo=function(a){f&&f.removeGlobalListener(b);f=a;f.getTag();f.volume(d.volume);f.mute(d.mute);f.addGlobalListener(b)};d.getVideo=function(){return f};d.seekDrag=function(a){f.seekDrag(a)};
d.setFullscreen=function(b){b!=d.fullscreen&&(d.fullscreen=b,d.sendEvent(a.JWPLAYER_FULLSCREEN,{fullscreen:b}))};d.setPlaylist=function(b){d.playlist=h.filterPlaylist(b);0==d.playlist.length?d.sendEvent(a.JWPLAYER_ERROR,{message:"Error loading playlist: No playable sources found"}):(d.sendEvent(a.JWPLAYER_PLAYLIST_LOADED,{playlist:jwplayer(d.id).getPlaylist()}),d.item=-1,d.setItem(0))};d.setItem=function(b){var c=!1;b==d.playlist.length||-1>b?(b=0,c=!0):b=-1==b||b>d.playlist.length?d.playlist.length-
1:b;if(c||b!=d.item)d.item=b,d.sendEvent(a.JWPLAYER_PLAYLIST_ITEM,{index:d.item})};d.setVolume=function(c){d.mute&&0<c&&d.setMute(!1);c=Math.round(c);d.mute||h.saveCookie("volume",c);b({type:a.JWPLAYER_MEDIA_VOLUME,volume:c});f.volume(c)};d.setMute=function(c){h.exists(c)||(c=!d.mute);h.saveCookie("mute",c);b({type:a.JWPLAYER_MEDIA_MUTE,mute:c});f.mute(c)};d.componentConfig=function(a){return l[a]};h.extend(d,new a.eventdispatcher);var n=d,z=h.extend({},m,u,c);h.foreach(z,function(a,b){z[a]=h.serialize(b)});
n.config=z;h.extend(d,{id:c.id,state:a.state.IDLE,duration:-1,position:0,buffer:0},d.config);d.playlist=[];d.setItem(0);d.setVideo(e?e:new g.video)}})(jwplayer.html5);
(function(g){var h=g.utils,a=h.css,c=h.transitionStyle,e="top",b="bottom",d="right",f="left",u=document,l={fontcase:void 0,fontcolor:"#ffffff",fontsize:12,fontweight:void 0,activecolor:"#ffffff",overcolor:"#ffffff"};g.html5.overlay=function(c,g,n){function z(a){return"#"+D+(a?" ."+a:"")}function j(a,b){var c=u.createElement("div");a&&(c.className=a);b&&b.appendChild(c);return c}function q(b,c){var d;d=(d=v.getSkinElement("tooltip",b))?d:{width:0,height:0,src:"",image:void 0,ready:!1};var e=j(c,p);
a.style(e,C(d));return[e,d]}function C(a){return{background:"url("+a.src+") center","background-size":a.width+"px "+a.height+"px"}}function w(c,k){k||(k="");var j=q("cap"+c+k,"jwborder jw"+c+(k?k:"")),g=j[0],j=j[1],l=h.extend(C(j),{width:c==f||k==f||c==d||k==d?j.width:void 0,height:c==e||k==e||c==b||k==b?j.height:void 0});l[c]=c==b&&!x||c==e&&x?B.height:0;k&&(l[k]=0);a.style(g,l);g={};l={};j={left:j.width,right:j.width,top:(x?B.height:0)+j.height,bottom:(x?0:B.height)+j.height};k&&(g[k]=j[k],g[c]=
0,l[c]=j[c],l[k]=0,a(z("jw"+c),g),a(z("jw"+k),l),s[c]=j[c],s[k]=j[k])}var t=this,D=c,v=g,x=n,p,k,B,F;c=h.extend({},l,v.getComponentSettings("tooltip"));var s={};t.element=function(){return p};t.setContents=function(a){h.empty(k);k.appendChild(a)};t.positionX=function(b){a.style(p,{left:Math.round(b)})};t.constrainX=function(b,c){if(t.showing&&0!==b.width&&t.offsetX(0)){c&&a.unblock();var d=h.bounds(p);0!==d.width&&(d.right>b.right?t.offsetX(b.right-d.right):d.left<b.left&&t.offsetX(b.left-d.left))}};
t.offsetX=function(b){b=Math.round(b);var c=p.clientWidth;0!==c&&(a.style(p,{"margin-left":Math.round(-c/2)+b}),a.style(F,{"margin-left":Math.round(-B.width/2)-b}));return c};t.borderWidth=function(){return s.left};t.show=function(){t.showing=!0;a.style(p,{opacity:1,visibility:"visible"})};t.hide=function(){t.showing=!1;a.style(p,{opacity:0,visibility:"hidden"})};p=j(".jwoverlay".replace(".",""));p.id=D;g=q("arrow","jwarrow");F=g[0];B=g[1];a.style(F,{position:"absolute",bottom:x?void 0:0,top:x?0:
void 0,width:B.width,height:B.height,left:"50%"});w(e,f);w(b,f);w(e,d);w(b,d);w(f);w(d);w(e);w(b);g=q("background","jwback");a.style(g[0],{left:s.left,right:s.right,top:s.top,bottom:s.bottom});k=j("jwcontents",p);a(z("jwcontents")+" *",{color:c.fontcolor,font:c.fontweight+" "+c.fontsize+"px Arial,Helvetica,sans-serif","text-transform":"upper"==c.fontcase?"uppercase":void 0});x&&h.transform(z("jwarrow"),"rotate(180deg)");a.style(p,{padding:s.top+1+"px "+s.right+"px "+(s.bottom+1)+"px "+s.left+"px"});
t.showing=!1};a(".jwoverlay",{position:"absolute",visibility:"hidden",opacity:0});a(".jwoverlay .jwcontents",{position:"relative","z-index":1});a(".jwoverlay .jwborder",{position:"absolute","background-size":"100% 100%"},!0);a(".jwoverlay .jwback",{position:"absolute","background-size":"100% 100%"});c(".jwoverlay","opacity .25s, visibility .25s")})(jwplayer);
(function(g){var h=g.html5,a=g.utils;h.player=function(c){function e(b){var c={description:b.description,file:b.file,image:b.image,mediaid:b.mediaid,title:b.title};a.foreach(b,function(a,b){c[a]=b});c.sources=[];c.tracks=[];0<b.sources.length&&a.foreach(b.sources,function(a,b){c.sources.push({file:b.file,type:b.type?b.type:void 0,label:b.label,"default":b["default"]?!0:!1})});0<b.tracks.length&&a.foreach(b.tracks,function(a,b){c.tracks.push({file:b.file,kind:b.kind?b.kind:void 0,label:b.label,"default":b["default"]?
!0:!1})});!b.file&&0<b.sources.length&&(c.file=b.sources[0].file);return c}function b(a){return function(){return f[a]}}var d=this,f,u,l,m;f=new h.model(c);d.id=f.id;a.css.block(d.id);u=new h.view(d,f);l=new h.controller(f,u);d._model=f;d.jwPlay=l.play;d.jwPause=l.pause;d.jwStop=l.stop;d.jwSeek=l.seek;d.jwSetVolume=l.setVolume;d.jwSetMute=l.setMute;d.jwLoad=function(a){d.jwInstreamDestroy();l.load(a)};d.jwPlaylistNext=l.next;d.jwPlaylistPrev=l.prev;d.jwPlaylistItem=l.item;d.jwSetFullscreen=l.setFullscreen;
d.jwResize=u.resize;d.jwSeekDrag=f.seekDrag;d.jwGetQualityLevels=l.getQualityLevels;d.jwGetCurrentQuality=l.getCurrentQuality;d.jwSetCurrentQuality=l.setCurrentQuality;d.jwGetCaptionsList=l.getCaptionsList;d.jwGetCurrentCaptions=l.getCurrentCaptions;d.jwSetCurrentCaptions=l.setCurrentCaptions;d.jwGetSafeRegion=u.getSafeRegion;d.jwForceState=u.forceState;d.jwReleaseState=u.releaseState;d.jwGetPlaylistIndex=b("item");d.jwGetPosition=b("position");d.jwGetDuration=b("duration");d.jwGetBuffer=b("buffer");
d.jwGetWidth=b("width");d.jwGetHeight=b("height");d.jwGetFullscreen=b("fullscreen");d.jwGetVolume=b("volume");d.jwGetMute=b("mute");d.jwGetState=b("state");d.jwGetStretching=b("stretching");d.jwGetPlaylist=function(){for(var a=f.playlist,b=[],c=0;c<a.length;c++)b.push(e(a[c]));return b};d.jwGetControls=b("controls");d.jwDetachMedia=l.detachMedia;d.jwAttachMedia=l.attachMedia;d.jwPlayAd=function(a){var b=g(d.id).plugins;b.vast&&b.vast.jwPlayAd(a)};d.jwPauseAd=function(){var a=g(d.id).plugins;a.googima&&
a.googima.jwPauseAd()};d.jwInitInstream=function(){d.jwInstreamDestroy();m=new h.instream(d,f,u,l);m.init()};d.jwLoadItemInstream=function(a,b){if(!m)throw"Instream player undefined";m.load(a,b)};d.jwLoadArrayInstream=function(a,b){if(!m)throw"Instream player undefined";m.load(a,b)};d.jwSetControls=function(a){u.setControls(a);m&&m.setControls(a)};d.jwInstreamPlay=function(){m&&m.jwInstreamPlay()};d.jwInstreamPause=function(){m&&m.jwInstreamPause()};d.jwInstreamState=function(){return m?m.jwInstreamState():
""};d.jwInstreamDestroy=function(a,b){if(b=b||m)b.jwInstreamDestroy(a||!1),b===m&&(m=void 0)};d.jwInstreamAddEventListener=function(a,b){m&&m.jwInstreamAddEventListener(a,b)};d.jwInstreamRemoveEventListener=function(a,b){m&&m.jwInstreamRemoveEventListener(a,b)};d.jwPlayerDestroy=function(){u&&u.destroy()};d.jwInstreamSetText=function(a){m&&m.jwInstreamSetText(a)};d.jwIsBeforePlay=function(){return l.checkBeforePlay()};d.jwIsBeforeComplete=function(){return f.getVideo().checkComplete()};d.jwSetCues=
u.addCues;d.jwAddEventListener=l.addEventListener;d.jwRemoveEventListener=l.removeEventListener;d.jwDockAddButton=u.addButton;d.jwDockRemoveButton=u.removeButton;c=new h.setup(f,u,l);c.addEventListener(g.events.JWPLAYER_READY,function(b){l.playerReady(b);a.css.unblock(d.id)});c.addEventListener(g.events.JWPLAYER_ERROR,function(b){a.log("There was a problem setting up the player: ",b);a.css.unblock(d.id)});c.start()}})(window.jwplayer);
(function(g){var h={size:180,backgroundcolor:"#333333",fontcolor:"#999999",overcolor:"#CCCCCC",activecolor:"#CCCCCC",titlecolor:"#CCCCCC",titleovercolor:"#FFFFFF",titleactivecolor:"#FFFFFF",fontweight:"normal",titleweight:"normal",fontsize:11,titlesize:13},a=jwplayer.events,c=jwplayer.utils,e=c.css,b=c.isMobile(),d=document;g.playlistcomponent=function(f,u){function l(a){return"#"+q.id+(a?" ."+a:"")}function m(a,b){var c=d.createElement(a);b&&(c.className=b);return c}function r(a){return function(){v=
a;n.jwPlaylistItem(a);n.jwPlay(!0)}}var n=f,z=n.skin,j=c.extend({},h,n.skin.getComponentSettings("playlist"),u),q,C,w,t,D=-1,v,x,p=76,k={background:void 0,divider:void 0,item:void 0,itemOver:void 0,itemImage:void 0,itemActive:void 0},B,F=this;F.element=function(){return q};F.redraw=function(){x&&x.redraw()};F.show=function(){c.show(q)};F.hide=function(){c.hide(q)};q=m("div","jwplaylist");q.id=n.id+"_jwplayer_playlistcomponent";B="basic"==n._model.playlistlayout;C=m("div","jwlistcontainer");q.appendChild(C);
c.foreach(k,function(a){k[a]=z.getSkinElement("playlist",a)});B&&(p=32);k.divider&&(p+=k.divider.height);var s=0,A=0,K=0;c.clearCss(l());e(l(),{"background-color":j.backgroundcolor});e(l("jwlist"),{"background-image":k.background?" url("+k.background.src+")":""});e(l("jwlist *"),{color:j.fontcolor,font:j.fontweight+" "+j.fontsize+"px Arial, Helvetica, sans-serif"});k.itemImage?(s=(p-k.itemImage.height)/2+"px ",A=k.itemImage.width,K=k.itemImage.height):(A=4*p/3,K=p);k.divider&&e(l("jwplaylistdivider"),
{"background-image":"url("+k.divider.src+")","background-size":"100% "+k.divider.height+"px",width:"100%",height:k.divider.height});e(l("jwplaylistimg"),{height:K,width:A,margin:s?s+"0 "+s+s:"0 5px 0 0"});e(l("jwlist li"),{"background-image":k.item?"url("+k.item.src+")":"",height:p,overflow:"hidden","background-size":"100% "+p+"px",cursor:"pointer"});s={overflow:"hidden"};""!==j.activecolor&&(s.color=j.activecolor);k.itemActive&&(s["background-image"]="url("+k.itemActive.src+")");e(l("jwlist li.active"),
s);e(l("jwlist li.active .jwtitle"),{color:j.titleactivecolor});e(l("jwlist li.active .jwdescription"),{color:j.activecolor});s={overflow:"hidden"};""!==j.overcolor&&(s.color=j.overcolor);k.itemOver&&(s["background-image"]="url("+k.itemOver.src+")");b||(e(l("jwlist li:hover"),s),e(l("jwlist li:hover .jwtitle"),{color:j.titleovercolor}),e(l("jwlist li:hover .jwdescription"),{color:j.overcolor}));e(l("jwtextwrapper"),{height:p,position:"relative"});e(l("jwtitle"),{overflow:"hidden",display:"inline-block",
height:B?p:20,color:j.titlecolor,"font-size":j.titlesize,"font-weight":j.titleweight,"margin-top":B?"0 10px":10,"margin-left":10,"margin-right":10,"line-height":B?p:20});e(l("jwdescription"),{display:"block","font-size":j.fontsize,"line-height":18,"margin-left":10,"margin-right":10,overflow:"hidden",height:36,position:"relative"});n.jwAddEventListener(a.JWPLAYER_PLAYLIST_LOADED,function(){C.innerHTML="";for(var a=n.jwGetPlaylist(),d=[],f=0;f<a.length;f++)a[f]["ova.hidden"]||d.push(a[f]);if(w=d){a=
m("ul","jwlist");a.id=q.id+"_ul"+Math.round(1E7*Math.random());t=a;for(a=0;a<w.length;a++){var j=a,d=w[j],f=m("li","jwitem"),h=void 0;f.id=t.id+"_item_"+j;0<j?(h=m("div","jwplaylistdivider"),f.appendChild(h)):(j=k.divider?k.divider.height:0,f.style.height=p-j+"px",f.style["background-size"]="100% "+(p-j)+"px");j=m("div","jwplaylistimg jwfill");h=void 0;d["playlist.image"]&&k.itemImage?h=d["playlist.image"]:d.image&&k.itemImage?h=d.image:k.itemImage&&(h=k.itemImage.src);h&&!B&&(e("#"+f.id+" .jwplaylistimg",
{"background-image":h}),f.appendChild(j));j=m("div","jwtextwrapper");h=m("span","jwtitle");h.innerHTML=d&&d.title?d.title:"";j.appendChild(h);d.description&&!B&&(h=m("span","jwdescription"),h.innerHTML=d.description,j.appendChild(h));f.appendChild(j);d=f;b?(new c.touch(d)).addEventListener(c.touchEvents.TAP,r(a)):d.onclick=r(a);t.appendChild(d)}D=n.jwGetPlaylistIndex();C.appendChild(t);x=new g.playlistslider(q.id+"_slider",n.skin,q,t)}});n.jwAddEventListener(a.JWPLAYER_PLAYLIST_ITEM,function(a){0<=
D&&(d.getElementById(t.id+"_item_"+D).className="jwitem",D=a.index);d.getElementById(t.id+"_item_"+a.index).className="jwitem active";a=n.jwGetPlaylistIndex();a!=v&&(v=-1,x&&x.visible()&&x.thumbPosition(a/(n.jwGetPlaylist().length-1)))});n.jwAddEventListener(a.JWPLAYER_RESIZE,function(){F.redraw()});return this};e(".jwplaylist",{position:"absolute",width:"100%",height:"100%"});c.dragStyle(".jwplaylist","none");e(".jwplaylist .jwplaylistimg",{position:"relative",width:"100%","float":"left",margin:"0 5px 0 0",
background:"#000",overflow:"hidden"});e(".jwplaylist .jwlist",{position:"absolute",width:"100%","list-style":"none",margin:0,padding:0,overflow:"hidden"});e(".jwplaylist .jwlistcontainer",{position:"absolute",overflow:"hidden",width:"100%",height:"100%"});e(".jwplaylist .jwlist li",{width:"100%"});e(".jwplaylist .jwtextwrapper",{overflow:"hidden"});e(".jwplaylist .jwplaylistdivider",{position:"absolute"});b&&c.transitionStyle(".jwplaylist .jwlist","top .35s")})(jwplayer.html5);
(function(g){function h(){var a=[],b;for(b=0;b<arguments.length;b++)a.push(".jwplaylist ."+arguments[b]);return a.join(",")}var a=jwplayer.utils,c=a.touchEvents,e=a.css,b=document,d=window,f=void 0;g.playlistslider=function(h,g,m,r){function n(a){return"#"+k.id+(a?" ."+a:"")}function z(a,c,d,k){var j=b.createElement("div");a&&(j.className=a,c&&e(n(a),{"background-image":c.src?c.src:f,"background-repeat":k?"repeat-y":"no-repeat",height:k?f:c.height}));d&&d.appendChild(j);return j}function j(a){return(a=
x.getSkinElement("playlist",a))?a:{width:0,height:0,src:f}}function q(a){if(G)return a=a?a:d.event,aa(A-(a.detail?-1*a.detail:a.wheelDelta/40)/10),a.stopPropagation&&a.stopPropagation(),a.preventDefault&&a.preventDefault(),a.cancelBubble=!0,a.cancel=!0,a.returnValue=!1}function C(a){0==a.button&&(s=!0);b.onselectstart=function(){return!1};d.addEventListener("mousemove",t,!1);d.addEventListener("mouseup",v,!1)}function w(a){aa(A-2*a.deltaY/p.clientHeight)}function t(b){if(s||"click"==b.type){var c=
a.bounds(B),d=F.clientHeight/2;aa((b.pageY-c.top-d)/(c.height-d-d))}}function D(a){return function(b){0<b.button||(aa(A+0.05*a),K=setTimeout(function(){I=setInterval(function(){aa(A+0.05*a)},50)},500))}}function v(){s=!1;d.removeEventListener("mousemove",t);d.removeEventListener("mouseup",v);b.onselectstart=f;clearTimeout(K);clearInterval(I)}var x=g,p=r,k,B,F,s,A=0,K,I;g=a.isMobile();var G=!0,H,P,Q,M,y,R,T,ca,ba;this.element=function(){return k};this.visible=function(){return G};var S=this.redraw=
function(){clearTimeout(ba);ba=setTimeout(function(){if(p&&p.clientHeight){var a=p.parentNode.clientHeight/p.clientHeight;0>a&&(a=0);1<a?G=!1:(G=!0,e(n("jwthumb"),{height:Math.max(B.clientHeight*a,y.height+R.height)}));e(n(),{visibility:G?"visible":"hidden"});p&&(p.style.width=G?p.parentElement.clientWidth-Q.width+"px":"")}else ba=setTimeout(S,10)},0)},aa=this.thumbPosition=function(a){isNaN(a)&&(a=0);A=Math.max(0,Math.min(1,a));e(n("jwthumb"),{top:T+(B.clientHeight-F.clientHeight)*A});r&&(r.style.top=
Math.min(0,k.clientHeight-r.scrollHeight)*A+"px")};k=z("jwslider",null,m);k.id=h;h=new a.touch(p);g?h.addEventListener(c.DRAG,w):(k.addEventListener("mousedown",C,!1),k.addEventListener("click",t,!1));H=j("sliderCapTop");P=j("sliderCapBottom");Q=j("sliderRail");h=j("sliderRailCapTop");m=j("sliderRailCapBottom");M=j("sliderThumb");y=j("sliderThumbCapTop");R=j("sliderThumbCapBottom");T=H.height;ca=P.height;e(n(),{width:Q.width});e(n("jwrail"),{top:T,bottom:ca});e(n("jwthumb"),{top:T});H=z("jwslidertop",
H,k);P=z("jwsliderbottom",P,k);B=z("jwrail",null,k);F=z("jwthumb",null,k);g||(H.addEventListener("mousedown",D(-1),!1),P.addEventListener("mousedown",D(1),!1));z("jwrailtop",h,B);z("jwrailback",Q,B,!0);z("jwrailbottom",m,B);e(n("jwrailback"),{top:h.height,bottom:m.height});z("jwthumbtop",y,F);z("jwthumbback",M,F,!0);z("jwthumbbottom",R,F);e(n("jwthumbback"),{top:y.height,bottom:R.height});S();p&&!g&&(p.addEventListener("mousewheel",q,!1),p.addEventListener("DOMMouseScroll",q,!1));return this};e(h("jwslider"),
{position:"absolute",height:"100%",visibility:"hidden",right:0,top:0,cursor:"pointer","z-index":1,overflow:"hidden"});e(h("jwslider")+" *",{position:"absolute",width:"100%","background-position":"center","background-size":"100% 100%",overflow:"hidden"});e(h("jwslidertop","jwrailtop","jwthumbtop"),{top:0});e(h("jwsliderbottom","jwrailbottom","jwthumbbottom"),{bottom:0})})(jwplayer.html5);
(function(g){var h=jwplayer.utils,a=h.css,c=document,e="none";g.rightclick=function(a,d){function f(a){var b=c.createElement("div");b.className=a.replace(".","");return b}function u(){r||(n.style.display=e)}var l,m=h.extend({aboutlink:"http://www.longtailvideo.com/jwpabout/?a\x3dr\x26v\x3d"+g.version+"\x26m\x3dh\x26e\x3do",abouttext:"About JW Player "+g.version+"..."},d),r=!1,n,z;this.element=function(){return n};this.destroy=function(){c.removeEventListener("mousedown",u,!1)};l=c.getElementById(a.id);
n=f(".jwclick");n.id=a.id+"_menu";n.style.display=e;l.oncontextmenu=function(a){if(!r){null==a&&(a=window.event);var b=null!=a.target?a.target:a.srcElement,c=h.bounds(l),b=h.bounds(b);n.style.display=e;n.style.left=(a.offsetX?a.offsetX:a.layerX)+b.left-c.left+"px";n.style.top=(a.offsetY?a.offsetY:a.layerY)+b.top-c.top+"px";n.style.display="block";a.preventDefault()}};n.onmouseover=function(){r=!0};n.onmouseout=function(){r=!1};c.addEventListener("mousedown",u,!1);z=f(".jwclick_item");z.innerHTML=
m.abouttext;z.onclick=function(){window.top.location=m.aboutlink};n.appendChild(z);l.appendChild(n)};a(".jwclick",{"background-color":"#FFF","-webkit-border-radius":5,"-moz-border-radius":5,"border-radius":5,height:"auto",border:"1px solid #bcbcbc","font-family":'"MS Sans Serif", "Geneva", sans-serif',"font-size":10,width:320,"-webkit-box-shadow":"5px 5px 7px rgba(0,0,0,.10), 0px 1px 0px rgba(255,255,255,.3) inset","-moz-box-shadow":"5px 5px 7px rgba(0,0,0,.10), 0px 1px 0px rgba(255,255,255,.3) inset",
"box-shadow":"5px 5px 7px rgba(0,0,0,.10), 0px 1px 0px rgba(255,255,255,.3) inset",position:"absolute","z-index":999},!0);a(".jwclick div",{padding:"8px 21px",margin:"0px","background-color":"#FFF",border:"none","font-family":'"MS Sans Serif", "Geneva", sans-serif',"font-size":10,color:"inherit"},!0);a(".jwclick_item",{padding:"8px 21px","text-align":"left",cursor:"pointer"},!0);a(".jwclick_item:hover",{"background-color":"#595959",color:"#FFF"},!0);a(".jwclick_item a",{"text-decoration":e,color:"#000"},
!0);a(".jwclick hr",{width:"100%",padding:0,margin:0,border:"1px #e9e9e9 solid"},!0)})(jwplayer.html5);
(function(g){var h=jwplayer,a=h.utils,c=h.events,e=h.playlist,b=2,d=4;g.setup=function(f,h){function l(a,b,c){v.push({name:a,method:b,depends:c})}function m(){for(var a=0;a<v.length;a++){var b=v[a],c;a:{if(c=b.depends){c=c.toString().split(",");for(var d=0;d<c.length;d++)if(!C[c[d]]){c=!1;break a}}c=!0}if(c){v.splice(a,1);try{b.method(),m()}catch(e){j(e.message)}return}}0<v.length&&!D&&setTimeout(m,500)}function r(){C[b]=!0}function n(a){j("Error loading skin: "+a)}function z(){C[d]=!0}function j(a){D=
!0;t.sendEvent(c.JWPLAYER_ERROR,{message:a});q.setupError(a)}var q=h,C={},w,t=new c.eventdispatcher,D=!1,v=[];a.extend(this,t);this.start=m;l(1,function(){f.edition&&"invalid"==f.edition()?j("Error setting up player: Invalid license key"):C[1]=!0});l(b,function(){w=new g.skin;w.load(f.config.skin,r,n)},1);l(3,function(){switch(a.typeOf(f.config.playlist)){case "string":j("Can't load a playlist as a string anymore");case "array":var b=new e(f.config.playlist);f.setPlaylist(b);0==f.playlist[0].sources.length?
j("Error loading playlist: No playable sources found"):C[3]=!0}},1);l(d,function(){var a=f.playlist[f.item].image;if(a){var b=new Image;b.addEventListener("load",z,!1);b.addEventListener("error",z,!1);b.src=a;setTimeout(z,500)}else C[d]=!0},3);l(5,function(){q.setup(w);C[5]=!0},d+","+b);l(6,function(){C[6]=!0},"5,3");l(7,function(){t.sendEvent(c.JWPLAYER_READY);C[7]=!0},6)}})(jwplayer.html5);
(function(g){g.skin=function(){var h={},a=!1;this.load=function(c,e,b){new g.skinloader(c,function(b){a=!0;h=b;"function"==typeof e&&e()},function(a){"function"==typeof b&&b(a)})};this.getSkinElement=function(c,e){c=c.toLowerCase();e=e.toLowerCase();if(a)try{return h[c].elements[e]}catch(b){jwplayer.utils.log("No such skin component / element: ",[c,e])}return null};this.getComponentSettings=function(c){c=c.toLowerCase();return a&&h&&h[c]?h[c].settings:null};this.getComponentLayout=function(c){c=c.toLowerCase();
if(a){var e=h[c].layout;if(e&&(e.left||e.right||e.center))return h[c].layout}return null}}})(jwplayer.html5);
(function(g){var h=jwplayer.utils,a=h.foreach,c="Skin formatting error";g.skinloader=function(e,b,d){function f(a){z=a;h.ajax(h.getAbsolutePath(t),function(a){try{h.exists(a.responseXML)&&l(a.responseXML)}catch(b){q(c)}},function(a){q(a)})}function u(a,b){return a?a.getElementsByTagName(b):null}function l(a){var b=u(a,"skin")[0];a=u(b,"component");var c=b.getAttribute("target"),b=parseFloat(b.getAttribute("pixelratio"));0<b&&(x=b);(!c||parseFloat(c)>parseFloat(jwplayer.version))&&q("Incompatible player version");
if(0===a.length)j(z);else for(c=0;c<a.length;c++){var d=n(a[c].getAttribute("name")),b={settings:{},elements:{},layout:{}},e=u(u(a[c],"elements")[0],"element");z[d]=b;for(var f=0;f<e.length;f++)r(e[f],d);if((d=u(a[c],"settings")[0])&&0<d.childNodes.length){d=u(d,"setting");for(e=0;e<d.length;e++){var f=d[e].getAttribute("name"),g=d[e].getAttribute("value");/color$/.test(f)&&(g=h.stringToColor(g));b.settings[n(f)]=g}}if((d=u(a[c],"layout")[0])&&0<d.childNodes.length){d=u(d,"group");for(e=0;e<d.length;e++){g=
d[e];f={elements:[]};b.layout[n(g.getAttribute("position"))]=f;for(var l=0;l<g.attributes.length;l++){var t=g.attributes[l];f[t.name]=t.value}g=u(g,"*");for(l=0;l<g.length;l++){t=g[l];f.elements.push({type:t.tagName});for(var v=0;v<t.attributes.length;v++){var w=t.attributes[v];f.elements[l][n(w.name)]=w.value}h.exists(f.elements[l].name)||(f.elements[l].name=t.tagName)}}}C=!1;m()}}function m(){clearInterval(w);D||(w=setInterval(function(){var b=!0;a(z,function(c,d){"properties"!=c&&a(d.elements,
function(a){(z[n(c)]?z[n(c)].elements[n(a)]:null).ready||(b=!1)})});b&&!1==C&&(clearInterval(w),j(z))},100))}function r(a,b){b=n(b);var c=new Image,d=n(a.getAttribute("name")),e=a.getAttribute("src");if(0!==e.indexOf("data:image/png;base64,"))var f=h.getAbsolutePath(t),e=[f.substr(0,f.lastIndexOf("/")),b,e].join("/");z[b].elements[d]={height:0,width:0,src:"",ready:!1,image:c};c.onload=function(){var a=b,e=z[n(a)]?z[n(a)].elements[n(d)]:null;e?(e.height=Math.round(c.height/x*v),e.width=Math.round(c.width/
x*v),e.src=c.src,e.ready=!0,m()):h.log("Loaded an image for a missing element: "+a+"."+d)};c.onerror=function(){D=!0;m();q("Skin image not found: "+this.src)};c.src=e}function n(a){return a?a.toLowerCase():""}var z={},j=b,q=d,C=!0,w,t=e,D=!1,v=(jwplayer.utils.isMobile(),1),x=1;"string"!=typeof t||""===t?l(g.defaultskin().xml):"xml"!=h.extension(t)?q("Skin not a valid file type"):new g.skinloader("",f,q)}})(jwplayer.html5);
(function(g){var h=g.utils,a=g.events,c=h.css;g.html5.thumbs=function(e){function b(a){r=null;try{a=(new g.parsers.srt).parse(a.responseText,!0)}catch(b){d(b.message);return}if("array"!==h.typeOf(a))return d("Invalid data");l=a}function d(a){r=null;h.log("Thumbnails could not be loaded: "+a)}function f(a,b,d){a.onload=null;b.width||(b.width=a.width,b.height=a.height);b["background-image"]=a.src;c.style(u,b);d&&d(b.width)}var u,l,m,r,n,z={},j,q=new a.eventdispatcher;h.extend(this,q);u=document.createElement("div");
u.id=e;this.load=function(a){c.style(u,{display:"none"});r&&(r.onload=null,r.onreadystatechange=null,r.onerror=null,r.abort&&r.abort(),r=null);j&&(j.onload=null);a?(m=a.split("?")[0].split("/").slice(0,-1).join("/"),r=h.ajax(a,b,d,!0)):(l=n=j=null,z={})};this.element=function(){return u};this.updateTimeline=function(a,b){if(l){for(var c=0;c<l.length&&a>l[c].end;)c++;c===l.length&&c--;c=l[c].text;a:{var e=c;if(e&&e!==n){n=e;0>e.indexOf("://")&&(e=m?m+"/"+e:e);var h={display:"block",margin:"0 auto",
"background-position":"0 0",width:0,height:0};if(0<e.indexOf("#xywh"))try{var g=/(.+)\#xywh=(\d+),(\d+),(\d+),(\d+)/.exec(e),e=g[1];h["background-position"]=-1*g[2]+"px "+-1*g[3]+"px";h.width=g[4];h.height=g[5]}catch(p){d("Could not parse thumbnail");break a}var k=z[e];k?f(k,h,b):(k=new Image,k.onload=function(){f(k,h,b)},z[e]=k,k.src=e);j&&(j.onload=null);j=k}}return c}}}})(jwplayer);
(function(g){var h=g.utils,a=g.events,c=a.state,e=!0,b=!1;g.html5.video=function(d){function f(a,b){y&&M.sendEvent(a,b)}function g(){}function l(b){r(b);y&&(G==c.PLAYING&&!I)&&(F=Number(k.currentTime.toFixed(1)),f(a.JWPLAYER_MEDIA_TIME,{position:F,duration:B}))}function m(c){y&&(s||(s=e,n()),"loadedmetadata"==c.type&&(k.muted&&(k.muted=b,k.muted=e),f(a.JWPLAYER_MEDIA_META,{duration:k.duration,height:k.videoHeight,width:k.videoWidth})))}function r(){s&&(0<K&&!ca)&&(D?setTimeout(function(){0<K&&da(K)},
200):da(K))}function n(){A||(A=e,f(a.JWPLAYER_MEDIA_BUFFER_FULL))}function z(a){y&&!I&&(k.paused?k.currentTime==k.duration&&3<k.duration||qa():(!h.isFF()||!("play"==a.type&&G==c.BUFFERING))&&w(c.PLAYING))}function j(){y&&(I||w(c.BUFFERING))}function q(a){var b;if("array"==h.typeOf(a)&&0<a.length){b=[];for(var c=0;c<a.length;c++){var d=a[c],e={};e.label=d.label&&d.label?d.label?d.label:0:c;b[c]=e}}return b}function C(){A=s=b;p=R[T];w(c.BUFFERING);k.src=p.file;k.load();P=setInterval(t,100);h.isMobile()&&
n()}function w(b){if(!(b==c.PAUSED&&G==c.IDLE)&&!I&&G!=b){var d=G;G=b;f(a.JWPLAYER_PLAYER_STATE,{oldstate:d,newstate:b})}}function t(){if(y){var b;b=0==k.buffered.length||0==k.duration?0:k.buffered.end(k.buffered.length-1)/k.duration;b!=Q&&(Q=b,f(a.JWPLAYER_MEDIA_BUFFER,{bufferPercent:Math.round(100*Q)}));1<=b&&clearInterval(P)}}var D=h.isIE(),v={abort:g,canplay:m,canplaythrough:g,durationchange:function(){if(y){var a=Number(k.duration.toFixed(1));B!=a&&(B=a);ca&&(0<K&&a>K)&&da(K);l()}},emptied:g,
ended:function(){y&&G!=c.IDLE&&(T=-1,Y=e,f(a.JWPLAYER_MEDIA_BEFORECOMPLETE),y&&(w(c.IDLE),Y=b,f(a.JWPLAYER_MEDIA_COMPLETE)))},error:function(){y&&(h.log("Error playing media: %o",k.error),M.sendEvent(a.JWPLAYER_MEDIA_ERROR,{message:"Error loading media: File could not be played"}),w(c.IDLE))},loadeddata:g,loadedmetadata:m,loadstart:g,pause:z,play:z,playing:z,progress:r,ratechange:g,readystatechange:g,seeked:function(){!I&&G!=c.PAUSED&&w(c.PLAYING)},seeking:D?j:g,stalled:g,suspend:g,timeupdate:l,volumechange:function(){f(a.JWPLAYER_MEDIA_VOLUME,
{volume:Math.round(100*k.volume)});f(a.JWPLAYER_MEDIA_MUTE,{mute:k.muted})},waiting:j},x,p,k,B,F,s,A,K,I=b,G=c.IDLE,H,P=-1,Q=-1,M=new a.eventdispatcher,y=b,R,T=-1,ca=h.isAndroid(b,e),ba=h.isIOS(7),S=this,aa=[],Y=b;h.extend(S,M);S.load=function(b){if(y){x=b;K=0;B=b.duration?b.duration:-1;F=0;R=x.sources;0>T&&(T=0);for(b=0;b<R.length;b++)if(R[b]["default"]){T=b;break}var c=h.getCookies().qualityLabel;if(c)for(b=0;b<R.length;b++)if(R[b].label==c){T=b;break}(b=q(R))&&M.sendEvent(a.JWPLAYER_MEDIA_LEVELS,
{levels:b,currentQuality:T});C()}};S.stop=function(){y&&(k.removeAttribute("src"),D||k.load(),T=-1,clearInterval(P),w(c.IDLE))};S.play=function(){y&&!I&&k.play()};var qa=S.pause=function(){y&&(k.pause(),w(c.PAUSED))};S.seekDrag=function(a){y&&((I=a)?k.pause():k.play())};var da=S.seek=function(b){y&&(!I&&0==K&&f(a.JWPLAYER_MEDIA_SEEK,{position:F,offset:b}),s?(K=0,k.currentTime=b):K=b)},Ra=S.volume=function(a){h.exists(a)&&(k.volume=Math.min(Math.max(0,a/100),1),H=100*k.volume)};S.mute=function(a){h.exists(a)||
(a=!k.muted);a?(H=100*k.volume,k.muted=e):(Ra(H),k.muted=b)};this.addCaptions=function(a,b,c){h.isIOS()&&k.addTextTrack&&(0<c&&(c=a[c-1].label),h.foreach(a,function(a,b){if(b.data){var c=k.addTextTrack(b.kind,b.label);h.foreach(b.data,function(a,d){1==a%2&&c.addCue(new TextTrackCue(d.begin,b.data[parseInt(a)+1].begin,d.text))});aa.push(c);c.mode="hidden"}}))};this.resetCaptions=function(){};this.fsCaptions=function(a){if(h.isIOS()&&k.addTextTrack){var b=null;h.foreach(aa,function(c,d){!a&&"showing"==
d.mode&&(b=parseInt(c));a||(d.mode="hidden")});if(!a)return b}};this.checkComplete=function(){return Y};S.detachMedia=function(){y=b;return k};S.attachMedia=function(d){y=e;d||(s=b);Y&&(w(c.IDLE),f(a.JWPLAYER_MEDIA_COMPLETE),Y=b)};S.getTag=function(){return k};S.audioMode=function(){if(!R)return b;var a=R[0].type;return"aac"==a||"mp3"==a||"vorbis"==a};S.setCurrentQuality=function(b){T!=b&&(b=parseInt(b,10),0<=b&&(R&&R.length>b)&&(T=b,h.saveCookie("qualityLabel",R[b].label),f(a.JWPLAYER_MEDIA_LEVEL_CHANGED,
{currentQuality:b,levels:q(R)}),b=k.currentTime,C(),S.seek(b)))};S.getCurrentQuality=function(){return T};S.getQualityLevels=function(){return q(R)};d||(d=document.createElement("video"));k=d;h.foreach(v,function(a,c){k.addEventListener(a,c,b)});ba||(k.controls=e,k.controls=b);k.setAttribute("x-webkit-airplay","allow");y=e}})(jwplayer);
(function(g){var h=g.html5,a=g.utils,c=g.events,e=c.state,b=a.css,d=a.bounds,f=a.isMobile(),u=a.isIPad(),l=a.isIPod(),m=a.isAndroid(),r=a.isIOS(),n=document,z="aspectMode",j=!0,q=!1,C="hidden",w="none",t="block";h.view=function(D,v){function x(){var a=d(O),b=Math.round(a.width),e=Math.round(a.height);if(n.body.contains(O)){if(b&&e&&(b!==eb||e!==Va))eb=b,Va=e,X&&X.redraw(),clearTimeout(xa),xa=setTimeout(P,50),va.sendEvent(c.JWPLAYER_RESIZE,{width:b,height:e})}else window.removeEventListener("resize",
x),f&&window.removeEventListener("orientationchange",x);return a}function p(a){a&&(a.element().addEventListener("mousemove",A,q),a.element().addEventListener("mouseout",K,q))}function k(){}function B(a,b){var c=n.createElement(a);b&&(c.className=b);return c}function F(){clearTimeout(Aa);Aa=setTimeout(Y,nb)}function s(){clearTimeout(Aa);if(U.jwGetState()==e.PAUSED||U.jwGetState()==e.PLAYING)qa(),W||(Aa=setTimeout(Y,nb))}function A(){clearTimeout(Aa);W=j}function K(){W=q}function I(a){va.sendEvent(a.type,
a)}function G(c,d,e){var f=O.className,g,h,k=U.id+"_view";b.block(k);if(e=!!e)f=f.replace(/\s*aspectMode/,""),O.className!==f&&(O.className=f),b.style(O,{display:t},e);a.exists(c)&&a.exists(d)&&(L.width=c,L.height=d);e={width:c};-1==f.indexOf(z)&&(e.height=d);b.style(O,e,!0);X&&X.redraw();V&&V.redraw(j);ea&&(ea.offset(V&&0<=ea.position().indexOf("bottom")?V.height()+V.margin():0),setTimeout(function(){N&&N.offset("top-left"==ea.position()?ea.element().clientWidth+ea.margin():0)},500));H(d);g=L.playlistsize;
h=L.playlistposition;if(oa&&g&&("right"==h||"bottom"==h))oa.redraw(),f={display:t},e={},f[h]=0,e[h]=g,"right"==h?f.width=g:f.height=g,b.style(Oa,f),b.style(za,e);P(c,d);b.unblock(k)}function H(a){var b=d(O);ka=0<a.toString().indexOf("%")||0===b.height?q:"bottom"==L.playlistposition?b.height<=40+L.playlistsize:40>=b.height;V&&(ka?(V.audioMode(j),qa(),X.hidePreview(j),X&&X.hide(),da(q)):(V.audioMode(q),Sa(U.jwGetState())));ea&&ka&&S();O.style.backgroundColor=ka?"transparent":"#000"}function P(b,c){if(ja){if(!b||
isNaN(Number(b)))b=ra.clientWidth;if(!c||isNaN(Number(c)))c=ra.clientHeight;a.stretch(L.stretching,ja,b,c,ja.videoWidth,ja.videoHeight)&&(clearTimeout(xa),xa=setTimeout(P,250))}}function Q(a){if(L.fullscreen)switch(a.keyCode){case 27:fa(q)}}function M(a){r||(a?(O.className+=" jwfullscreen",n.getElementsByTagName("body")[0].style["overflow-y"]=C):(O.className=O.className.replace(/\s+jwfullscreen/,""),n.getElementsByTagName("body")[0].style["overflow-y"]=""))}function y(){var a;a=n.mozFullScreenElement||
n.webkitCurrentFullScreenElement||n.msFullscreenElement||ja.webkitDisplayingFullscreen;a=!(!a||a.id&&a.id!=U.id);L.fullscreen!=a&&fa(a)}function R(){V&&(!ka&&!L.getVideo().audioMode())&&V.hide()}function T(){N&&(!ka&&L.controls)&&N.show()}function ca(){N&&(!Ga&&!L.getVideo().audioMode())&&N.hide()}function ba(){ea&&!ka&&ea.show()}function S(){ea&&!L.getVideo().audioMode()&&ea.hide(ka)}function aa(){X&&L.controls&&!ka&&(!l||U.jwGetState()==e.IDLE)&&X.show();if(!f||!L.fullscreen)ja.controls=q}function Y(){clearTimeout(Aa);
la=q;var a=U.jwGetState();(!v.controls||a!=e.PAUSED)&&R();v.controls||ca();a!=e.IDLE&&a!=e.PAUSED&&(ca(),S())}function qa(){la=j;if((L.controls||ka)&&!(l&&$==e.PAUSED))(!l||ka)&&V&&V.show(),T();fb.hide&&ba()}function da(a){(a=a&&!ka)||m?b.style(ra,{visibility:"visible",opacity:1}):b.style(ra,{visibility:C,opacity:0})}function Ra(){Ga=j;fa(q);L.controls&&T()}function ha(){}function kb(){}function Ia(a){Ga=q;clearTimeout(ga);ga=setTimeout(function(){Sa(a.newstate)},100)}function Ya(){R()}function Sa(a){$=
a;switch(a){case e.PLAYING:(Ba?Ja:L).getVideo().audioMode()?(da(q),X.hidePreview(ka),X.setHiding(j),V&&(qa(),V.hideFullscreen(j)),T(),ba()):(da(j),P(),X.hidePreview(j),V&&V.hideFullscreen(q),Y());break;case e.IDLE:da(q);ka||(X.hidePreview(q),aa(),T(),ba(),V&&V.hideFullscreen(q));break;case e.BUFFERING:aa();Y();f&&da(j);break;case e.PAUSED:aa(),qa()}}function Ta(a){return"#"+U.id+(a?" ."+a:"")}function Na(a,c){b(a,{display:c?t:w})}var U=D,L=v,O,za,ua,Za,Oa,Aa=-1,nb=f?4E3:2E3,ja,ra,eb,Va,sa,Pa,Ca,Ja,
Ba=q,V,X,N,ea,fb=a.extend({},L.componentConfig("logo")),J,oa,ka,Xa=q,la=q,Ga,E,xa=-1,W=q,$,va=new c.eventdispatcher;a.extend(this,va);this.getCurrentCaptions=function(){return J.getCurrentCaptions()};this.setCurrentCaptions=function(a){J.setCurrentCaptions(a)};this.getCaptionsList=function(){return J.getCaptionsList()};this.setup=function(d){if(!Xa){U.skin=d;za=B("span","jwmain");za.id=U.id+"_view";ra=B("span","jwvideo");ja=L.getVideo().getTag();ra.appendChild(ja);ua=B("span","jwcontrols");sa=B("span",
"jwinstream");Oa=B("span","jwplaylistcontainer");Za=B("span","jwaspect");d=L.height;var g=L.componentConfig("controlbar"),m=L.componentConfig("display");H(d);J=new h.captions(U,L.captions);J.addEventListener(c.JWPLAYER_CAPTIONS_LIST,I);J.addEventListener(c.JWPLAYER_CAPTIONS_CHANGED,I);J.addEventListener(c.JWPLAYER_CAPTIONS_LOADED,k);ua.appendChild(J.element());X=new h.display(U,m);X.addEventListener(c.JWPLAYER_DISPLAY_CLICK,function(a){I(a);f?la?Y():qa():Ia(U.jwGetState());la&&F()});ka&&X.hidePreview(j);
ua.appendChild(X.element());ea=new h.logo(U,fb);ua.appendChild(ea.element());N=new h.dock(U,L.componentConfig("dock"));ua.appendChild(N.element());U.edition&&!f?E=new h.rightclick(U,{abouttext:L.abouttext,aboutlink:L.aboutlink}):f||(E=new h.rightclick(U,{}));L.playlistsize&&(L.playlistposition&&L.playlistposition!=w)&&(oa=new h.playlistcomponent(U,{}),Oa.appendChild(oa.element()));V=new h.controlbar(U,g);V.addEventListener(c.JWPLAYER_USER_ACTION,F);ua.appendChild(V.element());l&&R();za.appendChild(ra);
za.appendChild(ua);za.appendChild(sa);O.appendChild(za);O.appendChild(Za);O.appendChild(Oa);n.addEventListener("webkitfullscreenchange",y,q);ja.addEventListener("webkitbeginfullscreen",y,q);ja.addEventListener("webkitendfullscreen",y,q);n.addEventListener("mozfullscreenchange",y,q);n.addEventListener("MSFullscreenChange",y,q);n.addEventListener("keydown",Q,q);window.removeEventListener("resize",x);window.addEventListener("resize",x,!1);f&&(window.removeEventListener("orientationchange",x),window.addEventListener("orientationchange",
x,!1));U.jwAddEventListener(c.JWPLAYER_PLAYER_READY,kb);U.jwAddEventListener(c.JWPLAYER_PLAYER_STATE,Ia);U.jwAddEventListener(c.JWPLAYER_MEDIA_ERROR,Ya);U.jwAddEventListener(c.JWPLAYER_PLAYLIST_COMPLETE,Ra);U.jwAddEventListener(c.JWPLAYER_PLAYLIST_ITEM,ha);Ia({newstate:e.IDLE});f||(ua.addEventListener("mouseout",function(){clearTimeout(Aa);Aa=setTimeout(Y,10)},q),ua.addEventListener("mousemove",s,q),a.isIE()&&(ra.addEventListener("mousemove",s,q),ra.addEventListener("click",X.clickHandler)));p(V);
p(N);p(ea);b("#"+O.id+"."+z+" .jwaspect",{"margin-top":L.aspectratio,display:t});d=a.exists(L.aspectratio)?parseFloat(L.aspectratio):100;g=L.playlistsize;b("#"+O.id+".playlist-right .jwaspect",{"margin-bottom":-1*g*(d/100)+"px"});b("#"+O.id+".playlist-right .jwplaylistcontainer",{width:g+"px",right:0,top:0,height:"100%"});b("#"+O.id+".playlist-bottom .jwaspect",{"padding-bottom":g+"px"});b("#"+O.id+".playlist-bottom .jwplaylistcontainer",{width:"100%",height:g+"px",bottom:0});b("#"+O.id+".playlist-right .jwmain",
{right:g+"px"});b("#"+O.id+".playlist-bottom .jwmain",{bottom:g+"px"});setTimeout(function(){G(L.width,L.height)},0)}};var fa=this.fullscreen=function(b){a.exists(b)||(b=!L.fullscreen);if(b){if((Ba?Ja:L).getVideo().audioMode())return;if(f)try{ja.webkitEnterFullScreen(),L.setFullscreen(j)}catch(c){return}else L.fullscreen||(M(j),O.requestFullScreen?O.requestFullScreen():O.mozRequestFullScreen?O.mozRequestFullScreen():O.webkitRequestFullScreen?O.webkitRequestFullScreen():O.msRequestFullscreen&&O.msRequestFullscreen(),
L.setFullscreen(j))}else f?(ja.webkitExitFullScreen(),L.setFullscreen(q),u&&(ja.controls=q)):L.fullscreen&&(M(q),L.setFullscreen(q),n.cancelFullScreen?n.cancelFullScreen():n.mozCancelFullScreen?n.mozCancelFullScreen():n.webkitCancelFullScreen?n.webkitCancelFullScreen():n.msExitFullscreen&&n.msExitFullscreen()),u&&U.jwGetState()==e.PAUSED&&setTimeout(aa,500);V&&V.redraw();X&&X.redraw();N&&N.redraw();P();L.fullscreen&&(clearTimeout(xa),xa=setTimeout(P,200))};this.resize=function(a,b){G(a,b,!0);x()};
this.resizeMedia=P;var Qa=this.completeSetup=function(){b.style(O,{opacity:1})},ga;this.setupInstream=function(a,c,d,f){b.unblock();Na(Ta("jwinstream"),j);Na(Ta("jwcontrols"),q);sa.appendChild(a);Pa=c;Ca=d;Ja=f;Ia({newstate:e.PLAYING});Ba=j};this.destroyInstream=function(){b.unblock();Na(Ta("jwinstream"),q);Na(Ta("jwcontrols"),j);sa.innerHTML="";Ba=q};this.setupError=function(a){Xa=j;g.embed.errorScreen(O,a,L);Qa()};this.addButton=function(a,b,c,d){N&&(N.addButton(a,b,c,d),U.jwGetState()==e.IDLE&&
T())};this.removeButton=function(a){N&&N.removeButton(a)};this.setControls=function(a){var b=L.controls,d=a?j:q;L.controls=d;d!=b&&(Ba?a?(Pa.show(),Ca.show()):(Pa.hide(),Ca.hide()):d?Ia({newstate:U.jwGetState()}):(Y(),X&&X.hide()),va.sendEvent(c.JWPLAYER_CONTROLS,{controls:d}))};this.addCues=function(a){V&&V.addCues(a)};this.forceState=function(a){X.forceState(a)};this.releaseState=function(){X.releaseState(U.jwGetState())};this.getSafeRegion=function(){var a={x:0,y:0,width:0,height:0};if(!L.controls)return a;
V.showTemp();N.showTemp();var b=d(za),c=b.top,e=Ba?d(n.getElementById(U.id+"_instream_controlbar")):d(V.element()),f=Ba?!1:0<N.numButtons(),g=0===ea.position().indexOf("top"),h=d(ea.element());f&&(f=d(N.element()),a.y=Math.max(0,f.bottom-c));g&&(a.y=Math.max(a.y,h.bottom-c));a.width=b.width;a.height=e.height?(g?e.top:h.top)-c-a.y:b.height-a.y;V.hideTemp();N.hideTemp();return a};this.destroy=function(){n.removeEventListener("webkitfullscreenchange",y,q);n.removeEventListener("mozfullscreenchange",
y,q);n.removeEventListener("MSFullscreenChange",y,q);ja.removeEventListener("webkitbeginfullscreen",y,q);ja.removeEventListener("webkitendfullscreen",y,q);n.removeEventListener("keydown",Q,q);E&&E.destroy()};O=B("div","jwplayer playlist-"+L.playlistposition);O.id=U.id;L.aspectratio&&(b.style(O,{display:"inline-block"}),O.className=O.className.replace("jwplayer","jwplayer "+z));G(L.width,L.height);var La=n.getElementById(U.id);La.parentNode.replaceChild(O,La)};b(".jwplayer",{position:"relative",display:"block",
opacity:0,"min-height":0,"-webkit-transition":"opacity .25s ease","-moz-transition":"opacity .25s ease","-o-transition":"opacity .25s ease"});b(".jwmain",{position:"absolute",left:0,right:0,top:0,bottom:0,"-webkit-transition":"opacity .25s ease","-moz-transition":"opacity .25s ease","-o-transition":"opacity .25s ease"});b(".jwvideo, .jwcontrols",{position:"absolute",height:"100%",width:"100%","-webkit-transition":"opacity .25s ease","-moz-transition":"opacity .25s ease","-o-transition":"opacity .25s ease"});
b(".jwvideo",{overflow:C,visibility:C,opacity:0,cursor:"pointer"});b(".jwvideo video",{background:"transparent",height:"100%",width:"100%",position:"absolute",margin:"auto",right:0,left:0,top:0,bottom:0});b(".jwplaylistcontainer",{position:"absolute",height:"100%",width:"100%",display:w});b(".jwinstream",{position:"absolute",top:0,left:0,bottom:0,right:0,display:"none"});b(".jwaspect",{display:"none"});b(".jwplayer."+z,{height:"auto"});b(".jwplayer.jwfullscreen",{width:"100%",height:"100%",left:0,
right:0,top:0,bottom:0,"z-index":1E3,position:"fixed"},j);b(".jwplayer.jwfullscreen .jwmain",{left:0,right:0,top:0,bottom:0},j);b(".jwplayer.jwfullscreen .jwplaylistcontainer",{display:w},j);b(".jwplayer .jwuniform",{"background-size":"contain !important"});b(".jwplayer .jwfill",{"background-size":"cover !important","background-position":"center"});b(".jwplayer .jwexactfit",{"background-size":"100% 100% !important"})})(jwplayer);
(function(g){var h=jwplayer.utils.extend,a=g.logo;a.defaults.prefix="";a.defaults.file="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAAAyCAMAAACkjD/XAAACnVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJCQkSEhIAAAAaGhoAAAAiIiIrKysAAAAxMTEAAAA4ODg+Pj4AAABEREQAAABJSUkAAABOTk5TU1NXV1dcXFxiYmJmZmZqamptbW1xcXF0dHR3d3d9fX2AgICHh4eKioqMjIyOjo6QkJCSkpKUlJSWlpaYmJidnZ2enp6ioqKjo6OlpaWmpqanp6epqamqqqqurq6vr6+wsLCxsbG0tLS1tbW2tra3t7e6urq7u7u8vLy9vb2+vr6/v7/AwMDCwsLFxcXFxcXHx8fIyMjJycnKysrNzc3Ozs7Ozs7Pz8/Pz8/Q0NDR0dHR0dHS0tLU1NTV1dXW1tbW1tbW1tbX19fX19fa2trb29vb29vc3Nzc3Nzf39/f39/f39/f39/g4ODh4eHj4+Pj4+Pk5OTk5OTk5OTk5OTl5eXn5+fn5+fn5+fn5+fn5+fo6Ojo6Ojq6urq6urq6urr6+vr6+vr6+vt7e3t7e3t7e3t7e3u7u7u7u7v7+/v7+/w8PDw8PDw8PDw8PDy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL09PT09PT09PT09PT09PT09PT09PT29vb29vb29vb29vb29vb29vb29vb29vb39/f39/f39/f39/f39/f4+Pj4+Pj4+Pj5+fn5+fn5+fn5+fn5+fn5+fn5+fn6+vr6+vr6+vr6+vr6+vr6+vr8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz9/f39/f39/f39/f39/f39/f39/f39/f39/f3+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7///////////////9kpi5JAAAA33RSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhYWFxcYGBgZGRoaGhsbHBwdHR4eHx8gISIiIyQmJicoKSoqKywtLi4uMDEyMjM0NTU2Njc5Ojo7Ozw9Pj5AQUJCQ0ZGSElKSktMTU5PUFFRUlRVVlZXWFpbXV5eX2BhYmVmZ2hpamtsbW5vcHFyc3R2d3h5enx9fn+BgoKDhIWGiYmKi4yNjo+QkZKTlJWWl5eYmZqbnJ2enp+goaKkpaamp6ipqqusra6vsLKzs7W2t7i5uru8vb6/wMHCwsPExcbHyMnJysvMVK8y+QAAB5FJREFUeNrFmP2f3EQdx8kmm2yy2WQzmZkjl3bJ2Rb12mtp8SiKiBUUxVKFVisIihV62CKCIoK0UvVK1bP07mitBeVJUVso0Duw1Xo9ET0f6JN47bV3u9+/xe83kyzr0+vlL7t8Xq9ubpLpvHfm+7i54P+UVkBp2gWdFpGNYtFA+NtALpYcxzZ1rSM0TSvgv5xse0wwu1joxDYLulE0dKTTSLcqfOvMQ1WzoHXAtCadsGXqBCsUnWDxNBzmlq51wLSuz0LmOcTWClZFfA1ghLUbrUwbdq396kAvK5s6HoFdlb8FuLONB66RlGnD5S8BwKkNoVMsFEw3XIOj97hmoX2updP5kml7jgLp/Ec8yzBKntwDMCnwa7TPtUrkWLrliW2gtC+0TdNhvdMAu1hJ19plYNcP0LGKiJp/HJTeEI5V8sjJ4PZ2mTp1rb7Pf5C5JbvCN0Cuha7jpE5WX9oeU6us8YlTUH8grFQC+QzkWuKVvdTJXuWO0Z5Nk2tNkWNdzgLed+4tdNWrkpPBI20ytVYwK+LrQLpPcHk3vIVm1ZCcDD7jt8fUGmYNoeLpJzKW+1vQYSjJyc72ZKbWSOqqhpn+99r/rn99WDDLbJViHZbJirkWtJDkZPArbhta2jFg7LdKV1ID9aWaz5CTzTD0pvB2aypB9xYPKtaUXEC7bKKjeA1dHyJTU+xbFgY/RiAKP2lYsm28RaJmAtfTs6c4xP9g0gycUqKpeDGLegZPl3MqTL6oWCdl9EIrOol20/U6zyzgVJzpeV6l7Dhl18VP1/N8v1r1vQoNSziH1nPKKMdBChbAiprheygfL65tZmxazguYXDoL8BcyqlhRb0W/M3Wy412YRTUd7SKEFIKzIBQ8DBhHewgSjkLB7GwS54wxwcoORqYQ+QyhFGA9VIYxnfCKq2VtE3k3wTB1taLx+FVCNTRyxnU4YQ/8WEY9M7PvkvJHsEsAam5srRRwH0YBhml14Zv7pRz62+LAD/jWE0vHINU6OUGXyc0Mt5GiLW/+6blV8eO4tY8B6t3qvBsZOnUy+HJgFaiuMELfhQ6RrAe4JZGvwxcFPLx69YZDZ1ciOrB03ayEd52vr0x6/zokhbxs+p5o7Oc3kfrkxFOrV392d+NWFaeaXvK652Cw+xTAo9cS5ar0vKcfy9BrgNRfMVN0SOh+gPfWtgN8L7kM6pcI2FSrJUtm7kc0KxlF2xcHd/1xWxxvmv1QLB9/5cJobDiKIxklcmI4ShJ5eJ/qOTSqU6/BBC4JN6boQSAN71Doi1Mnm+B0Rjlavgabo/GZ2V/LL8FRSehkkfzzYIouoqXf31jz3de7kq5DB6JP1a+vSUQnOXrRoujpn2XogumJpwCeBfhDV4qeAdK1QwqdOhkMqdAyyyk6HoHR3tmD4/UlI/DDBNFxHK1tDBDaNrHODU7KDzTW16Lr6nccHZGxHNt3Jao/RrSU8pPTeX+JPYj4NpAGkxsg16FoWP1xP5Bu8UwdYxSXJXRyJ0zeCtsegdsm4QsLBBwcHf3l+fF5hHbscnDh1LeSaGwvModnTl7ChVRuNiblxIkjR6bq+9+R9RzkO7cBadWCdZBroDaq/jgDqHMLMYtSr8jkpwl9aaOxF9bdDHsb9T5Ev/rkk6N398SIDj3X5zfDzi1bDpxdHNWWwcOchS27funeR+EOyTI0RcyKLIM20VPzyOObeh4LJsZ/hYnaRpgRsTwG9TPzLz5XhyOSDlzykDEKLsEYl08cG0W9eW+U4B1eZZmtY7J13PXCeHeg0MrPjlH8yLiJ/mYtfqIFvQVNTaez/cMrfwHHpJC7APZH0csAP5ARokPPwXyIoEjKaOnM7UIIOfKKrJEJvEAguhZHUY1sHb3vH1tCxyS0OvGtAL+/iMubQOlMXyKfA6U8i+I0PqWyecA3AmyVEmPhczxEdBUbOKwCsHsAtfNUDyZNdiNcLQld8cTYgQHScjExjNPvOf9RSsrZtt3uB3f2s0Dku35MyiY6z6LYjbMdx+HvO7pd11/egBtCvh7mFvs+P70Rl8L0yU8r7WROyXb5b77Dxemv+I7L82wmxoeY53U9+/K8HE1ZvBq4eGQfh1SNa0Keo5tZVCXwXs7KluUwIZjrMsrHTsB95f4B50JwztGURtHywsBjvGphtIUiFeb9Kn4pjzHXUOhmlXPI3Ug/5QH6BjS1uWpRRdLNku3YWPNw4RKVSSqfpKLq3k3bIZXMvFha+NjQqXqlhYxKa9EgFJGVqKCrqD2ZloJrql7Qgq4vw9DKfn0ahp73B+ln3hPQY/xKJEO1CC2P6T49UOP/fD+R5qphSBvAslttQb8YZr1os7/5ry0P8VDNoZK6T8pnZpdW4bb9ZWPQ2NPtlhxf/A5yPUApt+0/MP2uqy5nLkaKLyZycuOKCp13u9mWXXasol4staAPYyprN1p5CvkR1nD5pxz9jQDPu1Pvbii3yklQmr2U/LtDUr9Fngelp0NqwDsmirPtoLRWJdxOiQrp9Yr8XGiTk3XyxF2eFuw3+ju5aRJl1Yu+f+LMM1eiexc6/lK0QuWpYhkd3XT+UsfOXhd2WKpO6W/TO3BUO8H/BB7RwuB6W7b7AAAAAElFTkSuQmCC";
g.logo=function(c,e){"free"==c.edition()?e=null:(a.defaults.file="",a.defaults.prefix="");h(this,new a(c,e))}})(jwplayer.html5);(function(g){var h=g.model;g.model=function(a,c){var e=new jwplayer.utils.key(a.key),b=new h(a,c),d=b.componentConfig;b.edition=function(){return e.edition()};b.componentConfig=function(a){return"logo"==a?b.logo:d(a)};return b}})(jwplayer.html5);(function(g){g.player.prototype.edition=function(){return this._model.edition()}})(jwplayer.html5);
(function(g){var h=jwplayer.utils.extend,a=g.rightclick;g.rightclick=function(c,e){if("free"==c.edition())e.aboutlink="http://www.longtailvideo.com/jwpabout/?a\x3dr\x26v\x3d"+g.version+"\x26m\x3dh\x26e\x3df",delete e.abouttext;else{if(!e.aboutlink){var b="http://www.longtailvideo.com/jwpabout/?a\x3dr\x26v\x3d"+g.version+"\x26m\x3dh\x26e\x3d",d=c.edition();e.aboutlink=b+("pro"==d?"p":"premium"==d?"r":"ads"==d?"a":"f")}e.abouttext?e.abouttext+=" ...":(b=c.edition(),b=b.charAt(0).toUpperCase()+b.substr(1),
e.abouttext="About JW Player "+g.version+" ("+b+" edition)")}h(this,new a(c,e))}})(jwplayer.html5);(function(g){var h=g.view;g.view=function(a,c){var e=new h(a,c);"invalid"==c.edition()&&e.setupError("Error setting up player: Invalid license key");return e}})(jwplayer.html5);
jwplayer.key="NqTL6OJafEE1e0WF2zzmJ1VRC3NFp9K2jLrcZQ9mBD8=";

+function ($, document, window) {
  'use strict';

  // RESOURCE CLASS DEFINITION
  // =========================

  var Resource = function (element, options) {
    this.$element   = null

    this.init('resource', element, options)
  }

  Resource.DEFAULTS = {
    subtype: ''
  }

  Resource.prototype.init = function (type, element, options) {
    this.type     = type
    this.$element = $(element)
    this.options  = this.getOptions(options)

    if ( this.options.subtype === 'tabell' ) {
      this.togglable();
    }
    if ( this.options.subtype === 'karta' ) {
      this.map();
    }
    if ( this.options.subtype === 'textruta' ) {
      this.togglable();
    }
  }

  Resource.prototype.getDefaults = function () {
    return Resource.DEFAULTS
  }

  Resource.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    return options
  }

  Resource.prototype.map = function () {
    if ( this.options.subtype === 'karta') {
        var $el = this.$element,
            $figcaption = $el.find('figcaption'),
            $byline = $el.find('.byline'),
            $link = $el.find('a').addClass('btn btn-sm btn-success'),
            $iconExt = $('<span>&emsp;</span>').addClass('fa fa-external-link').prependTo($link),
            $iconGlo = $('<span></span>').addClass('fa fa-globe').prependTo($el);

        $link.appendTo($figcaption);
        $byline.appendTo($figcaption);
    }
  }

  Resource.prototype.togglable = function () {
    if (this.options.subtype === 'tabell' || this.options.subtype === 'textruta') {
        var $el = this.$element,
            expanded = false,
            $caret = $('<span>&emsp;</span>').addClass('fa fa-chevron-circle-down'),
            $button = $('<a></a>')
                .attr('role', 'button')
                .text('Visa tabell ')
                .addClass('btn btn-info btn-sm')
                .prepend($caret)
                .click(function() {
                    $el.find('.collapse').collapse('toggle');
                    $button
                        .text(expanded ? 'Visa tabell ' : 'Dölj tabell ')
                        .toggleClass('active')
                        .prepend($caret);
                    expanded = !expanded;
                });

        $el.wrapInner('<div class="collapse"></div>');

        var $heading = $el.find('.huvud')
            .prependTo($el);
        var $icon = $('<span>&nbsp;</span>').addClass('fa fa-table');
        $icon.prependTo($heading);
        $button.appendTo($heading);
    }
  }

  // RESOURCE PLUGIN DEFINITION
  // ==========================

  var old = $.fn.resource

  $.fn.resource = function (option) {
    return this.each(function () {
      var $this     = $(this)
      var data      = $this.data('ne.resource')
      var options   = typeof option == 'object' && option

      if (!data) $this.data('ne.resource', (data = new Resource(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.resource.Constructor = Resource


  // RESOURCE NO CONFLICT
  // ====================

  $.fn.resource.noConflict = function () {
    $.fn.resource = old
    return this
  }

  // RESOURCE AUTO INIT
  // ==================

  $(window).on('load', function () {
    $('.resource.tabell').each(function () {
      var $resource = $(this);
      $resource.resource( {subtype: 'tabell'} );
    });

    $('.resource.interaktiv.karta').each(function () {
      var $resource = $(this);
      $resource.resource( {subtype: 'karta'} );
    });

    $('.resource.textruta').each(function () {
      var $resource = $(this);
      $resource.resource( {subtype: 'textruta'} );
    });
  })

}(jQuery, document, window);

+function ($, document, window) {
  'use strict';

  /*
   * TODO:
   * - Change the absolute URL to the flashplayer.
   * - Document how to use the player
   */

  // MEDIAPLAYER CLASS DEFINITION
  // =========================

  var Mediaplayer = function (element, options) {
    this.options    =
    this.$element   = null;

    this.init(element, options);
  }

  Mediaplayer.VIDEO = 'video';
  Mediaplayer.AUDIO = 'audio';
  Mediaplayer.TYPES = [Mediaplayer.VIDEO, Mediaplayer.AUDIO];

  Mediaplayer.DEFAULTS = {
    flashplayer: 'http://masala-ux.ne.se/dist/swf/jwplayer.flash.swf',
    skin: 'glow',
    fontSize: 10
  }

  Mediaplayer.MEDIA_DEFAULTS = {
    video: {
      width: '100%',
      aspectratio: '16:9',
      fallback: false
    },
    audio: {
      size: 'default'
    }
  }

  Mediaplayer.AUDIO_SIZES = {
    small:     { width: 150, height: 32 },
    "default": { width: 270, height: 32 },
    large:     { width: "100%", aspectratio: "16:9" }
  }

  Mediaplayer.prototype.init = function (element, options) {
    this.$element  = $(element);
    this.options   = this.getOptions(options);

    var mediaId = this.$element.attr('id');
    jwplayer(mediaId).setup(this.options);
  }

  Mediaplayer.prototype.getDefaults = function (type) {
    return $.extend({}, Mediaplayer.DEFAULTS, Mediaplayer.MEDIA_DEFAULTS[type]);
  }

  Mediaplayer.prototype.getOptions = function (options) {
    var dataOptions = this.$element.data();
    var type = dataOptions.mediaplayer;

    var mediaOptions = $.extend({}, this.getDefaults(type), dataOptions, options);

    if (type === Mediaplayer.VIDEO) {
      // Add file sources
      var sources = [];
      var files = ($.isArray(mediaOptions.file)) ? mediaOptions.file : [ mediaOptions.file ];
      $.each(files, function(i, source) {
        sources.push({file: source});
      });
      $.extend(mediaOptions, {
        playlist: [{
          sources: sources,
          image: mediaOptions.image
        }]
      });

      if(mediaOptions.subtitle) {
        var subtitles = ($.isArray(mediaOptions.subtitle)) ? mediaOptions.subtitle : [ mediaOptions.subtitle ];
        $.each(subtitles, function(i, st){
          st.kind = "captions";
        });
        // Put subtitles on the first video source
        $.extend(mediaOptions.playlist[0], {tracks: subtitles});        
      }
    }
    else if (type === Mediaplayer.AUDIO) {
      $.extend(mediaOptions, Mediaplayer.AUDIO_SIZES[mediaOptions.size]);
    }

    return mediaOptions;
  }


  // MEDIAPLAYER PLUGIN DEFINITION
  // ==========================

  var old = $.fn.mediaplayer;

  $.fn.mediaplayer = function (option) {
    return this.each(function () {
      var $this     = $(this)
      var data      = $this.data('ne.mediaplayer')
      var options   = typeof option == 'object' && option

      if (!data) $this.data('ne.mediaplayer', (data = new Mediaplayer(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.mediaplayer.Constructor = Mediaplayer;


  // MEDIAPLAYER NO CONFLICT
  // ====================

  $.fn.mediaplayer.noConflict = function () {
    $.fn.mediaplayer = old
    return this
  }

  // MEDIAPLAYER AUTO INIT
  // =====================

  $(document).on('ready', function () {
    $.each(Mediaplayer.TYPES, function(i, type){
      $('[data-mediaplayer="'+type+'"]').each(function() {
        var $el = $(this);
        $el.mediaplayer($el.data());
      });
    });
  });

}(jQuery, document, window);

+function ($, document, window) {
    $('.carousel').carousel({
        pause: true,
        interval: false
    });
}(jQuery, document, window);
var NE = NE || {};
$.extend(true, NE, {
  masonryjs: {
    init: function() {
      var msnry = new Masonry( '.inspiration', {
        itemSelector: '.panel',
        transitionDuration: 0
      });
    }
  }
});


+function ($, document, window) {
  'use strict';

  // SEARCHBAR CLASS DEFINITION
  // =========================

  var Searchbar = function (element, options) {
    this.options    =
    this.$window    = $(window)
                        .on('resize', $.proxy(this.resize, this))
                        .on('scroll', $.proxy(this.scroll, this))

    this.$element   = null

    this.init('searchbar', element, options)

  }

  Searchbar.DEFAULTS = {
    master            : '.navigation',
    hidden            : false,
    offsetTop         : 6,
    offsetLeft        : 12,
    offsetRight       : 12,
    scrollTop         : null,
    scrollTolerance   : 24,
    scrollDirection   : null
  }

  Searchbar.prototype.init = function (type, element, options) {
    this.type           = type
    this.$element       = $(element)
    this.options        = this.getOptions(options)
    this.$master        = $(this.options.master);

    this.$element.find('.sources').each(function(){
      var $srcwrapper = $(this);
      var $sel = $(this).find('.selected-source');
      $srcwrapper.find('.btn').not('.dropdown-toggle').click(function(e){
          $sel.text($(this).text()); // set text
          if($(this).attr("id") == "no_search_source") {
              $('input[name="typ"]').removeAttr("checked");
          }
      });
    });

    this.affix();
  }

  Searchbar.prototype.getDefaults = function () {
    return Searchbar.DEFAULTS
  }

  Searchbar.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    return options
  }

  Searchbar.prototype.affix = function () {
    if ( this.$master != null ) {
      this.$element.addClass('fixed').resize();
    }
  }

  Searchbar.prototype.show = function () {
    if ( this.options.hidden ) {
      this.$element.css( 'top', $('.navigation').first().outerHeight() + this.options.offsetTop )
      this.options.hidden = false
    }
  }

  Searchbar.prototype.hide = function () {
    if ( !this.options.hidden ) {
      this.$element.css( 'top', -( this.$element.outerHeight() ) )
      this.options.hidden = true
    }
  }

  Searchbar.prototype.resize = function () {
    var top     = ( this.options.hidden ) ? -( this.$element.outerHeight() ) : $('.navigation').first().outerHeight() + this.options.offsetTop
    var left    = this.$master.offset().left + this.options.offsetLeft
    var right   = (this.$window.width() - (this.$master.offset().left + this.$master.outerWidth())) + this.options.offsetRight

    this.$element
      .css( 'top',   top )
      .css( 'left',  left )
      .css( 'right', right )
  }

  Searchbar.prototype.scroll = function () {
    var scrollTop = this.options.scrollTop
    this.options.scrollTop = this.$window.scrollTop()

    // Check how far we have scrolled, and in what direction
    if ( this.options.scrollTop < scrollTop && ( scrollTop - this.options.scrollTop ) > this.options.scrollTolerance && this.options.scrollDirection !== 'up' ) {
      // Scrolling up started
      this.options.scrollDirection = 'up'
      this.show()
    }
    else if ( this.options.scrollTop > scrollTop && ( this.options.scrollTop - scrollTop ) > this.options.scrollTolerance && this.options.scrollDirection !== 'down' ) {
      // Scrolling down started
      this.options.scrollDirection = 'down'
      this.hide()
    }
  }

  // SEARCHBAR PLUGIN DEFINITION
  // ==========================

  var old = $.fn.searchbar

  $.fn.searchbar = function (option) {
    return this.each(function () {
      var $this     = $(this)
      var data      = $this.data('ne.searchbar')
      var options   = typeof option == 'object' && option

      if (!data) $this.data('ne.searchbar', (data = new Searchbar(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.searchbar.Constructor = Searchbar


  // SEARCHBAR NO CONFLICT
  // ====================

  $.fn.searchbar.noConflict = function () {
    $.fn.searchbar = old
    return this
  }

  // SEARCHBAR AUTO INIT
  // ==================

  $(document).on('ready', function () {
    $('[data-component="searchbar"]').each(function () {
      var $searchbar = $(this);
      $searchbar.searchbar();
    });

    $('[data-component="searchbar-static"]').each(function() {
        $(this).find('.input-group').each(function(){
            var $srcwrapper = $(this);
            var $sel = $(this).find('.selected-source');
            $srcwrapper.find('.btn').not('.dropdown-toggle, button:submit').click(function(e) {
                $sel.text($(this).text()); // set text
                if($(this).attr("id") == "no_search_source") {
                  $('input[name="t"]').removeAttr("checked");
                }
            });
			$srcwrapper.find("input:radio").change(function(e) {
				if(!$srcwrapper.find('input[name="q"]').val().length < 1) {
					$srcwrapper.find('button:submit').click();
				}
            });
        });
    });
  })

}(jQuery, document, window);

+function ($, document, window) {
  'use strict';

  // PROMOTION CLASS DEFINITION
  // =========================

  var Promotion = function (element, options) {
    this.options    =
    this.$element   = null;
    this.$fixedElement = null;
    this.$window  = $(window);
    this.showStatic = false;

    this.init(element, options);
  }

  Promotion.DEFAULTS = {
    fixedContainer: '<div id="promotion-fixed"><div class="container"></div></div>',
    duration: 300
  }

  Promotion.prototype.init = function (element, options) {
    var that = this;
    this.$element  = $(element);
    this.options   = this.getOptions(options);

    // Create the fixed element by cloning the original, and appending it to the body
    this.$fixedElement = $(this.options.fixedContainer);
    this.$fixedElement.hide()
                      .find('.container')
                      .append($('#promotion').html());
    $('body').append(this.$fixedElement);

    this.$window.scroll(function() {
      that.update();
    });

    this.$window.resize(function() {
      that.update();
    });

    this.update();
  }

  Promotion.prototype.update = function () {
    this.recalc();
    this.process();
  }

  Promotion.prototype.recalc = function () {
    var docScrollTop = this.$window.scrollTop();

    var elemTop = this.$element.offset().top;
    var elemBottom = elemTop + this.$element.height();

    this.showStatic = (elemBottom < docScrollTop);
  }

  Promotion.prototype.process = function () {
    var that = this;

    if (this.showStatic) {
      if(this.$fixedElement.is(':hidden')){
        this.$fixedElement.stop().slideDown(this.options.duration);
      }
    }
    else {
      if(this.$fixedElement.is(':visible') && !this.isHiding){
        this.isHiding = true;
        this.$fixedElement.stop().slideUp(this.options.duration, function() {
          that.isHiding = false;
        });
      }
    }
  }

  Promotion.prototype.getDefaults = function () {
    return Promotion.DEFAULTS;
  }

  Promotion.prototype.getOptions = function (options) {
    var dataOptions = this.$element.data();

    return $.extend({}, this.getDefaults(), dataOptions, options);
  }


  // PROMOTION PLUGIN DEFINITION
  // ==========================

  var old = $.fn.promotion;

  $.fn.promotion = function (option) {
    return this.each(function () {
      var $this     = $(this)
      var data      = $this.data('ne.promotion')
      var options   = typeof option == 'object' && option

      if (!data) $this.data('ne.promotion', (data = new Promotion(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.promotion.Constructor = Promotion;


  // PROMOTION NO CONFLICT
  // ====================

  $.fn.promotion.noConflict = function () {
    $.fn.promotion = old
    return this
  }

  // PROMOTION AUTO INIT
  // =====================

  $(document).on('ready', function () {
    var $el = $('#promotion');
    $el.promotion($el.data());
  });

}(jQuery, document, window);

/**
 * Scrollup
 * Component that adds "scroll to top" functinality.
 */

var NE = NE || {};

$.extend(true, NE, {
  scrollup: {
    init: function() {
      $(function () {
        $.scrollUp({
          topDistance: '600', // Distance from top before showing element (px)
          topSpeed: 300, // Speed back to top (ms)
          animation: 'fade', // Fade, slide, none
          animationInSpeed: 200, // Animation in speed (ms)
          animationOutSpeed: 200, // Animation out speed (ms)
          scrollText: '' // Text for element
        });
      });
    }
  }
});


// Avoid 'console' errors in browsers that lack a console
if (!(window.console && console.log)) {
  (function() {

    var noop = function() {};
    var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
    var length = methods.length;
    var console = window.console = {};

    while (length--) {
        console[methods[length]] = noop;
    }

  }());
}


// Add support for [array].indexOf() in IE<9
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/) {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++) {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}


// DOM Based Router
// Attach classes and ids to <body> to run functions in the NE object literal
//
// EXAMPLE:
// <body id="search" class="upp">
//
// this will run, in order:
//   NE.common.init
//   NE.upp.init
//   NE.upp.search
//   NE.common.finalize

ROUTER = {

  // Fire functions
  fire : function(func, funcname, args){

    var namespace = NE;

    funcname = (funcname === undefined) ? 'init' : funcname;
    if (func !== '' && namespace[func] && typeof namespace[func][funcname] == 'function'){
      namespace[func][funcname](args);
    }

  },

  // Load events based on body id and classes
  loadEvents : function(){

    var bodyId = document.body.id;

    // hit up common first.
    ROUTER.fire('common');

    // do all the classes too.
    $.each(document.body.className.split(/\s+/), function(i, classnm){
      ROUTER.fire(classnm);
      ROUTER.fire(classnm, bodyId);
    });

    ROUTER.fire('common','finalize');

  }

};
$(document).ready( ROUTER.loadEvents );


// Create NE object literal
// Used as a namespace for functions
NE = NE || {};

// Extend NE with configuration options
$.extend(true, NE, {
  config: {
    lineHeightComputed:   23,
    gridGutterWidth:      54,
    gridBleedWidth:       104
  }
});

// Extend NE with common functions
$.extend(true, NE, {

  common: {

    init: function() { },

    finalize: function() { }

  }

});
