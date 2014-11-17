/// <reference path="NE.Net.js" />
/// <reference path="NE.Constants.js" />

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

NE.Plugin = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _basePath = '//' + NE.Constants.APPLICATION_BASE_PATH + '/resources/scripts/components';

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

    function _resolvePath(i_path) {
        var pathParts = i_path.split('/');
        var name = pathParts.slice(-1);
        return {
            path: pathParts.length > 1 ? pathParts.slice(0, -1).join('/') + name : _basePath + '/' + name,
            name: name
        };
    }


    function _findTokens(i_name, i_data) {
        var rgx = new RegExp('{' + i_name + '[.|\\s\\S]+?{\\/' + i_name + '}', 'g');
        var tokens = i_data.match(rgx);
        var objs = [];

        if (!tokens) return objs;

        for (var i = 0; i < tokens.length; i++) {
            var obj = _buildObj(i_name, tokens[i]);
            objs.push(obj);
        }


        return objs;
    }

    function _removeTokens(i_name, i_data) {
        var rgx = new RegExp('{' + i_name + '[.|\\s\\S]+?{\\/' + i_name + '}', 'g');
        return i_data.replace(rgx, '');
    }


    function _buildObj(i_name, i_token) {

        var nameRgx = new RegExp('{' + i_name + ':(.*?)}');
        var dataRgx = new RegExp('}(.|[\\s\\S]*?){\\/' + i_name + '}');

        var objName = i_token.match(nameRgx);
        objName = objName ? objName[1] : 'param';

        return {
            name: objName,
            data: i_token.match(dataRgx)[1]
        };
    }

    function _runFunction(i_plugin, i_name, i_params, i_data) {
        var rgx = new RegExp('{function:' + i_name + '}[.|\\s\\S]+?{\\/function}', 'g');
        return i_data.replace(rgx, i_plugin[i_name](i_params));
    }



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

        Load: function (i_initObj) {

            var pn = _resolvePath(i_initObj.name);
            
            NE.Net.AddScriptFile(pn.path + '/' + pn.name + '.js');
         

            var depends = NE.Plugin[pn.name].Dependencies;
            if (depends) {
                for (var i = 0; i < depends.length; i++) {
                    var ext = NE.Net.GetExtension(depends[i]);
                    switch (ext.toString().toLowerCase()) {
                        case 'css':
                            NE.Net.AddCssFile(pn.path + '/' + depends[i]);
                            break;
                        case 'js':
                            NE.Net.AddScriptFile(pn.path + '/' + depends[i]);
                            break;
                    }
                }
            }

   
            NE.Plugin[pn.name].Init(i_initObj);
         

        },


        
        ApplyTemplate: function(i_name, i_callback) {

            var templateData = '';
            var crntPlugin = NE.Plugin[i_name];
            var pn = _resolvePath(i_name);
     

            NE.Net.LoadTxtFile(pn.path + '/' + pn.name + '.html', function (data) {

                templateData = data;

                var variables = _findTokens('var', templateData);
                for (var i = 0; i < variables.length; i++) {
                    crntPlugin[variables[i].name] = variables[i].data;
                }
                templateData = _removeTokens('var', templateData);

                var functions = _findTokens('function', templateData);
                for (var i = 0; i < functions.length; i++) {
                    var params = _findTokens('param', functions[i].data);
                    templateData = _runFunction(crntPlugin, functions[i].name, params, templateData);
                }

                if (i_callback) i_callback(templateData)

            });

        },

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
};

})();

