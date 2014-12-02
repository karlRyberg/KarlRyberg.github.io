/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />
/// <reference path="../../NE.Navigation.js" />

/////////////////////////////////////////////////////////////////////
//
//  TYPE: 
//  NAME: 
//  NAMESPACE: 
//  
//  SUMMARY
//      
//  
//  PUBLIC FIELDS  
//      
//
//  PUBLIC FUNCTIONS
//      
//
//  DEPENDENCIES
//      
//
//////////////////////////////////////////////////////////////////////

// Ensure that the LOUISE namespace is avaiable
if (NE === null || NE === undefined) { var NE = {}; }
if (NE.Plugin === null || NE.Plugin === undefined) { NE.Plugin = {}; }

NE.Plugin.page = function (i_params) {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _params = i_params;
    var _settings = {};
    var _myDOMContent;
    var _numComponents = 0;
    var _componentsLoaded = 0;


    var _navTopTimer;
    var _navBottomTimer;
    var _exitTop;
    var _exitBottom
    var _beenOverscrolledTop = false;
    var _beenOverscrolledBottom = false;

    //////////////////////
    //
    //  Initiation
    //
    /////////////////////

    (function () {



    })();

    //////////////////////
    //
    //  Private functions 
    //
    /////////////////////

    function _addToDOM(i_content) {
        _params.node.replaceWith(i_content);
    }

    function _onCompnentsLoad(e) {

        _componentsLoaded++;

        if (_componentsLoaded == _numComponents) {
            _pageComplete();
        }

    }

    function _buildPage(i_html) {

        $('#' + NE.Constants.PAGE_ID_PREFIX + _settings.chapterIndex + '-' + _settings.index).html(i_html);
        _numComponents = $('.NE-plugin-container', _myDOMContent.first()).length;

        if (_numComponents > 0) {
            NE.Plugin.LoadAll(_myDOMContent.first(), _onCompnentsLoad);
        }
        else {
            _pageComplete();
        }
    }

    function _pageComplete() {

        _addScrollWatch();

        me.OnLoaded({
            chapter: _settings.chapterIndex,
            index: _settings.index,
            guid: _settings.guid,
        });
    }

    function _hideTopScrollNavHinter(i_obj) {
        i_obj.animate({
            'top': (-i_obj.outerHeight()) + 'px',
            'border-bottom-left-radius': '100%',
            'border-bottom-right-radius': '100%',
            'opacity': 0
        }, 200);
    }

    function _hideBottomScrollNavHinter(i_obj) {
        i_obj.animate({
            'bottom': (-i_obj.outerHeight()) + 'px',
            'border-top-left-radius': '100%',
            'border-top-right-radius': '100%',
            'opacity': 0
        }, 200);
    }


    function _scrollNavTop(i_pageDiv, i_hinter) {
        var newPos;

        if (
            _settings.chapterIndex != NE.Navigation.CurrentChapterIndex
            ||
            _settings.index != NE.Navigation.CurrentPageIndex
            ) return;

        clearTimeout(_exitTop);

        if (i_pageDiv.scrollTop() < 0) {
            _beenOverscrolledTop = true;
            newPos = Math.min(-i_hinter.outerHeight() - i_pageDiv.scrollTop(), 0);
            i_hinter.stop().css('top', newPos + 'px');

        }
        else if (i_pageDiv.scrollTop() === 0 && !_beenOverscrolledTop) {
            newPos = Math.min(i_hinter.position().top - (i_hinter.position().top * .50), 0);
            i_hinter.stop().css('top', newPos + 'px');
            i_pageDiv.scrollTop(1);

        }


        _exitTop = setTimeout(function () {
            _hideTopScrollNavHinter(i_hinter);
        }, 250);



        if (i_hinter.position().top > -40) {
            if (!_navTopTimer) {
                _navTopTimer = setTimeout(function () {
                    if (i_hinter.position().top > -30) {
                        _hideTopScrollNavHinter(i_hinter);
                        NE.Navigation.Previous();
                    }
                    _navTopTimer = null;
                }, 600);
            }
        }

        var rad = Math.max((-i_hinter.position().top), 10);
        i_hinter.css({
            'border-bottom-left-radius': rad + '%',
            'border-bottom-right-radius': rad + '%',
            'opacity': ((i_hinter.outerHeight() + i_hinter.position().top) / 100)
        });

    }


    function _scrollNavBottom(i_pageDiv, i_hinter) {

        if (_settings.chapterIndex != NE.Navigation.CurrentChapterIndex
            ||
            _settings.index != NE.Navigation.CurrentPageIndex
            ) return;

        var newPos;

        clearTimeout(_exitBottom);


        var overFlowHeight = i_pageDiv[0].scrollHeight - i_pageDiv.innerHeight();
        var bott = parseInt(i_hinter.css('bottom'), 10);
        var scrollBottomReset = overFlowHeight - 1;

        if (i_pageDiv.scrollTop() > overFlowHeight + 1) {
            _beenOverscrolledBottom = true;
            newPos = Math.min(-i_hinter.outerHeight() + (i_pageDiv.scrollTop() - overFlowHeight), 0);
            i_hinter.stop().css('bottom', newPos + 'px');
        }
        else if (i_pageDiv.scrollTop() >= overFlowHeight && !_beenOverscrolledBottom) {
            newPos = Math.min(bott - (bott * .50), 0);
            i_hinter.stop().css('bottom', newPos + 'px');
            i_pageDiv.scrollTop(scrollBottomReset);
        }

        _exitBottom = setTimeout(function () {
            _hideBottomScrollNavHinter(i_hinter);
        }, 250);


        if (bott > -40) {
            if (!_navBottomTimer) {
                _navBottomTimer = setTimeout(function () {
                    if (parseInt(i_hinter.css('bottom'), 10) > -30) {
                        _hideBottomScrollNavHinter(i_hinter);
                        NE.Navigation.Next();
                    }
                    _navBottomTimer = null;
                }, 600);
            }
        }

        var rad = Math.max((-bott), 10);
        i_hinter.css({
            'border-top-left-radius': rad + '%',
            'border-top-right-radius': rad + '%',
            'opacity': ((i_hinter.outerHeight() + bott) / 100)
        });


    }

    function _addScrollWatch() {

        _myDOMContent.first().on('scroll', function (e) {
            console.log(NE.UI.AcceptScrollEvent);
            if (!NE.UI.AcceptScrollEvent) return;

            var mp = $(this);
            var sht = $('#NE-scroll-nav-hint-top');
            var shb = $('#NE-scroll-nav-hint-bottom');
            _scrollNavTop(mp, sht);
            _scrollNavBottom(mp, shb);

        });


    }

    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    var me = {

        //////////////////////
        //
        //  Public fields 
        //
        /////////////////////

        Name: 'page',
        Dependencies: [
            'page.css'
        ],


        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function () {

            _settings = _params.settings;

            NE.Plugin.ApplyTemplate(this, function (data) {

                _myDOMContent = $(data);
                _addToDOM(_myDOMContent);

                if (_settings.datafile) {
                    NE.Net.LoadTxtFile(_settings.datafile, function (htmlData) {
                        _buildPage(htmlData);
                    });
                }
                else {
                    _pageComplete();
                }

            });

        },

        RenderPage: function (params) {
            var returnVal = '';
            returnVal += params[0].data.replace(/{pageID}/g, NE.Constants.PAGE_ID_PREFIX + _settings.chapterIndex + '-' + _settings.index);
            returnVal += params[1].data;
            return returnVal;
        },

        OnLoaded: function (e) { },

        eof: null
    };

    return me;

};

