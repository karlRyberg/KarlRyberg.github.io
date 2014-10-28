/// <reference path="NE.Navigation.js" />
/// <reference path="NE.Events.js" />
/// <reference path="NE.EventHandlers.js" />
/// <reference path="NE.Constants.js" />


$(window).load(function () {

    $(window).on('resize', function () {
        NE.UI.ResizeScrollContainer();
    });

    new FastClick(document.body);

    NE.Events.Add(NE.Navigation.ON_NAVIGATION, NE.EventHandlers.Navigation);

    $('#NE-nav-back').on('click', function () {
        NE.Navigation.Previous();
    });

    $('#NE-nav-forward').on('click', function () {
        NE.Navigation.Next();
    });

    $('#NE-expand-chapter-menu-btn').on('click', function () {
        var menuPanel = $('#' + NE.Constants.FLOATING_HEADER_ID),
            heightIncrease = $('#NE-chapter-menu').outerHeight();

        if (menuPanel.hasClass('open')) {
            heightIncrease *= -1;

        }
        menuPanel.animate({ 'height': '+=' + heightIncrease + 'px' });
        menuPanel.toggleClass('open');
    });

    $('.NE-btn-slider-next').on('click', function () {
        var slider = $(this).parents('.NE-slider').first();
        var pageHolder = slider.find('.NE-panel-page-holder').first();

        if (pageHolder.outerWidth() + pageHolder.position().left <= slider.innerWidth()) {
            pageHolder.animate({ 'left': '-=30px' }, 100, 'swing', function () {
                pageHolder.animate({ 'left': '+=30px' }, 200);
            });
            return;
        }


        pageHolder.animate({ 'left': '-=' + slider.innerWidth() + 'px' });

    });

    $('.NE-btn-slider-back').on('click', function () {
        var slider = $(this).parents('.NE-slider').first();
        var pageHolder = slider.find('.NE-panel-page-holder').first();

        if (pageHolder.position().left >= 0) {
            pageHolder.animate({ 'left': '+=30px' }, 100, 'swing', function () {
                pageHolder.animate({ 'left': '-=30px' }, 200);
            });
            return;
        }


        pageHolder.animate({ 'left': '+=' + slider.innerWidth() + 'px' });

    });


    $('.NE-revealer-button').click(function (e) {

        var id = $(this).parent().data('reveal');
        var area = $('#' + id);
        var that = $(this);
        var chapter = $(this).parents('.NE-chapter').first();
        var row = $(this).parents('.NE-drilldown-row').first();

        if ($(this).hasClass('open')) {
            $(this).addClass('active');
            setTimeout(function () {
                area.slideUp(500, function () {
                    area.addClass('hidden');
                    NE.Scroll.ToElementY(that, 'middle', function () {
                        that.removeClass('active').removeClass('open');
                        setTimeout(function () {
                            NE.UI.ApplyVerticalScrollbar(chapter);
                        }, 300);
                    });
                });
                row.removeClass('open');
            }, 100);
        }
        else {
            $(this).addClass('active');
            setTimeout(function () {
                area.removeClass('hidden').slideUp(0).slideDown(500, function () {
                    NE.Scroll.ToElementY(area, 'top', function () {
                        that.removeClass('active').addClass('open');
                        NE.UI.ApplyVerticalScrollbar(chapter);
                    });
                });
                row.addClass('open');
            }, 100);
        }

        e.preventDefault();
        return false;

    });


});


