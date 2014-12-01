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


    var _scrollExitTImer;
    var _navTimer;
    var _beenNegative = false;
    var _beenOverscrolledBottom

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

    function _hideScrollNavHinter(i_obj) {
        i_obj.animate({
            'top': (-i_obj.outerHeight()) + 'px',
            'border-bottom-left-radius': '100%',
            'border-bottom-right-radius': '100%',
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


        if (i_pageDiv.scrollTop() < 0) {
            _beenNegative = true;
            newPos = Math.min(-i_hinter.outerHeight() - i_pageDiv.scrollTop(), 0);
            i_hinter.stop().css('top', newPos + 'px');

        }
        else if (i_pageDiv.scrollTop() === 0 && !_beenNegative) {
            newPos = Math.min(i_hinter.position().top - (i_hinter.position().top * .50), 0);
            i_hinter.stop().css('top', newPos + 'px');
            i_pageDiv.scrollTop(1);

        }

        else if ((i_pageDiv.scrollTop() === 1 && !_beenNegative) || (i_pageDiv.scrollTop() === 0 && _beenNegative)) {
            _scrollExitTImer = setTimeout(function () {
                _hideScrollNavHinter(i_hinter);
            }, 250);
        }

        else if ((i_pageDiv.scrollTop() > 1 && i_hinter.position().top > -i_hinter.outerHeight())) {
            _hideScrollNavHinter(i_hinter);
        }

        if (i_hinter.position().top > -40) {
            if (!_navTimer) {
                _navTimer = setTimeout(function () {
                    if (i_hinter.position().top > -30) {
                        _hideScrollNavHinter(i_hinter);
                        NE.Navigation.Previous();
                    }
                    _navTimer = null;
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

        if (
            _settings.chapterIndex != NE.Navigation.CurrentChapterIndex
            ||
            _settings.index != NE.Navigation.CurrentPageIndex
            ) return;

        var newPos;

        var overFlowHeight = i_pageDiv[0].scrollHeight - $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).innerHeight();
        var bott = parseInt(i_hinter.css('bottom'), 10);
        $('#tracer').html(i_pageDiv.scrollTop() + ' > ' + overFlowHeight);
        if (i_pageDiv.scrollTop() > overFlowHeight) {
            _beenOverscrolledBottom = true;
            newPos = Math.min(-i_hinter.outerHeight() - (i_pageDiv.scrollTop() - $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).innerHeight()), 0);
            $('#tracer').html(newPos);
            i_hinter.stop().css('top', newPos + 'px');
        }
        else if (i_pageDiv.scrollTop() === overFlowHeight && !_beenNegative) {
       
            newPos = Math.min(bott - (bott * .50), 0);
            console.log(bott);
            i_hinter.stop().css('bottom', newPos + 'px');
            i_pageDiv.scrollTop(overFlowHeight-1);
        }

        var rad = Math.max((-bott), 10);
        i_hinter.css({
            'border-top-left-radius': rad + '%',
            'border-top-right-radius': rad + '%',
            'opacity': ((i_hinter.outerHeight() + bott) / 100)
        });


    }

    function _addScrollWatch() {

        _myDOMContent.first().on('scroll', function () {

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

