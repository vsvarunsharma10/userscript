// ==UserScript==
// @name         GP downaload pdf
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://patents.google.com/*
// @require      http://code.jquery.com/jquery-3.1.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.debug.js
// @include      https://patents.google.com/*
// @grant        GM_addStyle
// ==/UserScript==

var doc = new jsPDF();
var height = doc.internal.pageSize.height;
var reset = 10;
var x = 10;

function init(){
    var zNode       = document.createElement ('div');
    zNode.innerHTML = '<button id="myButton" type="button">'+ 'Download PDF </button>';
    zNode.setAttribute ('id', 'myContainer');
    document.body.appendChild (zNode);

    //--- Activate the newly added button.
    document.getElementById ("myButton").addEventListener (
        "click", getData, false
    );

    //--- Style our newly added elements using CSS.
    GM_addStyle ( multilineStr ( function () {/*!
    #myContainer {
        position:               absolute;
        top:                    5px;
        left:                   60%;
        font-size:              20px;
        margin:                 5px;
        z-index:                222;
        padding:                5px 20px;

    }
    #myButton {
        height:                 32px;
        background :            #4285F4;
        color:                  white;
        border-radius:          3px;
        font-weight:            bold;
        border:                 none;
    }
    #myContainer p {
        color:                  red;
        background:             white;
    }
*/} ) );

    function multilineStr (dummyFunc) {
        var str = dummyFunc.toString ();
        str     = str.replace (/^[^\/]+\/\*!?/, '') // Strip function () { /*!
            .replace (/\s*\*\/\s*\}\s*$/, '')   // Strip */ }
            .replace (/\/\/.+$/gm, '') // Double-slash comments wreck CSS. Strip them.
        ;
        return str;
    }
}

function waitForLoad(){
    if($('#title').length === 0){
        console.log("waiting");
        window.setTimeout(waitForLoad,50);
    }
    else{
        init();
    }
}

function getData(){
    //console.log($('#title').text());
    //console.log($('#abstract').text());
    var filename = document.evaluate('/html/body/search-app/search-result/search-ui/div/main/div/div/div/patent-result/div/div/div[2]/section/header/h2', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
    try{
        var c = document.evaluate('/html/body/search-app/search-result/search-ui/div/main/div/div/div/patent-result/div/div/div[2]/section/dl/dd', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
    }
    catch(err){
        console.log("No abstract found");
    }
    var claims = [];
    var count_str = document.evaluate('/html/body/search-app/search-result/search-ui/div/main/div/div/div/patent-result/div/div[2]/div[2]/section/h3/div/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
    count = parseInt(count_str.slice(1, 3));
    try{
        for (i=0;i<count;i++){
            var url = "/html/body/search-app/search-result/search-ui/div/main/div/div/div/patent-result/div/div[2]/div[2]/section/patent-text/div/div/div["+parseInt(i+1)+"]/div/div/span";
            var claim = document.evaluate(url, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
            var new_str = claim.split("</span>")[1];
            claims.push(new_str);
        }
    }
    catch(err){
        console.log("no claims found");
    }
    var description = [];
    try{
        var x =0;
        while (true) {
            var description_line = document.evaluate("/html/body/search-app/search-result/search-ui/div/main/div/div/div/patent-result/div/div[2]/div/section/patent-text/div/div/p["+parseInt(x+1)+"]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
            description.push(description_line.split("</span>")[1]);
            x++;
        }
    }
    catch(err) {
       // console.log("no description found");
    }
    var images = [];
    try{
        var image_count = document.evaluate('/html/body/search-app/search-result/search-ui/div/main/div/div/div/patent-result/div/div/div/section[2]/image-carousel/h3/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
        for(i=0;i<image_count;i++){
            var image_src = document.evaluate('/html/body/search-app/search-result/search-ui/div/main/div/div/div/patent-result/div/div/div/section[2]/image-carousel/div/img['+image_count+']', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;
            images.push(image_src);
        }
    }
    catch(err){
        console.log("no images found");
    }

    console.log(images);
    doc.setFontType("bold");
    doc.setFontSize(15);
    doc.text('Title', 10, 10);
    doc.setFontType("normal");
    doc.setFontSize(11);
    doc.text( $('#title').text(),10,20);
    doc.setFontType("bold");
    doc.setFontSize(15);
    doc.text('Abstarct', 10, 30);
    doc.setFontType("normal");
    doc.setFontSize(11);
    var y = 40 ;
    var splitAbstarct = doc.splitTextToSize($('#abstract').text().split("translated from")[1].trim(), 180);
    for(i=1;i<splitAbstarct.length;i++){
        doc.text(10,y,unescape(encodeURIComponent(splitAbstarct[i].replace("​​",""))));
        y = y + 5;
        if (y >= height)
        {
            doc.addPage();
            y = reset; // Restart height position
        }
    }
     y = y + 5;
    doc.setFontType("bold");
    doc.setFontSize(15);
    doc.text('Claims : '+ count_str, 10, y);
    doc.setFontType("normal");
    doc.setFontSize(11);
    claims = claims.join("\n").replace(/(<([^>]+)>)/ig,"").split("\n");
    var splitClaims = doc.splitTextToSize(claims, 180);
    y = y + 10;
    doc.text(10,y,"1."+splitClaims[0]);
    y = y + 5;
    for(i=1;i<splitClaims.length;i++){
        doc.text(10,y,unescape(encodeURIComponent(splitClaims[i].replace("​​",""))));
        y = y + 5;
        if (y >= height)
        {
            doc.addPage();
            y = reset; // Restart height position
        }
    }
    y = y + 5;
    doc.setFontType("bold");
    doc.setFontSize(15);
    doc.text('Description : ',10,y);
    doc.setFontType("normal");
    doc.setFontSize(11);
    description = description.join("\n").replace(/(<([^>]+)>)/ig,"").split("\n");
    var splitDescription = doc.splitTextToSize(description, 180);
    //console.log(splitDescription);
    y = y + 10;
    for(i=0;i<splitDescription.length;i++){
        doc.text(10,y,unescape(encodeURIComponent(splitDescription[i].replace("​​",""))));
        y = y + 5;
        if (y >= height)
        {
            doc.addPage();
            y = reset; // Restart height position
        }
    }
    doc.save(filename+'.pdf');
}

waitForLoad();
