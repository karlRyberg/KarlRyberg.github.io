﻿/// <reference path="NE.Plugin.js" />
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


                $('.NE-page').on('sw-scrolled', function (e, scrollObj) {
                    if (!NE.UI.AcceptScrollEvent) return;
                    if (scrollObj.visibility > 0.95 && $(this).attr('id') != NE.Navigation.CurrentPageDiv().attr('id')) {

                        NE.Navigation.CurrentChapterIndex = parseInt($(this).data('chapter'), 10);
                        NE.Navigation.CurrentPageIndex = parseInt($(this).data('index'), 10);

                        NE.UI.SetNavigationButtons();
                    }

                });;

                $('.NE-page').ScrollWatch({
                    axis: 'y',
                    prioritize: 'max',//'partofviewport'//'partofobject'
                    swWindow: '#' + NE.Constants.SCROLL_CONTAINER_ID,
                    swDocument: '.NE-chapter'
                });

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
