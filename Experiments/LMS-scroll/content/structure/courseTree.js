// Ensure that the NE namespace is avaiable
if (NE === null || NE === undefined) { var NE = {}; }

NE.CourseTree = {
    "name": "Klarspråket",
    "chapters": [
        {
            "guid": "D86D5675-6624-4C8D-86F1-D4EFF4AA9707",
            "title": "Introduktion",
            "index": 0,
            "datasrc": "",
            "plugin": "startscreen",
            "properties": {
                "displayInMenu": true
            },
            "pages": [
                {
                    "guid": "19CEAB46-9E1A-430E-9325-9EBA8D397075",
                    "title": "Page 1",
                    "datafile": "chapter1_page_1"
                }
            ]
        },
                {
                    "guid": "P86D5675-6624-4C8D-86F1-D4EFF4AA9707",
                    "title": "Klarspråk är att skriva för läsaren.",
                    "index": 1,
                    "datasrc": "",
                    "plugin": "",
                    "properties": {
                        "displayInMenu": true
                    },
                    "pages": [
                        {
                            "guid": "19FEAB46-9E1A-430E-9325-9EBA8D397075",
                            "title": "Page 1",
                            "datafile": "chapter2_page_1"
                        },
                        {
                            "guid": "7BFF52B4-9E09-4367-AF3D-9D5E3724951E",
                            "title": "Page 2",
                            "datafile": "chapter2_page_2"
                        },
                        {
                            "guid": "E507FE70-41B7-48F3-B68F-C51B51455D32",
                            "title": "Page 3",
                            "datafile": "chapter2_page_3"
                        }
                    ]
                }

    ]
};