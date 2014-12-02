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


    var _scrollOverflow = {top:0,bottom:0};
    var _scrollInterval = { top: null, bottom: null };
    var _scrollIntervalDelay = { top: null, bottom: null };
    var _scrollNavLimit = 100;
    var _inertScroll = false;

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

    function _renderScrollNav() {
        var header = $('#' + NE.Constants.FLOATING_HEADER_ID);
        var headerPush = header.outerHeight() + header.position().top;
        $('#NE-scroll-nav-hint-top').css({
            'top': ((headerPush - _scrollNavLimit) + _scrollOverflow.top) + 'px',
            'opacity': _scrollOverflow.top / 100
        });

        var footer = $('#' + NE.Constants.FLOATING_FOOTER_ID);
        var footerPush = footer.outerHeight();
        $('#NE-scroll-nav-hint-bottom').css({
            'bottom': ((footerPush - _scrollNavLimit) + _scrollOverflow.bottom) + 'px',
            'opacity': _scrollOverflow.bottom / 100
        });
    }



    function _scrollCountDown(i_value) {

        clearInterval(_scrollInterval[i_value]);
        clearTimeout(_scrollIntervalDelay[i_value]);

        _scrollIntervalDelay[i_value] = setTimeout(function () {
            _scrollInterval[i_value] = setInterval(function () {
                if (_scrollOverflow[i_value] > 0) {
                    _scrollOverflow[i_value] = Math.floor(_scrollOverflow[i_value] * .9);
                }
                else {
                    clearInterval(_scrollInterval[i_value]);
                }
                _renderScrollNav();
            }, 30);
        }, 600);
    }

    function _calcScrollNavTop(i_page, i_scrollTop) {
        if (i_scrollTop < 0) {
            _inertScroll = true;
            _scrollOverflow.top = Math.abs(i_scrollTop);
        }
        else if (i_scrollTop == 0 && !_inertScroll) {
            _scrollOverflow.top += (_scrollNavLimit - _scrollOverflow.top) * .4;
            i_page.scrollTop(1);
        }
        else if (i_scrollTop > 1) {
            _scrollOverflow.top = 0;
        }
        _scrollCountDown('top');
    }

    function _calcScrollNavBottom(i_page, i_scrollTop) {
        var docOverflow = i_page[0].scrollHeight - i_page.innerHeight();
        if (i_scrollTop > docOverflow + 1) {
            _inertScroll = true;
            _scrollOverflow.bottom = i_scrollTop - docOverflow;
        }
        else if ((i_scrollTop == docOverflow || i_scrollTop == docOverflow + 1) && !_inertScroll) {
            _scrollOverflow.bottom += (_scrollNavLimit - _scrollOverflow.bottom) * .4;
            i_page.scrollTop(docOverflow - 1);
        }
        else if (i_scrollTop < docOverflow - 1) {
            _scrollOverflow.bottom = 0;
        }
        _scrollCountDown('bottom');
    }

    function _addScrollWatch() {

        _myDOMContent.first().on('scroll', function (e) {

            if (!NE.UI.AcceptScrollEvent) return;

            var mp = $(this);
            var scrollPos = mp.scrollTop();

            if (NE.Navigation.CurrentChapterIndex != 0 || NE.Navigation.CurrentPageIndex !== 0) {
                _calcScrollNavTop(mp, scrollPos);
            }

            if (!NE.Navigation.IsAtLast()) {
                _calcScrollNavBottom(mp, scrollPos);
            }

            _renderScrollNav();

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

