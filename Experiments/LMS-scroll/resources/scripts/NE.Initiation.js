/// <reference path="NE.Plugin.js" />
/// <reference path="../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="NE.Navigation.js" />
/// <reference path="NE.Events.js" />
/// <reference path="NE.EventHandlers.js" />
/// <reference path="NE.Constants.js" />
/// <reference path="NE.UI.js" />
/// <reference path="../../content/structure/courseTree.js" />

$(window).load(function () {



    $('.NE-plugin-container').each(function () {
        NE.Plugin.Load({
            name: $(this).data('plugin'),
            node: $(this),
            settings: {}
        });
    });


    for (var i = 0; i < NE.CourseTree.chapters.length; i++) {
        NE.Plugin.Load({
            name: 'chapter',
            node: $('<div></div>').appendTo('#' + NE.Constants.SCROLL_CONTAINER_ID),
            settings: {
                index: i,
                chapter: NE.CourseTree.chapters[i]
            }
        });
    }

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



    $(document).on('keyup', NE.EventHandlers.KeyUp);



    $('#NE-scroller').on('blur', '.NE-page', function (e) {
        $(this).click();
    });

    $('#NE-scroller').on('click', '.NE-revealer-button', function (e) {

        var id = $(this).data('reveal');
        var area = $('#' + id);
        var that = $(this);

        if (!that.hasClass('open')) {

            that.addClass('active');
            area.removeClass('hidden').slideUp(0).slideDown(500, function () {
                NE.Scroll.ToElementY(area, 'top');
                NE.UI.ApplyVerticalScrollbar();
                that.removeClass('active').addClass('open');
            });

        }
        else {

            that.addClass('active');
            area.removeClass('hidden').slideUp(500, function () {
                NE.Scroll.ToElementY(that, 'top');
                NE.UI.ApplyVerticalScrollbar();
                that.removeClass('active').removeClass('open');
            });

        }

        e.preventDefault();
        return false;

    });



});


