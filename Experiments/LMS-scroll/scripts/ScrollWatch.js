/// <reference path="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js" />

(function ($) {

    $.fn.ScrollWatch = function (options) {

        var defaults = {
            axis: 'xy',
            prioritize: 'max',
            mainListener: $(window)
        };

        var _positions = {};

        var settings = $.extend({}, defaults, options);

        var _watchItems,
            _viewport,
            _id = 0;

        function _calcViewport() {
            return {
                top: $(document).scrollTop(),
                left: $(document).scrollLeft(),
                bottom: $(document).scrollTop() + $(window).innerHeight(),
                right: $(document).scrollLeft() + $(window).innerWidth()
            };
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

            if (item.css('display') === 'none' || item.css('visibility') === 'hidden') visibility = 0;

            return {
                partOfObject: ofMe,
                partOfViewport: ofViewport,
                visibility: visibility,
                visibleV: verticalOverlap,
                visibleH: horizontalOverlap,
                itemArea: itemRect,
                viewportArea: _viewport
            };
        }

        function _checkVisibilityChange(item, visibility) {

            var itemID = item.data('NE-scroll-id');
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

        function _loopItems() {

            if (!_watchItems) return;

            _viewport = _calcViewport();

            settings.mainListener.triggerHandler('sw-begin-scroll');

            _watchItems.each(function (i) {

                var item = $(this);
                var scrollObject = _composeScrollObject(item);

                var newStatus = _checkVisibilityChange(item, scrollObject.visibility);

                if (newStatus === 1) {
                    item.triggerHandler('sw-apear', scrollObject);
                }
                else if (newStatus === -1) {
                    item.triggerHandler('sw-disapear', scrollObject);
                }

                item.triggerHandler('sw-scrolled', scrollObject);

            });

            settings.mainListener.triggerHandler('sw-end-scroll');
        };

        $(window).on('scroll scrollstop resize', function (e) {
            _loopItems();
        });
        var that = this;
        return{
            init: (function () {
                that.each(function () {
                    var newItem = $(this).data('NE-scroll-id', _id++);
                    _watchItems = _watchItems ? _watchItems.add(newItem) : newItem;
                    _loopItems();
                });
            })(),
            Update: function () {
                _loopItems();
            }
    }
    };
})(jQuery);