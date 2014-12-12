
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

NE.SCORM = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////



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



    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    return {

        //////////////////////
        //
        //  Public fields 
        //
        /////////////////////

        NavigateToBookmark: function () {

            var _initBookmark = NE.LMS.Bookmark.GetBookmark();
            if (_initBookmark) {
                var visitItem = $('#' + _initBookmark);

                NE.Navigation.CurrentChapterIndex = parseInt(visitItem.data('chapter'), 10);
                NE.Navigation.CurrentPageIndex = parseInt(visitItem.data('index'), 10);

                NE.Navigation.ToPage(NE.Navigation.CurrentPageIndex, NE.Navigation.CurrentChapterIndex);

                NE.UI.ScrollToPage(false)

                _initBookmark = null;
            }

        },


        RegisterSections: function () {
            var sections = [];
            for (var i = 0; i < NE.CourseTree.chapters.length; i++) {
                sections.push(NE.LMS.Section(NE.CourseTree.SCO_name + '_' + NE.CourseTree.chapters[i].index));
            }
            NE.LMS.Sections.RegisterSections(sections);
        },


        Unlockhistory: function () {
            var sections = NE.LMS.Sections.GetSections();
            for (var i = 0; i < sections.length; i++) {
                if (sections[i].State == 'completed') {
                    var index = sections[i].ID.split('_');
                    index = parseInt(index[index.length - 1], 10);
                    NE.UI.Unlock(index);
                    NE.UI.HideVIsitedItems(index);
                }
            }
        },


        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

