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


    function _scrollTopCountDown() {

        clearInterval(_scrollTopInterval);
        clearTimeout(_scrollTopIntervalDelay);

        _scrollTopIntervalDelay = setTimeout(function () {
            _scrollTopInterval = setInterval(function () {
                if (_scrollOverflowTop > 0) {
                    _scrollOverflowTop = Math.floor(_scrollOverflowTop / 2);
                }
                else {
                    clearInterval(_scrollTopInterval);
                }
                $('#tracer').html(_scrollOverflowTop + '<br/>' + _scrollOverflowBottom);
            }, 100);
        }, 300);
    }


    function _scrollBottomCountDown() {

        clearInterval(_scrollBottomInterval);
        clearTimeout(_scrollBottomIntervalDelay);

        _scrollBottomIntervalDelay = setTimeout(function () {
            _scrollBottomInterval = setInterval(function () {
                if (_scrollOverflowBottom > 0) {
                    _scrollOverflowBottom = Math.floor(_scrollOverflowBottom / 2);
                }
                else {
                    clearInterval(_scrollBottomInterval);
                }
                $('#tracer').html(_scrollOverflowTop + '<br/>' + _scrollOverflowBottom);
            }, 100);
        }, 300);
    }

    var _scrollOverflowTop = 0;
    var _scrollOverflowBottom = 0;
    var _scrollTopInterval;
    var _scrollTopIntervalDelay;
    var _scrollBottomInterval;
    var _scrollBottomIntervalDelay;
    var _scrollNavLimit = 100;
    var _inertScroll = false;
    function _addScrollWatch() {

        _myDOMContent.first().on('scroll', function (e) {

            if (!NE.UI.AcceptScrollEvent) return;

            var mp = $(this);
            var sht = $('#NE-scroll-nav-hint-top');
            var shb = $('#NE-scroll-nav-hint-bottom');


            var scrollPos = mp.scrollTop();

            if (scrollPos < 0) {
                _inertScroll = true;
                _scrollOverflowTop = Math.abs(scrollPos);
            }
            else if (scrollPos == 0 && !_inertScroll) {
                _scrollOverflowTop += (_scrollNavLimit - _scrollOverflowTop) * .4;
                mp.scrollTop(1);
            }
            else if (scrollPos > 1) {
                _scrollOverflowTop = 0;
            }
            _scrollTopCountDown();

            var docOverflow = mp[0].scrollHeight - mp.innerHeight();

            if (scrollPos > docOverflow + 1) {
                _inertScroll = true;
                _scrollOverflowBottom = scrollPos - docOverflow;
            }
            else if ((scrollPos == docOverflow || scrollPos == docOverflow + 1) && !_inertScroll) {
                _scrollOverflowBottom += (_scrollNavLimit - _scrollOverflowBottom) * .4;
                mp.scrollTop(docOverflow - 1);
            }
            else if (scrollPos < docOverflow - 1) {
                _scrollOverflowBottom = 0;
            }
            _scrollBottomCountDown();

            $('#tracer').html(_scrollOverflowTop + '<br/>' + _scrollOverflowBottom);

            // _scrollNavTop(mp, sht);
            // _scrollNavBottom(mp, shb);

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

