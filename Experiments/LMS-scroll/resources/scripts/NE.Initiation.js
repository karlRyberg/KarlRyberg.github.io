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
        }).Init();
    });

    var _chaptersLoaded = 0;
    for (var i = 0; i < NE.CourseTree.chapters.length; i++) {
        var chapter = NE.Plugin.Load({
            name: 'chapter',
            node: $('<div></div>').appendTo('#' + NE.Constants.SCROLL_CONTAINER_ID),
            settings: {
                index: i,
                chapter: NE.CourseTree.chapters[i]
            }
        });
        chapter.OnLoaded = function (e) {

            if (e.index == NE.Navigation.CurrentChapterIndex) {
                NE.Navigation.ToPage(0);
            }
            _chaptersLoaded++;

            if (_chaptersLoaded >= NE.CourseTree.chapters.length) {
                NE.EventHandlers.ChaptersLoaded();
            }

        }
        chapter.Init();
    }

    NE.UI.Setup();

    $(window).on('resize', function () {
        NE.EventHandlers.WindowResize();
    });


    FastClick.attach(document.body);


    NE.Events.Add(NE.Navigation.ON_NAVIGATION, NE.EventHandlers.Navigation);

    $('body').on('click', '.NE-nav-back', function () {
        if ($(this).hasClass('disable')) return;
        NE.EventHandlers.NavBackBtnClick($(this));
    });

    $('body').on('click', '.NE-nav-forward', function () {
        if ($(this).hasClass('disable')) return;
        NE.EventHandlers.NavForwardBtnClick($(this));
    });

    $('#NE-chapter-label').on('click', function () {
        NE.EventHandlers.ChapterLabelClick($(this));
    });

    $('#NE-scroller').on('click', '.NE-chapterlink', function (e) {
        NE.EventHandlers.ChapterLinkCLick($(this), e);
    });


    $(document).on('keyup', NE.EventHandlers.KeyUp);




});
