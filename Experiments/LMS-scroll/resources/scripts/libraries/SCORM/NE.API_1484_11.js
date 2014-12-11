
var NE = NE || {};

NE.API_1484_11 = (function () {

    _apiData = [];

    return {
        Initialize: function (str) {
            console.log('NE.API_1484_11.Initialize()');
            return true;
        },

        Terminate: function (str) {
            console.log('NE.API_1484_11.Terminate()');
            return true;
        },

        GetValue: function (key) {
            console.log('NE.API_1484_11.GetValue(\'' + key + '\') returned: ' + _apiData[key]);
            return _apiData[key];
        },

        SetValue: function (key, value) {
            console.log('NE.API_1484_11.SetValue(\'' + key + '\', \'' + value + '\')');
            _apiData[key] = value;
            return true;
        },

        Commit: function (str) {
            console.log('NE.API_1484_11.Commit()');
            return true;
        },

        // Returns the error code that resulted from the last API call.
        GetLastError: function() {
            return 0;
        },

        // Returns a short string describing the specified error code.
        GetErrorString: function(errorCode) {
            return "No error occurred, the previous API call was successful.";
        },

        // Returns detailed information about the last error that occurred.
        GetDiagnostic: function(errorCode) {
            return "No error occurred, the previous API call was successful.";
        }
    };

})();
