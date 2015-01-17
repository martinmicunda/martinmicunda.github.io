function pxparallax() {

    var pxoffset = window.pageYOffset;

    // First Section
    $('#first').children('.container').css({ 'top' : (0+(pxoffset/11))+'%' });
    $('#first').find('.cloud1').css({ 'top' : (+22-(pxoffset/20))+'%' });
    $('#first').find('.cloud2').css({ 'top' : (+40-(pxoffset/20))+'%' });

    // Second Section
    $('#second').find('.cloud4').css({ 'top' : (+100-(pxoffset/18))+'%' });
    $('#second').find('.cloud5').css({ 'top' : (+80-(pxoffset/13))+'%' });

    // Third Section
    $('#third').find('.cloud9').css({ 'top' : (+255-(pxoffset/9))+'%' });
    $('#third').find('.cloud8').css({ 'top' : (+170-(pxoffset/14))+'%' });
    $('#third').find('.cloud6').css({ 'top' : (+195-(pxoffset/9))+'%' });
    $('#third').find('.cloud7').css({ 'top' : (+65-(pxoffset/28))+'%' });

    // Fourth Section
    $('#fourth').find('.cloud11').css({ 'top' : (+395-(pxoffset/9))+'%' });
    $('#fourth').find('.cloud10').css({ 'top' : (+105-(pxoffset/28))+'%' });
}

$(document).ready(function() {

    //scroll
    pxparallax();

    //gallery
    $(".group1").colorbox({rel:'group1'});
    $(".group2").colorbox({rel:'group2'});
    $(".group3").colorbox({rel:'group3'});
    $(".group4").colorbox({rel:'group4'});
    $(".group5").colorbox({rel:'group5'});
    $(".group6").colorbox({rel:'group6'});
    $(".group7").colorbox({rel:'group7'});
	$(".group8").colorbox({rel:'group8'});
	$(".group9").colorbox({rel:'group9'});
	$(".group10").colorbox({rel:'group10'});
    $(".certif").colorbox({rel:'certif'});

    //loader
    $("body").queryLoader2({
        barColor: "#2A2A2A",
        backgroundColor: "#ffffff",
        percentage: true,
        barHeight: 1,
        completeAnimation: "grow",
        minimumTime: 4000
    });

});

$(window).scroll(function() {

    pxparallax();

});

$(window).resize(function() {

    pxparallax();

});

$(function tabs() {
    $('.section2').tabs({ fxFade: true, fxSpeed: 'fast' });

});

function toggleSlide(objname){
    if($(objname).css('display') == 'none'){
        // div is hidden, so let's slide down
        $(objname).slideDown();
    }else{
        // div is not hidden, so slide up
        $(objname).slideUp();
    }
}

//contact validation
function val_contact(){
    var validate=new Array();
    validate[0] = isBlank('name','Your Name');
    validate[1] = isBlank('email','Your Email');
    validate[2] = isBlank('message','Your Message');
    if(validate[1] == true){
        validate[3] = emailCheck('email','Enter valid email address');
    }
    var check=true;
    for(var i=0;i<validate.length;i++)
    {
        if(validate[i]==false)
        {
            check=false;
        }
    }
    if(check==true)
    {
        var data = 'name=' + getValue('name') + '&email=' + getValue('email') + '&website=' + '&message='  + encodeURIComponent(getValue('message'));

        //disabled all the text fields
        $('.text').attr('disabled','true');

        //show the loading sign
        $('.loading').show();

        //start the ajax
        $.ajax({
            url: "../process.php",
            type: "GET",
            data: data,
            //Do not cache the page
            cache: false,

            //success
            success: function (html) {
                //if process.php returned 1/true (send mail success)
                if (html==1) {
                    //hide the form
                    $('#contactform').fadeOut('slow');

                    //show the success message
                    $('.done').fadeIn('slow');

                    //hide the loading sign
                    $('.loading').hide();

                    //if process.php returned 0/false (send mail failed)
                } else alert('Sorry, unexpected error. Please try again later.');
            }
        });
    }
    return false;
}

function isBlank(objName,DefValue) {
    if( (document.getElementById(objName).value == "") || (document.getElementById(objName).value== DefValue) ){
        document.getElementById(objName).style.color ="red";
        document.getElementById(objName).value = DefValue;
        return false;
    } else {
        return true;
    }
}
function emailCheck(objName,DefValue) {
    if( (!echeck(document.getElementById(objName).value)) || (document.getElementById(objName).value== DefValue) ){
        document.getElementById(objName).style.color ="red";
        document.getElementById(objName).value = DefValue;
        return false;
    } else {
        return true;
    }
}
function echeck(value) {
    var re = new RegExp(/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/i);
    return re.test(value);
}
function changecolor(objName,DefValue){
    if(document.getElementById(objName).value == DefValue){
        document.getElementById(objName).style.color ="#fff";
        document.getElementById(objName).value = "";
    }
}
function changecolor1(objName,DefValue){
    if(document.getElementById(objName).value == ""){
        document.getElementById(objName).style.color ="#fff";
        document.getElementById(objName).value = DefValue;
    }
}
function changecolor2(objName,DefValue,DefValue1){
    if( (document.getElementById(objName).value == DefValue) || (document.getElementById(objName).value == DefValue1) ){
        document.getElementById(objName).style.color ="#fff";
        document.getElementById(objName).value = "";
    }
}
function getValue(objName) {
    return document.getElementById(objName).value;
}