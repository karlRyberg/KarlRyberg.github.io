/// <reference path="../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="NE.Navigation.js" />
/// <reference path="NE.Events.js" />
/// <reference path="NE.EventHandlers.js" />
/// <reference path="NE.Constants.js" />
/// <reference path="NE.UI.js" />

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

    $('#NE-chapter-label').on('click', function () {
        var chapterMenuDiv = $('#NE-chapter-menu');
        var menuHeight = 0;
        if (!chapterMenuDiv.hasClass('open')) {
            chapterMenuDiv.find('li').each(function () {
                menuHeight += $(this).outerHeight();
            });
        }
        $(this).parent().toggleClass('active');
        chapterMenuDiv.css('height', menuHeight + 'px').toggleClass('open');
    });

    $('.NE-chapter-navigation-link').on('click', function () {

        var clickedItem = $(this);
        if (clickedItem.hasClass('disable')) return;

        var chapterIndex = parseInt(clickedItem.data('chapter'), 10);
        NE.Navigation.ToChapter(chapterIndex);

        if (clickedItem.hasClass('NE-chapter-menu-link-xs')) {
            $('#NE-chapter-label-xs').click();
        }
        else if (clickedItem.hasClass('NE-chapter-menu-link')) {
            $('#NE-chapter-label').click();
        }

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

    NE.UI.ResizeScrollContainer();

});


