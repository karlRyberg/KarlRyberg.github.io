/// <reference path="../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="NE.Navigation.js" />
/// <reference path="NE.Events.js" />
/// <reference path="NE.EventHandlers.js" />
/// <reference path="NE.Constants.js" />
/// <reference path="NE.UI.js" />

$(window).load(function () {

    NE.UI.Setup();

    $(window).on('resize', function () {
        NE.EventHandlers.WindowResize();
    });

    new FastClick(document.body);

    NE.Events.Add(NE.Navigation.ON_NAVIGATION, NE.EventHandlers.Navigation);

    $('#NE-nav-back').on('click', function () {
        NE.EventHandlers.NavBackBtnClick($(this));
    });

    $('#NE-nav-forward').on('click', function () {
        NE.EventHandlers.NavForwardBtnClick($(this));
    });

    $('#NE-chapter-label').on('click', function () {
        NE.EventHandlers.ChapterLabelClick($(this));
    });

    $('#NE-chapter-label-xs').on('click', function () {
        NE.EventHandlers.ChapterLabelXsClick($(this));
    });

    $('.NE-chapter-navigation-link, .NE-chapter-navigation-link-xs').on('click', function () {
        NE.EventHandlers.ChapterLinkClick($(this));
    });

    $('.NE-Compenent-Content-Nav-Next-btn').on('click', function () {
        NE.EventHandlers.NavForwardBtnClick($(this));
    });

    $('#NE-overlay').on('click', function () {
        NE.EventHandlers.OverlayClick($(this));
    });

    $('.NE-revealer-button').click(function (e) {

        var id = $(this).data('reveal');
        var area = $('#' + id);
        var that = $(this);
        var chapter = $(this).parents('.NE-chapter').first();
        var row = $(this).parents('.row').first();


        that.addClass('active');
 

            area.removeClass('hidden').slideUp(0).slideDown(500, function () {
                NE.Scroll.ToElementY(area, 'top', function () {
                    NE.UI.ApplyVerticalScrollbar(chapter);
                });
            });

            setTimeout(function () {
            row.hide(0);
        }, 300);




        e.preventDefault();
        return false;

    });



});


