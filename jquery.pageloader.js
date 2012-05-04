/*

jquery.pageloader
@author Ken Kubiak <kenk@glam.com>

Dynamically load content pages with ajax and transition between them:

$('#page-container').pageloader( [method, ] [{ options }] );

Copyright 2012 Glam Media, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

(function ($) {

    var dataKey = 'pageloader_object';

    var methods = {

        init:function (options) {
            return this.each(function () {
                $(this).data(dataKey, new PageLoader(this, options));
            });
        },


        // TODO: rather than writing all these out, should handle generically in dispatch

        configure:function (options) {
            return this.each(function () {
                var $loader = $(this).data(dataKey);
                $loader.configure(options);
            });
        },

        load:function (endpoint) {
            return this.each(function () {
                var $loader = $(this).data(dataKey);
                $loader.load(endpoint);
            });
        },

        post:function (endpoint, data) {
            return this.each(function () {
                var $loader = $(this).data(dataKey);
                $loader.post(endpoint, data);
            });
        },

        forward:function () {
            return this.each(function () {
                var $loader = $(this).data(dataKey);
                $loader.forward();
            });
        },

        backward:function () {
            return this.each(function () {
                var $loader = $(this).data(dataKey);
                $loader.forward();
            });
        },

        goto:function (endpoint) {
            return this.each(function () {
                var $loader = $(this).data(dataKey);
                $loader.goto(endpoint);
            });
        },

        fetch:function (endpoint, options) {
            return this.each(function () {
                var $loader = $(this).data(dataKey);
                $loader.fetch(endpoint, options);
            });
        }

    };

    var transitions = {

        // TODO: plug-in interface for transitions 

        fade:{
            start:function ($from, $to, dir) {
                $to.css('opacity', 0).show();
            },
            drag:function ($from, $to, fraction) {
                $from.css('opacity', 1 - Math.abs(fraction));
                $to.css('opacity', Math.abs(fraction));
            },
            end:function ($from, $to, dir, callback) {
                var dur = this.settings.duration;
                $from.animateWithCss({ opacity:0 }, dur, 'ease-in-out');
                $to.animateWithCss({ opacity:1 }, dur, 'ease-in-out', callback);
            },
            rollback:function ($from, $to, dir, callback) {
                var dur = this.settings.duration;
                $from.animateWithCss({ opacity:1 }, dur, 'ease-in-out');
                $to.animateWithCss({ opacity:0 }, dur, 'ease-in-out', callback);
            }
        },

        slide:{
            // slide pages side-by-side
            start:function ($from, $to, dir) {
                $to.css('left', Math.floor(dir * this.pageWidth) + "px").show();
            },
            drag:function ($from, $to, fraction) {
                this.$container.css(this.prefix.transform,
                    'translateX(' + Math.floor(-fraction * this.pageWidth) + 'px)');
            },
            end:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] =
                    'translateX(' + Math.floor(-dir * this.pageWidth) + 'px)';
                this.$container.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            },
            rollback:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] = 'translateX(0)';
                this.$container.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            }
        },

        reveal:{
            // slide top page out of the way, revealing next page (stationary) underneath
            start:function ($from, $to, dir) {
                $from.css(this.prefix.transform, 'translateZ(1px)').css('z-index', 1);
                $to.show();
            },
            drag:function ($from, $to, fraction) {
                $from.css(this.prefix.transform,
                    'translateX(' + Math.floor(-fraction * this.pageWidth) + 'px)');
            },
            end:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] =
                    'translateX(' + Math.floor(-dir * this.pageWidth) + 'px)';
                $from.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            },
            rollback:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] = 'translateX(0)';
                $from.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            }
        },

        squish:{
            // scale the top page horizontally, revealing next page (stationary) underneath
            start:function ($from, $to, dir) {
                $from.css(this.prefix.transform, 'translateZ(1px)').css('z-index', 1);
                $to.show();
            },
            drag:function ($from, $to, fraction) {
                $from.css(this.prefix.transform,
                    'translateX(' + Math.floor(-fraction * this.pageWidth / 2) + 'px)' +
                        'scaleX(' + (1 - Math.abs(fraction)) + ')');
            },
            end:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] =
                    'translateX(' + Math.floor(-dir * this.pageWidth / 2) + 'px) scaleX(0)';
                $from.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            },
            rollback:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] = 'translateX(0) scaleX(1)';
                $from.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            }
        },

        flip:{
            // spin the top page toward us, revealing next page (stationary) underneath
            start:function ($from, $to, dir) {
                $from.css('z-index', 1).css(this.prefix.transformOrigin,
                    (dir > 0 ? 'left' : 'right') + ' center 0');
                $to.show();
            },
            drag:function ($from, $to, fraction) {
                $from.css(this.prefix.transform, 'rotateY(' + -90 * fraction + 'deg)');
            },
            end:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] = 'rotateY(' + -90 * dir + 'deg)';
                $from.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            },
            rollback:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] = 'rotateY(0)';
                $from.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            }
        },

        spin:{
            // spin the page about its center axis, show next page on back side
            start:function ($from, $to, dir) {
                $from.css(this.prefix.transform, 'translateZ(1px)'); // for iPad
                $to.css(this.prefix.transform, 'rotateY(180deg)').show();
            },
            drag:function ($from, $to, fraction) {
                this.$container.css(this.prefix.transform, 'rotateY(' + -180 * fraction + 'deg)');
            },
            end:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] = 'rotateY(' + -180 * dir + 'deg)';
                this.$container.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            },
            rollback:function ($from, $to, dir, callback) {
                var props = {};
                props[ this.prefix.transform ] = 'rotateY(0deg)';
                this.$container.animateWithCss(props, this.settings.duration, 'ease-in-out', callback);
            }
        },

        slidePosition:{
            // slide transition implemented using CSS2 positioning, instead of transforms
            start:function ($from, $to, dir) {
                $to.css({ left:(100 * dir) + "%" }).show();
            },
            drag:function ($from, $to, fraction) {
                this.$container.css({ left:(-100 * fraction) + "%" });
            },
            end:function ($from, $to, dir, callback) {
                this.$container.animateWithCss(
                    { left:(-dir * 100) + "%" },
                    this.settings.duration, 'ease-in-out', callback);
            },
            rollback:function ($from, $to, dir, callback) {
                this.$container.animateWithCss(
                    { left:0 },
                    this.settings.duration, 'ease-in-out', callback);
            }
        },

        none:{}

    };

    var PageLoader = function (viewer, options) {

        this.$viewer = $(viewer);
        this.$container = this.$viewer.children().first();
        this.pageWidth = this.$viewer.width();

        this.settings = {
            urlPrefix:"",
            urlSuffix:"",
            idPrefix:"pageloaded-",
            transition:"none",
            duration:300,
            swipeMinOffset:5,
            swipeMaxSlope:0.2,
            enableSwiping: true,
            enableMouseSwiping:true
        };

        this.configure(options);

        this.initSupport();
        this.initPages();

        if( this.settings.enableSwiping ) {
            this.initSwipeEvents();
        }

        this.initHistoryEvents();
    };

    $.extend( PageLoader.prototype, {

        configure: function (options) {
            if (options) {
                $.extend(this.settings, options);
            }
        },

        initSupport: function () {

            // infrastructure for browser/device suppport

            this.modes = {
                mouse:{ start:"mousedown", move:"mousemove", end:"mouseup" },
                touch:{ start:"touchstart", move:"touchmove", end:"touchend" }
            };

            this.hasTouch = (function () {
                try {
                    document.createEvent("TouchEvent");
                    return true;
                } catch (e) {
                    return false;
                }
            }());

            this.startEvents = [];

            if (this.settings.enableMouseSwiping) {
                this.startEvents.push(this.modes.mouse.start);
            }

            if (this.hasTouch) {
                this.startEvents.push(this.modes.touch.start);
            }

            var prefix = {};

            var test = $("<div></div>")[0];

            var prefixes = {
                // CamelCase required for feature detection (below), tolerated by $.css
                transform:[ 'transform', 'MozTransform', 'WebkitTransform' ],
                transformOrigin:[ 'transformOrigin', 'MozTransformOrigin', 'WebkitTransformOrigin' ]
            };

            $.each(prefixes, function (std, vendors) {
                var i;
                for (i = 0; i < vendors.length; i++) {
                    if (typeof test.style[vendors[i]] !== 'undefined') {
                        prefix[std] = vendors[i];
                        break;
                    }
                    prefix[std] = std; // probably better than not defining it
                }
            });

            this.prefix = prefix;

        },

        initPages: function () {

            // initialize preloaded pages

            var $pages = this.$container.children();

            if ($pages.length) {
                var $first = $pages.first();
                $first.addClass('_current');
                this.prefetch($first.data('next-page'));
                this.prefetch($first.data('prev-page'));
            }

        },

        initSwipeEvents: function () {

            if (this.startEvents.length) {

                var my = this;

                my.$container.on(my.startEvents.join(' '), function (startEvent) {
                    var startPos = my.coordinates(startEvent);
                    var $from = my.$container.find("._current");
                    var started = false;
                    var mode = my.modes[startEvent.type.substr(0, 5)];
                    var $to;
                    var direction = 0; // 1=forward, -1=backward

                    my.prefetch($from.data('next-page'));
                    my.prefetch($from.data('prev-page'));

                    $(document).on(mode.move, function (moveEvent) {
                        var movePos = my.coordinates(moveEvent);
                        var xOffset = startPos.x - movePos.x;
                        var yOffset = startPos.y - movePos.y;
                        var reversing = started && ( xOffset * direction < 0 );
                        var starting = !started && Math.abs(xOffset) >= my.settings.swipeMinOffset
                            && Math.abs(yOffset / xOffset) <= my.settings.swipeMaxSlope;
                        direction = (xOffset >= 0) ? 1 : -1;
                        moveEvent.preventDefault();

                        if (reversing) {
                            my.transition_reverse($from, $to, -direction);
                        }

                        if (reversing || starting) {
                            if (direction > 0) {
                                $to = my.lookup($from.data('next-page'));
                            } else {
                                $to = my.lookup($from.data('prev-page'));
                            }
                            started = true;
                            my.transition_start($from, $to, direction);
                        }

                        if (started) {
                            var fraction = xOffset / my.pageWidth;
                            // turn just one page at a time
                            fraction = Math.min(fraction, 1.0);
                            fraction = Math.max(fraction, -1.0);
                            my.transition_drag($from, $to, fraction);
                        }

                    });

                    $(document).one(mode.end, function (endEvent) {
                        $(document).off(mode.move);
                        if (started) {
                            if ($to.length) {
                                my.transition_end($from, $to, direction);
                            } else {
                                my.transition_rollback($from, $to, direction);
                            }
                        }
                    });

                });
            }

        },

        initHistoryEvents: function () {
            var my = this;
            $(window).on('popstate', function (event) {
                var state = event.originalEvent.state;
                if( typeof state === 'object' && state !== null ) {
                    var $existing = my.lookup(state.hash);
                    my.transition_to( $existing, -state.dir, false, true );
                }
            });
        },

        current: function () {
            return this.$viewer.find("._current");
        },

        lookup: function (hash) {
            var target = this.settings.idPrefix + hash;
            var $existing = this.$container.find('#' + target);
            return $existing;
        },

        coordinates: function (e) {
            // touch devices
            if (this.hasTouch && 
                typeof e.originalEvent.touches !== 'undefined') {
                e = e.originalEvent.touches[0];
            }
            // after http://www.quirksmode.org/js/events_properties.html#position
            var pos = {};
            if (e.pageX || e.pageY) {
                pos = { x:e.pageX, y:e.pageY };
            } else if (e.clientX || e.clientY) {
                pos = {
                    x:e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
                    y:e.clientY + document.body.scrollTop + document.documentElement.scrollTop
                };
            }
            return pos;
        },

        // fetch - just fetch the page into the DOM

        fetch: function (path, options, callback) {
            if( typeof callback === 'undefined' ) {
                callback = options;
                options = {};
            }
            var my = this;
            var $collector = $("<div></div>");
            var $placeholder = $("<div></div>").
                addClass("_loading").
                attr('id', my.settings.idPrefix + path).
                appendTo(my.$container);
            var endpoint = my.settings.urlPrefix + path + my.settings.urlSuffix;
            var settings = {
                dataType:'html',
                error:function (response, status, xhr) {
                    $placeholder.addClass("_error").removeClass("_loading");
                    $placeholder.html(response);
                },
                success:function (response, status, xhr) {
                    $collector.html(response);
                    var $newPages = $collector.children();
                    var $requested = $newPages.first();
                    $.each(['next-page', 'prev-page', 'title'],
                           function (index, value) {
                               $placeholder.data(value, $requested.data(value));
                           });
                    $placeholder.addClass($requested.attr('class'));
                    $placeholder.append($requested.children()).removeClass("_loading");
                    $placeholder.trigger('pageloader.ready');
                    // additional pages may have come down in the payload
                    $newPages = $newPages.slice(1);
                    $newPages.appendTo(my.$container);
                    $newPages.each(function () {
                        $(this).trigger('pageloader.ready');
                    });
                    if( callback ) {
                        callback($placeholder);
                    }
                }
            };
            $.ajax( endpoint, $.extend( settings, options ) );
            return $placeholder;
        },

        prefetch: function (path) {
            var $result = $();
            if (typeof path !== 'undefined') {
                $result = this.lookup(path);
                if (!$result.length) {
                    $result = this.fetch(path);
                }
            }
            return $result;
        },

        // load - fetch the page and transition to it

        load: function (endpoint, callback) {
            var my = this;
            my.fetch(endpoint, function ($new) {
                my.transition_to($new, callback);
            });
        },

        // post - issue a post request and transition to the resulting page

        post: function (endpoint, data, callback) {
            var my = this;
            var options = {
                type:'POST',
                data:data
            };
            my.fetch(endpoint, options, function ($new) {
                my.transition_to($new, callback);
            });
        },

        // goto - if the page exists, transition to it; otherwise, load it

        goto: function (endpoint, callback) {
            callback = callback || function () {
            };

            var pat = /[^\/]+$/;
            var path = endpoint.match(pat);
            var $existing = this.lookup(path);

            if ($existing.length) {
                this.transition_to($existing, callback);
            } else {
                this.load(endpoint, callback);
            }
        },

        forward: function (callback) {
            var path = this.current().data('next-page');
            this.transition_to(this.lookup(path), callback);
        },

        backward: function (callback) {
            var path = this.current().data('prev-page');
            this.transition_to(this.lookup(path), -1, callback);
        },

        transition_start: function ($from, $to, dir) {
            var transition = transitions[this.settings.transition].start;

            if (transition) {
                transition.apply(this, [ $from, $to, dir ]);
            }

        },

        transition_drag: function ($from, $to, fraction) {
            var transition = transitions[this.settings.transition].drag;

            if (transition) {
                transition.apply(this, [ $from, $to, fraction ]);
            }
        },

        transition_end: function ($from, $to, dir, callback, pop) {
            var my = this;
            callback = callback || function () {};
            pop = pop || false;

            var cleanup = function () {
                var oldHash = $from.attr('id') ? $from.attr('id').substr( my.settings.idPrefix.length ) : false;
                var hash = $to.attr('id').substr( my.settings.idPrefix.length );
                var path = my.settings.urlPrefix + hash
                // clear the styles, which is how the transitions operate
                // (if this is ever a problem, we could save/restore the styles )
                $from.removeClass("_current").removeAttr('style');
                $to.addClass("_current").removeAttr('style');
                my.$container.removeAttr('style');
                if( !pop ) {
                    if( oldHash ) {
                        window.history.replaceState({ hash: oldHash, dir: dir },
                                                    $from.data('title') );
                    }
                    window.history.pushState({ hash: hash, dir: 0 },
                                             $to.data('title'), path);
                }
                callback();
                my.prefetch($to.data('next-page'));
                my.prefetch($to.data('prev-page'));
            };

            var transition = transitions[this.settings.transition].end;

            if (transition) {
                transition.apply(this, [ $from, $to, dir, cleanup ]);
            } else {
                cleanup();
            }

        },

        transition_rollback: function ($from, $to, dir, callback) {
            var my = this;

            callback = callback || function () {
            };

            var cleanup = function () {
                $from.removeAttr('style');
                $to.removeAttr('style');
                my.$container.removeAttr('style');
                callback();
            };

            var transition = transitions[this.settings.transition].rollback;

            if (transition) {
                transition.apply(this, [ $from, $to, dir, cleanup ]);
            } else {
                cleanup();
            }

        },

        transition_reverse: function ($from, $to, dir, callback) {
            var my = this;
            callback = callback || function () {
            };

            var cleanup = function () {
                $to.removeAttr('style');
                callback();
            };

            var transition = transitions[this.settings.transition].reverse;

            if (transition) {
                transition.apply(this, [ $from, $to, dir, cleanup ]);
            } else {
                cleanup();
            }

        },

        transition_to: function ($to, dir, callback, pop) {
            if (typeof callback === 'undefined') {
                if (typeof dir === 'function') {
                    callback = dir;
                    dir = 1;
                }
            }
            dir = dir || 1;
            pop = pop || false;

            var $from = this.current();
            this.transition_start($from, $to, dir);
            this.transition_end($from, $to, dir, callback, pop);
        }

    });

    $.fn.pageloader = function (method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('"' + method + '"" is not a method of pageloader');
        }

    };

}(jQuery));