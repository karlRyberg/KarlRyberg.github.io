/// <reference path="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js" />

(function ($) {

    $.fn.ScrollWatch = function (options) {

        var defaults = {
            axis: 'xy',
            prioritize: 'max',
            swWindow: window,
            swDocument: document
        };

        var _positions = {};

        var settings = $.extend({}, defaults, options);

        var _watchItems,
            _viewport,
            _id = 0;

        function _calcViewport(i_scrollSender) {
            var t = $(settings.swDocument).scrollTop() + $(settings.swWindow).offset().top;
            var l = $(settings.swDocument).scrollLeft() + $(settings.swWindow).offset().left;
            var viewPort = {
                top: t,
                left: l,
                bottom: t + $(settings.swWindow).innerHeight(),
                right: l + $(settings.swWindow).innerWidth()
            };
            return viewPort;
        }

        function _calcItemRect(item) {
            var itemOffset = item.offset();
            return {
                top: itemOffset.top,
                left: itemOffset.left,
                bottom: itemOffset.top + item.outerHeight(),
                right: itemOffset.left + item.outerWidth()
            };
        }

        function _visibleArea(rect) {
            var x = rect.right - rect.left;
            var y = rect.bottom - rect.top;
            return x * y;
        }

        function _calcOverlap(min1, min2, max1, max2) {
            var overlap = Math.min(min1, min2) - Math.max(max1, max2);
            return Math.max(overlap, 0);
        }

        function _calcPercentage(axis, vOverlap, hOverlap, rect) {

            var p;

            if (axis.toLowerCase() === 'x') {
                p = hOverlap / (rect.right - rect.left);
            }
            else if (axis.toLowerCase() === 'y') {
                p = vOverlap / (rect.bottom - rect.top);
            }
            else {
                var sqr = Math.max(vOverlap * hOverlap, 0);
                p = sqr / _visibleArea(rect);
            }

            return Math.max(p, 0);

        }

        function _composeScrollObject(item) {

            var itemRect = _calcItemRect(item);

            var verticalOverlap = _calcOverlap(itemRect.bottom, _viewport.bottom, itemRect.top, _viewport.top);
            var horizontalOverlap = _calcOverlap(itemRect.right, _viewport.right, itemRect.left, _viewport.left);

            var ofMe = _calcPercentage(settings.axis, verticalOverlap, horizontalOverlap, itemRect);
            var ofViewport = _calcPercentage(settings.axis, verticalOverlap, horizontalOverlap, _viewport);

            var visibility = Math.max(ofMe, ofViewport);
            if (settings.prioritize.toLowerCase() === 'partofobject') {
                visibility = ofMe;
            }
            else if (settings.prioritize.toLowerCase() === 'partofviewport') {
                visibility = ofViewport;
            }

            return {
                partOfObject: ofMe,
                partOfViewport: ofViewport,
                visibility: visibility,
                visibleV: verticalOverlap,
                visibleH: horizontalOverlap
            };
        }

        function _checkVisibilityChange(item, visibility) {

            var itemID = item.attr('data-sw-id');
            var lastPos = _positions[itemID] || 0;
            var status = 0;

            if (lastPos <= 0 && visibility > 0) {
                status = 1;
            }
            else if (lastPos >= 0 && visibility <= 0) {
                status = -1;
            }

            _positions[itemID] = visibility;
            return status;
        }

        function _loopItems(i_scrollSender) {

            if (!_watchItems) return;

            _viewport = _calcViewport(i_scrollSender);

            _watchItems.each(function (i) {

                var item = $(this);
                var scrollObject = _composeScrollObject(item);

                var newStatus = _checkVisibilityChange(item, scrollObject.visibility);

                if (newStatus === 1) {
                    item.trigger('sw-apear', scrollObject);
                }
                else if (newStatus === -1) {
                    item.trigger('sw-disapear', scrollObject);
                }

                item.trigger('sw-scrolled', scrollObject);

            });

        };

        $(settings.swDocument).on('scroll resize', function (e) {
            _loopItems($(this));
        });

        return this.each(function () {
            var newItem = $(this).attr('data-sw-id', _id++);
            _watchItems = _watchItems ? _watchItems.add(newItem) : newItem;
            _loopItems($(this));
        });

    };
})(jQuery);